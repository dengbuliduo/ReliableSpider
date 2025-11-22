// ============================================
// 数据库服务类 - MySQL连接和操作封装
// ============================================

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
// import { TaskMessage, CrawlerNodeParameters, DataExtractionParam } from '../types/app';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  charset?: string;
  timezone?: string;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
  multipleStatements?: boolean;
}

export class DatabaseService {
  // private connection: mysql.Connection | null = null;
  private pool: mysql.Pool | null = null;
  private config: DatabaseConfig | null = null;

  constructor(configPath?: string) {
    // 加载配置文件
    this.loadConfig(configPath);
  }

  /**
   * 加载数据库配置
   */
  private loadConfig(configPath?: string): void {
    const defaultPath = path.join(__dirname, '../../mysql_config.json');
    const configFilePath = configPath || defaultPath;

    try {
      if (fs.existsSync(configFilePath)) {
        const configData = fs.readFileSync(configFilePath, 'utf8');
        const config = JSON.parse(configData);
        
        this.config = {
          host: config.host || 'localhost',
          port: config.port || 3306,
          username: config.username || 'root',
          password: config.password || '123456',
          database: config.database || 'reliableSpider',
          charset: config.charset || 'utf8mb4',
          timezone: config.timezone || '+08:00',
          connectionLimit: config.connectionLimit || 10,
          acquireTimeout: config.acquireTimeout || 60000,
          timeout: config.timeout || 60000,
          multipleStatements: (typeof config.multipleStatements === 'boolean') ? config.multipleStatements : true
        };

        console.log('数据库配置加载成功:', {
          host: this.config.host,
          port: this.config.port,
          database: this.config.database
        });
      } else {
        throw new Error(`配置文件不存在: ${configFilePath}`);
      }
    } catch (error) {
      console.error('加载数据库配置失败:', error);
      throw error;
    }
  }

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<boolean> {
    try {
      // 创建连接池
      if (!this.config) {
        throw new Error('数据库配置未加载');
      }
      // 将内部配置映射到 mysql2 PoolOptions
      const poolConfig: mysql.PoolOptions = {
        host: this.config.host,
        port: this.config.port,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        connectionLimit: this.config.connectionLimit ?? 10,
        // mysql2 使用 connectTimeout（毫秒）用于初始连接；避免传递未识别的 timeout 字段
        connectTimeout: this.config.acquireTimeout ?? 60000,
        // 其他可选项
        waitForConnections: true,
        queueLimit: 0,
        multipleStatements: this.config.multipleStatements ?? true
      };

      this.pool = mysql.createPool(poolConfig);

      // 测试连接
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      console.log('数据库连接池初始化成功');
      // 初始化数据库表结构（如果尚未创建）
      await this.initializeSchemaIfNeeded();
      return true;
    } catch (error) {
      console.error('数据库连接初始化失败:', error);
      // 若数据库不存在，尝试自动创建并重试
      const errAny: any = error;
      if (errAny && (errAny.code === 'ER_BAD_DB_ERROR' || /Unknown database/i.test(String(errAny.message)))) {
        try {
          console.warn(`检测到数据库 ${this.config!.database} 不存在，正在自动创建...`);
          await this.ensureDatabaseExists();
          // 创建后重试连接
          const retryPoolConfig: mysql.PoolOptions = {
            host: this.config!.host,
            port: this.config!.port,
            user: this.config!.username,
            password: this.config!.password,
            database: this.config!.database,
            connectionLimit: this.config!.connectionLimit ?? 10,
            connectTimeout: this.config!.acquireTimeout ?? 60000,
            waitForConnections: true,
            queueLimit: 0,
            multipleStatements: this.config!.multipleStatements ?? true
          };
          this.pool = mysql.createPool(retryPoolConfig);
          const conn = await this.pool.getConnection();
          await conn.ping();
          conn.release();
          console.log('数据库创建后连接池初始化成功');
          // 数据库创建后，初始化表结构
          await this.initializeSchemaIfNeeded();
          return true;
        } catch (createErr) {
          console.error('自动创建数据库失败:', createErr);
        }
      }
      return false;
    }
  }

  /**
   * 若目标数据库不存在，则在服务器上创建它
   */
  private async ensureDatabaseExists(): Promise<void> {
    if (!this.config) throw new Error('数据库配置未加载');

    const baseConn = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      connectTimeout: this.config.acquireTimeout ?? 60000,
      multipleStatements: this.config.multipleStatements ?? true
    });
    try {
      const dbName = this.config.database;
      const charset = this.config.charset || 'utf8mb4';
      const collate = charset === 'utf8mb4' ? 'utf8mb4_unicode_ci' : 'utf8_general_ci';
      await baseConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET ${charset} COLLATE ${collate}`);
      console.log(`数据库 ${dbName} 已存在或创建完成`);
    } finally {
      await baseConn.end();
    }
  }

  /**
   * 判断关键表是否已存在
   */
  private async schemaInitialized(): Promise<boolean> {
    if (!this.config) throw new Error('数据库配置未加载');
    try {
      const rows = await this.query(
        'SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ? LIMIT 1',
        [this.config.database, 'tasks']
      );
      return Array.isArray(rows) && rows.length > 0;
    } catch (e) {
      // 无法查询视为未初始化
      return false;
    }
  }

  /**
   * 尝试初始化数据库表结构（执行 db/init.sql）
   */
  private async initializeSchemaIfNeeded(): Promise<void> {
    if (!this.pool) return;
    const initialized = await this.schemaInitialized();
    if (initialized) {
      console.log('数据库表结构已存在，无需初始化');
      return;
    }

    const initSqlPath = this.resolveInitSqlPath();
    if (!initSqlPath) {
      console.warn('未找到数据库初始化脚本 db/init.sql，跳过表结构初始化');
      return;
    }

    try {
      const raw = fs.readFileSync(initSqlPath, 'utf8');
      // 预处理：移除注释与 DELIMITER 行，按分号拆分语句
      const lines = raw.replace(/\r\n/g, "\n").split("\n");
      const filtered = lines
        .filter(l => !/^\s*--/.test(l))
        .filter(l => !/^\s*DELIMITER\b/i.test(l));
      const text = filtered.join("\n");
      const statements = text
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        if (/CREATE\s+PROCEDURE|CREATE\s+FUNCTION|CREATE\s+TRIGGER/i.test(stmt)) {
          console.warn('跳过高阶例程创建语句（开发环境无需）：', stmt.substring(0, 60) + '...');
          continue;
        }
        await this.pool.query(stmt);
      }
      console.log('数据库表结构初始化完成');
    } catch (err) {
      console.error('执行数据库初始化脚本失败:', err);
    }
  }

  /**
   * 解析 db/init.sql 的可能路径（兼容 src 与 dist 运行环境）
   */
  private resolveInitSqlPath(): string | null {
    // 1) 源码运行：src/services -> ../../db/init.sql
    const pathFromSrc = path.join(__dirname, '../../db/init.sql');
    if (fs.existsSync(pathFromSrc)) return pathFromSrc;
    // 2) 编译运行：dist/electron/src/services -> ../../../../db/init.sql
    const pathFromDist = path.join(__dirname, '../../../..', 'db', 'init.sql');
    if (fs.existsSync(pathFromDist)) return pathFromDist;
    return null;
  }

  /**
   * 获取数据库连接
   */
  async getConnection(): Promise<mysql.PoolConnection> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化，请先调用initialize()');
    }
    return await this.pool.getConnection();
  }

  /**
   * 执行查询
   */
  async query(sql: string, params?: any[]): Promise<any> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * 开始事务
   */
  async beginTransaction(): Promise<mysql.PoolConnection> {
    const connection = await this.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  /**
   * 提交事务
   */
  async commitTransaction(connection: mysql.PoolConnection): Promise<void> {
    await connection.commit();
    connection.release();
  }

  /**
   * 回滚事务
   */
  async rollbackTransaction(connection: mysql.PoolConnection): Promise<void> {
    await connection.rollback();
    connection.release();
  }

  // ============================================
  // 任务相关操作
  // ============================================

  /**
   * 创建任务
   */
  async createTask(taskData: {
    name: string;
    type: number;
    description?: string;
    url?: string;
    interval_seconds?: number;
  }): Promise<number> {
    const sql = `
      INSERT INTO tasks (name, type, description, url, interval_seconds, status)
      VALUES (?, ?, ?, ?, ?, 'waiting')
    `;
    const params = [
      taskData.name,
      taskData.type,
      taskData.description || null,
      taskData.url || null,
      taskData.interval_seconds || 3600
    ];
    
    const result = await this.query(sql, params);
    return result.insertId;
  }

  /**
   * 获取任务列表
   */
  async getTasks(status?: string): Promise<any[]> {
    let sql = `
      SELECT id, name, type, status, description, url, 
             interval_seconds, created_at, updated_at, 
             last_executed_at, next_execute_at
      FROM tasks
    `;
    let params: any[] = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';

    return await this.query(sql, params);
  }

  /**
   * 获取任务详情
   */
  async getTask(id: number): Promise<any> {
    const sql = `
      SELECT id, name, type, status, description, url, 
             interval_seconds, created_at, updated_at, 
             last_executed_at, next_execute_at
      FROM tasks
      WHERE id = ?
    `;
    
    const results = await this.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(id: number, status: string): Promise<boolean> {
    const sql = 'UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?';
    const result = await this.query(sql, [status, id]);
    return result.affectedRows > 0;
  }

  /**
   * 删除任务
   */
  async deleteTask(id: number): Promise<boolean> {
    const sql = 'DELETE FROM tasks WHERE id = ?';
    const result = await this.query(sql, [id]);
    return result.affectedRows > 0;
  }

  // ============================================
  // 日志相关操作
  // ============================================

  /**
   * 添加任务日志
   */
  async addTaskLog(logData: {
    task_id: number;
    execution_id?: string;
    status: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
    details?: any;
  }): Promise<number> {
    const sql = `
      INSERT INTO task_logs (task_id, execution_id, status, message, level, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      logData.task_id,
      logData.execution_id || null,
      logData.status,
      logData.message,
      logData.level,
      logData.details ? JSON.stringify(logData.details) : null
    ];
    
    const result = await this.query(sql, params);
    return result.insertId;
  }

  /**
   * 获取任务日志
   */
  async getTaskLogs(taskId: number, limit: number = 100): Promise<any[]> {
    const sql = `
      SELECT id, execution_id, status, start_time, end_time, 
             duration_ms, message, level, details
      FROM task_logs
      WHERE task_id = ?
      ORDER BY start_time DESC
      LIMIT ?
    `;
    
    return await this.query(sql, [taskId, limit]);
  }

  // ============================================
  // 节点相关操作
  // ============================================

  /**
   * 保存爬虫节点
   */
  async saveCrawlerNodes(taskId: number, nodes: any[]): Promise<boolean> {
    const connection = await this.beginTransaction();
    
    try {
      // 删除现有节点
      await connection.execute('DELETE FROM crawler_nodes WHERE task_id = ?', [taskId]);
      
      // 插入新节点
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const sql = `
          INSERT INTO crawler_nodes 
          (task_id, node_index, node_type, title, description, iframe, xpath,
           option, option_mode, option_value, use_loop, loop_index, loop_type,
           value, code, code_mode, wait_time, before_js, before_js_wait_time,
           after_js, after_js_wait_time, click_way, new_tab, alert_handle_type,
           path_list, text_list, links, class_type, position_x, position_y)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
          taskId, i, node.nodeType || 0, node.title, node.description, 
          node.iframe || false, node.xpath || '', node.option || 0,
          node.optionMode || 0, node.optionValue || null, node.useLoop || false,
          node.index || null, node.loopType || 0, node.value || null,
          node.code || null, node.codeMode || 0, node.waitTime || 0,
          node.beforeJS || null, node.beforeJSWaitTime || 0, node.afterJS || null,
          node.afterJSWaitTime || 0, node.clickWay || 1, node.newTab || 0,
          node.alertHandleType || 0, JSON.stringify(node.pathList || []),
          JSON.stringify(node.textList || []), node.links || null,
          node.class || 0, 0, 0 // position_x, position_y
        ];
        
        await connection.execute(sql, params);
      }
      
      await this.commitTransaction(connection);
      return true;
    } catch (error) {
      await this.rollbackTransaction(connection);
      console.error('保存爬虫节点失败:', error);
      return false;
    }
  }

  /**
   * 获取爬虫节点
   */
  async getCrawlerNodes(taskId: number): Promise<any[]> {
    const sql = `
      SELECT id, node_index, node_type, title, description, iframe, xpath,
             option, option_mode, option_value, use_loop, loop_index, loop_type,
             value, code, code_mode, wait_time, before_js, before_js_wait_time,
             after_js, after_js_wait_time, click_way, new_tab, alert_handle_type,
             path_list, text_list, links, class_type, position_x, position_y
      FROM crawler_nodes
      WHERE task_id = ?
      ORDER BY node_index
    `;
    
    const results = await this.query(sql, [taskId]);
    
    // 解析JSON字段
    return results.map((row: any) => ({
      ...row,
      pathList: row.path_list ? JSON.parse(row.path_list) : [],
      textList: row.text_list ? JSON.parse(row.text_list) : []
    }));
  }

  // ============================================
  // 配置相关操作
  // ============================================

  /**
   * 获取系统配置
   */
  async getSystemConfig(key: string): Promise<string | null> {
    const sql = 'SELECT config_value FROM system_configs WHERE config_key = ?';
    const results = await this.query(sql, [key]);
    return results.length > 0 ? results[0].config_value : null;
  }

  /**
   * 设置系统配置
   */
  async setSystemConfig(key: string, value: string, description?: string): Promise<boolean> {
    const sql = `
      INSERT INTO system_configs (config_key, config_value, config_type, description)
      VALUES (?, ?, 'string', ?)
      ON DUPLICATE KEY UPDATE 
      config_value = VALUES(config_value),
      updated_at = NOW()
    `;
    
    const result = await this.query(sql, [key, value, description || '']);
    return result.affectedRows > 0;
  }

  // ============================================
  // 统计相关操作
  // ============================================

  /**
   * 获取任务统计信息
   */
  async getTaskStats(): Promise<any> {
    const sql = 'SELECT * FROM v_task_stats';
    return await this.query(sql);
  }

  /**
   * 获取结果统计信息
   */
  async getResultStats(taskId?: number): Promise<any[]> {
    let sql = 'SELECT * FROM v_task_result_stats';
    let params: any[] = [];
    
    if (taskId) {
      sql += ' WHERE task_id = ?';
      params.push(taskId);
    }
    
    return await this.query(sql, params);
  }

  // ============================================
  // 清理操作
  // ============================================

  /**
   * 清理过期数据
   */
  async cleanupOldData(daysToKeep: number = 30): Promise<boolean> {
    try {
      await this.query('CALL cleanup_old_logs(?)', [daysToKeep]);
      console.log(`清理${daysToKeep}天前的数据完成`);
      return true;
    } catch (error) {
      console.error('清理数据失败:', error);
      return false;
    }
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('数据库连接池已关闭');
    }
  }

  /**
   * 测试数据库连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return false;
    }
  }
}