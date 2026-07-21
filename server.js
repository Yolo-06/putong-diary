/**
 * 噗通日记本 — 本地数据管家 🐱
 * 负责把数据存到硬盘上的 data.db 文件里
 * 用法：node server.js
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const PORT = process.env.PORT || 3456;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

// ==================== 数据库初始化 ====================

let db;

// sql.js 辅助函数：执行不返回结果的 SQL
function dbExec(sql) {
  db.exec(sql);
  saveDB();
}

// sql.js 辅助函数：查询单行（返回对象或 undefined）
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

// sql.js 辅助函数：执行写操作（INSERT/UPDATE/DELETE）
function dbRun(sql, params) {
  var stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDB();
}

async function initDB() {
  const SQL = await initSqlJs();

  // 尝试加载已有数据库，没有就创建新的
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

  // 建表（如果不存在）
  db.exec(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY,
    amount REAL NOT NULL,
    cat1 TEXT NOT NULL,
    cat2 TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'expense',
    photos TEXT DEFAULT '[]'
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS journals (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    photos TEXT DEFAULT '[]',
    mood TEXT DEFAULT '',
    sticker TEXT DEFAULT '',
    stickers TEXT DEFAULT '[]',
    related_record_id INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS user_categories (
    name TEXT PRIMARY KEY,
    subs TEXT NOT NULL DEFAULT '[]',
    color TEXT NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS savings_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    daily_amount REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT DEFAULT 'active'
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS savings_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    record_id INTEGER,
    UNIQUE(plan_id, date)
  )`);

  // 清理 24 小时前创建的旧会话（防止 token 堆积）
  var oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  db.exec("DELETE FROM sessions WHERE created_at < '" + oneDayAgo + "'");

  saveDB();
}

// 给 db 对象添加 .get() 和增强 .run() 方法，兼容 better-sqlite3 风格
function enhanceDB(rawDb) {
  rawDb._exec = rawDb.exec;
  rawDb._prepare = rawDb.prepare;

  // db.get(sql, [params]) — 查询单行，返回对象
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

  // db.run(sql, [params]) — 执行写操作（替换原生 run）
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
app.use(express.json({ limit: '10mb' }));  // 限制请求体积

// 安全响应头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:;");
  next();
});

// 只开放 index.html，不暴露项目其他文件（尤其是 data.db）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== 认证中间件 ====================

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '请先登录' });

  const row = db.get('SELECT token FROM sessions WHERE token = ?', [token]);
  if (!row) return res.status(401).json({ error: '登录已过期，请重新输入密码' });

  next();
}

// ==================== 认证接口 ====================

// 检查是否已设置密码
app.get('/api/auth/status', (req, res) => {
  const row = db.get("SELECT value FROM kv_store WHERE key = 'password_hash'");
  const lenRow = db.get("SELECT value FROM kv_store WHERE key = 'pin_length'");
  var result = { hasPassword: !!row };
  if (lenRow) result.pinLength = parseInt(lenRow.value) || 6;
  res.json(result);
});

// 首次设置密码
app.post('/api/auth/set-password', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '请输入密码' });
  if (password.length !== 6) {
    return res.status(400).json({ error: '密码需要正好6位数字哦~' });
  }
  if (!/^\d+$/.test(password)) {
    return res.status(400).json({ error: '密码只能是数字哦~' });
  }

  // 检查是否已设置过
  const existing = db.get("SELECT value FROM kv_store WHERE key = 'password_hash'");
  if (existing) return res.status(400).json({ error: '密码已设置过啦，请登录' });

  const hash = bcrypt.hashSync(password, 10);
  dbRun("INSERT INTO kv_store (key, value) VALUES ('password_hash', ?)", [hash]);
  // 保存密码长度
  dbRun("INSERT INTO kv_store (key, value) VALUES ('pin_length', ?)", [String(password.length)]);

  // 创建会话
  const token = crypto.randomBytes(32).toString('hex');
  dbRun("INSERT INTO sessions (token, created_at) VALUES (?, ?)", [token, new Date().toISOString()]);

  res.json({ token, pinLength: password.length });
});

// 登录
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '请输入密码' });

  const row = db.get("SELECT value FROM kv_store WHERE key = 'password_hash'");
  if (!row) return res.status(400).json({ error: '请先设置密码' });

  if (!bcrypt.compareSync(password, row.value)) {
    return res.status(401).json({ error: '密码不对哦，再试一次吧~' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  dbRun("INSERT INTO sessions (token, created_at) VALUES (?, ?)", [token, new Date().toISOString()]);

  res.json({ token });
});

// 退出登录
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization.replace('Bearer ', '');
  dbRun("DELETE FROM sessions WHERE token = ?", [token]);
  res.json({ ok: true });
});

// 重置密码（忘记密码时使用，前端已弹窗确认）
// 安全说明：服务器已绑定 127.0.0.1 仅监听本机，外部网络无法访问，
// 所以即使此接口不需要登录验证，也不会被局域网其他人利用。
// 如需额外保护，可手动删除 data.db 文件来重置一切。
app.post('/api/auth/reset-password', (req, res) => {
  dbRun("DELETE FROM kv_store WHERE key IN ('password_hash', 'pin_length')");
  dbRun("DELETE FROM sessions");
  res.json({ ok: true });
});

// 修改密码
app.put('/api/auth/change-password', requireAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: '请填写旧密码和新密码' });
  if (newPassword.length !== 6) return res.status(400).json({ error: '新密码需要正好6位数字哦~' });
  if (!/^\d+$/.test(newPassword)) return res.status(400).json({ error: '新密码只能是数字哦~' });

  const row = db.get("SELECT value FROM kv_store WHERE key = 'password_hash'");
  if (!row) return res.status(400).json({ error: '还没有设置过密码' });
  if (!bcrypt.compareSync(oldPassword, row.value)) return res.status(401).json({ error: '旧密码不对哦~' });

  const hash = bcrypt.hashSync(newPassword, 10);
  dbRun("UPDATE kv_store SET value = ? WHERE key = 'password_hash'", [hash]);
  // 同步更新密码长度
  var existingLen = db.get("SELECT value FROM kv_store WHERE key = 'pin_length'");
  if (existingLen) {
    dbRun("UPDATE kv_store SET value = ? WHERE key = 'pin_length'", [String(newPassword.length)]);
  } else {
    dbRun("INSERT INTO kv_store (key, value) VALUES ('pin_length', ?)", [String(newPassword.length)]);
  }
  res.json({ ok: true });
});

// ==================== 数据接口 ====================

// --- 记账记录 ---

app.get('/api/records', requireAuth, (req, res) => {
  const rows = db.exec("SELECT * FROM records ORDER BY id DESC");
  if (rows.length === 0) return res.json([]);

  const records = rows[0].values.map(row => ({
    id: row[0], amount: row[1], cat1: row[2], cat2: row[3],
    date: row[4], note: row[5], type: row[6],
    photos: JSON.parse(row[7])
  }));
  res.json(records);
});

app.put('/api/records', requireAuth, (req, res) => {
  const records = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: '数据格式错误' });

  dbRun("DELETE FROM records");
  const stmt = db.prepare("INSERT INTO records (id, amount, cat1, cat2, date, note, type, photos) VALUES (?,?,?,?,?,?,?,?)");
  records.forEach(r => {
    stmt.run([r.id, r.amount, r.cat1, r.cat2, r.date, r.note || '', r.type || 'expense', JSON.stringify(r.photos || [])]);
  });
  stmt.free();
  saveDB();
  res.json({ ok: true, count: records.length });
});

// --- 手账记录 ---

app.get('/api/journals', requireAuth, (req, res) => {
  const rows = db.exec("SELECT * FROM journals ORDER BY id DESC");
  if (rows.length === 0) return res.json([]);

  const journals = rows[0].values.map(row => ({
    id: row[0], content: row[1],
    photos: JSON.parse(row[2]),
    mood: row[3], sticker: row[4],
    stickers: JSON.parse(row[5] || '[]'),
    relatedRecordId: row[6], date: row[7],
    time: row[8], createdAt: row[9]
  }));
  res.json(journals);
});

app.put('/api/journals', requireAuth, (req, res) => {
  const journals = req.body;
  if (!Array.isArray(journals)) return res.status(400).json({ error: '数据格式错误' });

  dbRun("DELETE FROM journals");
  const stmt = db.prepare("INSERT INTO journals (id, content, photos, mood, sticker, stickers, related_record_id, date, time, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)");
  journals.forEach(j => {
    stmt.run([j.id, j.content, JSON.stringify(j.photos || []), j.mood || '', j.sticker || '', JSON.stringify(j.stickers || []), j.relatedRecordId || null, j.date, j.time, j.createdAt]);
  });
  stmt.free();
  saveDB();
  res.json({ ok: true, count: journals.length });
});

// --- 许愿储钱罐 ---

app.get('/api/savings/current', requireAuth, (req, res) => {
  // 获取当前活跃计划
  const plan = db.get("SELECT * FROM savings_plans WHERE status = 'active' ORDER BY id DESC LIMIT 1");
  if (!plan) return res.json({ plan: null, logs: {} });

  // 获取当月打卡日志
  const today = new Date();
  const monthStart = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-01';
  const monthEnd = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-31';
  const logsRows = db.exec("SELECT date, amount, record_id FROM savings_logs WHERE plan_id = ? AND date >= ? AND date <= ? ORDER BY date",
    [plan.id, monthStart, monthEnd]);
  const logs = {};
  if (logsRows.length > 0 && logsRows[0].values.length > 0) {
    logsRows[0].values.forEach(row => { logs[row[0]] = { amount: row[1], recordId: row[2] }; });
  }

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
  const { title, targetAmount, dailyAmount, startDate, endDate } = req.body;
  if (!title || !targetAmount || !dailyAmount) {
    return res.status(400).json({ error: '请填写完整信息哦~' });
  }

  // 检查是否已有活跃计划
  const existing = db.get("SELECT id FROM savings_plans WHERE status = 'active'");
  if (existing) {
    // 更新现有计划
    dbRun("UPDATE savings_plans SET title=?, target_amount=?, daily_amount=?, start_date=?, end_date=? WHERE id=?",
      [title, targetAmount, dailyAmount, startDate, endDate || null, existing.id]);
    return res.json({ ok: true, id: existing.id, updated: true });
  }

  // 新建
  dbRun("INSERT INTO savings_plans (title, target_amount, daily_amount, start_date, end_date) VALUES (?,?,?,?,?)",
    [title, targetAmount, dailyAmount, startDate, endDate || null]);
  res.json({ ok: true, updated: false });
});

app.post('/api/savings/checkin', requireAuth, (req, res) => {
  const { amount, date, recordId } = req.body;
  const checkDate = date || new Date().toISOString().substring(0, 10);

  // 获取当前计划
  const plan = db.get("SELECT * FROM savings_plans WHERE status = 'active' ORDER BY id DESC LIMIT 1");
  if (!plan) return res.status(400).json({ error: '还没有创建储钱计划哦~' });

  // 检查是否已打卡
  const existingLog = db.get("SELECT id FROM savings_logs WHERE plan_id = ? AND date = ?", [plan.id, checkDate]);
  if (existingLog) return res.status(400).json({ error: '今天已经投过币啦~' });

  const checkAmount = amount || plan.daily_amount;
  dbRun("INSERT INTO savings_logs (plan_id, date, amount, record_id) VALUES (?,?,?,?)",
    [plan.id, checkDate, checkAmount, recordId || null]);

  res.json({ ok: true, amount: checkAmount, date: checkDate });
});

app.delete('/api/savings/checkin/:date', requireAuth, (req, res) => {
  const plan = db.get("SELECT id FROM savings_plans WHERE status = 'active' ORDER BY id DESC LIMIT 1");
  if (!plan) return res.status(400).json({ error: '没有活跃的储钱计划' });

  dbRun("DELETE FROM savings_logs WHERE plan_id = ? AND date = ?", [plan.id, req.params.date]);
  res.json({ ok: true });
});

// --- 用户分类 ---

app.get('/api/categories', requireAuth, (req, res) => {
  const rows = db.exec("SELECT * FROM user_categories");
  if (rows.length === 0) return res.json({});

  const cats = {};
  rows[0].values.forEach(row => {
    cats[row[0]] = { subs: JSON.parse(row[1]), color: row[2] };
  });
  res.json(cats);
});

app.put('/api/categories', requireAuth, (req, res) => {
  const cats = req.body;
  if (typeof cats !== 'object') return res.status(400).json({ error: '数据格式错误' });

  dbRun("DELETE FROM user_categories");
  const stmt = db.prepare("INSERT INTO user_categories (name, subs, color) VALUES (?,?,?)");
  Object.keys(cats).forEach(name => {
    stmt.run([name, JSON.stringify(cats[name].subs || []), cats[name].color || '#6366F1']);
  });
  stmt.free();
  saveDB();
  res.json({ ok: true });
});

// --- 键值存储 ---

// 敏感 key 白名单：只有这些 key 可以通过通用 KV 接口读写
// password_hash 和 pin_length 只能通过 /api/auth/* 专用接口操作
var ALLOWED_KV_KEYS = ['budget', 'darkmode', 'stickers', 'checkin_date', 'pet_img'];

app.get('/api/kv/:key', requireAuth, (req, res) => {
  if (ALLOWED_KV_KEYS.indexOf(req.params.key) === -1) {
    return res.status(403).json({ error: '不允许访问此配置项' });
  }
  const row = db.get("SELECT value FROM kv_store WHERE key = ?", [req.params.key]);
  res.json({ value: row ? row.value : null });
});

app.put('/api/kv/:key', requireAuth, (req, res) => {
  if (ALLOWED_KV_KEYS.indexOf(req.params.key) === -1) {
    return res.status(403).json({ error: '不允许修改此配置项' });
  }
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: '缺少 value' });

  const existing = db.get("SELECT key FROM kv_store WHERE key = ?", [req.params.key]);
  if (existing) {
    dbRun("UPDATE kv_store SET value = ? WHERE key = ?", [value, req.params.key]);
  } else {
    dbRun("INSERT INTO kv_store (key, value) VALUES (?, ?)", [req.params.key, value]);
  }
  res.json({ ok: true });
});

// --- 数据迁移 ---

app.post('/api/migrate', requireAuth, (req, res) => {
  const { records, journals, userCategories, budget, darkmode, stickers, checkin_date, pet_img } = req.body;

  // 检查是否已有数据，防止重复迁移
  const existingRecords = db.get("SELECT COUNT(*) as cnt FROM records");
  if (existingRecords && existingRecords.cnt > 0) {
    return res.status(409).json({ error: '数据库已有数据，无需迁移' });
  }

  try {
    // 写入记账记录
    if (Array.isArray(records) && records.length > 0) {
      const stmt = db.prepare("INSERT INTO records (id, amount, cat1, cat2, date, note, type, photos) VALUES (?,?,?,?,?,?,?,?)");
      records.forEach(r => {
        stmt.run([r.id, r.amount, r.cat1, r.cat2, r.date, r.note || '', r.type || 'expense', JSON.stringify(r.photos || [])]);
      });
      stmt.free();
    }

    // 写入手账
    if (Array.isArray(journals) && journals.length > 0) {
      const stmt = db.prepare("INSERT INTO journals (id, content, photos, mood, sticker, stickers, related_record_id, date, time, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)");
      journals.forEach(j => {
        stmt.run([j.id, j.content, JSON.stringify(j.photos || []), j.mood || '', j.sticker || '', JSON.stringify(j.stickers || []), j.relatedRecordId || null, j.date, j.time, j.createdAt]);
      });
      stmt.free();
    }

    // 写入分类
    if (userCategories && typeof userCategories === 'object') {
      const stmt = db.prepare("INSERT INTO user_categories (name, subs, color) VALUES (?,?,?)");
      Object.keys(userCategories).forEach(name => {
        stmt.run([name, JSON.stringify(userCategories[name].subs || []), userCategories[name].color || '#6366F1']);
      });
      stmt.free();
    }

    // 写入键值
    const kvPairs = { budget, darkmode, stickers, checkin_date, pet_img };
    const kvStmt = db.prepare("INSERT OR REPLACE INTO kv_store (key, value) VALUES (?,?)");
    Object.keys(kvPairs).forEach(k => {
      if (kvPairs[k] !== undefined && kvPairs[k] !== null) {
        kvStmt.run([k, String(kvPairs[k])]);
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

  app.listen(PORT, '127.0.0.1', () => {
    console.log('🐱 ===================================');
    console.log('   ✨ 噗通日记本 - 小管家已上线！');
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
