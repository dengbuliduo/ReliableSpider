# 🗄️ ReliableSpider MySQL 使用指南

## 🚀 快速开始

### 1. 环境准备

#### 安装 MySQL (5.7+)
```bash
# Windows: 下载并安装 MySQL Installer
# https://dev.mysql.com/downloads/mysql/5.7.html

# 或使用包管理器
# Chocolatey (Windows)
choco install mysql

# Homebrew (macOS)  
brew install mysql@5.7

# Ubuntu/Debian
sudo apt-get install mysql-server-5.7
```

#### 启动 MySQL 服务
```bash
# Windows
net start mysql

# macOS
brew services start mysql@5.7

# Linux
sudo systemctl start mysql
```

### 2. 自动设置 (推荐)

运行自动设置脚本：
```bash
node scripts/setup-database.js
```

这个脚本会自动：
- ✅ 检查 MySQL 安装
- ✅ 验证配置文件
- ✅ 测试数据库连接
- ✅ 初始化数据库结构
- ✅ 安装所需依赖
- ✅ 创建使用示例

### 3. 手动设置

如果自动设置失败，可以按以下步骤手动设置：

#### 3.1 创建配置文件
创建 `mysql_config.json`：
```json
{
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "123456",
  "database": "reliableSpider",
  "charset": "utf8mb4",
  "timezone": "+08:00"
}
```

#### 3.2 初始化数据库
```bash
mysql -u root -p123456 < db/init.sql
```

#### 3.3 安装 Node.js 依赖
```bash
npm install mysql2
```

## 💻 编程使用

### 基础连接示例

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 加载配置
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mysql_config.json'), 'utf8')
);

// 创建连接
async function connectDatabase() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功');
    return connection;
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    throw error;
  }
}
```

### 使用 DatabaseService 类

```javascript
import { DatabaseService } from './src/services/database.service';

// 初始化数据库服务
const db = new DatabaseService();

async function example() {
  try {
    // 连接数据库
    await db.initialize();
    
    // 创建任务
    const taskId = await db.createTask({
      name: '我的爬虫任务',
      type: 1,
      description: '爬取网站数据',
      url: 'https://example.com'
    });
    
    console.log('任务创建成功，ID:', taskId);
    
    // 获取任务列表
    const tasks = await db.getTasks();
    console.log('所有任务:', tasks);
    
    // 添加执行日志
    await db.addTaskLog({
      task_id: taskId,
      status: 'started',
      message: '任务开始执行',
      level: 'info'
    });
    
  } catch (error) {
    console.error('数据库操作失败:', error);
  } finally {
    // 关闭连接
    await db.close();
  }
}

example();
```

## 📊 主要功能

### 1. 任务管理
```javascript
// 创建任务
const taskId = await db.createTask({
  name: '数据采集任务',
  type: 1,
  description: '采集商品信息',
  url: 'https://shop.example.com',
  interval_seconds: 3600
});

// 获取任务
const tasks = await db.getTasks('running');
const task = await db.getTask(taskId);

// 更新状态
await db.updateTaskStatus(taskId, 'completed');

// 删除任务
await db.deleteTask(taskId);
```

### 2. 日志管理
```javascript
// 添加日志
await db.addTaskLog({
  task_id: taskId,
  execution_id: 'uuid-123',
  status: 'running',
  message: '正在处理第 1 页',
  level: 'info',
  details: { page: 1, total_pages: 10 }
});

// 获取日志
const logs = await db.getTaskLogs(taskId, 50);
```

### 3. 爬虫节点管理
```javascript
// 保存爬虫节点
const nodes = [
  {
    nodeType: 1, // 点击节点
    title: '点击搜索按钮',
    xpath: '//button[@id="search"]',
    waitTime: 2000
  },
  {
    nodeType: 3, // 提取节点
    title: '提取结果',
    xpath: '//div[@class="result"]',
    contentType: 0,
    recordASField: true
  }
];

await db.saveCrawlerNodes(taskId, nodes);

// 获取节点
const savedNodes = await db.getCrawlerNodes(taskId);
```

### 4. 系统配置
```javascript
// 获取配置
const wsPort = await db.getSystemConfig('websocket.port');

// 设置配置
await db.setSystemConfig('app.version', '1.0.0', '应用版本号');
```

### 5. 统计查询
```javascript
// 任务统计
const stats = await db.getTaskStats();

// 结果统计
const resultStats = await db.getResultStats(taskId);
```

## 🔧 高级用法

### 事务处理
```javascript
// 开启事务
const connection = await db.beginTransaction();

try {
  // 执行多个相关操作
  await connection.execute(
    'INSERT INTO tasks (name, type, status) VALUES (?, ?, ?)',
    ['批量任务', 1, 'waiting']
  );
  
  await connection.execute(
    'INSERT INTO task_logs (task_id, status, message, level) VALUES (?, ?, ?, ?)',
    [taskId, 'created', '通过事务创建', 'info']
  );
  
  // 提交事务
  await db.commitTransaction(connection);
  
} catch (error) {
  // 回滚事务
  await db.rollbackTransaction(connection);
  console.error('事务失败，已回滚:', error);
}
```

### 存储过程调用
```javascript
// 清理过期数据
await db.query('CALL cleanup_old_logs(?)', [30]);

// 更新任务执行时间
await db.query('CALL update_next_execute_time(?)', [taskId]);
```

## 📈 性能优化

### 1. 连接池配置
```json
{
  "connectionLimit": 20,
  "acquireTimeout": 60000,
  "timeout": 60000,
  "reconnect": true
}
```

### 2. 索引使用
数据库已预创建关键索引：
- `tasks.status` - 任务状态查询
- `task_logs.task_id` - 日志查询
- `crawler_nodes.task_id` - 节点查询

### 3. 分页查询
```javascript
// 使用分页避免大数据量查询
const getTasksWithPagination = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return await db.query(
    'SELECT * FROM tasks ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
};
```

## 🛠️ 故障排除

### 常见问题

#### 1. 连接失败
```
错误: ER_ACCESS_DENIED_ERROR
解决: 检查用户名和密码是否正确
```

#### 2. 数据库不存在
```
错误: ER_BAD_DB_ERROR
解决: 运行数据库初始化脚本
mysql -u root -p < db/init.sql
```

#### 3. 字符编码问题
```
错误: 乱码
解决: 确保使用 utf8mb4 字符集
```

#### 4. 端口被占用
```
错误: ECONNREFUSED
解决: 检查 MySQL 服务是否启动
net start mysql
```

### 调试模式
```javascript
// 启用调试日志
const db = new DatabaseService();
db.initialize().then(() => {
  console.log('数据库连接成功，开始调试...');
}).catch(console.error);
```

## 📚 相关文档

- `db/readme.txt` - 表结构详细说明
- `db/init.sql` - 数据库初始化脚本
- `src/services/database.service.ts` - 数据库服务实现
- `examples/database-usage-example.ts` - 完整使用示例

## 🎯 最佳实践

1. **使用连接池**: 避免频繁创建连接
2. **事务处理**: 保证数据一致性
3. **错误处理**: 捕获并记录所有异常
4. **资源清理**: 确保连接正确关闭
5. **分页查询**: 避免大数据量查询
6. **索引优化**: 根据查询模式创建适当索引

---

🎉 **现在您可以开始使用 MySQL 数据库来管理 ReliableSpider 项目了！**