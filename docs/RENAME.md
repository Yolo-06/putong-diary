# 噗通日记本 — 命名规范与别名手册 📝

> 本文档记录项目中所有"可爱化命名"的映射关系，帮助维护者理解代码中的别名、昵称与原始含义的对应关系。

---

## 一、产品命名

| 正式名称 | 可爱名称 | 使用场景 |
|----------|----------|----------|
| 记账本 | ✨ 噗通日记本 | 页面标题 `<title>`、顶部栏 `.header-title` |
| V2.0 | 少女治愈系 | 设计文档、README |
| V3.0 | SQLite+密码锁 | 新增后端数据库和密码保护 |
| V3.1 | 安全加固+许愿储钱罐 | 多设备安全、贴纸插入、自定义分类 |
| V4.0 | 多用户云端版 | 昵称注册登录、每人独立数据空间、Render 部署 |
| V4.1 | 黑猫图标+锁屏优化 | 猫咪图标替换、登录注册tab切换、密码自动提交、轻提示 |
| V4.2 | 云端持久化数据库 | SQLite → Neon PostgreSQL，数据永久保存不再丢失 |

---

## 二、页面/标签命名

| 页面ID | 底部标签 | 图标 | 功能描述 |
|--------|----------|------|----------|
| `page-home` | 首页 | 🐾 | 轮播图 + 手账时间线 + 快捷记账 |
| `page-add` | 记账 | ✏️ | 双色拼盘 + 软糖键盘 |
| `page-bills` | 日记 | 📖 | 账单列表 + 统计图表 |
| `page-heal` | 治愈 | 🌟 | 数据聚合仪表盘 |

---

## 三、分类别名映射 (catAliases)

> 代码函数：`getCatAlias(cat)` — 返回分类的可爱别名

| 原始分类名（key） | 可爱别名 | 含义 |
|-------------------|----------|------|
| 🍽️ 餐饮饮食 | 🍱 顿顿饱 | 吃饭相关支出 |
| 🚗 交通出行 | 🚌 咕嘟出行 | 出行通勤 |
| 🛒 购物消费 | 🛍️ 剁手手 | 购物买买买 |
| 🏠 居家住房 | 🏠 小窝窝 | 房租/水电/维修 |
| 🎬 休闲娱乐 | 🎮 快乐水 | 娱乐消遣 |
| 💊 医疗健康 | 💊 元气站 | 看病买药 |
| 📚 学习教育 | 📚 变聪明 | 学习培训 |
| 📱 通讯网络 | 📱 连连看 | 话费/网费/快递 |
| 👔 服饰装扮 | 💅 变美丽 | 衣服/美妆/美发 |
| 💰 收入 | 💰 小进账 | 工资/奖金/兼职 |
| 🔧 其他杂项 | 🐱 吞金兽 | 红包/宠物/手续费 |

---

## 四、心情命名映射 (moodNames)

| emoji | 可爱名称 | 含义 |
|-------|----------|------|
| 🥰 | 超幸福 | 开心到冒泡 |
| 🐶 | 元气 | 活力满满 |
| 🥺 | 委屈 | 有点小难过 |
| 🥱 | 困困 | 疲惫的一天 |
| 🐱 | 傲娇 | 嘴上说不要 |
| 💔 | 碎碎念 | 心事重重 |

---

## 五、UI 组件可爱命名

### 5.1 页面区域
| 代码标识 | 可爱名称 | 说明 |
|----------|----------|------|
| `.add-pink-zone` | 蜜桃草莓粉弧形区 | 记账页上半部分粉色背景 |
| `.add-white-zone` | 棉花糖白底卡片区 | 记账页下半部分白色区域 |
| `.cute-keyboard` | 软糖数字键盘 | 自定义数字输入键盘 |
| `.petal-toggle` | 花瓣类型切换 | 支出/收入切换按钮组 |
| `.cat-candy-grid` | 分类圆糖 | 一级分类选择网格 |
| `.bubble-input` | 气泡输入框 | 粉色虚线边框输入框 |
| `.journal-entry-card` | 手账闪电入口 | 首页"写手账"大卡片 |

### 5.2 功能模块
| 代码标识 | 可爱名称 | 说明 |
|----------|----------|------|
| `#carouselWrap` | 轮播图 | 首页顶部3张滑动卡片 |
| `#homeJournals` | 碎碎念时间轴 | 首页今日手账列表 |
| `#budgetReminder` | 预算温柔提醒 | 超支警告卡片 |
| `#homeOverview` | 小钱包 | 本月收支概览 |
| `#catInviteModal` | 猫咪手账邀请 | 记账后弹窗 |
| `#catPickerOverlay` | 分类选择弹窗 | 底部滑出的分类面板 |
| `#settingsPanel` | 少女心配置馆 | 右侧滑入设置面板 |
| `#photoWall` | 照片回忆墙 | 治愈页随机照片网格 |
| `#moodDonut` | 心情甜甜圈 | SVG环形图 |
| `#streakCard` | 连续记账里程碑 | 治愈页底部成就卡片 |
| `#desktopPet` | 电子桌宠 | 右下角浮动萌宠 |
| `#lockScreen` | 密码锁屏（V3）→ 昵称+密码锁屏（V4）→图标+tabs版（V4.1） | 打开 APP 首先看到的画面 |
| `#lockUsernameInput` | 昵称输入框（V4 新增） | 锁屏页用户名输入 |
| `#lockRegister` | 注册新账号入口（V4 新增） | 登录页底部"没有账号？点此注册" → V4.1改为tab切换按钮 |
| `#lockTabs` | 登录/注册切换标签容器（V4.1 新增） | 锁屏页中部两个tab按钮 |
| `#tabLogin` | 登录tab按钮（V4.1 新增） | 点击切换到登录模式 |
| `#tabRegister` | 注册tab按钮（V4.1 新增） | 点击切换到注册模式 |

### 5.3 按钮命名
| 代码标识 | 可爱文案 | 功能 |
|----------|----------|------|
| `.kb-save` | 💖 塞进钱包 | 记账保存按钮 |
| `#journalSaveBtn` | 💌 写好啦，封存！ | 新建手账保存 |
| `#journalSaveBtn` (编辑) | 💌 更新手账 | 编辑手账保存 |
| `#chartToggleBtn` | 📊 魔法统计 / 📋 账单 | 列表/图表切换 |
| 快捷按钮 | 🍱干饭 ☕奶茶 🛍️买买 🚇贴贴 | 首页快捷记账 |
| 盲盒按钮 | 🎁 拆盲盒 | 每日签到 |
| 时光机按钮 | 🔮 旧时光 | 随机回顾手账 |
| 储钱罐卡片 | 🐷 许愿储钱罐 | 首页打卡进度+草莓日历 |
| 投币按钮 | 🪙 叮当投币 | 一键完成今日存钱打卡 |
| 提醒弹窗 | 猫咪催塞钱 | 21:00 未打卡的温馨提醒 |
| 锁屏"进入"按钮 | 进入（V4.1升级，原"→"） | 密码输满后高亮+自动提交 |
| 锁屏tab按钮 | 登录 / 注册（V4.1新增） | 粉色渐变高亮切换登录/注册模式 |

---

## 六、数据存储命名规范

### 6.1 SQLite 数据库

| 表名 / 文件名 | 说明 |
|------|------|
| `data.db` | SQLite 数据库文件，存在项目根目录 |
| `users` 表 | 用户表（V4 新增）：id, username, password_hash, pin_length, created_at |
| `records` 表 | 记账记录表（V4：加 user_id 列） |
| `journals` 表 | 手账记录表（V4：加 user_id 列） |
| `user_categories` 表 | 用户自定义分类表（V4：复合主键 user_id+name） |
| `kv_store` 表 | 键值存储表（V4：复合主键 user_id+key） |
| `sessions` 表 | 登录会话表（V4：加 user_id 列） |
| `savings_plans` 表 | 储钱计划表（V4：加 user_id 列） |
| `savings_logs` 表 | 打卡记录表（V4：加 user_id 列） |

### 6.1b 静态文件托管（V4.1 新增）
- `server.js` 通过 `express.static('assets')` 托管 `assets/` 目录
- 访问路径：`/assets/black-cat.png`、`/assets/black-cat-emoji.png`
- 黑猫图标：用户提供的透明背景猫咪图片，用于锁屏和页面emoji替换

### 6.2 键值存储键名（kv_store，V4：按用户隔离）

| 键名 | 格式 | 说明 |
|------|------|------|
| ~~`password_hash`~~ | — | V4 已移至 `users` 表 |
| ~~`pin_length`~~ | — | V4 已移至 `users` 表 |
| `budget` | 数字字符串 | 月度预算金额 |
| `darkmode` | "0"/"1" | 暗黑模式开关 |
| `stickers` | JSON数组 | 盲盒解锁贴纸 |
| `checkin_date` | "YYYY-MM-DD" | 盲盒上次签到日期 |
| `pet_img` | base64 | 桌宠自定义图片 |
| `savings_reminder_time` | "21:00" | 储钱罐提醒时间 |
| `savings_reminder_enabled` | "1"/"0" | 提醒开关 |
| `last_savings_remind_date` | "YYYY-MM-DD" | 上次提醒日期 |

### 6.3 API 接口命名

| 方法 | 路径模式 | 说明 | 版本 |
|------|----------|------|------|
| GET | `/api/auth/status` | 检查是否有任何用户（可传 `?username=` 查特定用户） | V4 更新 |
| POST | `/api/auth/register` | **用户注册**（昵称+密码，V4 新增，替代旧 set-password） | V4 新增 |
| ~~POST~~ | ~~`/api/auth/set-password`~~ | ~~首次设置密码~~ → V4 已替换为 `/api/auth/register` | 已废弃 |
| POST | `/api/auth/login` | 登录验证（V4：增加 username 字段） | V4 更新 |
| POST | `/api/auth/logout` | 退出登录 | V3 |
| POST | `/api/auth/reset-password` | 重置账号（V4.1：需传 username + 5分钟限频，429防滥用） | V4 更新 |
| PUT | `/api/auth/change-password` | 修改密码（V4：按当前登录用户改） | V3 |
| GET/PUT | `/api/records` | 记账记录读写（V4：按 user_id 隔离） | V4 更新 |
| GET/PUT | `/api/journals` | 手账记录读写（V4：按 user_id 隔离） | V4 更新 |
| GET/PUT | `/api/categories` | 用户分类读写（V4：按 user_id 隔离） | V4 更新 |
| GET/PUT | `/api/kv/:key` | 键值存储读写（V4：按 user_id 隔离） | V4 更新 |
| POST | `/api/migrate` | localStorage→数据库迁移（V4：迁移到当前用户） | V4 更新 |
| GET | `/api/savings/current` | 获取当前储钱计划+打卡日志（V4：按 user_id） | V4 更新 |
| POST | `/api/savings/plan` | 创建或更新储钱计划（V4：按 user_id） | V4 更新 |
| POST | `/api/savings/checkin` | 执行今日打卡（V4：按 user_id） | V4 更新 |
| DELETE | `/api/savings/checkin/:date` | 撤销某天打卡（V4：按 user_id） | V4 更新 |

### 6.4 旧 localStorage 键名（V2，已废弃）

| 键名 | 说明 | 迁移到 |
|------|------|--------|
| ~~`jizhangben_records`~~ | 记账记录 | → `/api/records` |
| ~~`jizhangben_journals`~~ | 手账记录 | → `/api/journals` |
| ~~`jizhangben_usercats`~~ | 自定义分类 | → `/api/categories` |
| ~~`jizhangben_budget`~~ | 月度预算 | → `/api/kv/budget` |
| ~~`jizhangben_darkmode`~~ | 暗黑模式 | → `/api/kv/darkmode` |
| ~~`jizhangben_petimg`~~ | 桌宠图片 | → `/api/kv/pet_img` |
| ~~`jizhangben_stickers`~~ | 贴纸数据 | → `/api/kv/stickers` |
| ~~`jizhangben_checkin_date`~~ | 签到日期 | → `/api/kv/checkin_date` |

> 命名规范：所有旧键名以 `jizhangben_` 为前缀。V3.0 改为 SQLite 存储，旧键名仅用于一次性数据迁移。

---

## 七、CSS 类名命名规范

### 7.1 命名模式
- **页面级**：`page-{name}` — 如 `page-home`、`page-add`
- **组件级**：`{功能}-{子元素}` — 如 `journal-card`、`record-item`
- **状态级**：`.active`、`.show`、`.selected`
- **修饰符**：`-light`（浅色）、`-sm`（小号）、`-xs`（超小号）、`-ready`（就绪态高亮）

### 7.2 缩写对照
| 缩写 | 全称 | 说明 |
|------|------|------|
| `j-*` | journal-* | 手账相关（j-header、j-mood、j-content、j-photos、j-time） |
| `jd-*` | journal-detail-* | 手账详情弹窗 |
| `kb-*` | keyboard-* | 软糖键盘（kb-btn、kb-fn、kb-save） |
| `hs-*` | heal-stat-* | 治愈统计卡片 |
| `cc-*` | cat-candy-* | 分类圆糖 |
| `cat-emoji` | — | 猫咪emoji替换图片样式（V4.1 新增，`height:1.1em`行内融合） |
| `lock-tabs` | — | 锁屏登录/注册切换容器（V4.1 新增） |
| `lock-tab` | — | 单个切换按钮（V4.1 新增） |
| `go-ready` | — | 密码输满时"进入"按钮高亮（V4.1 新增，`scale(1.06)`+亮度提升） |
| `cp-*` | cat-picker-* | 分类选择弹窗 |
| `qb-*` | quick-btn-* | 快捷按钮 |
| `pw-*` | photo-wall-* | 照片墙 |
| `lk-*` | lock-* | 锁屏相关（V3 新增） |
| `lt-*` | lock-tab-* | 锁屏登录/注册切换标签（V4.1 新增） |

---

## 八、JavaScript 函数命名规范

### 8.1 命名模式
| 前缀 | 含义 | 示例 |
|------|------|------|
| `api*` | 调用后端API | `apiGet()`、`apiPut()`、`apiPost()` |
| `load*` | 读取数据 | `loadRecords()`、`loadJournals()` |
| `save*` | 保存数据 | `saveRecords()`、`saveJournals()` |
| `show*` | 显示UI/Toast | `showToast()`、`showPhotoFull()` |
| `open*` | 打开弹窗/面板 | `openJournalEdit()`、`openSettings()` |
| `close*` | 关闭弹窗/面板 | `closeJournalEdit()`、`closeSettings()` |
| `refresh*` | 刷新UI内容 | `refreshHome()`、`refreshHealPage()` |
| `render*` | 渲染HTML | `renderStickerPicker()` |
| `build*` | 构建/初始化 | `buildCarousel()` |
| `draw*` | 绘制图表 | `drawCharts()` |
| `spawn*` | 生成特效粒子 | `spawnCoinRain()`、`spawnHeart()` |
| `toggle*` | 切换状态 | `toggleDarkMode()`、`toggleCatSection()` |
| `pick*` | 选择操作 | `pickMood()`、`pickCandyCat()` |
| `switch*` | 切换模式 | `switchPage()`、`switchType()`、`switchToRegister()`（V4 新增） |
| `custom*` | 自定义弹窗（V4 新增，替代浏览器 prompt/alert/confirm） | `customPrompt()`、`customConfirm()`、`customAlert()` |
| `startup` | 应用启动入口（V3 新增） | `startup()`（异步） |
| `loadAll*` | 从服务器加载全量数据 | `loadAllData()` |
| `show*Mode` | 锁屏模式切换 | `showFirstRunMode()`、`showLoginMode()` |
| `onPin*` | PIN码键盘交互 | `onPinDigit()`、`onPinBack()`、`onPinGo()` |
| `insert*` | 贴纸插入文字 | `insertSticker()`（贴纸直接插入 textarea 光标位置） |
| `loadSavings*` | 加载储钱罐数据 | `loadSavingsData()`、`renderPiggyCard()`、`doPiggyCheckin()` |
| `spawnCoin*` | 金币落罐动画 | `spawnCoinDropAnim()` |
| `check*Reminder` | 储钱罐提醒 | `checkSavingsReminder()`、`showPiggyReminder()` |
| `pickCustom*` | 临时自定义分类 | `pickCustomCat()` |
| `changePet*` | 桌宠换肤 | `changePetSkin()`（V4 更新：弹窗选图替代 JS click） |
| `add*Major` | 分类管理 | `addCatMajor()`、`editCatMajor()`、`deleteCatMajor()` |
| `replaceCats` | 猫咪emoji→图片替换（V4.1 新增） | 页面级IIFE，TreeWalker遍历+MutationObserver监听 |

### 8.1b V4.1 新增函数
| 函数 | 说明 |
|------|------|
| `showPinHint(msg)` | 轻提示：仅显示消息，**不抖动不清空**，1.8s自动消失 |
| `switchToLogin()` | 从注册画面切换回登录画面 |
| `replaceCats(root)` | 递归替换文本节点中的 🐱 emoji 为 `<img class="cat-emoji">` |
| (IIFE, 页面底部) | 页面加载后立即执行 `replaceCats()` + 注册 `MutationObserver` 监听动态内容 |

### 8.2 变量命名模式
| 变量 | 含义 | 类型 | 版本 |
|------|------|------|------|
| `kbAmount` | 软糖键盘输入的金额字符串 | string | |
| `recordType` | 当前记账类型 | `'expense'` / `'income'` | |
| `selectedCat1` | 当前选中的一级分类 | string | |
| `selectedMood` | 当前选中的心情emoji | string | |
| `currentAddPhotos` | 记账页临时照片数组 | string[] | |
| `tempJournalPhotos` | 手账编辑临时照片数组 | string[] | |
| `currentListMonth` | 账单页当前查看月份 | `'YYYY-MM'` | |
| `carouselIndex` | 轮播图当前页码 | number | |
| `catExpanded` | 分类区域是否展开 | boolean | |
| `showChart` | 是否显示统计图表 | boolean | |
| `editingJournalId` | 正在编辑的手账ID | number/null | |
| `lastSavedRecordId` | 最近保存的记账ID | number/null | |
| `deleteTargetId` | 待删除的记录ID | number/null | |
| `monthlyBudget` | 月度预算金额 | number | |
| `petImg` | 桌宠自定义图片base64 | string | |
| `authToken` | 登录令牌 | string | V3 |
| `pinInput` | PIN码输入缓存 | string | V3 |
| `pinLength` | 密码位数（固定 6 位） | number | V3 |
| `lockMode` | 锁屏模式 | `'firstrun'` / `'login'` / `'reset'` | V3 |
| `lockUsername` | 锁屏页昵称（V4 新增） | string | V4 |
| `unlockedStickers` | 盲盒已收集贴纸 | string[] | V3 |
| `lastCheckinDate` | 上次盲盒签到日 | `'YYYY-MM-DD'` | V3 |
| `darkModeSetting` | 暗黑模式状态缓存 | `'0'` / `'1'` | V3 |
| `currentSavingsPlan` | 当前储钱计划数据 | object | V3.1 |
| `todayCheckedIn` | 今天是否已打卡 | boolean | V3.1 |
| `savingsReminderTime` | 提醒时间 | `'21:00'` | V3.1 |
| `savingsMonthLogs` | 当月打卡日志 | `{date: {amount, recordId}}` | V3.1 |
| `lockUsername` | 锁屏页输入的昵称（V4.1 优化：登录时自动填入上次用户名） | string | V4 |

---

## 九、动效命名

| CSS动画名 | 可爱名称 | 效果描述 |
|-----------|----------|----------|
| `fadeUp` | 轻轻飘上来 | 页面/弹窗：透明→显现 + 上移10px |
| `heartPop` | 爱心冒泡 | 爱心粒子：上飘40px + 缩小消失 |
| `confettiFall` | 软糖落雨/撒花 | emoji飘落：下落60px + 360°旋转 |
| `bounceIn` | QQ糖弹入 | 弹窗：缩小→放大→回弹 |
| `heartBeat` | 心跳怦怦 | 轮播指示点：缩放脉冲 |
| `breathe` | 呼吸灯 | 输入框光晕：0→8px→0 |
| `petFloat` | 萌宠漂浮 | 桌宠：上下6px浮动 |
| `nightPulse` | 星光脉冲 | 暗黑模式保存按钮：光晕扩散 |
| `blink` | 光标一闪一闪 | 金额光标闪烁 |
| `toastIn` | 提示滑入 | Toast：从上方滑入+淡入 |

---

## 十、数据字段命名对照

### 10.1 记账记录 (record)
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 时间戳唯一标识 |
| `user_id` | number | 归属用户ID（V4 新增） |
| `amount` | number | 金额（元） |
| `cat1` | string | 一级分类（如 "🍽️ 餐饮饮食"） |
| `cat2` | string | 二级分类（如 "午餐"） |
| `date` | string | 日期 "YYYY-MM-DD" |
| `note` | string | 备注/碎碎念 |
| `type` | string | "expense"（支出）/ "income"（收入） |
| `photos` | string[] | base64 照片数组 |

### 10.2 手账记录 (journal)
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 时间戳唯一标识 |
| `user_id` | number | 归属用户ID（V4 新增） |
| `content` | string | 正文内容 |
| `photos` | string[] | base64 照片数组（最多9张） |
| `mood` | string | 心情emoji（🥰🐶🥺🥱🐱💔） |
| `sticker` | string | 贴纸emoji |
| `stickers` | string[] | 贴纸数组（V3.1 新增） |
| `relatedRecordId` | number/null | 关联的记账记录ID |
| `date` | string | 日期 "YYYY-MM-DD" |
| `time` | string | 时间 "HH:MM" |
| `createdAt` | string | ISO时间戳 |

### 10.3 用户 (user)（V4 新增）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 自增主键 |
| `username` | string | 昵称（3-20位，支持字母数字中文下划线，唯一） |
| `password_hash` | string | bcrypt 密码哈希 |
| `pin_length` | number | 密码长度（固定6） |
| `created_at` | string | 注册时间 ISO ||

---

## 十一、文案风格指南

### 11.1 治愈系文案特点
- 大量使用 emoji 作为情感点缀
- 语气词：鸭、哦、~、呢、吧、啦
- 自称：仙女、精致的猪猪女孩、宝宝
- 金钱观：花出去的钱=变成快乐的魔法
- 鼓励式表达：不要冷冰冰的"保存成功"，而是"小账本已收好！"

### 11.2 典型文案对照
| 常规说法 | 噗通日记本说法 |
|----------|----------------|
| 保存成功 | 💖 已塞进小钱包！ |
| 本月支出 | 🍓 喂给生活 |
| 本月收入 | 🌸 倒出钱包 |
| 本月结余 | 🌟 剩余宝藏 |
| 写手账 | ✍️ 收集今天的小确幸吧！ |
| 查看统计 | 📊 魔法统计 |
| 删除确认 | ⚠️ 确认删除 |
| 数据为空 | 还没有记录哦~去写一条吧 ✍️ |
| 超预算 | 钱包空空啦！但没关系…💖 |
| 设置 | ⚙️ 少女心配置馆 |
| 暗黑模式 | 🌙 梦幻星空模式 |
| 分类管理 | 🌸 小分类大变身 |
| 注册账号（V4新增） | ✨ 没有账号？点此注册 |
| 昵称提示（V4新增） | 给自己取个昵称~ |
| 换肤弹窗（V4新增） | 换一张可爱的萌宠图片吧~ |

### 11.3 金额相关命名
| 概念 | 可爱化表达 |
|------|-----------|
| 支出 | 喂给生活 🍓 |
| 收入 | 倒出钱包 🌸 |
| 结余 | 剩余宝藏 🌟 |
| 预算 | 变富小预算 💰 |
| 记账 | 塞进钱包 💖 |

---

## 十二、V4.0 多用户架构（新增）

### 12.1 设计理念
- **酒店式**：每人拿自己的房卡（昵称+密码）进自己的房间（独立数据）
- **数据隔离**：所有表加 `user_id` 列，查询/写入全部带用户过滤
- **requireAuth 中间件**：从 token 解析 user_id，挂载到 `req.userId`

### 12.2 注册/登录流程
```
首次使用 → 输入昵称+6位密码 → POST /api/auth/register → 创建用户+返回token
已有账号 → 输入昵称+密码 → POST /api/auth/login → 验证+返回token
登录画面 → 点"✨ 没有账号？点此注册" → 切换为注册模式
忘记密码 → 输入昵称 → 确认 → POST /api/auth/reset-password → 清空该用户→重新注册
```

### 12.3 iOS 弹窗问题修复
- **问题**：iOS Safari 对 `prompt()`、`alert()`、`confirm()` 和 JS 触发的 `input.click()` 会显示"Javascript"标记
- **修复**：
  - 所有 `prompt()` → `customPrompt()`（自定义弹窗+输入框）
  - 所有 `alert()` → `customAlert()`（自定义弹窗）
  - 所有 `confirm()` → `customConfirm()`（自定义确认弹窗）
  - 所有 `input.click()` → `<label for="input">`（直接用户手势触发）
  - 桌宠换肤改为弹窗面板+label 选择图片

---

## 附录：快速索引

| 要找什么 | 去哪里找 |
|----------|----------|
| 后端服务器代码 | `server.js`（项目根目录） |
| 数据库表结构 | `server.js` → `CREATE TABLE` 语句 |
| API 接口列表 | `server.js` → app.get/post/put 路由 |
| 分类别名怎么改 | `catAliases` 对象（`index.html` JS 数据层） |
| 心情名称怎么改 | `moodNames` 对象（`index.html` JS 图表函数） |
| 治愈语录怎么改 | `healingQuotes` 数组（`index.html` JS 数据层） |
| 贴纸选项怎么改 | `stickerOptions` 数组（`index.html` JS 数据层） |
| 幸运签怎么改 | `fortunes` 数组（`index.html` JS 盲盒函数） |
| 绝版贴纸怎么改 | `bonusStickers` 数组（`index.html` JS 盲盒函数） |
| 桌宠聊天文案 | `msgs` 数组（`index.html` JS 桌宠函数） |
| 暗黑模式颜色 | CSS `body.dark-fairy-mode` 区块 |
| 锁屏样式和逻辑 | CSS `.lock-*` + JS `showLoginMode()` |
| 密码修改/重置 | `server.js` 认证接口 + `index.html` JS |
| 自定义弹窗（V4新增） | `customPrompt()` / `customConfirm()` / `customAlert()` |
| SQLite 键值存储键名 | 见本文档 §6.2 |
| 底部标签顺序 | HTML `.tab-bar` |
| 软糖键盘布局 | CSS `.cute-keyboard` |
| 页面切换逻辑 | JS `switchPage()` |
| 应用启动流程 | JS `startup()`（异步入口） |
| 多用户注册/登录（V4新增） | `server.js` users表 + `/api/auth/register` |
