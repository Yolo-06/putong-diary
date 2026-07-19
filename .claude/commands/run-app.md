先启动本地 HTTP 服务器（避免 file:// 协议报错），再打开浏览器。

步骤：
1. 后台启动服务器：`npx serve -p 3456 -s .`（如果3456被占用则换端口）
2. 打开浏览器：`start http://localhost:3456/记账本.html`
