// Electron API 类型定义
declare interface ElectronAPI {
  // 文件操作
  openFile: () => Promise<string>
  saveFile: (data: string) => Promise<void>
  
  // 应用控制
  minimize: () => void
  maximize: () => void
  close: () => void
  
  // 菜单事件
  onNewTask: (callback: () => void) => void
  
  // 平台信息
  platform: string
  
  // 版本信息
  versions: {
    node: string
    chrome: string
    electron: string
  }
}

// 扩展 Window 接口
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}