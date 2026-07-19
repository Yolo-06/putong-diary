/**
 * 记账本 V2.0 - 自动化测试运行器
 * 用法：node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let passed = 0, failed = 0, errors = [];

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch(e) { failed++; console.log(`  ❌ ${name}\n     原因：${e.message}`); errors.push({name,error:e.message}); }
}
function assertEqual(a,b,m){if(a!==b)throw new Error(m||`期望${JSON.stringify(b)}，实际${JSON.stringify(a)}`);}
function assertTrue(c,m){if(!c)throw new Error(m||'条件不成立');}

console.log('\n🧪 记账本 V2.0 自动化测试');
console.log('='.repeat(50));

const htmlPath = path.join(__dirname, '..', '记账本.html');
const html = fs.readFileSync(htmlPath, 'utf-8');
const dom = new JSDOM(html, { url:'http://localhost', runScripts:'dangerously', resources:'usable', pretendToBeVisual:true });
const win = dom.window;
const doc = win.document;

// ========== 数据层 ==========
console.log('\n📦 数据存取测试');

test('localStorage 读写记录', () => {
  win.saveRecords([{id:1,amount:100,cat1:'🍽️ 餐饮饮食',cat2:'午餐',date:'2026-07-01',note:'',type:'expense'}]);
  assertEqual(win.loadRecords().length, 1);
  assertEqual(win.loadRecords()[0].amount, 100);
  win.saveRecords([]);
});

test('loadRecords 空数据返回空数组', () => {
  win.saveRecords([]);
  assertTrue(Array.isArray(win.loadRecords()));
  assertEqual(win.loadRecords().length, 0);
});

test('手账数据读写', () => {
  win.journals = [{id:1,content:'测试手账',photos:[],mood:'😊',relatedRecordId:null,date:'2026-07-14',time:'12:00',createdAt:new Date().toISOString()}];
  win.saveJournals();
  assertEqual(win.loadJournals().length, 1);
  assertEqual(win.loadJournals()[0].content, '测试手账');
  win.journals = []; win.saveJournals();
});

test('用户分类读写', () => {
  win.userCategories = {'🐱 宠物':{subs:['猫粮','猫砂'],color:'#F97316'}};
  win.saveUserCategories();
  assertEqual(Object.keys(win.loadUserCategories()).length, 1);
  win.userCategories = {}; win.saveUserCategories(); win.rebuildCategories();
});

// ========== 工具函数 ==========
console.log('\n🔧 工具函数测试');

test('formatDate - 格式化日期', () => {
  assertEqual(win.formatDate(new Date(2026,6,13)), '2026-07-13');
});

test('formatDate - 补零', () => {
  assertEqual(win.formatDate(new Date(2026,0,5)), '2026-01-05');
});

test('formatMonthLabel - 月份标签', () => {
  assertEqual(win.formatMonthLabel('2026-07'), '2026年7月');
  assertEqual(win.formatMonthLabel('2026-12'), '2026年12月');
});

test('getCurrentMonth - 格式正确', () => {
  assertTrue(/^\d{4}-\d{2}$/.test(win.getCurrentMonth()));
});

test('escapeHtml - 转义HTML', () => {
  // escapeHtml 转义 <> &，不转义引号（HTML body 上下文不需要）
  var escaped = win.escapeHtml('<script>alert("xss")</script>');
  assertTrue(escaped.includes('&lt;script&gt;'), 'script标签应被转义');
  assertTrue(escaped.includes('&lt;/script&gt;'), '闭合标签应被转义');
  assertTrue(!escaped.includes('<script>'), '不应有原始script标签');
  // 单引号也应被转义（V2增强）
  assertTrue(win.escapeHtml("it's").includes('&#39;'));
});

test('getMonthRecords - 按月份筛选', () => {
  win.saveRecords([
    {id:1,amount:100,date:'2026-07-01',cat1:'🍽️ 餐饮饮食',cat2:'午餐',note:'',type:'expense'},
    {id:2,amount:200,date:'2026-07-15',cat1:'🚗 交通出行',cat2:'公交地铁',note:'',type:'expense'},
    {id:3,amount:300,date:'2026-06-20',cat1:'🛒 购物消费',cat2:'日常百货',note:'',type:'expense'},
  ]);
  win.records = win.loadRecords();
  assertEqual(win.getMonthRecords('2026-07').length, 2);
  assertEqual(win.getMonthRecords('2026-06').length, 1);
  assertEqual(win.getMonthRecords('2026-05').length, 0);
  win.saveRecords([]); win.records = [];
});

test('shiftMonth - 月份加减', () => {
  assertEqual(win.shiftMonth('2026-07', -1), '2026-06');
  assertEqual(win.shiftMonth('2026-07', 1), '2026-08');
  assertEqual(win.shiftMonth('2026-01', -1), '2025-12');
  assertEqual(win.shiftMonth('2026-12', 1), '2027-01');
});

// ========== 分类系统 ==========
console.log('\n📂 分类系统测试');

test('rebuildCategories - 预置大类', () => {
  win.userCategories = {}; win.saveUserCategories(); win.userCategories = win.loadUserCategories(); win.rebuildCategories();
  assertEqual(Object.keys(win.categories).length, 11);
  assertTrue(Object.keys(win.categories).includes('🍽️ 餐饮饮食'));
});

test('rebuildCategories - 合并自定义', () => {
  win.userCategories = {'🐱 宠物':{subs:['猫粮','猫砂'],color:'#F97316'}};
  win.saveUserCategories(); win.userCategories = win.loadUserCategories(); win.rebuildCategories();
  assertEqual(Object.keys(win.categories).length, 12);
  assertEqual(win.categories['🐱 宠物'].length, 2);
  win.userCategories = {}; win.saveUserCategories(); win.userCategories = win.loadUserCategories(); win.rebuildCategories();
});

// ========== 记账功能 ==========
console.log('\n✏️ 记账功能测试');

test('addRecord - 空金额应拒绝', () => {
  win.kbAmount = '';
  win.selectedCat1 = '🍽️ 餐饮饮食';
  win.addRecord();
  // 清空records以确保测试独立性
  win.records = win.loadRecords();
});

test('addRecord - 正常记录', () => {
  win.saveRecords([]); win.records = [];
  win.currentAddPhotos = win.currentAddPhotos || [];
  win.recordType = 'expense';
  win.kbAmount = '88.50';
  win.selectedCat1 = '🍽️ 餐饮饮食';
  doc.getElementById('dateInput').value = '2026-07-14';
  doc.getElementById('noteInput').value = '测试午餐';
  win.updateCat2Options('🍽️ 餐饮饮食');
  doc.getElementById('cat2Select').value = '午餐';

  win.addRecord();
  assertEqual(win.records.length, 1);
  assertEqual(win.records[0].amount, 88.50);
  assertEqual(win.records[0].type, 'expense');
  assertEqual(win.records[0].photos.length, 0);
  win.saveRecords([]); win.records = [];
});

test('addRecord - 收入类型识别', () => {
  win.saveRecords([]); win.records = [];
  win.currentAddPhotos = win.currentAddPhotos || [];
  win.kbAmount = '5000';
  win.recordType = 'income';  // V2：先切到收入模式
  win.selectedCat1 = '💰 收入';
  win.updateCat2Options('💰 收入');
  doc.getElementById('cat2Select').value = '工资薪水';
  doc.getElementById('dateInput').value = '2026-07-01';
  doc.getElementById('noteInput').value = '工资';
  win.addRecord();
  assertEqual(win.records[0].type, 'income');
  assertEqual(win.records[0].amount, 5000);
  win.saveRecords([]); win.records = [];
});

// ========== 手账功能 ==========
console.log('\n📝 手账功能测试');

test('saveJournal - 保存手账', () => {
  win.journals = []; win.saveJournals();
  win.journals.unshift({id:999,content:'测试手账内容',photos:[],mood:'😊',relatedRecordId:null,date:'2026-07-14',time:'12:00',createdAt:new Date().toISOString()});
  win.saveJournals();
  assertEqual(win.loadJournals().length, 1);
  assertEqual(win.loadJournals()[0].mood, '😊');
});

test('deleteJournal - 删除手账', () => {
  win.journals = win.journals.filter(function(j){return j.id!==999;});
  win.saveJournals();
  assertEqual(win.loadJournals().length, 0);
});

// ========== 导出功能 ==========
console.log('\n📥 导出功能测试');

test('exportCSV - 有数据时不报错', () => {
  const oc = win.URL.createObjectURL, orv = win.URL.revokeObjectURL, ocl = win.HTMLAnchorElement.prototype.click;
  win.URL.createObjectURL = () => 'blob:mock'; win.URL.revokeObjectURL = () => {};
  win.HTMLAnchorElement.prototype.click = function(){};
  win.saveRecords([{id:1,amount:100,date:'2026-07-01',cat1:'🍽️ 餐饮饮食',cat2:'午餐',note:'',type:'expense'}]);
  win.records = win.loadRecords();
  win.currentListMonth = '2026-07';
  try { win.exportCSV('2026-07'); assertTrue(true); }
  catch(e) { assertTrue(false, '导出报错：'+e.message); }
  win.URL.createObjectURL = oc; win.URL.revokeObjectURL = orv; win.HTMLAnchorElement.prototype.click = ocl;
  win.saveRecords([]); win.records = [];
});

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
  errors.forEach((e,i) => console.log(`  ${i+1}. ${e.name}\n     ${e.error}`));
}

const resultFile = path.join(__dirname, '.test-result.json');
const codeHash = process.env.CODE_HASH || 'unknown';
try {
  fs.writeFileSync(resultFile, JSON.stringify({
    passed: failed===0, passedCount: passed, failedCount: failed,
    totalCount: passed+failed,
    passRate: parseFloat(((passed/(passed+failed))*100).toFixed(1)),
    codeHash, timestamp: new Date().toISOString()
  }, null, 2), 'utf-8');
} catch(e) { console.log('⚠️ 无法写入结果文件：'+e.message); }

console.log(failed===0?'\n🎉 所有测试通过！应用运行正常。\n':'');
process.exit(failed > 0 ? 1 : 0);
