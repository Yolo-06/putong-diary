/**
 * 记账本 - 自动化测试运行器
 *
 * 用大白话说：这个脚本会模拟浏览器环境，自动检查记账本的各项功能
 * 是否正常工作，然后给你一份测试报告。
 *
 * 用法：node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// ========== 辅助函数 ==========

let passed = 0;
let failed = 0;
let errors = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    const msg = `  ❌ ${name}\n     原因：${e.message}`;
    console.log(msg);
    errors.push({ name, error: e.message });
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg || `期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition, msg) {
  if (!condition) {
    throw new Error(msg || '条件不成立');
  }
}

// ========== 加载应用 ==========

console.log('');
console.log('🧪 记账本 自动化测试');
console.log('='.repeat(50));

const htmlPath = path.join(__dirname, '..', '记账本.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// 创建模拟浏览器环境
const dom = new JSDOM(htmlContent, {
  url: 'http://localhost',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true
});

const document = dom.window.document;

// ========== 数据层测试 ==========

console.log('\n📦 数据存取测试');

test('localStorage 读写记录', () => {
  const testData = [{ id: 1, amount: 100, cat1: '🍽️ 餐饮饮食', cat2: '午餐', date: '2026-07-01', note: '', type: 'expense' }];
  dom.window.saveRecords(testData);
  const loaded = dom.window.loadRecords();
  assertEqual(loaded.length, 1, '记录数量应该为1');
  assertEqual(loaded[0].amount, 100, '金额应该为100');
  // 清理
  dom.window.saveRecords([]);
});

test('loadRecords 空数据返回空数组', () => {
  dom.window.saveRecords([]);
  const loaded = dom.window.loadRecords();
  assertTrue(Array.isArray(loaded), '应该返回数组');
  assertEqual(loaded.length, 0, '空数据时应返回空数组');
});

test('用户分类读写', () => {
  const testCats = { '🐱 宠物': { subs: ['猫粮', '猫砂'], color: '#F97316' } };
  // saveUserCategories 读取的是全局 userCategories 变量，需要先赋值
  dom.window.userCategories = testCats;
  dom.window.saveUserCategories();
  const loaded = dom.window.loadUserCategories();
  assertEqual(Object.keys(loaded).length, 1, '应有1个大类');
  assertEqual(loaded['🐱 宠物'].subs.length, 2, '应有2个小类');
  // 清理
  dom.window.userCategories = {};
  dom.window.saveUserCategories();
  dom.window.rebuildCategories();
});

// ========== 工具函数测试 ==========

console.log('\n🔧 工具函数测试');

test('formatDate - 格式化日期', () => {
  const d = new Date(2026, 6, 13); // 7月13日
  const result = dom.window.formatDate(d);
  assertEqual(result, '2026-07-13', '日期格式应为 YYYY-MM-DD');
});

test('formatDate - 补零', () => {
  const d = new Date(2026, 0, 5); // 1月5日
  const result = dom.window.formatDate(d);
  assertEqual(result, '2026-01-05', '月份和日期应补零');
});

test('formatMonthLabel - 月份标签', () => {
  assertEqual(dom.window.formatMonthLabel('2026-07'), '2026年7月', '7月显示');
  assertEqual(dom.window.formatMonthLabel('2026-12'), '2026年12月', '12月显示');
});

test('getCurrentMonth - 当前月份', () => {
  const result = dom.window.getCurrentMonth();
  assertTrue(/^\d{4}-\d{2}$/.test(result), '格式应为 YYYY-MM');
});

test('escapeHtml - 转义HTML', () => {
  assertEqual(dom.window.escapeHtml('<script>alert("xss")</script>'),
    '&lt;script&gt;alert("xss")&lt;/script&gt;', '应转义特殊字符');
});

test('getMonthRecords - 按月份筛选', () => {
  const testRecords = [
    { id: 1, amount: 100, date: '2026-07-01', cat1: '🍽️ 餐饮饮食', cat2: '午餐', note: '', type: 'expense' },
    { id: 2, amount: 200, date: '2026-07-15', cat1: '🚗 交通出行', cat2: '公交地铁', note: '', type: 'expense' },
    { id: 3, amount: 300, date: '2026-06-20', cat1: '🛒 购物消费', cat2: '日常百货', note: '', type: 'expense' },
    { id: 4, amount: 500, date: '2026-07-01', cat1: '💰 收入', cat2: '工资薪水', note: '', type: 'income' },
  ];
  dom.window.saveRecords(testRecords);
  // 同步全局变量 records（因为 saveRecords 只写 localStorage，
  // 全局 records 变量需要手动同步）
  dom.window.records = testRecords.slice();

  const july = dom.window.getMonthRecords('2026-07');
  assertEqual(july.length, 3, '7月应有3条记录');

  const june = dom.window.getMonthRecords('2026-06');
  assertEqual(june.length, 1, '6月应有1条记录');

  const may = dom.window.getMonthRecords('2026-05');
  assertEqual(may.length, 0, '5月应有0条记录');

  // 清理
  dom.window.saveRecords([]);
  dom.window.records = [];
});

// ========== 分类系统测试 ==========

console.log('\n📂 分类系统测试');

test('isPresetMajor - 识别预置分类', () => {
  assertTrue(dom.window.isPresetMajor('🍽️ 餐饮饮食'), '餐饮饮食是预置分类');
  assertTrue(dom.window.isPresetMajor('💰 收入'), '收入是预置分类');
});

test('isPresetMajor - 识别非预置分类', () => {
  assertTrue(!dom.window.isPresetMajor('🐱 我的自定义分类'), '自定义分类不应被识别为预置');
  assertTrue(!dom.window.isPresetMajor(''), '空字符串不应被识别为预置');
});

test('getPresetSubs - 获取预置小类', () => {
  const subs = dom.window.getPresetSubs('🍽️ 餐饮饮食');
  assertEqual(subs.length, 6, '餐饮饮食应有6个预置小类');
  assertTrue(subs.includes('早餐'), '应包含早餐');
  assertTrue(subs.includes('午餐'), '应包含午餐');
});

test('getPresetSubs - 不存在的分类', () => {
  const subs = dom.window.getPresetSubs('不存在分类');
  assertEqual(subs.length, 0, '不存在的分类应返回空数组');
});

test('rebuildCategories - 合并预置和自定义', () => {
  dom.window.saveUserCategories({});
  dom.window.rebuildCategories();

  const keys = Object.keys(dom.window.categories);
  assertEqual(keys.length, 11, '应有11个预置大类');
  assertTrue(keys.includes('🍽️ 餐饮饮食'), '应包含餐饮饮食');
  assertTrue(keys.includes('💰 收入'), '应包含收入');
});

test('rebuildCategories - 合并自定义分类', () => {
  dom.window.userCategories = {
    '🐱 宠物': { subs: ['猫粮', '猫砂'], color: '#F97316' }
  };
  dom.window.saveUserCategories();
  dom.window.userCategories = dom.window.loadUserCategories();
  dom.window.rebuildCategories();

  const keys = Object.keys(dom.window.categories);
  assertEqual(keys.length, 12, '加上自定义应共12个大类');
  assertTrue(keys.includes('🐱 宠物'), '应包含宠物');
  assertEqual(dom.window.categories['🐱 宠物'].length, 2, '宠物应有2个小类');
  assertEqual(dom.window.catColors['🐱 宠物'], '#F97316', '颜色应匹配');

  // 清理
  dom.window.saveUserCategories({});
  dom.window.userCategories = {};
  dom.window.rebuildCategories();
});

test('getUserAddedSubs - 获取用户添加的小类', () => {
  dom.window.userCategories = {
    '🍽️ 餐饮饮食': { subs: ['下午茶', '夜宵'] }
  };
  dom.window.saveUserCategories();
  dom.window.userCategories = dom.window.loadUserCategories();
  dom.window.rebuildCategories();

  const subs = dom.window.getUserAddedSubs('🍽️ 餐饮饮食');
  assertEqual(subs.length, 2, '应有2个用户小类');
  assertTrue(subs.includes('下午茶'), '应包含下午茶');

  // 清理
  dom.window.saveUserCategories({});
  dom.window.userCategories = {};
  dom.window.rebuildCategories();
});

// ========== 记账功能测试 ==========

console.log('\n✏️ 记账功能测试');

// 确保 records 全局变量正确初始化
dom.window.saveRecords([]);
dom.window.records = [];

test('addRecord - 空金额应拒绝', () => {
  const before = dom.window.records.length;

  document.getElementById('amountInput').value = '';
  document.getElementById('cat1Select').value = '🍽️ 餐饮饮食';
  document.getElementById('cat2Select').value = '午餐';
  document.getElementById('dateInput').value = '2026-07-13';
  document.getElementById('noteInput').value = '';

  dom.window.addRecord();

  assertEqual(dom.window.records.length, before, '空金额不应添加记录');
});

test('addRecord - 正常记录', () => {
  const before = dom.window.records.length;

  document.getElementById('amountInput').value = '88.50';
  document.getElementById('cat1Select').value = '🍽️ 餐饮饮食';
  document.getElementById('dateInput').value = '2026-07-13';
  document.getElementById('noteInput').value = '测试午餐';

  // 手动触发二级分类更新
  dom.window.updateCat2Options('🍽️ 餐饮饮食');
  document.getElementById('cat2Select').value = '午餐';

  dom.window.addRecord();

  assertEqual(dom.window.records.length, before + 1, '应新增1条记录');
  const latest = dom.window.records[0];
  assertEqual(latest.amount, 88.50, '金额应为88.50');
  assertEqual(latest.cat1, '🍽️ 餐饮饮食', '大类应为餐饮饮食');
  assertEqual(latest.cat2, '午餐', '小类应为午餐');
  assertEqual(latest.date, '2026-07-13', '日期应正确');
  assertEqual(latest.note, '测试午餐', '备注应正确');
  assertEqual(latest.type, 'expense', '类型应为支出');

  // 清理：删除刚添加的记录
  dom.window.records.shift();
  dom.window.saveRecords(dom.window.records);
});

test('addRecord - 收入类型识别', () => {
  const before = dom.window.records.length;

  document.getElementById('amountInput').value = '5000';
  document.getElementById('cat1Select').value = '💰 收入';
  document.getElementById('dateInput').value = '2026-07-01';
  document.getElementById('noteInput').value = '工资';

  dom.window.updateCat2Options('💰 收入');
  document.getElementById('cat2Select').value = '工资薪水';

  dom.window.addRecord();

  assertEqual(dom.window.records.length, before + 1, '应新增1条记录');
  assertEqual(dom.window.records[0].type, 'income', '收入分类的记录类型应为 income');
  assertEqual(dom.window.records[0].amount, 5000, '金额应为5000');

  // 清理
  dom.window.records.shift();
  dom.window.saveRecords(dom.window.records);
});

// ========== 俄罗斯方块逻辑测试 ==========

console.log('\n🎮 俄罗斯方块逻辑测试');

// 初始化俄罗斯方块棋盘（因为 init() 不会自动初始化它）
function initTetrisBoard() {
  const cols = dom.window.TETRIS_COLS;
  const rows = dom.window.TETRIS_ROWS;
  dom.window.tetrisBoard = [];
  for (let r = 0; r < rows; r++) {
    dom.window.tetrisBoard[r] = [];
    for (let c = 0; c < cols; c++) {
      dom.window.tetrisBoard[r][c] = '';
    }
  }
}

test('rotateMatrix - 旋转 O 型方块（2x2）', () => {
  const matrix = [[1,1],[1,1]];
  const rotated = dom.window.rotateMatrix(matrix);
  assertEqual(JSON.stringify(rotated), JSON.stringify([[1,1],[1,1]]), 'O型方块旋转后形状应不变');
});

test('rotateMatrix - 旋转 I 型方块（4x4）', () => {
  // I型横条
  const matrix = [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ];
  const rotated = dom.window.rotateMatrix(matrix);
  // 旋转后应该是竖条：[0,0,1,0] x4
  assertEqual(rotated.length, 4, '应有4行');
  for (let r = 0; r < 4; r++) {
    assertEqual(rotated[r][2], 1, `第${r+1}行第3列应为1`);
  }
});

test('isValidPosition - 空棋盘中心位置有效', () => {
  initTetrisBoard();
  const matrix = [[1,1],[1,1]];
  assertTrue(dom.window.isValidPosition(matrix, 0, 4), '空棋盘中心位置应有效');
});

test('isValidPosition - 超出右边界无效', () => {
  initTetrisBoard();
  const matrix = [[1,1],[1,1]];
  assertTrue(!dom.window.isValidPosition(matrix, 0, 9), '超出右边界应无效');
});

test('isValidPosition - 超出底部无效', () => {
  initTetrisBoard();
  const matrix = [[1,1],[1,1]];
  assertTrue(!dom.window.isValidPosition(matrix, 19, 4), '超出底部应无效');
});

test('createPiece - 创建方块', () => {
  const piece = dom.window.createPiece(0);
  assertTrue(piece.matrix.length > 0, '方块应有矩阵');
  assertTrue(!!piece.color, '方块应有颜色');
  assertEqual(piece.row, 0, '起始行应为0');
});

test('randomPieceIdx - 随机索引范围', () => {
  const total = dom.window.TETRIS_PIECES.length;
  for (let i = 0; i < 50; i++) {
    const idx = dom.window.randomPieceIdx();
    assertTrue(idx >= 0 && idx < total, `索引 ${idx} 应在0-${total - 1}之间`);
  }
});

// ========== 导出功能测试 ==========

console.log('\n📥 导出功能测试');

test('exportCSV - 有数据时不报错', () => {
  // jsdom 不支持 URL.createObjectURL/revokeObjectURL，手动模拟
  const originalCreateObjectURL = dom.window.URL.createObjectURL;
  const originalRevokeObjectURL = dom.window.URL.revokeObjectURL;
  dom.window.URL.createObjectURL = () => 'blob:mock-url';
  dom.window.URL.revokeObjectURL = () => {};
  // 模拟 <a> 元素的 click 方法
  const originalClick = dom.window.HTMLAnchorElement.prototype.click;
  dom.window.HTMLAnchorElement.prototype.click = function() {};

  const testRecords = [
    { id: 1, amount: 100, date: '2026-07-01', cat1: '🍽️ 餐饮饮食', cat2: '午餐', note: '', type: 'expense' },
  ];
  dom.window.saveRecords(testRecords);
  dom.window.records = testRecords.slice();

  try {
    dom.window.exportCSV('2026-07');
    assertTrue(true, '导出不应报错');
  } catch(e) {
    assertTrue(false, `导出报错：${e.message}`);
  }

  // 恢复
  dom.window.URL.createObjectURL = originalCreateObjectURL;
  dom.window.URL.revokeObjectURL = originalRevokeObjectURL;
  dom.window.HTMLAnchorElement.prototype.click = originalClick;
  dom.window.saveRecords([]);
  dom.window.records = [];
});

// ========== 删除功能测试 ==========

console.log('\n🗑️ 删除功能测试');

test('confirmDelete - 设置删除目标', () => {
  const testRecords = [
    { id: 999, amount: 50, date: '2026-07-01', cat1: '🍽️ 餐饮饮食', cat2: '测试', note: '', type: 'expense' },
  ];
  dom.window.saveRecords(testRecords);
  dom.window.records = testRecords.slice();

  dom.window.confirmDelete(999);
  assertEqual(dom.window.deleteTargetId, 999, 'deleteTargetId 应设为999');

  // 清理
  dom.window.closeDeleteModal();
  dom.window.saveRecords([]);
  dom.window.records = [];
});

test('closeDeleteModal - 清除删除目标', () => {
  dom.window.deleteTargetId = 123;
  dom.window.closeDeleteModal();
  assertEqual(dom.window.deleteTargetId, null, 'deleteTargetId 应为 null');
});

// ========== 输出汇总报告 ==========

console.log('');
console.log('='.repeat(50));
console.log('📊 测试报告');
console.log('='.repeat(50));
console.log(`  ✅ 通过：${passed} 项`);
console.log(`  ❌ 失败：${failed} 项`);
console.log(`  📈 总计：${passed + failed} 项`);
console.log(`  🎯 通过率：${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('');
  console.log('失败详情：');
  errors.forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.name}`);
    console.log(`     ${e.error}`);
  });
}

console.log('');
if (failed === 0) {
  console.log('🎉 所有测试通过！应用运行正常。');
}

// ========== 写入标记文件（供 gitcommit-agent / pre-commit hook 读  ==========

const resultFilePath = path.join(__dirname, '.test-result.json');
const codeHash = process.env.CODE_HASH || 'unknown';
const resultData = {
  passed: failed === 0,
  passedCount: passed,
  failedCount: failed,
  totalCount: passed + failed,
  passRate: parseFloat(((passed / (passed + failed)) * 100).toFixed(1)),
  codeHash: codeHash,
  timestamp: new Date().toISOString()
};

try {
  fs.writeFileSync(resultFilePath, JSON.stringify(resultData, null, 2), 'utf-8');
} catch(e) {
  console.log('⚠️ 无法写入测试结果标记文件：' + e.message);
}

// 返回退出码（CI 工具可以根据退出码判断测试是否通过）
process.exit(failed > 0 ? 1 : 0);
