// ============================================
// 数据库设置脚本
// ============================================

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

console.log('🗄️  ReliableSpider 数据库设置向导\n');

async function checkMySQL() {
  console.log('📋 检查 MySQL 安装状态...');
  
  return new Promise((resolve) => {
    const mysql = spawn('mysql', ['--version'], { stdio: 'pipe' });
    
    mysql.on('close', (code) => {
      if (code === 0) {
        console.log('✅ MySQL 已安装');
        resolve(true);
      } else {
        console.log('❌ MySQL 未安装或未添加到PATH');
        console.log('   请先安装 MySQL: https://dev.mysql.com/downloads/mysql/');
        resolve(false);
      }
    });
  });
}

async function checkConfig() {
  console.log('\n📋 检查配置文件...');
  
  const configPath = path.join(__dirname, '../mysql_config.json');
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ 配置文件不存在，请先创建 mysql_config.json');
    console.log('   参考配置:');
    console.log('   {');
    console.log('     "host": "localhost",');
    console.log('     "port": 3306,');
    console.log('     "username": "root",');
    console.log('     "password": "123456",');
    console.log('     "database": "reliableSpider"');
    console.log('   }');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ 配置文件存在');
    console.log(`   数据库: ${config.database}@${config.host}:${config.port}`);
    return true;
  } catch (error) {
    console.log('❌ 配置文件格式错误');
    return false;
  }
}

async function testConnection() {
  console.log('\n📋 测试数据库连接...');
  
  return new Promise((resolve) => {
    const configPath = path.join(__dirname, '../mysql_config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    const mysql = spawn('mysql', [
      '-h', config.host,
      '-P', config.port.toString(),
      '-u', config.username,
      `-p${config.password}`,
      '-e', 'SELECT 1;'
    ], { stdio: 'pipe' });
    
    let errorOutput = '';
    
    mysql.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    mysql.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 数据库连接成功');
        resolve(true);
      } else {
        console.log('❌ 数据库连接失败');
        console.log('   错误信息:', errorOutput.trim());
        console.log('   请检查:');
        console.log('   1. MySQL 服务是否启动');
        console.log('   2. 用户名和密码是否正确');
        console.log('   3. 防火墙设置');
        resolve(false);
      }
    });
  });
}

async function initDatabase() {
  console.log('\n📋 初始化数据库结构...');
  
  return new Promise((resolve) => {
    const configPath = path.join(__dirname, '../mysql_config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const initScriptPath = path.join(__dirname, '../db/init.sql');
    
    const mysql = spawn('mysql', [
      '-h', config.host,
      '-P', config.port.toString(),
      '-u', config.username,
      `-p${config.password}`,
      '-e', `SOURCE ${initScriptPath};`
    ], { stdio: 'pipe' });
    
    let output = '';
    
    mysql.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    mysql.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    mysql.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 数据库初始化成功');
        console.log(output);
        resolve(true);
      } else {
        console.log('❌ 数据库初始化失败');
        console.log('   错误信息:', output);
        resolve(false);
      }
    });
  });
}

async function installDependencies() {
  console.log('\n📋 检查 Node.js 依赖...');
  
  return new Promise((resolve) => {
    const npm = spawn('npm', ['list', 'mysql2'], { stdio: 'pipe' });
    
    npm.on('close', (code) => {
      if (code === 0) {
        console.log('✅ MySQL2 驱动已安装');
        resolve(true);
      } else {
        console.log('📦 安装 MySQL2 驱动...');
        const install = spawn('npm', ['install', 'mysql2'], { stdio: 'inherit' });
        
        install.on('close', (installCode) => {
          if (installCode === 0) {
            console.log('✅ MySQL2 驱动安装成功');
            resolve(true);
          } else {
            console.log('❌ MySQL2 驱动安装失败');
            resolve(false);
          }
        });
      }
    });
  });
}

async function createExampleApp() {
  console.log('\n📋 创建数据库使用示例...');
  
  const exampleDir = path.join(__dirname, '../examples');
  if (!fs.existsSync(exampleDir)) {
    fs.mkdirSync(exampleDir, { recursive: true });
  }
  
  const examplePath = path.join(exampleDir, 'database-usage-example.js');
  
  if (!fs.existsSync(examplePath)) {
    const exampleContent = `
// ============================================
// 数据库使用示例
// ============================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 加载配置
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../mysql_config.json'), 'utf8'));

async function example() {
  let connection;
  
  try {
    // 创建连接
    connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功');
    
    // 创建任务
    const [result] = await connection.execute(
      'INSERT INTO tasks (name, type, status, description) VALUES (?, ?, ?, ?)',
      ['示例任务', 1, 'waiting', '这是一个数据库使用示例']
    );
    
    const taskId = result.insertId;
    console.log('✅ 创建任务成功，ID:', taskId);
    
    // 查询任务
    const [tasks] = await connection.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );
    
    console.log('✅ 查询结果:', tasks[0]);
    
    // 添加日志
    await connection.execute(
      'INSERT INTO task_logs (task_id, status, message, level) VALUES (?, ?, ?, ?)',
      [taskId, 'started', '任务开始执行', 'info']
    );
    
    console.log('✅ 日志记录成功');
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

// 运行示例
example().catch(console.error);
`;
    
    fs.writeFileSync(examplePath, exampleContent, 'utf8');
    console.log('✅ 示例文件已创建:', examplePath);
  } else {
    console.log('✅ 示例文件已存在');
  }
}

async function main() {
  console.log('🚀 开始数据库设置流程...\n');
  
  // 1. 检查 MySQL
  const mysqlInstalled = await checkMySQL();
  if (!mysqlInstalled) {
    process.exit(1);
  }
  
  // 2. 检查配置
  const configExists = await checkConfig();
  if (!configExists) {
    process.exit(1);
  }
  
  // 3. 测试连接
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // 4. 初始化数据库
  await initDatabase();
  
  // 5. 安装依赖
  await installDependencies();
  
  // 6. 创建示例
  await createExampleApp();
  
  console.log('\n🎉 数据库设置完成！');
  console.log('\n📝 接下来的步骤:');
  console.log('1. 运行示例: node examples/database-usage-example.js');
  console.log('2. 查看文档: cat db/readme.txt');
  console.log('3. 启动应用: npm start');
  console.log('\n✨ 现在您可以在应用中使用 MySQL 数据库了！');
}

// 运行主程序
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 设置过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = {
  checkMySQL,
  checkConfig,
  testConnection,
  initDatabase,
  installDependencies,
  createExampleApp
};