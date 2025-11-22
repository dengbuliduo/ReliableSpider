// ============================================
// 数据库使用示例
// ============================================

import { DatabaseService } from '../src/services/database.service';

async function databaseExample() {
  // 1. 初始化数据库服务
  const db = new DatabaseService();
  
  try {
    // 2. 连接数据库
    const connected = await db.initialize();
    if (!connected) {
      console.error('数据库连接失败');
      return;
    }
    
    console.log('数据库连接成功！');
    
    // 3. 创建任务示例
    const taskId = await db.createTask({
      name: '示例数据采集任务',
      type: 1,
      description: '这是一个示例任务，演示如何使用MySQL数据库',
      url: 'https://example.com',
      interval_seconds: 3600
    });
    
    console.log('创建任务成功，ID:', taskId);
    
    // 4. 获取任务列表
    const tasks = await db.getTasks();
    console.log('任务列表:', tasks);
    
    // 5. 添加任务日志
    await db.addTaskLog({
      task_id: taskId,
      status: 'started',
      message: '任务开始执行',
      level: 'info'
    });
    
    // 6. 更新任务状态
    await db.updateTaskStatus(taskId, 'running');
    
    // 7. 获取系统配置
    const wsPort = await db.getSystemConfig('websocket.port');
    console.log('WebSocket端口配置:', wsPort);
    
    // 8. 设置系统配置
    await db.setSystemConfig('app.version', '1.0.0', '应用版本号');
    
    // 9. 获取统计信息
    const stats = await db.getTaskStats();
    console.log('任务统计:', stats);
    
    // 10. 查询任务日志
    const logs = await db.getTaskLogs(taskId);
    console.log('任务日志:', logs);
    
    console.log('数据库操作示例完成！');
    
  } catch (error) {
    console.error('数据库操作失败:', error);
  } finally {
    // 11. 关闭数据库连接
    await db.close();
  }
}

// ============================================
// 事务使用示例
// ============================================

async function transactionExample() {
  const db = new DatabaseService();
  
  try {
    await db.initialize();
    
    // 开启事务
    const connection = await db.beginTransaction();
    
    try {
      // 执行多个相关操作
      await connection.execute(
        'INSERT INTO tasks (name, type, status) VALUES (?, ?, ?)',
        ['事务测试任务', 1, 'waiting']
      );
      
      await connection.execute(
        'INSERT INTO task_logs (task_id, status, message, level) VALUES (?, ?, ?, ?)',
        [1, 'started', '通过事务创建的任务', 'info']
      );
      
      // 提交事务
      await db.commitTransaction(connection);
      console.log('事务提交成功');
      
    } catch (error) {
      // 回滚事务
      await db.rollbackTransaction(connection);
      console.error('事务回滚:', error);
    }
    
  } catch (error) {
    console.error('事务示例失败:', error);
  } finally {
    await db.close();
  }
}

// ============================================
// 爬虫节点保存示例
// ============================================

async function crawlerNodeExample() {
  const db = new DatabaseService();
  
  try {
    await db.initialize();
    
    // 创建一个示例任务
    const taskId = await db.createTask({
      name: '爬虫节点示例',
      type: 1,
      description: '演示如何保存爬虫流程图节点'
    });
    
    // 模拟爬虫节点数据
    const nodes = [
      {
        nodeType: 1, // 点击节点
        title: '点击搜索按钮',
        description: '点击搜索按钮开始搜索',
        xpath: '//button[@type="submit"]',
        iframe: false,
        option: 1,
        useLoop: false,
        waitTime: 2000,
        clickWay: 1
      },
      {
        nodeType: 3, // 提取节点
        title: '提取搜索结果',
        description: '提取搜索结果列表',
        xpath: '//div[@class="search-result"]',
        iframe: false,
        contentType: 0,
        nodeType: 0,
        recordASField: true,
        splitLine: true
      }
    ];
    
    // 保存节点
    const saved = await db.saveCrawlerNodes(taskId, nodes);
    if (saved) {
      console.log('爬虫节点保存成功');
      
      // 获取保存的节点
      const savedNodes = await db.getCrawlerNodes(taskId);
      console.log('保存的节点:', savedNodes);
    }
    
  } catch (error) {
    console.error('爬虫节点示例失败:', error);
  } finally {
    await db.close();
  }
}

// ============================================
// 运行示例
// ============================================

async function runExamples() {
  console.log('=== 数据库使用示例 ===');
  await databaseExample();
  
  console.log('\n=== 事务使用示例 ===');
  await transactionExample();
  
  console.log('\n=== 爬虫节点示例 ===');
  await crawlerNodeExample();
}

// 如果直接运行此文件
if (require.main === module) {
  runExamples().catch(console.error);
}

export { databaseExample, transactionExample, crawlerNodeExample };