// ============================================
// 应用配置类型定义
// ============================================

export interface AppConfig {
  WEBSOCKET_PORT: number;
  LOG_FILE: string;
  ICON_PATH: string;
  SERVER: {
    HOST: string;
    PORT: number;
    LOCALHOST_ALIASES: string[];
  };
  PLATFORM_PATHS: {
    WIN32_X64: PlatformPathConfig;
    WIN32_IA32: PlatformPathConfig;
    DARWIN: PlatformPathConfig;
    [key: string]: PlatformPathConfig;
  };
  ERROR_MESSAGES: {
    WINDOWS_7_X64: string;
  };
}

export interface PlatformPathConfig {
  DRIVER: string;
  CHROME: string;
  EXECUTE: string;
}

// 服务器配置
export interface ServerConfig {
  webserver_address: string;
  webserver_port: number;
  user_data_folder: string;
  copyright: string;
  lang: string;
  debug: boolean;
  mysql_config_path?: string;
  absolute_user_data_folder?: string;
}

// 爬虫任务相关类型
export interface TaskMessage {
  type: number;
  message: TaskActionMessage;
  from?: number;
  id?: number;
  iframe?: boolean;
  xpath?: string;
  pathList?: string[];
}

export interface TaskActionMessage {
  id?: number;
  iframe?: boolean;
  xpath?: string;
  pipe?: string;
  node?: string;
  parentNode?: string;
  user_data_folder?: string;
  mysql_config_path?: string;
  type?: number;
  result?: number;
  keyboardStr?: string;
  title?: string;
}

// 爬虫节点参数
export interface CrawlerNodeParameters {
  iframe: boolean;
  xpath: string;
  option: number;
  useLoop: boolean;
  index?: number;
  value?: string;
  optionMode?: number;
  optionValue?: string;
  code?: string;
  codeMode?: number;
  waitTime?: number;
  beforeJS?: string;
  beforeJSWaitTime?: number;
  afterJS?: string;
  afterJSWaitTime?: number;
  clickWay?: number;
  newTab?: number;
  alertHandleType?: number;
  loopType?: number;
  pathList?: string;
  textList?: string;
  params?: DataExtractionParam[];
  links?: string;
  class?: number;
  title?: string;
}

export interface DataExtractionParam {
  iframe: boolean;
  relativeXPath: string;
  relative: boolean;
  contentType: number;
  nodeType: number;
  JS: string;
  beforeJS: string;
  beforeJSWaitTime: number;
  afterJS: string;
  afterJSWaitTime: number;
}

// WebSocket消息类型
export interface WebSocketMessage {
  type: string;
  message: any;
  level?: 'info' | 'warning' | 'error' | 'success';
}

// WebSocket连接管理
export interface SocketConnections {
  socket_window: WebSocket | null;
  socket_start: WebSocket | null;
  socket_flowchart: WebSocket | null;
  socket_popup: WebSocket | null;
  allWindowSockets: WebSocket[];
  allWindowSocketNames: number[];
}

// Express服务状态
export interface ExpressServiceStatus {
  isRunning: boolean;
  port: number;
  host: string;
  uptime: number;
}

// 文件上传结果
export interface FileUploadResult {
  success: boolean;
  filename: string;
  size: number;
  message?: string;
  error?: string;
}