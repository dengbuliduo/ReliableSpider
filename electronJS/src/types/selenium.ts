// ============================================
// Selenium WebDriver相关类型定义
// ============================================

export interface DriverOptions {
  driverPath: string;
  chromeBinaryPath: string;
  executePath: string;
}

export interface ElementFinderOptions {
  xpath: string;
  iframe?: boolean;
  notifyBrowser?: boolean;
  scrollIntoView?: boolean;
}

export interface ClickOptions {
  element: any;
  clickType?: 'single' | 'double' | 'loopClickEvery';
}

export interface JavaScriptExecutionOptions {
  code: string;
  element?: any;
  waitTime?: number;
}

export interface OperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface BrowserWindowState {
  windowHandles: string[];
  currentHandle: string | null;
  activeWindow: string | null;
}

export interface NavigationOptions {
  url: string;
  waitForLoad?: boolean;
  timeout?: number;
}

export interface ElementInteractionOptions {
  element: any;
  action: 'click' | 'doubleClick' | 'rightClick' | 'hover' | 'sendKeys';
  keys?: string;
  waitTime?: number;
}

export interface ScreenshotOptions {
  filename?: string;
  fullPage?: boolean;
  quality?: number;
}

export interface WaitOptions {
  condition: 'elementVisible' | 'elementClickable' | 'pageLoad';
  selector?: string;
  timeout?: number;
  pollInterval?: number;
}

// 鼠标操作类型
export interface MouseActionOptions {
  element: any;
  action: 'click' | 'doubleClick' | 'rightClick' | 'mouseDown' | 'mouseUp' | 'mouseMove';
  x?: number;
  y?: number;
}

// 键盘操作类型
export interface KeyboardActionOptions {
  keys: string;
  element?: any;
  clearFirst?: boolean;
}

// 浏览器窗口管理
export interface WindowManagementOptions {
  action: 'maximize' | 'minimize' | 'restore' | 'close' | 'setSize' | 'setPosition';
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

// Cookie管理
export interface CookieOptions {
  name: string;
  value?: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  expiry?: Date;
}

export interface ExpressServiceStatus {
  isRunning: boolean;
  port: number;
  host: string;
  uptime: number;
}

export interface FileUploadResult {
  success: boolean;
  filename: string;
  size: number;
  message: string;
}