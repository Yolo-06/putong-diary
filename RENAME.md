# 噗通日记本 — 命名规范与别名手册 📝

> 本文档记录项目中所有"可爱化命名"的映射关系，帮助维护者理解代码中的别名、昵称与原始含义的对应关系。

---

## 一、产品命名

| 正式名称 | 可爱名称 | 使用场景 |
|----------|----------|----------|
| 记账本 | ✨ 噗通日记本 | 页面标题 `<title>`、顶部栏 `.header-title` |
| V2.0 | 少女治愈系 | 设计文档、README |

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

---

## 六、localStorage 键名规范

| 键名 | 格式 | 说明 |
|------|------|------|
| `jizhangben_records` | JSON数组 | 记账记录（核心数据） |
| `jizhangben_journals` | JSON数组 | 手账记录 |
| `jizhangben_usercats` | JSON对象 | 用户自定义分类 |
| `jizhangben_budget` | 数字字符串 | 月度预算金额 |
| `jizhangben_darkmode` | "0"/"1" | 暗黑模式开关 |
| `jizhangben_petimg` | base64字符串 | 桌宠自定义图片 |
| `jizhangben_stickers` | JSON数组 | 盲盒解锁贴纸 |
| `jizhangben_checkin_date` | "YYYY-MM-DD" | 盲盒上次签到日期 |

> 命名规范：所有键名以 `jizhangben_` 为前缀，避免与其他站点冲突。

---

## 七、CSS 类名命名规范

### 7.1 命名模式
- **页面级**：`page-{name}` — 如 `page-home`、`page-add`
- **组件级**：`{功能}-{子元素}` — 如 `journal-card`、`record-item`
- **状态级**：`.active`、`.show`、`.selected`
- **修饰符**：`-light`（浅色）、`-sm`（小号）、`-xs`（超小号）

### 7.2 缩写对照
| 缩写 | 全称 | 说明 |
|------|------|------|
| `j-*` | journal-* | 手账相关（j-header、j-mood、j-content、j-photos、j-time） |
| `jd-*` | journal-detail-* | 手账详情弹窗 |
| `kb-*` | keyboard-* | 软糖键盘（kb-btn、kb-fn、kb-save） |
| `hs-*` | heal-stat-* | 治愈统计卡片 |
| `cc-*` | cat-candy-* | 分类圆糖 |
| `cp-*` | cat-picker-* | 分类选择弹窗 |
| `qb-*` | quick-btn-* | 快捷按钮 |
| `pw-*` | photo-wall-* | 照片墙 |

---

## 八、JavaScript 函数命名规范

### 8.1 命名模式
| 前缀 | 含义 | 示例 |
|------|------|------|
| `load*` | 从 localStorage 读取 | `loadRecords()`、`loadJournals()` |
| `save*` | 写入 localStorage | `saveRecords()`、`saveJournals()` |
| `show*` | 显示UI/Toast | `showToast()`、`showPhotoFull()` |
| `open*` | 打开弹窗/面板 | `openJournalEdit()`、`openSettings()` |
| `close*` | 关闭弹窗/面板 | `closeJournalEdit()`、`closeSettings()` |
| `refresh*` | 刷新UI内容 | `refreshHome()`、`refreshHealPage()` |
| `render*` | 渲染HTML | `renderStickerPicker()` |
| `build*` | 构建/初始化 | `buildCarousel()` |
| `draw*` | 绘制图表 | `drawCharts()` |
| `spawn*` | 生成特效粒子 | `spawnCoinRain()`、`spawnHeart()` |
| `toggle*` | 切换状态 | `toggleDarkMode()`、`toggleCatSection()` |
| `pick*` | 选择操作 | `pickMood()`、`pickSticker()` |
| `switch*` | 切换模式 | `switchPage()`、`switchType()` |

### 8.2 变量命名模式
| 变量 | 含义 | 类型 |
|------|------|------|
| `kbAmount` | 软糖键盘输入的金额字符串 | string |
| `recordType` | 当前记账类型 | `'expense'` / `'income'` |
| `selectedCat1` | 当前选中的一级分类 | string |
| `selectedMood` | 当前选中的心情emoji | string |
| `selectedSticker` | 当前选中的贴纸emoji | string |
| `currentAddPhotos` | 记账页临时照片数组 | string[] |
| `tempJournalPhotos` | 手账编辑临时照片数组 | string[] |
| `currentListMonth` | 账单页当前查看月份 | `'YYYY-MM'` |
| `carouselIndex` | 轮播图当前页码 | number |
| `catExpanded` | 分类区域是否展开 | boolean |
| `showChart` | 是否显示统计图表 | boolean |
| `editingJournalId` | 正在编辑的手账ID | number/null |
| `lastSavedRecordId` | 最近保存的记账ID | number/null |
| `deleteTargetId` | 待删除的记录ID | number/null |
| `monthlyBudget` | 月度预算金额 | number |
| `petImg` | 桌宠自定义图片base64 | string |

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
| `content` | string | 正文内容 |
| `photos` | string[] | base64 照片数组（最多9张） |
| `mood` | string | 心情emoji（🥰🐶🥺🥱🐱💔） |
| `sticker` | string | 贴纸emoji（🌸⭐️🎀等） |
| `relatedRecordId` | number/null | 关联的记账记录ID |
| `date` | string | 日期 "YYYY-MM-DD" |
| `time` | string | 时间 "HH:MM" |
| `createdAt` | string | ISO时间戳 |

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

### 11.3 金额相关命名
| 概念 | 可爱化表达 |
|------|-----------|
| 支出 | 喂给生活 🍓 |
| 收入 | 倒出钱包 🌸 |
| 结余 | 剩余宝藏 🌟 |
| 预算 | 变富小预算 💰 |
| 记账 | 塞进钱包 💖 |

---

## 附录：快速索引

| 要找什么 | 去哪里找 |
|----------|----------|
| 分类别名怎么改 | `catAliases` 对象（JS，约第1107行） |
| 心情名称怎么改 | `moodNames` 对象（JS，约第1827行 / 1936行） |
| 治愈语录怎么改 | `healingQuotes` 数组（JS，约第1125行） |
| 贴纸选项怎么改 | `stickerOptions` 数组（JS，约第1123行） |
| 幸运签怎么改 | `fortunes` 数组（JS，约第2024行） |
| 绝版贴纸怎么改 | `bonusStickers` 数组（JS，约第2032行） |
| 桌宠聊天文案 | `msgs` 数组（JS，约第2068行） |
| 暗黑模式颜色 | CSS `body.dark-fairy-mode` 区块（约第585-696行） |
| localStorage键名 | 见本文档第六章 |
| 底部标签顺序 | HTML `.tab-bar`（约第904-917行） |
| 软糖键盘布局 | CSS `.cute-keyboard`（约第270-296行） |
| 页面切换逻辑 | JS `switchPage()`（约第1193行） |
