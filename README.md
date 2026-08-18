# ✨ 噗通日记本

> 可爱治愈系记账手账应用 · 多用户云端版

一个少女心满满的记账 + 手账二合一应用，支持**多用户注册登录**，每个人拥有独立的数据空间。部署到云端后可在手机、电脑等任何设备上使用。

---

## 🌟 功能一览

| 功能 | 说明 |
|------|------|
| 🔐 多用户系统 | 昵称 + 6 位密码注册登录，每人独立账本，支持退出登录 |
| 📝 记账 | 双色拼盘 + 软糖键盘，支出/收入切换，支持照片 |
| ✍️ 手账 | 文字 + 照片 + 心情 + 贴纸，可将账单击联 |
| 📊 统计 | 分类条形图、月度趋势折线图、心情晴雨表 |
| 🌟 治愈时刻 | 数据仪表盘、照片回忆墙、心情甜甜圈、坚持天数 |
| 🐷 许愿储钱罐 | 存钱打卡计划，草莓日历追踪，21:00 提醒 |
| 🎁 盲盒签到 | 每天拆盲盒收集绝版贴纸 |
| 🐱 电子桌宠 | 右下角浮动萌宠，点击聊天，长按换肤 |
| 🌙 暗黑模式 | "芋泥星愿"夜间主题 |
| 📤 导出备份 | CSV 导出 + 完整 JSON 备份（可导入恢复） |
| 📱 PWA 手机桌面（V4.3） | 手机浏览器"添加到主屏幕"，像 App 一样全屏使用 |

---

## 🚀 快速开始

### 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置数据库连接（首次运行需要）
#    在项目根目录创建 .env 文件，写入：
#    DATABASE_URL=postgresql://用户名:密码@主机/数据库名?sslmode=require

# 3. 启动服务器
node server.js

# 4. 打开浏览器
# http://localhost:3456
```

> 💡 数据库连接字符串可以在 [Neon](https://neon.com) 免费申请，详情见下方「云端部署」。

### 云端部署

本项目已部署在 [Render](https://render.com)（免费套餐）：

👉 **https://putong-diary.onrender.com**

部署步骤：
1. 在 [Neon](https://neon.com) 免费创建一个 PostgreSQL 数据库，复制连接字符串
2. 在 Render 项目的 **Environment** 里添加环境变量 `DATABASE_URL`（值就是上面复制的连接字符串）和 `HOST=0.0.0.0`
3. 推送代码后点 **Deploy latest commit**

---

## 🏗️ 技术架构

| 层级 | 技术 |
|------|------|
| 前端 | HTML + CSS + JavaScript（单文件） |
| 后端 | Node.js + Express |
| 数据库 | PostgreSQL（Neon 云端永久存储） |
| 认证 | bcryptjs 密码哈希 + Token 会话 |

---

## 📁 项目结构

```
├── server.js          # 后端：Express + PostgreSQL API
├── index.html         # 前端：全部界面和逻辑
├── package.json       # 依赖配置
├── data.db            # ⚠️ 早期 SQLite 遗留文件（现数据存云端 PostgreSQL，可忽略/删除）
├── assets/            # 静态资源（V4.1 新增）
│   ├── black-cat.png       # 锁屏页黑猫图标
│   └── black-cat-emoji.png # 页面内猫咪替图
├── docs/              # 详细文档
│   ├── CLAUDE.md      # 项目说明（给 AI 看的）
│   ├── 需求.md         # 功能需求清单
│   ├── design.md      # 设计规范
│   └── RENAME.md      # 命名规范与别名手册
└── tests/             # 自动化测试
```

---

## 📖 详细文档

- [项目说明](docs/CLAUDE.md) — 技术方案、分类体系、开发规则
- [需求文档](docs/需求.md) — V2.0 → V4.3 全部功能需求
- [设计规范](docs/design.md) — 颜色、布局、动效、组件设计
- [命名手册](docs/RENAME.md) — 可爱化命名对照、API 列表、函数索引

---

## 🧪 测试

```bash
npm test
```

38 项自动化测试覆盖：认证、数据存取、储钱罐、权限、迁移、工具函数。

---

## 📄 许可

MIT License
