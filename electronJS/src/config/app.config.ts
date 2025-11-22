// ============================================
// 应用配置（与原main.js逻辑一致）
// ============================================

import { AppConfig } from '../types/app';

export const APP_CONFIG: AppConfig = {
  // WebSocket 端口
  WEBSOCKET_PORT: 8084,
  // 日志文件路径
  LOG_FILE: "info.log",
  // 图标路径
  ICON_PATH: "favicon.ico",
  // 服务器配置
  SERVER: {
    HOST: "127.0.0.1",
    PORT: 8074,
    LOCALHOST_ALIASES: ["localhost", "127.0.0.1"]
  },
  // 平台相关路径配置
  PLATFORM_PATHS: {
    WIN32_X64: {
      DRIVER: "chrome_win64/chromedriver_win64.exe",
      CHROME: "chrome_win64/chrome.exe",
      EXECUTE: "chrome_win64/execute_win64.bat"
    },
    WIN32_IA32: {
      DRIVER: "chrome_win32/chromedriver_win32.exe",
      CHROME: "chrome_win32/chrome.exe",
      EXECUTE: "chrome_win32/execute_win32.bat"
    },
    DARWIN: {
      DRIVER: "chromedriver_mac64",
      CHROME: "chrome_mac64.app/Contents/MacOS/Google Chrome",
      EXECUTE: ""
    },
    LINUX: {
      DRIVER: "chrome_linux64/chromedriver_linux64",
      CHROME: "chrome_linux64/chrome",
      EXECUTE: "chrome_linux64/execute_linux64.sh"
    }
  },
  // 错误消息
  ERROR_MESSAGES: {
    WINDOWS_7_X64: "Windows 7系统请下载使用x32版本的软件，不论Win 7系统为x64还是x32版本。\nFor Windows 7, please download and use the x32 version of the software, regardless of whether the Win 7 system is x64 or x32 version."
  }
};