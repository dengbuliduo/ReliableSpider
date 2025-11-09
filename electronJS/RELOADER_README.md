# Electron Reloader 配置说明

## 已完成的配置

### 1. 依赖安装
- `electron-reloader` 已添加到 `devDependencies`

### 2. 代码集成
在 `main.js` 中添加了热重载代码：
```javascript
// Electron热重载配置 - 仅在开发模式下启用
if (process.env.NODE_ENV === 'development' || config.debug) {
    try {
        const reloader = require('electron-reloader');
        reloader(module, {
            debug: true,
            watchRenderer: false,
            ignore: ['node_modules', 'dist', 'Data', 'tasks', 'execution_instances']
        });
        console.log('Electron reloader enabled');
    } catch (error) {
        console.log('Electron reloader error:', error);
    }
}
```

### 3. 启动脚本
在 `package.json` 中添加了以下脚本：

```json
{
  "dev:reload": "NODE_ENV=development electron .",
  "dev:reload:win": "set NODE_ENV=development && electron ."
}
```

## 使用方法

### Windows 系统
```bash
npm run dev:reload:win
```

### Linux/Mac 系统
```bash
npm run dev:reload
```

### 其他可用的脚本
- `npm run dev:electron` - Vite热重载 + Electron
- `npm run build:electron` - 构建后启动
- `npm run serve:electron` - 构建后启动（推荐）

## 热重载特性

### 监控的文件类型
- JavaScript 文件 (`.js`)
- TypeScript 文件 (`.ts`)
- JSON 文件 (`.json`)

### 忽略的目录
- `node_modules`
- `dist`
- `Data`
- `tasks`
- `execution_instances`

### 热重载条件
热重载会在以下任一条件满足时启用：
1. `process.env.NODE_ENV === 'development'`
2. `config.debug === true`

## 注意事项

1. **renderer 进程**：当前配置 `watchRenderer: false`，意味着前端文件（HTML/CSS/JS）的热重载由 Vite 处理
2. **main 进程**：Electron 主进程的修改会触发应用重启
3. **开发模式**：建议使用 `npm run dev:electron` 以获得完整的开发体验（Vite + Electron 热重载）

## 调试信息

热重载启用时会在控制台显示：
- `Electron reloader enabled` - 热重载已启用
- `Electron reloader error: [error]` - 热重载错误信息

## 故障排除

如果热重载不工作，检查：
1. NODE_ENV 环境变量是否正确设置
2. config.debug 是否为 true
3. 文件是否在监控范围内
4. 控制台是否有错误信息