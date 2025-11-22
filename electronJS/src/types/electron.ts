// ============================================
// Electron相关类型定义
// ============================================

import { BrowserWindow } from 'electron';

export interface WindowState {
  mainWindow: BrowserWindow | null;
  flowchart_window: BrowserWindow | null;
  invoke_window: BrowserWindow | null;
}

export interface WebSocketConnection {
  socket_window: WebSocket | null;
  socket_start: WebSocket | null;
  socket_flowchart: WebSocket | null;
  socket_popup: WebSocket | null;
}

export interface DriverState {
  driver: any | null;
  current_handle: string | null;
  old_handles: string[];
  handle_pairs: { [key: number]: string };
}

// IPC通信相关类型
export interface IPCMessage {
  channel: string;
  data: any;
}

// 预加载脚本API
export interface PreloadAPI {
  electron: {
    sendMessage: (channel: string, data: any) => void;
    receiveMessage: (channel: string, func: (data: any) => void) => void;
  };
}

declare global {
  interface Window {
    electronAPI: PreloadAPI;
  }
}