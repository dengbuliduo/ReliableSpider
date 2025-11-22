# FastSpider - TypeScript版本

基于TypeScript和Vue 3重构的Electron爬虫应用。

## 项目结构

```
src/
├── app/                 # 应用主类
│   └── crawler.app.ts   # 爬虫应用主类
├── config/              # 配置文件
│   └── app.config.ts   # 应用配置常量
├── services/            # 服务类
│   ├── selenium.service.ts  # Selenium WebDriver服务
│   ├── websocket.service.ts # WebSocket通信服务
│   ├── express.service.ts   # Express服务器服务
│   └── task.service.ts      # 任务管理服务
├── types/               # TypeScript类型定义
│   ├── app.ts           # 应用相关类型
│   ├── selenium.ts       # Selenium相关类型
│   └── electron.ts       # Electron相关类型
├── views/               # Vue组件
└── main.ts              # Vue应用入口

electron/
├── main/                # Electron主进程
│   └── index.ts         # 主进程入口
└── preload/             # Preload脚本
    └── index.ts         # Preload脚本
```

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **桌面应用**: Electron 27
- **构建工具**: Vite
- **浏览器自动化**: Selenium WebDriver
- **服务器**: Express.js
- **实时通信**: WebSocket
- **UI组件库**: Element Plus

## 特性

1. **类型安全**: 完整的TypeScript类型定义
2. **模块化设计**: 清晰的服务架构
3. **实时监控**: WebSocket实时状态更新
4. **任务队列**: 智能任务调度和管理
5. **跨平台**: 支持Windows、macOS、Linux
6. **现代化UI**: 基于Vue 3的响应式界面

## 开发环境设置

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 在另一个终端启动Electron
npm run electron:dev
```

### 构建应用

```bash
# 构建应用程序
npm run build

# 构建并打包
npm run electron:build
```

## 迁移说明

本项目是从原有的JavaScript版本(main.js)迁移到TypeScript架构。主要变化包括：

### 架构改进

1. **类型安全**: 所有代码都有完整的TypeScript类型定义
2. **模块化**: 将1712行的main.js重构为多个独立的服务类
3. **依赖注入**: 清晰的服务依赖关系
4. **错误处理**: 统一的错误处理机制

### 核心服务

- **SeleniumService**: 浏览器自动化控制
- **WebSocketService**: 实时通信服务
- **ExpressService**: HTTP服务器管理
- **TaskService**: 任务队列调度

### 配置管理

- **应用配置**: 统一的配置常量管理
- **平台适配**: 自动检测平台并选择正确的驱动路径

## 开发指南

### 添加新功能

1. 在`src/types/`中定义相关类型
2. 在`src/services/`中实现服务逻辑
3. 在`src/app/crawler.app.ts`中集成新服务
4. 在Vue组件中使用新功能

### 错误处理

所有服务方法都返回`OperationResult`类型，包含成功状态和错误信息：

```typescript
interface OperationResult {
  success: boolean;
  data?: any;
  error?: string;
}
```

### 状态管理

应用状态通过WebSocket实时推送，可以在Vue组件中监听：

```typescript
window.electronAPI.onStatusUpdate((status) => {
  // 更新组件状态
});
```

## 部署

### 生产构建

```bash
npm run electron:build
```

### 打包配置

编辑`electron-builder.json5`文件来自定义打包选项。

## 故障排除

### 常见问题

1. **Chrome驱动问题**: 确保平台对应的Chrome驱动文件存在
2. **端口冲突**: 应用会自动检测并切换到备用端口
3. **依赖安装失败**: 删除node_modules文件夹后重新安装

### 日志文件

应用日志保存在`info.log`文件中。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。