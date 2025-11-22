// ============================================
// 爬虫应用类 - 模块化架构的核心类
// ============================================

import { WebSocketService } from '../services/websocket.service';
import { TaskService } from '../services/task.service';
import { SeleniumService } from '../services/selenium.service';
import { DatabaseService } from '../services/database.service';

export class CrawlerApplication {
  private webSocketService: WebSocketService | null = null;
  private taskService: TaskService | null = null;
  private seleniumService: SeleniumService | null = null;
  private databaseService: DatabaseService | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.databaseService = new DatabaseService();
    console.log('CrawlerApplication initialized');
  }

  /**
   * 初始化应用（与原main.js逻辑一致）
   */
  async initialize(): Promise<boolean> {
    try {
      // 初始化Selenium服务
      // 初始化数据库服务
      const dbInitialized = await this.databaseService!.initialize();
      if (!dbInitialized) {
        throw new Error('数据库初始化失败');
      }

      this.seleniumService = new SeleniumService();

      // 初始化WebSocket服务
      this.webSocketService = new WebSocketService();
      this.webSocketService.createServer(8080); // 使用默认端口

      // 初始化任务服务
      if (this.seleniumService && this.webSocketService) {
        this.taskService = new TaskService(this.seleniumService, this.webSocketService /*, this.databaseService! */);
      }

      this.isInitialized = true;
      console.log('Crawler application initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize crawler application:', error);
      return false;
    }
  }

  /**
   * 获取应用状态
   */
  getApplicationStatus(): {
    isInitialized: boolean;
    webSocketConnections: number;
    seleniumReady: boolean;
    taskQueueSize: number;
  } {
    return {
      isInitialized: this.isInitialized,
      webSocketConnections: this.webSocketService?.getActiveConnections() || 0,
      seleniumReady: this.seleniumService?.isReady() || false,
      taskQueueSize: this.taskService?.getTaskStatus().queueSize || 0
    };
  }

  /**
   * 关闭应用
   */
  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down crawler application...');
      
      // 关闭WebSocket连接
      if (this.webSocketService) {
        this.webSocketService.closeAllConnections();
      }

      // 关闭Selenium驱动
      if (this.seleniumService) {
        await this.seleniumService.shutdown();
      }

      this.isInitialized = false;
      console.log('Crawler application shutdown completed');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  /**
   * 获取服务实例（用于测试）
   */
  getServices() {
    return {
      webSocketService: this.webSocketService,
      taskService: this.taskService,
      seleniumService: this.seleniumService,
      databaseService: this.databaseService
    };
  }

  /**
   * 获取数据库服务实例
   */
  getDatabaseService(): DatabaseService | null {
    return this.databaseService;
  }
}