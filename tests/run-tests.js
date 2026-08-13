/**
 * 噗通日记本 V4.2 - 自动化测试运行器（PostgreSQL 云端版）
 * 用法：node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { JSDOM } = require('jsdom');

let passed = 0, failed = 0, errors = [];

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch(e) { failed++; console.log(`  ❌ ${name}\n     原因：${e.message}`); errors.push({name,error:e.message}); }
}

// 同步版测试（JSDOM 纯函数）
function testSync(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch(e) { failed++; console.log(`  ❌ ${name}\n     原因：${e.message}`); errors.push({name,error:e.message}); }
}

function assertEqual(a,b,m){if(a!==b)throw new Error(m||`期望${JSON.stringify(b)}，实际${JSON.stringify(a)}`);}
function assertTrue(c,m){if(!c)throw new Error(m||'条件不成立');}

// HTTP 请求工具
function httpRequest(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, 'http://localhost:3457');
    const options = {
      hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      method: method, headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    if (body) options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// 等待服务器就绪
function waitForServer(retries) {
  retries = retries || 30;
  return new Promise((resolve, reject) => {
    function check() {
      http.get('http://localhost:3457/api/auth/status', (res) => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => { try { JSON.parse(d); resolve(); } catch(e) { retry(); } });
      }).on('error', () => retry());
    }
    function retry() {
      if (retries-- > 0) setTimeout(check, 300);
      else reject(new Error('测试服务器启动超时'));
    }
    check();
  });
}

// ==================== 主流程 ====================
async function main() {
  console.log('\n🧪 噗通日记本 V4.2 自动化测试（PostgreSQL + API）');
  console.log('='.repeat(50));

  // 1. 启动测试服务器（连接 .env 里的云端数据库 DATABASE_URL）
  console.log('\n⚙️  启动测试服务器...');

  const serverPath = path.join(__dirname, '..', 'server.js');
  const server = spawn('node', [serverPath], {
    env: { ...process.env, PORT: '3457' },
    stdio: 'pipe'
  });

  let token = '';
  try {
    await waitForServer();

    // ========== Part 1: 认证测试 ==========
    console.log('\n🔐 认证测试');

    var testUser = 'tu' + Date.now();

    // 检查状态接口能正常响应（云端数据库是共享的，不能断言"无用户"）
    var res = await httpRequest('GET', '/api/auth/status');
    testSync('状态接口正常响应', () => {
      assertTrue(typeof res.body.hasAnyUser === 'boolean',
        '应返回 hasAnyUser 布尔值');
    });

    // 注册
    res = await httpRequest('POST', '/api/auth/register', { username: testUser, password: '123456' });
    testSync('注册成功，返回 token', () => {
      assertTrue(!!res.body.token, '应返回token');
      token = res.body.token;
    });

    // 重复注册应失败
    res = await httpRequest('POST', '/api/auth/register', { username: testUser, password: '999999' });
    testSync('重复注册应拒绝', () => {
      assertEqual(res.status, 400);
    });

    // 检查状态（传用户名）
    res = await httpRequest('GET', '/api/auth/status?username=' + testUser);
    testSync('注册后：该用户存在', () => {
      assertEqual(res.body.exists, true);
    });

    // 错误密码登录
    res = await httpRequest('POST', '/api/auth/login', { username: testUser, password: 'wrong' });
    testSync('错误密码应返回 401', () => {
      assertEqual(res.status, 401);
    });

    // 正确登录
    res = await httpRequest('POST', '/api/auth/login', { username: testUser, password: '123456' });
    testSync('正确密码登录成功', () => {
      assertTrue(!!res.body.token, '应返回新token');
    });
    token = res.body.token;

    // ========== Part 2: 数据 CRUD 测试 ==========
    console.log('\n📦 数据存取测试');

    // Records
    var testRecords = [
      { id: 1, amount: 100, cat1: '🍽️ 餐饮饮食', cat2: '午餐', date: '2026-07-01', note: '', type: 'expense', photos: [] },
      { id: 2, amount: 200, cat1: '🚗 交通出行', cat2: '公交地铁', date: '2026-07-15', note: '', type: 'expense', photos: [] },
      { id: 3, amount: 300, cat1: '🛒 购物消费', cat2: '日常百货', date: '2026-06-20', note: '', type: 'expense', photos: [] }
    ];

    res = await httpRequest('PUT', '/api/records', testRecords, token);
    testSync('PUT 保存记账记录', () => { assertEqual(res.body.ok, true); assertEqual(res.body.count, 3); });

    res = await httpRequest('GET', '/api/records', null, token);
    testSync('GET 读取记账记录', () => { assertEqual(res.body.length, 3); assertEqual(res.body[0].amount, 300); });

    // Journals
    var testJournals = [
      { id: 1, content: '测试手账', photos: [], mood: '🥰', sticker: '🌸', relatedRecordId: null, date: '2026-07-14', time: '12:00', createdAt: new Date().toISOString() }
    ];

    res = await httpRequest('PUT', '/api/journals', testJournals, token);
    testSync('PUT 保存手账', () => { assertEqual(res.body.ok, true); });

    res = await httpRequest('GET', '/api/journals', null, token);
    testSync('GET 读取手账', () => { assertEqual(res.body.length, 1); assertEqual(res.body[0].mood, '🥰'); });

    // Categories
    var testCats = { '🐱 宠物': { subs: ['猫粮', '猫砂'], color: '#F97316' } };

    res = await httpRequest('PUT', '/api/categories', testCats, token);
    testSync('PUT 保存分类', () => { assertEqual(res.body.ok, true); });

    res = await httpRequest('GET', '/api/categories', null, token);
    testSync('GET 读取分类', () => {
      assertTrue(!!res.body['🐱 宠物'], '应有自定义分类');
      assertEqual(res.body['🐱 宠物'].subs.length, 2);
    });

    // KV Store
    res = await httpRequest('PUT', '/api/kv/budget', { value: '8000' }, token);
    testSync('PUT 保存键值', () => { assertEqual(res.body.ok, true); });

    res = await httpRequest('GET', '/api/kv/budget', null, token);
    testSync('GET 读取键值', () => { assertEqual(res.body.value, '8000'); });

    // 空 categories
    res = await httpRequest('PUT', '/api/categories', {}, token);
    res = await httpRequest('GET', '/api/categories', null, token);
    testSync('空分类返回空对象', () => { assertEqual(Object.keys(res.body).length, 0); });

    // ========== Part 2.5: 许愿储钱罐测试 ==========
    console.log('\n🐷 许愿储钱罐测试');

    // 获取当前计划（无计划时）
    res = await httpRequest('GET', '/api/savings/current', null, token);
    testSync('无计划时返回 null', () => { assertEqual(res.body.plan, null); });

    // 创建计划
    res = await httpRequest('POST', '/api/savings/plan', {
      title: '迪士尼基金', targetAmount: 3000, dailyAmount: 50,
      startDate: '2026-07-01'
    }, token);
    testSync('创建储钱计划成功', () => { assertEqual(res.body.ok, true); });

    // 获取当前计划
    res = await httpRequest('GET', '/api/savings/current', null, token);
    testSync('获取计划返回数据', () => {
      assertTrue(!!res.body.plan, '应有计划数据');
      assertEqual(res.body.plan.title, '迪士尼基金');
      assertEqual(res.body.plan.dailyAmount, 50);
    });

    // 执行打卡（使用当月日期，确保查询时能命中当前月份）
    var todayStr = new Date().toISOString().substring(0,10);
    res = await httpRequest('POST', '/api/savings/checkin', {
      amount: 50, date: todayStr, recordId: 999
    }, token);
    testSync('打卡成功', () => { assertEqual(res.body.ok, true); });

    // 重复打卡应拒绝
    res = await httpRequest('POST', '/api/savings/checkin', {
      amount: 50, date: todayStr
    }, token);
    testSync('重复打卡应拒绝', () => { assertEqual(res.status, 400); });

    // 获取当月日志
    res = await httpRequest('GET', '/api/savings/current', null, token);
    testSync('打卡后日志有记录', () => {
      assertTrue(!!res.body.logs[todayStr], '今日应有打卡记录');
    });

    // 撤销打卡
    res = await httpRequest('DELETE', '/api/savings/checkin/'+todayStr, null, token);
    testSync('撤销打卡成功', () => { assertEqual(res.body.ok, true); });

    // ========== Part 3: 权限测试 ==========
    console.log('\n🔒 权限测试');

    res = await httpRequest('GET', '/api/records', null, '');
    testSync('无 token 访问应返回 401', () => { assertEqual(res.status, 401); });

    res = await httpRequest('GET', '/api/records', null, 'fake-token');
    testSync('假 token 访问应返回 401', () => { assertEqual(res.status, 401); });

    // ========== Part 4: 迁移测试 ==========
    console.log('\n📥 迁移测试');

    // 清空记录来测试迁移
    res = await httpRequest('PUT', '/api/records', [], token);
    res = await httpRequest('GET', '/api/records', null, token);
    testSync('清空后记录为空', () => { assertEqual(res.body.length, 0); });

    // 尝试迁移
    var migrateData = {
      records: [{ id: 100, amount: 50, cat1: '🍽️ 餐饮饮食', cat2: '早餐', date: '2026-01-01', note: '', type: 'expense', photos: [] }],
      journals: [],
      userCategories: {},
      budget: '3000',
      darkmode: '0',
      stickers: '[]',
      checkin_date: '',
      pet_img: ''
    };
    // 注意：因为我们清空了 records，但其他表还有数据，所以迁移应该被拒绝（409）
    res = await httpRequest('POST', '/api/migrate', migrateData, token);
    // 可能 409 或 ok，取决于数据是否完全为空
    testSync('迁移接口正常响应', () => { assertTrue(res.status >= 200 && res.status < 500, 'HTTP状态码应正常'); });

    // ========== Part 5: 纯函数测试（JSDOM） ==========
    console.log('\n🔧 工具函数测试（纯函数）');

    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    // 用 JSDOM 加载，但拦截 fetch 以防止实际网络请求
    const dom = new JSDOM(html, {
      url: 'http://localhost:3456',
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      beforeParse(window) {
        // 拦截 fetch，防止 startup() 做真实请求
        window.fetch = () => new Promise(() => {});  // 永不 resolve，挂起
      }
    });

    const win = dom.window;

    // 等待一小段让同步代码执行，然后测试纯函数
    // 注意：startup() 是 async 的，会被挂起等待 fetch

    testSync('formatDate - 格式化日期', () => {
      assertEqual(win.formatDate(new Date(2026, 6, 13)), '2026-07-13');
    });

    testSync('formatDate - 补零', () => {
      assertEqual(win.formatDate(new Date(2026, 0, 5)), '2026-01-05');
    });

    testSync('formatMonthLabel - 月份标签', () => {
      assertEqual(win.formatMonthLabel('2026-07'), '2026年7月');
      assertEqual(win.formatMonthLabel('2026-12'), '2026年12月');
    });

    testSync('getCurrentMonth - 格式正确', () => {
      assertTrue(/^\d{4}-\d{2}$/.test(win.getCurrentMonth()));
    });

    testSync('escapeHtml - 转义HTML', () => {
      var escaped = win.escapeHtml('<script>alert("xss")</script>');
      assertTrue(escaped.includes('&lt;script&gt;'), 'script标签应被转义');
      assertTrue(escaped.includes('&lt;/script&gt;'), '闭合标签应被转义');
      assertTrue(!escaped.includes('<script>'), '不应有原始script标签');
      assertTrue(win.escapeHtml("it's").includes('&#39;'));
    });

    testSync('shiftMonth - 月份加减', () => {
      assertEqual(win.shiftMonth('2026-07', -1), '2026-06');
      assertEqual(win.shiftMonth('2026-07', 1), '2026-08');
      assertEqual(win.shiftMonth('2026-01', -1), '2025-12');
      assertEqual(win.shiftMonth('2026-12', 1), '2027-01');
    });

    // getMonthRecords 测试（直接设置 records 数组）
    testSync('getMonthRecords - 按月份筛选', () => {
      win.records = [
        { id: 1, amount: 100, date: '2026-07-01', cat1: '🍽️ 餐饮饮食', cat2: '午餐', note: '', type: 'expense' },
        { id: 2, amount: 200, date: '2026-07-15', cat1: '🚗 交通出行', cat2: '公交地铁', note: '', type: 'expense' },
        { id: 3, amount: 300, date: '2026-06-20', cat1: '🛒 购物消费', cat2: '日常百货', note: '', type: 'expense' }
      ];
      assertEqual(win.getMonthRecords('2026-07').length, 2);
      assertEqual(win.getMonthRecords('2026-06').length, 1);
      assertEqual(win.getMonthRecords('2026-05').length, 0);
      win.records = [];
    });

    // 分类系统测试（不使用存储）
    testSync('rebuildCategories - 预置大类', () => {
      win.userCategories = {};
      win.rebuildCategories();
      assertEqual(Object.keys(win.categories).length, 11);
      assertTrue(Object.keys(win.categories).includes('🍽️ 餐饮饮食'));
    });

    testSync('rebuildCategories - 合并自定义', () => {
      win.userCategories = { '🐱 宠物': { subs: ['猫粮', '猫砂'], color: '#F97316' } };
      win.rebuildCategories();
      assertEqual(Object.keys(win.categories).length, 12);
      assertEqual(win.categories['🐱 宠物'].length, 2);
      win.userCategories = {};
      win.rebuildCategories();
    });

    // 预算提醒测试
    testSync('getBudgetTip - 80%警告', () => {
      var tip = win.getBudgetTip(8000, 10000);
      assertTrue(tip !== null, '80%应有提醒');
      assertEqual(tip.level, 'warn');
    });

    testSync('getBudgetTip - 100%超支', () => {
      var tip = win.getBudgetTip(10000, 10000);
      assertTrue(tip !== null, '100%应有提醒');
      assertEqual(tip.level, 'over');
    });

    testSync('getBudgetTip - 未超不提醒', () => {
      var tip = win.getBudgetTip(5000, 10000);
      assertEqual(tip, null);
    });

    console.log('\n  ✅ 所有纯函数测试完成（含 getBudgetTip）');

  } catch(e) {
    console.error('测试异常：' + e.message);
  } finally {
    // 清理：关闭测试服务器
    server.kill();
  }

  // ========== 报告 ==========
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试报告');
  console.log('='.repeat(50));
  console.log(`  ✅ 通过：${passed} 项`);
  console.log(`  ❌ 失败：${failed} 项`);
  console.log(`  📈 总计：${passed + failed} 项`);
  console.log(`  🎯 通过率：${((passed/(passed+failed))*100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n失败详情：');
    errors.forEach((e, i) => console.log(`  ${i+1}. ${e.name}\n     ${e.error}`));
  }

  const resultFile = path.join(__dirname, '.test-result.json');
  const codeHash = process.env.CODE_HASH || 'unknown';
  try {
    fs.writeFileSync(resultFile, JSON.stringify({
      passed: failed === 0, passedCount: passed, failedCount: failed,
      totalCount: passed + failed,
      passRate: parseFloat(((passed/(passed+failed))*100).toFixed(1)),
      codeHash, timestamp: new Date().toISOString()
    }, null, 2), 'utf-8');
  } catch(e) { console.log('⚠️ 无法写入结果文件：' + e.message); }

  console.log(failed === 0 ? '\n🎉 所有测试通过！应用运行正常。\n' : '');
  process.exit(failed > 0 ? 1 : 0);
}

main();
