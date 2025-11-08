## 快速上手 — 给 AI 编码代理的简短指南

以下内容旨在让 AI 代理快速在本仓库内完成常见改动（调试、前端改动、后端接口、集成点）。只记录可被仓库文件验证的事实与例子。

### 项目大局（关键组件）
- Electron 主进程: `main.js` —— 启动 Electron 窗口、管理 Selenium 浏览器、打开本地 web 服务（条件为 config.json 中 webserver_address 包含 localhost）。
- 本地 HTTP 服务: `server.js`（辅助文件服务器与 REST 风格接口，默认端口 8074）；辅助文件上传服务在端口 8075（在同一文件中由 Express/multer 提供 `/excelUpload`）。
- 启动脚本: `start_server.js` （可单独用 `node start_server.js` 启动 server.js），`package.json` 中有 Electron / forge / vite 脚本。
- 前端 (Vue): `src/vue/` —— 使用 Vite（`vite.config.js`），开发端口默认 3000；但 Electron 在运行时从 server.js 下的 `src/` 目录加载静态文件（见 `server.js` 的 safeBase = path.join(__dirname, 'src')）。
- 扩展与自动化：项目通过 Selenium + ChromeDriver 与 Chrome 扩展（`ReliableSpider_en.crx` / `ReliableSpider_zh.crx` / `XPathHelper.crx`）协作，浏览器路径和驱动位于仓库根的 platform 目录（如 `chrome_win64/` 等），对应逻辑在 `main.js` 的 APP_CONFIG.PLATFORM_PATHS。

### 主要运行 / 开发命令（可直接复制）
- 启动 Electron（推荐用于运行整套桌面应用 + 内嵌 server）:
  - npm run start    # electron-forge start
  - npm run start_direct  # electron . （直接运行本地 Electron，可用于调试）
- 仅启动内置 HTTP 服务（用于本地浏览与前端调试）:
  - node start_server.js  # 启动 server.js，默认监听 8074
- 前端 Vue 开发（在 `src/vue` 下使用 Vite）:
  - npm run dev    # 启动 Vite dev server (3000)
  - npm run build  # 打包前端 (outDir -> dist)

说明：Electron 主进程会在读取到 config.json 且 webserver_address 指向 localhost 时由 `main.js` 自动调用 `task_server.start(config.webserver_port)`，因此启动 Electron 通常也会启动服务（依赖 config.json）。

### 重要端点与数据布局（可用于编写或修改后端交互）
- Server (默认端口 8074) 支持（在 `server.js`）：
  - GET `/queryTasks` → 返回 tasks 目录下的任务列表（tasks/*.json）
  - GET `/queryTask?id=<id>` → 读取 `tasks/<id>.json`
  - POST `/manageTask` → 接收表单 params(JSON) 并写入 `tasks/<id>.json`（新任务会自增 id）
  - POST `/invokeTask` → 写入 `execution_instances/<eid>.json` 并返回执行实例 id
  - POST `/excelUpload` (file upload 服务在 8075) → 返回解析的 Excel 内容

### 仓库中值得关注的代码位置（直接跳转参考）
- Electron / 自动化: `main.js`（大量逻辑：WebSocket 端口 8084 硬编码、Selenium 驱动配置、浏览器/扩展加载、跨窗口元素定位函数 `findElementAcrossAllWindows` 等）。
- 本地服务与文件操作: `server.js`（文件路径管理 getDir(), tasks/、execution_instances/、Data/ 的创建和读取逻辑）。
- 前端 Vue 文档: `VUE_README.md`, `VUE_ROUTER_README.md`, `vite.config.js`（告诉你如何在本地运行或构建前端）。
- 配置文件: `config.json`（若不存在 server.js 会写入默认值）；`mime.json`（静态文件 mimemap）。

### 项目特定约定 / 模式（AI 应遵守）
- 任务和执行实例均以数字文件名存储：`tasks/0.json`, `execution_instances/1.json`。新增任务逻辑会选择当前最大 id + 1（见 `/manageTask` 实现）。
- WebSocket 端口在 `main.js` 固定为 8084，Electron 与浏览器扩展间通信依赖该端口；不要更改除非同时跟扩展同步修改。
- Chrome/Chromedriver 路径由 `APP_CONFIG.PLATFORM_PATHS` 控制（根目录下存在 `chrome_win64/`、`chrome_win32/`、`chrome_mac64/` 等）；自动化相关改动通常需要同时检查这些路径和打包产物。
- 前端开发与 Electron 运行可能是两种模式：
  - 快速前端开发：运行 `npm run dev`，在浏览器访问 Vite 提供的页面（端口 3000）。
  - 全套集成运行：使用 Electron（`npm run start` 或 `npm run start_direct`），Electron 会加载由 `server.js` 提供的 `src/index.html`（因此在集成调试时，确保 `server.js` 正常或让 Electron 启动它）。

### 常见改动提示（为代理写的快速规则）
- 若修改后端接口（比如 `/manageTask`、`/invokeTask`）：同时更新 `main.js` 中构造任务 / 调用任务的调用方，并在 `src/` 下查找与接口交互的 JS（比如 taskGrid 下的页面）。
- 若修改前端路由或构建输出路径：检查 `vite.config.js` 的 `root` 与 `outDir`，并确认 `server.js` 的静态 safeBase (`__dirname + '/src'`) 能正确提供构建后的文件。若要改为提供 `dist`，也需要更新 `server.js`。
- 如果更改 WebSocket 协议或端口，必须同步更新 `main.js`（客户端与服务端）以及 Chrome 扩展（仓库根下的 CRX/扩展源码）。

---
如果你希望我把本文件合并为一个已有的 `.github/copilot-instructions.md`（或把更多实现细节写得更具体，例如示例请求/响应），告诉我想要的风格和目标，我会继续迭代。请指出你希望补充的部分（例如：示例 JSON、常见改 PR checklist、或 CI 运行脚本）。
