// ============================================
// Express服务器服务类
// ============================================

import express from 'express';
import cors from 'cors';
import path from 'path';
import { APP_CONFIG } from '../config/app.config';
import { ExpressServiceStatus, FileUploadResult } from '../types/app';
import { DatabaseService } from './database.service';
import { TaskService } from './task.service';

export class ExpressService {
  private app: express.Application;
  private server: any = null;
  private port: number = APP_CONFIG.SERVER.PORT;
  private host: string = APP_CONFIG.SERVER.HOST;
  private isRunning: boolean = false;
  private database: DatabaseService;
  private taskService?: TaskService;

  constructor(databaseService: DatabaseService, taskService?: TaskService) {
    this.app = express();
    this.database = databaseService;
    this.taskService = taskService;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // CORS配置
    this.app.use(cors({
      origin: ['http://localhost:3003', 'http://127.0.0.1:3003', 'http://localhost:5173'],
      credentials: true
    }));

    // 静态文件服务
    this.app.use(express.static(path.join(__dirname, '../../dist/renderer')));
    
    // 解析JSON请求体
    this.app.use(express.json({ limit: '50mb' }));
    
    // 解析URL编码请求体
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (_req: express.Request, res: express.Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'crawler-app'
      });
    });

    // 文件上传接口
    this.app.post('/api/upload', this.handleFileUpload.bind(this));

    // 文件下载接口
    this.app.get('/api/download/:filename', this.handleFileDownload.bind(this));

    // 任务管理接口
    this.app.post('/api/tasks', this.handleCreateTask.bind(this));
    this.app.get('/api/tasks', this.handleGetTasks.bind(this));
    this.app.get('/api/tasks/:id', this.handleGetTaskDetail.bind(this));
    this.app.delete('/api/tasks/:id', this.handleDeleteTask.bind(this));
    this.app.post('/api/tasks/:id/execute', this.handleExecuteTask.bind(this));

    // 配置文件接口
    this.app.get('/api/config', this.handleGetConfig.bind(this));
    this.app.post('/api/config', this.handleUpdateConfig.bind(this));

    // 数据导出接口
    this.app.get('/api/export/:type', this.handleDataExport.bind(this));

    // 默认路由 - 返回Vue应用
    this.app.get('*', (_req: express.Request, res: express.Response) => {
      res.sendFile(path.join(__dirname, '../../dist/renderer/index.html'));
    });
  }

  /**
   * 启动Express服务器
   */
  async start(port?: number, host?: string): Promise<boolean> {
    try {
      if (this.isRunning) {
        console.log('Express server is already running');
        return true;
      }

      const targetPort = port || this.port;
      const targetHost = host || this.host;

      return new Promise((resolve) => {
        this.server = this.app.listen(targetPort, targetHost, () => {
          this.isRunning = true;
          this.port = targetPort;
          this.host = targetHost;
          
          console.log(`Express server started on http://${targetHost}:${targetPort}`);
          resolve(true);
        });

        this.server.on('error', (error: any) => {
          console.error('Failed to start Express server:', error);
          
          if (error.code === 'EADDRINUSE') {
            console.log(`Port ${targetPort} is busy, trying alternative port...`);
            const alternativePort = targetPort + 1;
            
            this.server = this.app.listen(alternativePort, targetHost, () => {
              this.isRunning = true;
              this.port = alternativePort;
              this.host = targetHost;
              
              console.log(`Express server started on http://${targetHost}:${alternativePort}`);
              resolve(true);
            });
          } else {
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Error starting Express server:', error);
      return false;
    }
  }

  /**
   * 停止Express服务器
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          console.log('Express server stopped');
          resolve();
        });
      } else {
        this.isRunning = false;
        resolve();
      }
    });
  }

  /**
   * 处理文件上传
   */
  private async handleFileUpload(req: express.Request, res: express.Response): Promise<void> {
    try {
      // 这里需要实现具体的文件上传逻辑
      // 当前版本简单返回成功响应
      
      const result: FileUploadResult = {
        success: true,
        filename: req.body.filename || 'unknown',
        size: req.body.size || 0,
        message: 'File uploaded successfully'
      };
      
      res.json(result);
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        error: 'File upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 处理文件下载
   */
  private async handleFileDownload(req: express.Request, res: express.Response): Promise<void> {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '../../data', filename);
      
      // 检查文件是否存在
      if (require('fs').existsSync(filePath)) {
        res.download(filePath, filename);
      } else {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
    } catch (error) {
      console.error('File download error:', error);
      res.status(500).json({
        success: false,
        error: 'File download failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 处理创建任务
   */
  private async handleCreateTask(req: express.Request, res: express.Response): Promise<void> {
    try {
      const taskData = req.body;
      const newId = await this.database.createTask({
        name: taskData.name,
        type: Number(taskData.type) || 0,
        description: taskData.description,
        url: taskData.url,
        interval_seconds: Number(taskData.interval_seconds) || 3600
      });
      res.json({ success: true, taskId: newId, message: 'Task created successfully' });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        error: 'Task creation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 处理获取任务列表
   */
  private async handleGetTasks(req: express.Request, res: express.Response): Promise<void> {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const tasks = await this.database.getTasks(status);
      res.json({ success: true, tasks, total: tasks.length });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tasks',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 处理获取任务详情
   */
  private async handleGetTaskDetail(req: express.Request, res: express.Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id) {
        res.status(400).json({ success: false, error: 'Invalid task id' });
        return;
      }
      const task = await this.database.getTask(id);
      if (!task) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }
      res.json({ success: true, task });
    } catch (error) {
      console.error('Get task detail error:', error);
      res.status(500).json({ success: false, error: 'Failed to get task', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * 处理删除任务
   */
  private async handleDeleteTask(req: express.Request, res: express.Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id) {
        res.status(400).json({ success: false, error: 'Invalid task id' });
        return;
      }
      const ok = await this.database.deleteTask(id);
      res.json({ success: ok, message: ok ? 'Task deleted successfully' : 'Task delete failed' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({
        success: false,
        error: 'Task deletion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 处理执行任务
   */
  private async handleExecuteTask(req: express.Request, res: express.Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id) {
        res.status(400).json({ success: false, error: 'Invalid task id' });
        return;
      }
      if (!this.taskService) {
        res.status(500).json({ success: false, error: 'Task service not available' });
        return;
      }
      await this.taskService.executeTask(id);
      res.json({ success: true, message: 'Task execution triggered' });
    } catch (error) {
      console.error('Execute task error:', error);
      res.status(500).json({ success: false, error: 'Task execute failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * 处理获取配置
   */
  private async handleGetConfig(_req: express.Request, res: express.Response): Promise<void> {
    try {
      // 这里需要实现具体的配置获取逻辑
      const config = {
        language: 'en',
        theme: 'light',
        debug: true
      };
      
      res.json({
        success: true,
        config
      });
    } catch (error) {
      console.error('Get config error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get config',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 处理更新配置
   */
  private async handleUpdateConfig(req: express.Request, res: express.Response): Promise<void> {
    try {
      const configData = req.body;
      
      // 这里需要实现具体的配置更新逻辑
      console.log('Updating config:', configData);
      
      res.json({
        success: true,
        message: 'Config updated successfully'
      });
    } catch (error) {
      console.error('Update config error:', error);
      res.status(500).json({
        success: false,
        error: 'Config update failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 处理数据导出
   */
  private async handleDataExport(req: express.Request, res: express.Response): Promise<void> {
    try {
      const exportType = req.params.type;
      
      // 这里需要实现具体的数据导出逻辑
      console.log('Exporting data:', exportType);
      
      res.json({
        success: true,
        downloadUrl: `/api/download/export_${exportType}_${Date.now()}.json`,
        message: 'Data exported successfully'
      });
    } catch (error) {
      console.error('Data export error:', error);
      res.status(500).json({
        success: false,
        error: 'Data export failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取服务器状态
   */
  getStatus(): ExpressServiceStatus {
    return {
      isRunning: this.isRunning,
      port: this.port,
      host: this.host,
      uptime: this.isRunning ? Date.now() : 0
    };
  }

  /**
   * 获取服务器地址
   */
  getServerAddress(): string {
    return `http://${this.host}:${this.port}`;
  }
}