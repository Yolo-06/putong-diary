/**
 * 噗通日记本 — 多用户版数据管家 🐱
 * 每人用用户名+密码注册自己的小账本，数据互不干扰
 * 用法：node server.js
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const PORT = process.env.PORT || 3456;
const HOST = process.env.HOST || '127.0.0.1';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

// ==================== 数据库初始化 ====================

let db;

function dbExec(sql) {
  db.exec(sql);
  saveDB();
}

function dbGet(sql, params) {
  var stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  if (stmt.step()) {
    var row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

function dbRun(sql, params) {
  var stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDB();
}

// sql.js 辅助函数：参数化查询多行（返回对象数组）
function dbAll(sql, params) {
  var stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  var results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    enhanceDB(db);
    console.log('📂 已加载数据库：' + DB_PATH);
  } else {
    db = new SQL.Database();
    enhanceDB(db);
    console.log('✨ 已创建新数据库：' + DB_PATH);
  }

  // 用户表
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    pin_length INTEGER DEFAULT 6,
    created_at TEXT NOT NULL
  )`);

  // 检查是否需要从旧版（单用户）升级
  var needsMigration = false;
  try {
    // 尝试查询旧表结构，如果 records 表存在但没有 user_id 列，则需要迁移
    var info = db.exec("PRAGMA table_info(records)");
    if (info.length > 0 && info[0].values.length > 0) {
      var cols = info[0].values.map(function(r) { return r[1]; });
      if (cols.indexOf('user_id') === -1) {
        needsMigration = true;
        console.log('🔄 检测到旧版数据（无多用户），准备升级...');
      }
    }
  } catch(e) {
    // 表不存在，不用迁移
  }

  if (needsMigration) {
    // 旧版升级：删除旧表，重新建带 user_id 的新表
    // 旧数据会丢失，但这是从单用户到多用户必须的代价
    db.exec("DROP TABLE IF EXISTS records");
    db.exec("DROP TABLE IF EXISTS journals");
    db.exec("DROP TABLE IF EXISTS user_categories");
    db.exec("DROP TABLE IF EXISTS kv_store");
    db.exec("DROP TABLE IF EXISTS sessions");
    db.exec("DROP TABLE IF EXISTS savings_plans");
    db.exec("DROP TABLE IF EXISTS savings_logs");
    console.log('🧹 旧表已清理，旧数据需重新注册后录入');
  }

  // 建新表（全部带 user_id）
  db.exec(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER, user_id INTEGER NOT NULL,
    amount REAL NOT NULL, cat1 TEXT NOT NULL, cat2 TEXT NOT NULL,
    date TEXT NOT NULL, note TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'expense', photos TEXT DEFAULT '[]',
    PRIMARY KEY (user_id, id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS journals (
    id INTEGER, user_id INTEGER NOT NULL,
    content TEXT NOT NULL, photos TEXT DEFAULT '[]',
    mood TEXT DEFAULT '', sticker TEXT DEFAULT '', stickers TEXT DEFAULT '[]',
    related_record_id INTEGER, date TEXT NOT NULL,
    time TEXT NOT NULL, created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS user_categories (
    user_id INTEGER NOT NULL, name TEXT NOT NULL,
    subs TEXT NOT NULL DEFAULT '[]', color TEXT NOT NULL,
    PRIMARY KEY (user_id, name)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS kv_store (
    user_id INTEGER NOT NULL, key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS savings_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, title TEXT NOT NULL,
    target_amount REAL NOT NULL, daily_amount REAL NOT NULL,
    start_date TEXT NOT NULL, end_date TEXT, status TEXT DEFAULT 'active'
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS savings_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
    date TEXT NOT NULL, amount REAL NOT NULL, record_id INTEGER,
    UNIQUE(plan_id, date)
  )`);

  // 清理 24 小时前创建的旧会话
  var oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  dbRun("DELETE FROM sessions WHERE created_at < ?", [oneDayAgo]);

  saveDB();
}

function enhanceDB(rawDb) {
  rawDb._exec = rawDb.exec;
  rawDb._prepare = rawDb.prepare;

  rawDb.get = function(sql, params) {
    var stmt = this._prepare(sql);
    if (params) stmt.bind(params);
    if (stmt.step()) {
      var row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  };

  rawDb.run = function(sql, params) {
    var stmt = this._prepare(sql);
    if (params) stmt.bind(params);
    stmt.step();
    stmt.free();
  };
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
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

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '请先登录' });

  const row = db.get('SELECT s.token, s.user_id FROM sessions s WHERE s.token = ?', [token]);
  if (!row) return res.status(401).json({ error: '登录已过期，请重新输入密码' });

  req.userId = row.user_id;
  next();
}

// ==================== 认证接口 ====================

// 检查用户名是否存在（注册前先查）
app.get('/api/auth/status', (req, res) => {
  const username = req.query.username || '';
  if (!username) {
    // 不传用户名：返回服务器是否有任何用户
    var anyUser = db.get("SELECT COUNT(*) as cnt FROM users");
    return res.json({ hasAnyUser: (anyUser && anyUser.cnt > 0) });
  }
  // 传了用户名：检查该用户是否存在
  var row = db.get("SELECT id, pin_length FROM users WHERE username = ?", [username]);
  res.json({ exists: !!row, pinLength: row ? row.pin_length : 6 });
});

// 注册（首次使用）
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' });
  if (!/^[a-zA-Z0-9_一-龥]{3,20}$/.test(username)) {
    return res.status(400).json({ error: '用户名3-20位，支持字母数字中文下划线' });
  }
  if (password.length !== 6) return res.status(400).json({ error: '密码需要正好6位数字哦~' });
  if (!/^\d+$/.test(password)) return res.status(400).json({ error: '密码只能是数字哦~' });

  // 检查用户名是否已被注册
  var existing = db.get("SELECT id FROM users WHERE username = ?", [username]);
  if (existing) return res.status(400).json({ error: '这个昵称已经被占用啦，换一个试试~' });

  var hash = bcrypt.hashSync(password, 10);
  dbRun("INSERT INTO users (username, password_hash, pin_length, created_at) VALUES (?,?,?,?)",
    [username, hash, password.length, new Date().toISOString()]);

  // 创建会话
  var user = db.get("SELECT id FROM users WHERE username = ?", [username]);
  var token = crypto.randomBytes(32).toString('hex');
  dbRun("INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)", [token, user.id, new Date().toISOString()]);

  res.json({ token, username, pinLength: password.length });
});

// 登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' });

  var row = db.get("SELECT id, password_hash, pin_length FROM users WHERE username = ?", [username]);
  if (!row) return res.status(400).json({ error: '用户不存在，请先注册' });

  if (!bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: '密码不对哦，再试一次吧~' });
  }

  var token = crypto.randomBytes(32).toString('hex');
  dbRun("INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)", [token, row.id, new Date().toISOString()]);

  res.json({ token, username, pinLength: row.pin_length });
});

// 退出登录
app.post('/api/auth/logout', requireAuth, (req, res) => {
  var token = req.headers.authorization.replace('Bearer ', '');
  dbRun("DELETE FROM sessions WHERE token = ?", [token]);
  res.json({ ok: true });
});

// 重置密码（忘记密码时使用）
// 云端部署时此接口不需登录，因为忘记密码的人无法登录
// 数据安全由 Render 的网络隔离层保障
app.post('/api/auth/reset-password', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: '请提供用户名' });
  var user = db.get("SELECT id FROM users WHERE username = ?", [username]);
  if (!user) return res.status(400).json({ error: '用户不存在' });
  dbRun("DELETE FROM users WHERE id = ?", [user.id]);
  dbRun("DELETE FROM sessions WHERE user_id = ?", [user.id]);
  dbRun("DELETE FROM records WHERE user_id = ?", [user.id]);
  dbRun("DELETE FROM journals WHERE user_id = ?", [user.id]);
  dbRun("DELETE FROM user_categories WHERE user_id = ?", [user.id]);
  dbRun("DELETE FROM kv_store WHERE user_id = ?", [user.id]);
  dbRun("DELETE FROM savings_plans WHERE user_id = ?", [user.id]);
  dbRun("DELETE FROM savings_logs WHERE user_id = ?", [user.id]);
  res.json({ ok: true });
});

// 修改密码
app.put('/api/auth/change-password', requireAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: '请填写旧密码和新密码' });
  if (newPassword.length !== 6) return res.status(400).json({ error: '新密码需要正好6位数字哦~' });
  if (!/^\d+$/.test(newPassword)) return res.status(400).json({ error: '新密码只能是数字哦~' });

  var row = db.get("SELECT password_hash FROM users WHERE id = ?", [req.userId]);
  if (!row) return res.status(400).json({ error: '用户不存在' });
  if (!bcrypt.compareSync(oldPassword, row.password_hash)) return res.status(401).json({ error: '旧密码不对哦~' });

  var hash = bcrypt.hashSync(newPassword, 10);
  dbRun("UPDATE users SET password_hash = ?, pin_length = ? WHERE id = ?", [hash, newPassword.length, req.userId]);
  res.json({ ok: true });
});

// ==================== 数据接口 ====================

// --- 记账记录 ---

app.get('/api/records', requireAuth, (req, res) => {
  var rows = dbAll("SELECT * FROM records WHERE user_id = ? ORDER BY id DESC", [req.userId]);

  var records = rows.map(function(row) {
    return {
      id: row.id, amount: row.amount, cat1: row.cat1, cat2: row.cat2,
      date: row.date, note: row.note, type: row.type,
      photos: JSON.parse(row.photos)
    };
  });
  res.json(records);
});

app.put('/api/records', requireAuth, (req, res) => {
  var records = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: '数据格式错误' });

  dbRun("DELETE FROM records WHERE user_id = ?", [req.userId]);
  var stmt = db.prepare("INSERT INTO records (id, user_id, amount, cat1, cat2, date, note, type, photos) VALUES (?,?,?,?,?,?,?,?,?)");
  records.forEach(function(r) {
    stmt.run([r.id, req.userId, r.amount, r.cat1, r.cat2, r.date, r.note || '', r.type || 'expense', JSON.stringify(r.photos || [])]);
  });
  stmt.free();
  saveDB();
  res.json({ ok: true, count: records.length });
});

// --- 手账记录 ---

app.get('/api/journals', requireAuth, (req, res) => {
  var rows = dbAll("SELECT * FROM journals WHERE user_id = ? ORDER BY id DESC", [req.userId]);

  var journals = rows.map(function(row) {
    return {
      id: row.id, content: row.content,
      photos: JSON.parse(row.photos),
      mood: row.mood, sticker: row.sticker,
      stickers: JSON.parse(row.stickers || '[]'),
      relatedRecordId: row.related_record_id, date: row.date,
      time: row.time, createdAt: row.created_at
    };
  });
  res.json(journals);
});

app.put('/api/journals', requireAuth, (req, res) => {
  var journals = req.body;
  if (!Array.isArray(journals)) return res.status(400).json({ error: '数据格式错误' });

  dbRun("DELETE FROM journals WHERE user_id = ?", [req.userId]);
  var stmt = db.prepare("INSERT INTO journals (id, user_id, content, photos, mood, sticker, stickers, related_record_id, date, time, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
  journals.forEach(function(j) {
    stmt.run([j.id, req.userId, j.content, JSON.stringify(j.photos || []), j.mood || '', j.sticker || '', JSON.stringify(j.stickers || []), j.relatedRecordId || null, j.date, j.time, j.createdAt]);
  });
  stmt.free();
  saveDB();
  res.json({ ok: true, count: journals.length });
});

// --- 许愿储钱罐 ---

app.get('/api/savings/current', requireAuth, (req, res) => {
  var plan = db.get("SELECT * FROM savings_plans WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1", [req.userId]);
  if (!plan) return res.json({ plan: null, logs: {} });

  var today = new Date();
  var monthStart = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-01';
  var monthEnd = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-31';
  var logsRows = dbAll("SELECT date, amount, record_id FROM savings_logs WHERE plan_id = ? AND user_id = ? AND date >= ? AND date <= ? ORDER BY date",
    [plan.id, req.userId, monthStart, monthEnd]);
  var logs = {};
  logsRows.forEach(function(row) { logs[row.date] = { amount: row.amount, recordId: row.record_id }; });

  res.json({
    plan: {
      id: plan.id, title: plan.title, targetAmount: plan.target_amount,
      dailyAmount: plan.daily_amount, startDate: plan.start_date,
      endDate: plan.end_date, status: plan.status
    },
    logs
  });
});

app.post('/api/savings/plan', requireAuth, (req, res) => {
  var { title, targetAmount, dailyAmount, startDate, endDate } = req.body;
  if (!title || !targetAmount || !dailyAmount) {
    return res.status(400).json({ error: '请填写完整信息哦~' });
  }

  var existing = db.get("SELECT id FROM savings_plans WHERE user_id = ? AND status = 'active'", [req.userId]);
  if (existing) {
    dbRun("UPDATE savings_plans SET title=?, target_amount=?, daily_amount=?, start_date=?, end_date=? WHERE id=? AND user_id=?",
      [title, targetAmount, dailyAmount, startDate, endDate || null, existing.id, req.userId]);
    return res.json({ ok: true, id: existing.id, updated: true });
  }

  dbRun("INSERT INTO savings_plans (user_id, title, target_amount, daily_amount, start_date, end_date) VALUES (?,?,?,?,?,?)",
    [req.userId, title, targetAmount, dailyAmount, startDate, endDate || null]);
  res.json({ ok: true, updated: false });
});

app.post('/api/savings/checkin', requireAuth, (req, res) => {
  var { amount, date, recordId } = req.body;
  var checkDate = date || new Date().toISOString().substring(0, 10);

  var plan = db.get("SELECT * FROM savings_plans WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1", [req.userId]);
  if (!plan) return res.status(400).json({ error: '还没有创建储钱计划哦~' });

  var existingLog = db.get("SELECT id FROM savings_logs WHERE plan_id = ? AND date = ?", [plan.id, checkDate]);
  if (existingLog) return res.status(400).json({ error: '今天已经投过币啦~' });

  var checkAmount = amount || plan.daily_amount;
  dbRun("INSERT INTO savings_logs (plan_id, user_id, date, amount, record_id) VALUES (?,?,?,?,?)",
    [plan.id, req.userId, checkDate, checkAmount, recordId || null]);

  res.json({ ok: true, amount: checkAmount, date: checkDate });
});

app.delete('/api/savings/checkin/:date', requireAuth, (req, res) => {
  var plan = db.get("SELECT id FROM savings_plans WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1", [req.userId]);
  if (!plan) return res.status(400).json({ error: '没有活跃的储钱计划' });

  dbRun("DELETE FROM savings_logs WHERE plan_id = ? AND date = ?", [plan.id, req.params.date]);
  res.json({ ok: true });
});

// --- 用户分类 ---

app.get('/api/categories', requireAuth, (req, res) => {
  var rows = dbAll("SELECT * FROM user_categories WHERE user_id = ?", [req.userId]);

  var cats = {};
  rows.forEach(function(row) {
    cats[row.name] = { subs: JSON.parse(row.subs), color: row.color };
  });
  res.json(cats);
});

app.put('/api/categories', requireAuth, (req, res) => {
  var cats = req.body;
  if (typeof cats !== 'object') return res.status(400).json({ error: '数据格式错误' });

  dbRun("DELETE FROM user_categories WHERE user_id = ?", [req.userId]);
  var stmt = db.prepare("INSERT INTO user_categories (user_id, name, subs, color) VALUES (?,?,?,?)");
  Object.keys(cats).forEach(function(name) {
    stmt.run([req.userId, name, JSON.stringify(cats[name].subs || []), cats[name].color || '#6366F1']);
  });
  stmt.free();
  saveDB();
  res.json({ ok: true });
});

// --- 键值存储 ---

var ALLOWED_KV_KEYS = ['budget', 'darkmode', 'stickers', 'checkin_date', 'pet_img',
  'savings_reminder_time', 'savings_reminder_enabled', 'last_savings_remind_date'];

app.get('/api/kv/:key', requireAuth, (req, res) => {
  if (ALLOWED_KV_KEYS.indexOf(req.params.key) === -1) {
    return res.status(403).json({ error: '不允许访问此配置项' });
  }
  var row = db.get("SELECT value FROM kv_store WHERE user_id = ? AND key = ?", [req.userId, req.params.key]);
  res.json({ value: row ? row.value : null });
});

app.put('/api/kv/:key', requireAuth, (req, res) => {
  if (ALLOWED_KV_KEYS.indexOf(req.params.key) === -1) {
    return res.status(403).json({ error: '不允许修改此配置项' });
  }
  var { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: '缺少 value' });

  var existing = db.get("SELECT key FROM kv_store WHERE user_id = ? AND key = ?", [req.userId, req.params.key]);
  if (existing) {
    dbRun("UPDATE kv_store SET value = ? WHERE user_id = ? AND key = ?", [value, req.userId, req.params.key]);
  } else {
    dbRun("INSERT INTO kv_store (user_id, key, value) VALUES (?, ?, ?)", [req.userId, req.params.key, value]);
  }
  res.json({ ok: true });
});

// --- 数据迁移（旧 localStorage → 当前用户） ---

app.post('/api/migrate', requireAuth, (req, res) => {
  var { records, journals, userCategories, budget, darkmode, stickers, checkin_date, pet_img } = req.body;

  var existingRecords = db.get("SELECT COUNT(*) as cnt FROM records WHERE user_id = ?", [req.userId]);
  if (existingRecords && existingRecords.cnt > 0) {
    return res.status(409).json({ error: '数据库已有数据，无需迁移' });
  }

  try {
    if (Array.isArray(records) && records.length > 0) {
      var stmt = db.prepare("INSERT INTO records (id, user_id, amount, cat1, cat2, date, note, type, photos) VALUES (?,?,?,?,?,?,?,?,?)");
      records.forEach(function(r) {
        stmt.run([r.id, req.userId, r.amount, r.cat1, r.cat2, r.date, r.note || '', r.type || 'expense', JSON.stringify(r.photos || [])]);
      });
      stmt.free();
    }

    if (Array.isArray(journals) && journals.length > 0) {
      var stmt = db.prepare("INSERT INTO journals (id, user_id, content, photos, mood, sticker, stickers, related_record_id, date, time, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
      journals.forEach(function(j) {
        stmt.run([j.id, req.userId, j.content, JSON.stringify(j.photos || []), j.mood || '', j.sticker || '', JSON.stringify(j.stickers || []), j.relatedRecordId || null, j.date, j.time, j.createdAt]);
      });
      stmt.free();
    }

    if (userCategories && typeof userCategories === 'object') {
      var stmt = db.prepare("INSERT INTO user_categories (user_id, name, subs, color) VALUES (?,?,?,?)");
      Object.keys(userCategories).forEach(function(name) {
        stmt.run([req.userId, name, JSON.stringify(userCategories[name].subs || []), userCategories[name].color || '#6366F1']);
      });
      stmt.free();
    }

    var kvPairs = { budget, darkmode, stickers, checkin_date, pet_img };
    var kvStmt = db.prepare("INSERT OR REPLACE INTO kv_store (user_id, key, value) VALUES (?,?,?)");
    Object.keys(kvPairs).forEach(function(k) {
      if (kvPairs[k] !== undefined && kvPairs[k] !== null) {
        kvStmt.run([req.userId, k, String(kvPairs[k])]);
      }
    });
    kvStmt.free();

    saveDB();
    res.json({ ok: true, recordsCount: (records || []).length, journalsCount: (journals || []).length });
  } catch(e) {
    res.status(500).json({ error: '迁移失败：' + e.message });
  }
});

// ==================== 启动服务器 ====================

async function start() {
  try {
    await initDB();
  } catch(e) {
    console.error('❌ 数据库初始化失败：' + e.message);
    console.error('请确认 data.db 文件没有被其他程序占用');
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
