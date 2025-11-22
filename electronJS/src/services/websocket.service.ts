// ============================================
// WebSocket服务类（与原main.js逻辑一致）
// ============================================

import * as ws from 'ws';
import { APP_CONFIG } from '../config/app.config';
import { WebSocketMessage, SocketConnections } from '../types/app';

export class WebSocketService {
  private server: ws.Server | null = null;
  private connections: SocketConnections = {
    socket_window: null,
    socket_start: null,
    socket_flowchart: null,
    socket_popup: null,
    allWindowSockets: [],
    allWindowSocketNames: []
  };
  private messageHandlers: Map<string, (message: WebSocketMessage, ws: any) => void> = new Map();

  /**
   * 创建WebSocket服务器（与原main.js一致）
   */
  createServer(port: number = APP_CONFIG.WEBSOCKET_PORT): ws.Server {
    this.server = new ws.Server({ port });
    
    this.server.on('connection', (ws: any) => {
      ws.on('message', async (data: any) => {
        await this.handleConnectionMessage(data, ws);
      });
      
      ws.on('close', async () => {
        await this.handleConnectionClose(ws);
      });
      
      ws.on('error', (error: any) => {
        console.error('WebSocket connection error:', error);
      });
    });

    this.server.on('error', (error: any) => {
      console.error('WebSocket server error:', error);
      // 端口占用错误处理（与原main.js一致）
      if (error.message.includes('EADDRINUSE')) {
        const errorMessage = `端口${port}被占用，大概率是重复打开了多个ReliableSpider程序导致，小概率是其他程序占用了此端口，请关闭所有已打开的ReliableSpider程序及其他占用此端口的程序，或重启系统后再次尝试打开软件。
Port ${port} is occupied, it is most likely that multiple ReliableSpider programs are opened repeatedly, or other programs occupy this port. Please close all opened ReliableSpider programs and other programs that occupy this port, or restart the system and try to open the software again.`;
        
        // 这里需要调用dialog.showErrorBox，但dialog在WebSocket服务中不可用
        // 将通过事件机制通知主进程
        this.emitError('PORT_OCCUPIED', errorMessage);
      }
    });

    console.log(`WebSocket server started on port ${port}`);
    return this.server;
  }

  /**
   * 处理连接消息（与原main.js的wss.on('connection')逻辑一致）
   */
  private async handleConnectionMessage(data: any, ws: any): Promise<void> {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;
      console.log('Received WebSocket message:', message);

      // 连接管理消息（msg.type == 0）
      if (message.type === '0') {
        await this.handleConnectionManagement(message, ws);
      } else if (message.type === '10') {
        // type=10特殊处理（原main.js逻辑）
        await this.handleWindowSwitch(message);
      } else {
        // 其他消息类型传递给beginInvoke处理（与原main.js一致）
        await this.handleTaskMessage(message, ws);
      }
    } catch (error: any) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * 处理连接管理消息（与原main.js的msg.type == 0逻辑一致）
   */
  private async handleConnectionManagement(message: WebSocketMessage, ws: any): Promise<void> {
    const msgId = Number(message.message?.id);
    
    if (msgId === 0) {
      this.connections.socket_window = ws;
      console.log('Set socket_window connection');
    } else if (msgId === 1) {
      this.connections.socket_start = ws;
      console.log('Set socket_start connection');
    } else if (msgId === 2) {
      this.connections.socket_flowchart = ws;
      console.log('Set socket_flowchart connection');
    } else if (msgId === 3) {
      this.connections.socket_popup = ws;
      console.log('Set socket_popup connection');
    } else {
      // 其他ID用于标识不同的浏览器标签页
      this.connections.allWindowSockets.push(ws);
      this.connections.allWindowSocketNames.push(msgId || 0);
      console.log(`Set socket for id: ${msgId}`);
      
      // 设置关闭事件处理
      ws.on('close', async () => {
        await this.handleWindowSocketClose(msgId || 0, ws);
      });
    }
  }

  /**
   * 处理窗口socket关闭事件
   */
  private async handleWindowSocketClose(id: number, ws: any): Promise<void> {
    const index = this.connections.allWindowSockets.indexOf(ws);
    if (index > -1) {
      this.connections.allWindowSockets.splice(index, 1);
      this.connections.allWindowSocketNames.splice(index, 1);
    }
    console.log(`Socket for id: ${id} closed`);
  }

  /**
   * 处理连接关闭
   */
  private async handleConnectionClose(ws: any): Promise<void> {
    // 检查并清理所有连接
    if (this.connections.socket_window === ws) {
      this.connections.socket_window = null;
    }
    if (this.connections.socket_flowchart === ws) {
      this.connections.socket_flowchart = null;
    }
    if (this.connections.socket_start === ws) {
      this.connections.socket_start = null;
    }
    if (this.connections.socket_popup === ws) {
      this.connections.socket_popup = null;
    }
    
    console.log('WebSocket connection closed');
  }

  /**
   * 处理窗口切换（与原main.js的msg.type == 10逻辑一致）
   */
  private async handleWindowSwitch(message: WebSocketMessage): Promise<void> {
    const msgId = message.message?.id;
    console.log('Handle window switch for id:', msgId);
    
    // 注意：这里需要与Selenium服务交互，但由于WebSocketService不直接依赖SeleniumService
    // 这个方法主要由消息处理器通过事件机制调用Selenium服务的方法
    // 实际的窗口切换逻辑应该由TaskService处理
    
    // 发送窗口切换请求到TaskService
    this.messageHandlers.forEach((handler, key) => {
      if (key === 'windowSwitch') {
        handler(message, null);
      }
    });
  }

  /**
   * 处理任务消息（与原main.js的beginInvoke函数逻辑一致）
   */
  private async handleTaskMessage(message: WebSocketMessage, ws: any): Promise<void> {
    // 调用注册的消息处理器
    this.messageHandlers.forEach((handler, key) => {
      if (key === message.type.toString() || key === '*') {
        handler(message, ws);
      }
    });
  }

  /**
   * 发送消息到指定窗口（与原main.js的send_message_to_browser函数一致）
   */
  sendMessageToWindow(message: WebSocketMessage): void {
    // 发送到主窗口
    if (this.connections.socket_window && this.connections.socket_window.readyState === 1) {
      this.connections.socket_window.send(JSON.stringify(message));
    }
    
    // 广播到所有窗口
    this.connections.allWindowSockets.forEach((ws, index) => {
      if (ws.readyState === 1) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.log(`Cannot send to socket with id: ${this.connections.allWindowSocketNames[index]}`);
        }
      }
    });
  }

  /**
   * 发送消息到流程图窗口
   */
  sendMessageToFlowchart(message: WebSocketMessage): boolean {
    if (this.connections.socket_flowchart && this.connections.socket_flowchart.readyState === 1) {
      this.connections.socket_flowchart.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * 发送消息到开始窗口
   */
  sendMessageToStart(message: WebSocketMessage): boolean {
    if (this.connections.socket_start && this.connections.socket_start.readyState === 1) {
      this.connections.socket_start.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * 发送通知消息（与原main.js逻辑一致）
   */
  sendNotification(title: string, messageText: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const notification = {
      type: 'notification',
      title,
      message: messageText,
      notificationType: type,
      timestamp: new Date().toISOString()
    };
    
    this.sendMessageToWindow(notification);
    this.sendMessageToFlowchart(notification);
  }

  /**
   * 错误事件发送
   */
  private emitError(errorType: string, message: string): void {
    // 这里需要通过事件系统通知主进程
    console.error(`${errorType}: ${message}`);
  }

  /**
   * 注册消息处理器
   */
  onMessage(type: string, handler: (message: WebSocketMessage, ws: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): { connected: boolean; port?: number } {
    return {
      connected: this.server !== null,
      port: (this.server?.address() as any)?.port
    };
  }

  /**
   * 获取活跃连接数
   */
  getActiveConnections(): number {
    if (!this.server) return 0;
    return this.server.clients.size;
  }

  /**
   * 启动服务
   */
  start(port?: number): void {
    if (!this.server) {
      this.createServer(port);
    }
  }

  /**
   * 停止服务
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  /**
   * 关闭所有连接
   */
  closeAllConnections(): void {
    if (this.server) {
      this.server.clients.forEach((client: any) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.close();
        }
      });
    }
  }
}