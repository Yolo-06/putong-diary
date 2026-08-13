/**
 * 噗通日记本 V4.2 — 多用户版数据管家 🐱
 * 每人用用户名+密码注册自己的小账本，数据互不干扰
 * 安全：密码 bcrypt 哈希 + Token 会话 + 重置限频
 * 数据库：Neon PostgreSQL（云端永久存储，不怕重启丢数据）
 * 用法：先设置 DATABASE_URL 环境变量，再 node server.js
 */

require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3456;
const HOST = process.env.HOST || '127.0.0.1';

// ==================== 数据库连接（Neon PostgreSQL） ====================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 参数化查询工具（都是异步的，用 await 调用）
// dbGet：查单行，返回第一行或 undefined
async function dbGet(sql, params) {
  const r = await pool.query(sql, params);
  return r.rows[0];
}

// dbAll：查多行，返回对象数组
async function dbAll(sql, params) {
  const r = await pool.query(sql, params);
  return r.rows;
}

// dbRun：执行写操作（INSERT/UPDATE/DELETE），不返回数据
async function dbRun(sql, params) {
  await pool.query(sql, params);
}

// 事务包装（批量写入用，保证要么全部成功要么全部回滚）
async function dbTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn({
      get: (sql, p) => client.query(sql, p).then(r => r.rows[0]),
      all: (sql, p) => client.query(sql, p).then(r => r.rows),
      run: (sql, p) => client.query(sql, p),
    });
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function initDB() {
  // 用户表
  await dbRun(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    pin_length INTEGER DEFAULT 6,
    created_at TEXT NOT NULL
  )`);

  // 记账记录（id 用 BIGINT，因为前端用 Date.now() 作为 id，超出 32 位整数范围）
  await dbRun(`CREATE TABLE IF NOT EXISTS records (
    id BIGINT NOT NULL, user_id INTEGER NOT NULL,
    amount DOUBLE PRECISION NOT NULL, cat1 TEXT NOT NULL, cat2 TEXT NOT NULL,
    date TEXT NOT NULL, note TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'expense', photos TEXT DEFAULT '[]',
    PRIMARY KEY (user_id, id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS journals (
    id BIGINT NOT NULL, user_id INTEGER NOT NULL,
    content TEXT NOT NULL, photos TEXT DEFAULT '[]',
    mood TEXT DEFAULT '', sticker TEXT DEFAULT '', stickers TEXT DEFAULT '[]',
    related_record_id BIGINT, date TEXT NOT NULL,
    time TEXT NOT NULL, created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS user_categories (
    user_id INTEGER NOT NULL, name TEXT NOT NULL,
    subs TEXT NOT NULL DEFAULT '[]', color TEXT NOT NULL,
    PRIMARY KEY (user_id, name)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS kv_store (
    user_id INTEGER NOT NULL, key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS savings_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, title TEXT NOT NULL,
    target_amount DOUBLE PRECISION NOT NULL, daily_amount DOUBLE PRECISION NOT NULL,
    start_date TEXT NOT NULL, end_date TEXT, status TEXT DEFAULT 'active'
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS savings_logs (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
    date TEXT NOT NULL, amount DOUBLE PRECISION NOT NULL, record_id BIGINT,
    UNIQUE(plan_id, date)
  )`);

  // 清理 24 小时前创建的旧会话
  var oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await dbRun("DELETE FROM sessions WHERE created_at < $1", [oneDayAgo]);

  console.log('🐱 已连接云端数据库（Neon PostgreSQL）');
}

// ==================== Express 设置 ====================

const app = express();
app.use(express.json({ limit: '10mb' }));

// 安全响应头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:;");
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== 认证中间件 ====================

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '请先登录' });

  const row = await dbGet('SELECT s.token, s.user_id FROM sessions s WHERE s.token = $1', [token]);
  if (!row) return res.status(401).json({ error: '登录已过期，请重新输入密码' });

  req.userId = row.user_id;
  next();
}

// ==================== 认证接口 ====================

// 检查用户名是否存在（注册前先查）
app.get('/api/auth/status', async (req, res) => {
  const username = req.query.username || '';
  if (!username) {
    // 不传用户名：返回服务器是否有任何用户
    var anyUser = await dbGet("SELECT COUNT(*) as cnt FROM users");
    return res.json({ hasAnyUser: (anyUser && parseInt(anyUser.cnt) > 0) });
  }
  // 传了用户名：检查该用户是否存在
  var row = await dbGet("SELECT id, pin_length FROM users WHERE username = $1", [username]);
  res.json({ exists: !!row, pinLength: row ? row.pin_length : 6 });
});

// 注册（首次使用）
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' });
  if (!/^[a-zA-Z0-9_一-龥]{3,20}$/.test(username)) {
    return res.status(400).json({ error: '用户名3-20位，支持字母数字中文下划线' });
  }
  if (password.length !== 6) return res.status(400).json({ error: '密码需要正好6位数字哦~' });
  if (!/^\d+$/.test(password)) return res.status(400).json({ error: '密码只能是数字哦~' });

  // 检查用户名是否已被注册
  var existing = await dbGet("SELECT id FROM users WHERE username = $1", [username]);
  if (existing) return res.status(400).json({ error: '这个昵称已经被占用啦，换一个试试~' });

  var hash = bcrypt.hashSync(password, 10);
  await dbRun("INSERT INTO users (username, password_hash, pin_length, created_at) VALUES ($1,$2,$3,$4)",
    [username, hash, password.length, new Date().toISOString()]);

  // 创建会话
  var user = await dbGet("SELECT id FROM users WHERE username = $1", [username]);
  var token = crypto.randomBytes(32).toString('hex');
  await dbRun("INSERT INTO sessions (token, user_id, created_at) VALUES ($1,$2,$3)", [token, user.id, new Date().toISOString()]);

  res.json({ token, username, pinLength: password.length });
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' });

  var row = await dbGet("SELECT id, password_hash, pin_length FROM users WHERE username = $1", [username]);
  if (!row) return res.status(400).json({ error: '用户不存在，请先注册' });

  if (!bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: '密码不对哦，再试一次吧~' });
  }

  var token = crypto.randomBytes(32).toString('hex');
  await dbRun("INSERT INTO sessions (token, user_id, created_at) VALUES ($1,$2,$3)", [token, row.id, new Date().toISOString()]);

  res.json({ token, username, pinLength: row.pin_length });
});

// 退出登录
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  var token = req.headers.authorization.replace('Bearer ', '');
  await dbRun("DELETE FROM sessions WHERE token = $1", [token]);
  res.json({ ok: true });
});

// 重置密码（忘记密码时使用）
// 云端部署时此接口不需登录，因为忘记密码的人无法登录
// 安全防护：频率限制（同一用户名 5 分钟内最多 1 次重置请求）
var resetRateLimit = {};
app.post('/api/auth/reset-password', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: '请提供用户名' });
  // 频率限制：防止恶意批量删除
  var now = Date.now();
  if (resetRateLimit[username] && now - resetRateLimit[username] < 300000) {
    return res.status(429).json({ error: '操作太频繁，请5分钟后再试' });
  }
  resetRateLimit[username] = now;
  var user = await dbGet("SELECT id FROM users WHERE username = $1", [username]);
  if (!user) return res.status(400).json({ error: '用户不存在' });
  await dbRun("DELETE FROM users WHERE id = $1", [user.id]);
  await dbRun("DELETE FROM sessions WHERE user_id = $1", [user.id]);
  await dbRun("DELETE FROM records WHERE user_id = $1", [user.id]);
  await dbRun("DELETE FROM journals WHERE user_id = $1", [user.id]);
  await dbRun("DELETE FROM user_categories WHERE user_id = $1", [user.id]);
  await dbRun("DELETE FROM kv_store WHERE user_id = $1", [user.id]);
  await dbRun("DELETE FROM savings_plans WHERE user_id = $1", [user.id]);
  await dbRun("DELETE FROM savings_logs WHERE user_id = $1", [user.id]);
  res.json({ ok: true });
});

// 修改密码
app.put('/api/auth/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: '请填写旧密码和新密码' });
  if (newPassword.length !== 6) return res.status(400).json({ error: '新密码需要正好6位数字哦~' });
  if (!/^\d+$/.test(newPassword)) return res.status(400).json({ error: '新密码只能是数字哦~' });

  var row = await dbGet("SELECT password_hash FROM users WHERE id = $1", [req.userId]);
  if (!row) return res.status(400).json({ error: '用户不存在' });
  if (!bcrypt.compareSync(oldPassword, row.password_hash)) return res.status(401).json({ error: '旧密码不对哦~' });

  var hash = bcrypt.hashSync(newPassword, 10);
  await dbRun("UPDATE users SET password_hash = $1, pin_length = $2 WHERE id = $3", [hash, newPassword.length, req.userId]);
  res.json({ ok: true });
});

// ==================== 数据接口 ====================

// --- 记账记录 ---

app.get('/api/records', requireAuth, async (req, res) => {
  var rows = await dbAll("SELECT * FROM records WHERE user_id = $1 ORDER BY id DESC", [req.userId]);

  var records = rows.map(function(row) {
    return {
      id: Number(row.id), amount: row.amount, cat1: row.cat1, cat2: row.cat2,
      date: row.date, note: row.note, type: row.type,
      photos: JSON.parse(row.photos)
    };
  });
  res.json(records);
});

app.put('/api/records', requireAuth, async (req, res) => {
  var records = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: '数据格式错误' });

  await dbTransaction(async (tx) => {
    await tx.run("DELETE FROM records WHERE user_id = $1", [req.userId]);
    for (var r of records) {
      await tx.run("INSERT INTO records (id, user_id, amount, cat1, cat2, date, note, type, photos) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [r.id, req.userId, r.amount, r.cat1, r.cat2, r.date, r.note || '', r.type || 'expense', JSON.stringify(r.photos || [])]);
    }
  });
  res.json({ ok: true, count: records.length });
});

// --- 手账记录 ---

app.get('/api/journals', requireAuth, async (req, res) => {
  var rows = await dbAll("SELECT * FROM journals WHERE user_id = $1 ORDER BY id DESC", [req.userId]);

  var journals = rows.map(function(row) {
    return {
      id: Number(row.id), content: row.content,
      photos: JSON.parse(row.photos),
      mood: row.mood, sticker: row.sticker,
      stickers: JSON.parse(row.stickers || '[]'),
      relatedRecordId: row.related_record_id ? Number(row.related_record_id) : null,
      date: row.date, time: row.time, createdAt: row.created_at
    };
  });
  res.json(journals);
});

app.put('/api/journals', requireAuth, async (req, res) => {
  var journals = req.body;
  if (!Array.isArray(journals)) return res.status(400).json({ error: '数据格式错误' });

  await dbTransaction(async (tx) => {
    await tx.run("DELETE FROM journals WHERE user_id = $1", [req.userId]);
    for (var j of journals) {
      await tx.run("INSERT INTO journals (id, user_id, content, photos, mood, sticker, stickers, related_record_id, date, time, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [j.id, req.userId, j.content, JSON.stringify(j.photos || []), j.mood || '', j.sticker || '', JSON.stringify(j.stickers || []), j.relatedRecordId || null, j.date, j.time, j.createdAt]);
    }
  });
  res.json({ ok: true, count: journals.length });
});

// --- 许愿储钱罐 ---

app.get('/api/savings/current', requireAuth, async (req, res) => {
  var plan = await dbGet("SELECT * FROM savings_plans WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1", [req.userId]);
  if (!plan) return res.json({ plan: null, logs: {} });

  var today = new Date();
  var monthStart = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-01';
  var monthEnd = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-31';
  var logsRows = await dbAll("SELECT date, amount, record_id FROM savings_logs WHERE plan_id = $1 AND user_id = $2 AND date >= $3 AND date <= $4 ORDER BY date",
    [plan.id, req.userId, monthStart, monthEnd]);
  var logs = {};
  logsRows.forEach(function(row) { logs[row.date] = { amount: row.amount, recordId: row.record_id ? Number(row.record_id) : null }; });

  res.json({
    plan: {
      id: plan.id, title: plan.title, targetAmount: plan.target_amount,
      dailyAmount: plan.daily_amount, startDate: plan.start_date,
      endDate: plan.end_date, status: plan.status
    },
    logs
  });
});

app.post('/api/savings/plan', requireAuth, async (req, res) => {
  var { title, targetAmount, dailyAmount, startDate, endDate } = req.body;
  if (!title || !targetAmount || !dailyAmount) {
    return res.status(400).json({ error: '请填写完整信息哦~' });
  }

  var existing = await dbGet("SELECT id FROM savings_plans WHERE user_id = $1 AND status = 'active'", [req.userId]);
  if (existing) {
    await dbRun("UPDATE savings_plans SET title=$1, target_amount=$2, daily_amount=$3, start_date=$4, end_date=$5 WHERE id=$6 AND user_id=$7",
      [title, targetAmount, dailyAmount, startDate, endDate || null, existing.id, req.userId]);
    return res.json({ ok: true, id: existing.id, updated: true });
  }

  await dbRun("INSERT INTO savings_plans (user_id, title, target_amount, daily_amount, start_date, end_date) VALUES ($1,$2,$3,$4,$5,$6)",
    [req.userId, title, targetAmount, dailyAmount, startDate, endDate || null]);
  res.json({ ok: true, updated: false });
});

app.post('/api/savings/checkin', requireAuth, async (req, res) => {
  var { amount, date, recordId } = req.body;
  var checkDate = date || new Date().toISOString().substring(0, 10);

  var plan = await dbGet("SELECT * FROM savings_plans WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1", [req.userId]);
  if (!plan) return res.status(400).json({ error: '还没有创建储钱计划哦~' });

  var existingLog = await dbGet("SELECT id FROM savings_logs WHERE plan_id = $1 AND date = $2", [plan.id, checkDate]);
  if (existingLog) return res.status(400).json({ error: '今天已经投过币啦~' });

  var checkAmount = amount || plan.daily_amount;
  await dbRun("INSERT INTO savings_logs (plan_id, user_id, date, amount, record_id) VALUES ($1,$2,$3,$4,$5)",
    [plan.id, req.userId, checkDate, checkAmount, recordId || null]);

  res.json({ ok: true, amount: checkAmount, date: checkDate });
});

app.delete('/api/savings/checkin/:date', requireAuth, async (req, res) => {
  var plan = await dbGet("SELECT id FROM savings_plans WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1", [req.userId]);
  if (!plan) return res.status(400).json({ error: '没有活跃的储钱计划' });

  await dbRun("DELETE FROM savings_logs WHERE plan_id = $1 AND date = $2", [plan.id, req.params.date]);
  res.json({ ok: true });
});

// --- 用户分类 ---

app.get('/api/categories', requireAuth, async (req, res) => {
  var rows = await dbAll("SELECT * FROM user_categories WHERE user_id = $1", [req.userId]);

  var cats = {};
  rows.forEach(function(row) {
    cats[row.name] = { subs: JSON.parse(row.subs), color: row.color };
  });
  res.json(cats);
});

app.put('/api/categories', requireAuth, async (req, res) => {
  var cats = req.body;
  if (typeof cats !== 'object') return res.status(400).json({ error: '数据格式错误' });

  await dbTransaction(async (tx) => {
    await tx.run("DELETE FROM user_categories WHERE user_id = $1", [req.userId]);
    for (var name of Object.keys(cats)) {
      await tx.run("INSERT INTO user_categories (user_id, name, subs, color) VALUES ($1,$2,$3,$4)",
        [req.userId, name, JSON.stringify(cats[name].subs || []), cats[name].color || '#6366F1']);
    }
  });
  res.json({ ok: true });
});

// --- 键值存储 ---

var ALLOWED_KV_KEYS = ['budget', 'darkmode', 'stickers', 'checkin_date', 'pet_img',
  'savings_reminder_time', 'savings_reminder_enabled', 'last_savings_remind_date'];

app.get('/api/kv/:key', requireAuth, async (req, res) => {
  if (ALLOWED_KV_KEYS.indexOf(req.params.key) === -1) {
    return res.status(403).json({ error: '不允许访问此配置项' });
  }
  var row = await dbGet("SELECT value FROM kv_store WHERE user_id = $1 AND key = $2", [req.userId, req.params.key]);
  res.json({ value: row ? row.value : null });
});

app.put('/api/kv/:key', requireAuth, async (req, res) => {
  if (ALLOWED_KV_KEYS.indexOf(req.params.key) === -1) {
    return res.status(403).json({ error: '不允许修改此配置项' });
  }
  var { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: '缺少 value' });

  var existing = await dbGet("SELECT key FROM kv_store WHERE user_id = $1 AND key = $2", [req.userId, req.params.key]);
  if (existing) {
    await dbRun("UPDATE kv_store SET value = $1 WHERE user_id = $2 AND key = $3", [value, req.userId, req.params.key]);
  } else {
    await dbRun("INSERT INTO kv_store (user_id, key, value) VALUES ($1, $2, $3)", [req.userId, req.params.key, value]);
  }
  res.json({ ok: true });
});

// --- 数据迁移（旧 localStorage → 当前用户） ---

app.post('/api/migrate', requireAuth, async (req, res) => {
  var { records, journals, userCategories, budget, darkmode, stickers, checkin_date, pet_img } = req.body;

  var existingRecords = await dbGet("SELECT COUNT(*) as cnt FROM records WHERE user_id = $1", [req.userId]);
  if (existingRecords && parseInt(existingRecords.cnt) > 0) {
    return res.status(409).json({ error: '数据库已有数据，无需迁移' });
  }

  try {
    await dbTransaction(async (tx) => {
      if (Array.isArray(records) && records.length > 0) {
        for (var r of records) {
          await tx.run("INSERT INTO records (id, user_id, amount, cat1, cat2, date, note, type, photos) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
            [r.id, req.userId, r.amount, r.cat1, r.cat2, r.date, r.note || '', r.type || 'expense', JSON.stringify(r.photos || [])]);
        }
      }

      if (Array.isArray(journals) && journals.length > 0) {
        for (var j of journals) {
          await tx.run("INSERT INTO journals (id, user_id, content, photos, mood, sticker, stickers, related_record_id, date, time, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
            [j.id, req.userId, j.content, JSON.stringify(j.photos || []), j.mood || '', j.sticker || '', JSON.stringify(j.stickers || []), j.relatedRecordId || null, j.date, j.time, j.createdAt]);
        }
      }

      if (userCategories && typeof userCategories === 'object') {
        for (var name of Object.keys(userCategories)) {
          await tx.run("INSERT INTO user_categories (user_id, name, subs, color) VALUES ($1,$2,$3,$4)",
            [req.userId, name, JSON.stringify(userCategories[name].subs || []), userCategories[name].color || '#6366F1']);
        }
      }

      var kvPairs = { budget, darkmode, stickers, checkin_date, pet_img };
      for (var k of Object.keys(kvPairs)) {
        if (kvPairs[k] !== undefined && kvPairs[k] !== null) {
          await tx.run("INSERT INTO kv_store (user_id, key, value) VALUES ($1,$2,$3) ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value",
            [req.userId, k, String(kvPairs[k])]);
        }
      }
    });

    res.json({ ok: true, recordsCount: (records || []).length, journalsCount: (journals || []).length });
  } catch(e) {
    res.status(500).json({ error: '迁移失败：' + e.message });
  }
});

// ==================== 统一错误处理 ====================

app.use((err, req, res, next) => {
  console.error('服务器错误：', err.message);
  res.status(500).json({ error: '服务器开小差了，请稍后再试' });
});

// ==================== 启动服务器 ====================

async function start() {
  try {
    await initDB();
  } catch(e) {
    console.error('❌ 数据库连接失败：' + e.message);
    console.error('请确认已设置 DATABASE_URL 环境变量（Neon 连接字符串）');
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    console.log('🐱 ===================================');
    console.log('   ✨ 噗通日记本（多用户版）- 小管家已上线！');
    console.log('   打开浏览器访问：http://localhost:' + PORT);
    console.log('   按 Ctrl+C 可以关掉我哦~');
    console.log('🐱 ===================================');
  }).on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error('❌ 端口 ' + PORT + ' 被占用了！请先关掉其他程序，或者改一下 PORT 环境变量');
    } else {
      console.error('❌ 启动失败：' + e.message);
    }
    process.exit(1);
  });
}

start();
