// ============================================
// 任务管理服务类（与原main.js逻辑一致）
// ============================================

import { TaskMessage } from '../types/app';
import { SeleniumService } from './selenium.service';
import { WebSocketService } from './websocket.service';
// import { DatabaseService } from './database.service';
import { ElementFinderOptions } from '../types/selenium';
import { APP_CONFIG } from '../config/app.config';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

export class TaskService {
  private seleniumService: SeleniumService;
  private websocketService: WebSocketService;
  // private databaseService: DatabaseService;
  // private _currentTask: TaskMessage | null = null; // 预留属性
  private _taskQueue: TaskMessage[] = [];
  private _isExecuting: boolean = false;
  private handlePairs: { [key: number]: string } = {};
  private currentHandle: string | null = null;
  private oldHandles: string[] = [];
  private allWindowSockets: any[] = [];
  private allWindowSocketNames: number[] = [];

  constructor(seleniumService: SeleniumService, websocketService: WebSocketService /*, databaseService: DatabaseService */) {
    this.seleniumService = seleniumService;
    this.websocketService = websocketService;
    // this.databaseService = databaseService;
    
    // 注册消息处理器
    this.setupMessageHandlers();
  }

  /**
   * 对外暴露的执行任务方法，便于通过 API 触发
   */
  public async executeTask(id: number, userDataFolder?: string): Promise<void> {
    const taskMessage: TaskMessage = {
      type: 5,
      message: {
        id,
        user_data_folder: userDataFolder
      }
    } as any;
    await this.executeMainTask(taskMessage);
  }

  /**
   * 设置消息处理器
   */
  private setupMessageHandlers(): void {
    // 注册消息处理器，不在这里注册具体类型，由handleTaskMessage函数统一处理
    this.websocketService.onMessage('task', (message, ws) => {
      this.handleTaskMessage(message, ws);
    });
    
    // 注册工具箱消息
    this.websocketService.onMessage('30', (message) => this.handleToolboxMessage(message, true));
    this.websocketService.onMessage('31', (message) => this.handleToolboxMessage(message, false));
  }

  /**
   * 处理任务消息
   */
  private async handleTaskMessage(message: any, ws: any): Promise<void> {
    try {
      const task = message as TaskMessage;
      
      switch (task.type) {
        case 1: // 开始调用
          await this.beginInvoke(task, ws);
          break;
        case 2: // 键盘输入
          await this.handleKeyboardInput(task);
          break;
        case 3: // 消息传递
          await this.handleMessageTransfer(task);
          break;
        case 4: // 标记元素和试运行
          await this.handleTrialRun(task);
          break;
        case 5: // 任务执行
          await this.executeMainTask(task);
          break;
        case 6: // 打开开发者工具
          await this.handleOpenDevTools(task);
          break;
        case 7: // 获取Cookies
          await this.handleGetCookies(task);
          break;
        case 30: // 显示工具箱（与 main.js 的 msg.type == 30 一致）
          this.handleToolboxMessage(task.message, true);
          break;
        case 31: // 隐藏工具箱（与 main.js 的 msg.type == 31 一致）
          this.handleToolboxMessage(task.message, false);
          break;
        default:
          console.warn(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      console.error('Error handling task message:', error);
      this.websocketService.sendNotification(
        '任务执行出错',
        'Task execution error',
        'error'
      );
    }
  }

  /**
   * 开始调用任务
   */
  private async beginInvoke(task: TaskMessage, ws: any): Promise<void> {
    console.log('Begin invoke task:', task);
    
    if (task.message?.id && task.message.id !== -1) {
      // 创建流程图窗口的逻辑
      let url = '';
      // 从配置或环境变量获取语言设置，默认为'en'
      const language = process.env.LANGUAGE === 'zh' ? 'zh' : 'en';
      
      if (language === 'zh') {
        url = `/taskGrid/FlowChart_CN.html?id=${task.message.id}&wsport=${this.websocketService.getConnectionStatus().port}&backEndAddressServiceWrapper=`;
      } else {
        url = `/taskGrid/FlowChart.html?id=${task.message.id}&wsport=${this.websocketService.getConnectionStatus().port}&backEndAddressServiceWrapper=`;
      }
      
      console.log('Flowchart URL:', url);
      
      // 窗口句柄管理
      let contentHandle = this.currentHandle;
      
      if (contentHandle && this.oldHandles.length > 0) {
        contentHandle = this.currentHandle;
      } else if (this.handlePairs[task.message.id]) {
        contentHandle = this.handlePairs[task.message.id];
      }
      
      // 这里需要调用窗口管理服务加载流程图窗口
      this.websocketService.sendNotification(
        '开始调用任务',
        'Starting task invocation',
        'info'
      );
      
      // 窗口切换逻辑
      // mainWindow.hide();
      // flowchartWindow.show();
      
      // 添加到窗口管理列表
      this.allWindowSockets.push(ws);
      this.allWindowSocketNames.push(task.message.id || 0);
      
      // 设置handle_pairs映射
      this.handlePairs[task.message.id || 0] = this.currentHandle || '';
      
      console.log('Set handle_pair for id:', task.message.id, 'to:', this.currentHandle);
    }
  }

  /**
   * 处理键盘输入（与原main.js的msg.type == 2逻辑一致）
   */
  private async handleKeyboardInput(task: TaskMessage): Promise<void> {
    console.log('Handle keyboard input task:', task);
    
    const keyInfo = task.message?.keyboardStr || '';
    let enter = false;
    let processedKeyInfo = keyInfo;
    
    // 处理<enter>标签
    if (/<enter>/i.test(keyInfo)) {
      processedKeyInfo = keyInfo.replace(/<enter>/gi, '');
      enter = true;
    }
    
    // 查找元素
    const elementOptions: ElementFinderOptions = {
      xpath: task.message?.xpath || '',
      iframe: task.message?.iframe || false
    };
    
    const result = await this.seleniumService.findElementAcrossAllWindows(elementOptions);
    
    if (result.success && result.data) {
        // 发送键盘输入
        await this.seleniumService.sendKeys(result.data, processedKeyInfo, enter);
      
      this.websocketService.sendNotification(
        '键盘输入完成',
        'Keyboard input completed',
        'success'
      );
    } else {
      this.websocketService.sendNotification(
        `无法找到元素：${elementOptions.xpath}`,
        `Cannot find element: ${elementOptions.xpath}`,
        'warning'
      );
    }
  }

  /**
   * 处理消息传递（与原main.js的msg.type == 3逻辑一致）
   */
  private async handleMessageTransfer(task: TaskMessage): Promise<void> {
    console.log('Handle message transfer task:', task);
    
    try {
      if (task.from === 0) {
        // 从浏览器发送到流程图
        const message = JSON.parse(task.message?.pipe || '{}');
        console.log('FROM Browser:', message);
        
        const messageType = message.type;
        if (messageType.includes('Click') || messageType.includes('Move')) {
          // 需要执行元素操作
          const elementInfo = {
            xpath: message.xpath,
            iframe: message.iframe || false,
            id: -1
          };
          
          const result = await this.seleniumService.findElementAcrossAllWindows(elementInfo);
          if (result.success && result.data) {
            if (messageType.includes('Click')) {
              await this.seleniumService.clickElement(result.data, messageType);
            } else if (messageType.includes('Move')) {
              await this.seleniumService.moveMouse(result.data);
            }
          }
        }
        
        // 转发消息到流程图窗口
        this.websocketService.sendMessageToFlowchart({
          type: 'forward',
          message: task.message?.pipe || ''
        });
      } else {
        // 从流程图发送到浏览器
        this.websocketService.sendMessageToWindow({
          type: 'forward',
          message: task.message?.pipe || ''
        });
        console.log('FROM Flowchart:', JSON.parse(task.message?.pipe || '{}'));
      }
    } catch (error) {
      console.error('Error in message transfer:', error);
    }
  }

  /**
   * 处理试运行（与原main.js的msg.type == 4逻辑一致）
   */
  private async handleTrialRun(task: TaskMessage): Promise<void> {
    console.log('Handle trial run task:', task);
    
    try {
      const node = JSON.parse(task.message?.node || '{}');
      const type = task.message?.type;
      
      if (type === 0) {
        // 标记元素
        await this.handleElementMarking(node, task.message?.parentNode);
      } else {
        // 试运行操作
        await this.executeTrialOperation(node, task.message?.parentNode);
      }
      
      // 发送试运行结果到浏览器
      this.websocketService.sendMessageToWindow({
        type: 'trial',
        message: task
      });
    } catch (error) {
      console.error('Error in trial run:', error);
      this.websocketService.sendNotification(
        '试运行出错',
        'Trial run error',
        'error'
      );
    }
  }

  /**
   * 处理元素标记
   */
  private async handleElementMarking(node: any, parentNodeStr?: string): Promise<void> {
    const parameters = node.parameters;
    const option = node.option;
    
    let xpath = '';
    let iframe = false;
    
    if (option === 2 || option === 4 || option === 6 || option === 7) {
      xpath = parameters.xpath;
      iframe = parameters.iframe || false;
      
      if (parameters.useLoop && option !== 4 && option !== 6) {
        const parentNode = JSON.parse(parentNodeStr || '{}');
        let parentXPath = parentNode.parameters.xpath;
        if (parentNode.parameters.loopType === 2) {
          parentXPath = parentNode.parameters.pathList.split('\n')[0].trim();
        }
        xpath = parentXPath + xpath;
      }
      
      if (xpath.includes('point(')) {
        xpath = '//body';
      }
      
      const elementInfo = { iframe, xpath, id: -1 };
      await this.seleniumService.findElementAcrossAllWindows(elementInfo);
    }
  }

  /**
   * 执行试运行操作
   */
  private async executeTrialOperation(node: any, parentNodeStr?: string): Promise<void> {
    const parameters = node.parameters;
    const option = node.option;
    
    this.websocketService.sendNotification(
      `正在试运行操作：${node.title}`,
      `Trying to run the operation: ${node.title}`,
      'info'
    );
    
    switch (option) {
      case 1: // 打开链接
        await this.trialOpenLink(parameters, parentNodeStr);
        break;
      case 2: // 点击事件
        await this.trialClickElement(parameters, parentNodeStr);
        break;
      case 3: // 提取数据
        await this.trialExtractData(parameters, parentNodeStr);
        break;
      case 4: // 键盘输入
        await this.trialKeyboardInput(parameters, parentNodeStr);
        break;
      case 5: // 自定义JavaScript
        await this.trialCustomJavaScript(parameters, parentNodeStr);
        break;
      case 6: // 下拉选择
        await this.trialDropdownSelect(parameters, parentNodeStr);
        break;
      case 7: // 鼠标移动
        await this.trialMouseMove(parameters, parentNodeStr);
        break;
      case 11: // 单个数据提取
        await this.trialSingleDataExtraction(parameters, parentNodeStr);
        break;
    }
  }

  /**
   * 执行主任务（与原main.js的msg.type == 5逻辑一致）
   */
  private async executeMainTask(task: TaskMessage): Promise<void> {
    console.log('Execute main task:', task);
    try {
      if (!task.message || task.message.id === undefined || task.message.id === -1) {
        this.websocketService.sendNotification(
          '任务ID无效，无法执行',
          'Invalid task ID, cannot execute',
          'warning'
        );
        return;
      }

      // 构造执行参数（与 main.js 保持一致的风格）
      const serverAddress = 'http://localhost:8074';
      let parameters: string[] = [];

      if (!task.message.user_data_folder) {
        parameters = [
          '--ids',
          `[${task.message.id}]`,
          '--server_address',
          serverAddress,
          '--user_data',
          '0'
        ];
      } else {
        const userDataFolderPath = path.join(process.cwd(), task.message.user_data_folder);
        parameters = [
          '--ids',
          `[${task.message.id}]`,
          '--server_address',
          serverAddress,
          '--user_data',
          '1'
        ];
        // 尽量模拟 main.js 对配置的更新（不强依赖 server.js）
        try {
          const cfgPath = path.join(process.cwd(), 'config.json');
          const content = fs.existsSync(cfgPath) ? fs.readFileSync(cfgPath, 'utf-8') : '{}';
          const cfg = JSON.parse(content);
          cfg.user_data_folder = task.message.user_data_folder;
          cfg.absolute_user_data_folder = userDataFolderPath;
          fs.writeFileSync(cfgPath, JSON.stringify(cfg));
        } catch (e) {
          console.log('Skip writing config.json:', e);
        }
      }

      // 选择执行脚本路径（参考 SeleniumService 的平台选择逻辑）
      let executePath = '';
      if (process.platform === 'win32' && process.arch === 'ia32') {
        executePath = path.join(__dirname, APP_CONFIG.PLATFORM_PATHS.WIN32_IA32.EXECUTE);
      } else if (process.platform === 'win32' && process.arch === 'x64') {
        executePath = path.join(__dirname, APP_CONFIG.PLATFORM_PATHS.WIN32_X64.EXECUTE);
      } else if (process.platform === 'darwin') {
        executePath = path.join(__dirname, APP_CONFIG.PLATFORM_PATHS.DARWIN.EXECUTE);
      } else {
        // linux 等其它平台
        executePath = path.join(__dirname, APP_CONFIG.PLATFORM_PATHS.LINUX?.EXECUTE || '');
      }

      // Windows/Linux 下尝试启动外部执行脚本（与 main.js 一致的意图）
      if (process.platform !== 'darwin' && fs.existsSync(executePath)) {
        const child = spawn(executePath, parameters, { stdio: 'pipe' });
        child.stdout.on('data', (data) => console.log(data.toString()));
        child.stderr.on('data', (data) => console.error(data.toString()));
        child.on('error', (err) => console.error('Execute process error:', err));
      } else {
        console.log('Execute script not found or platform is darwin. Skip spawn.');
      }

      // 向前端发送配置提示（主进程中为 ws.send）
      this.websocketService.sendMessageToWindow({
        type: 'configInfo',
        message: {
          config_folder: process.cwd() + '/',
          reliablespider_location: process.cwd()
        }
      });

      this.websocketService.sendNotification(
        '已触发任务执行',
        'Task execution triggered',
        'info'
      );
    } catch (error) {
      console.error('Failed to execute main task:', error);
      this.websocketService.sendNotification(
        '任务执行失败',
        'Task execution failed',
        'error'
      );
    }
  }

  /**
   * 处理打开开发者工具消息（type=6，原main.js逻辑）
   */
  private async handleOpenDevTools(task: TaskMessage): Promise<void> {
    console.log('Open dev tools message:', task);
    // 在新架构中直接控制 BrowserWindow 不可行，改为通过消息通知
    try {
      // 通知流程图与主窗口尝试打开开发者工具
      this.websocketService.sendMessageToFlowchart({ type: 'OpenDevTools', message: 'flowchart' });
      this.websocketService.sendMessageToWindow({ type: 'OpenDevTools', message: 'invoke' });
      this.websocketService.sendNotification('打开开发者工具', 'Open DevTools requested', 'info');
    } catch (error) {
      console.error('Failed to open dev tools:', error);
      this.websocketService.sendNotification('打开开发者工具失败', 'Open DevTools failed', 'error');
    }
  }

  /**
   * 处理获取Cookies消息（type=7，原main.js逻辑）
   */
  private async handleGetCookies(task: TaskMessage): Promise<void> {
    console.log('Get cookies message:', task);
    try {
      // 直接访问 Selenium driver（以 any 绕过私有属性限制）
      const driver = (this.seleniumService as any).driver;
      if (!driver) {
        this.websocketService.sendNotification('无法获取Cookies：驱动未启动', 'Cannot get Cookies: driver not started', 'warning');
        return;
      }

      const cookies = await driver.manage().getCookies();
      const cookiesText = (cookies || [])
        .map((cookie: any) => `${cookie.name}=${cookie.value}`)
        .join('\n');

      this.websocketService.sendMessageToFlowchart({ type: 'GetCookies', message: cookiesText });
      this.websocketService.sendNotification('已获取当前页面Cookies', 'Cookies fetched', 'success');
    } catch (error) {
      console.error('Failed to get cookies:', error);
      this.websocketService.sendNotification('无法获取Cookies', 'Cannot get Cookies', 'error');
    }
  }

  /**
   * 试运行打开链接
   */
  private async trialOpenLink(parameters: any, parentNodeStr?: string): Promise<void> {
    let url = parameters.links.split('\
')[0].trim();
    
    if (parameters.useLoop) {
      const parentNode = JSON.parse(parentNodeStr || '{}');
        url = parentNode.parameters.textList.split('\
')[0];
    }
    
    try {
      await this.seleniumService.navigateTo(url);
    } catch (error) {
      console.error('Failed to navigate to URL:', url, error);
    }
  }

  /**
   * 试运行点击元素
   */
  private async trialClickElement(parameters: any, parentNodeStr?: string): Promise<void> {
    let xpath = parameters.xpath;
    const iframe = parameters.iframe || false;
    
    if (xpath.includes('point(')) {
      xpath = '//body';
    }
    
    let elementInfo = { iframe, xpath, id: -1 };
    
    if (parameters.useLoop && !parameters.xpath.includes('point(')) {
      const parentNode = JSON.parse(parentNodeStr || '{}');
      let parentXPath = parentNode.parameters.xpath;
      if (parentNode.parameters.loopType === 2) {
        parentXPath = parentNode.parameters.pathList.split('\
')[0].trim();
      }
      elementInfo.xpath = parentXPath + elementInfo.xpath;
    }
    
    const result = await this.seleniumService.findElementAcrossAllWindows(elementInfo);
    if (result.success && result.data) {
      // 执行前置JavaScript
      if (parameters.beforeJS) {
        await this.seleniumService.executeJavaScript(parameters.beforeJS, result.data, parameters.beforeJSWaitTime);
      }
      
      // 执行点击
      if (parameters.xpath.includes('point(')) {
        await this.seleniumService.clickElement(result.data, parameters.xpath);
      } else {
        if (parameters.clickWay === 2) { // 双击
          await this.seleniumService.clickElement(result.data, 'double');
        } else if (parameters.newTab === 1) { // 新标签页
          await this.seleniumService.clickElement(result.data, 'loopClickEvery');
        } else {
          await this.seleniumService.clickElement(result.data);
        }
      }
      
      // 执行后置JavaScript
      if (parameters.afterJS) {
        await this.seleniumService.executeJavaScript(parameters.afterJS, result.data, parameters.afterJSWaitTime);
      }
      
      // 取消选择
      this.websocketService.sendMessageToWindow({
        type: 'cancelSelection',
        message: {}
      });
    }
  }

  /**
   * 试运行提取数据
   */
  private async trialExtractData(parameters: any, parentNodeStr?: string): Promise<void> {
    this.websocketService.sendNotification(
      '提示：提取数据操作只能试运行设置的JavaScript语句，且只针对第一个匹配的元素。',
      'Hint: can only test JavaScript statement set in the data extraction operation, and only for the first matching element.',
      'info'
    );
    
    const params = parameters.params;
    const notFoundXPaths = [];
    
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      let xpath = param.relativeXPath;
      
      if (param.relative) {
        const parentNode = JSON.parse(parentNodeStr || '{}');
        let parentXPath = parentNode.parameters.xpath;
        if (parentNode.parameters.loopType === 2) {
          parentXPath = parentNode.parameters.pathList.split('\
')[0].trim();
        }
        xpath = parentXPath + xpath;
      }
      
      const elementInfo = { iframe: param.iframe, xpath, id: -1 };
      const result = await this.seleniumService.findElementAcrossAllWindows(elementInfo);
      
      if (result.success && result.data) {
        if (param.beforeJS) {
          await this.seleniumService.executeJavaScript(param.beforeJS, result.data, param.beforeJSWaitTime);
        }
        if (param.afterJS) {
          await this.seleniumService.executeJavaScript(param.afterJS, result.data, param.afterJSWaitTime);
        }
      } else {
        notFoundXPaths.push(xpath);
      }
    }
    
    if (notFoundXPaths.length > 0) {
      this.websocketService.sendNotification(
        `无法找到以下元素，请检查XPath是否正确：${notFoundXPaths.join('\\n')}`,
        `Cannot find the element, please check if the XPath is correct: ${notFoundXPaths.join('\\n')}`,
        'warning'
      );
    }
  }

  /**
   * 试运行键盘输入
   */
  private async trialKeyboardInput(parameters: any, parentNodeStr?: string): Promise<void> {
    const elementInfo = {
      iframe: parameters.iframe || false,
      xpath: parameters.xpath,
      id: -1
    };
    
    let keyInfo = parameters.value;
    if (parameters.useLoop) {
      const parentNode = JSON.parse(parentNodeStr || '{}');
        keyInfo = parentNode.parameters.textList.split('\\n')[0];
      const index = parameters.index;
      if (index > 0) {
        keyInfo = keyInfo.split('~')[index - 1];
      }
    }
    
    let enter = false;
    if (/<enter>/i.test(keyInfo)) {
      keyInfo = keyInfo.replace(/<enter>/gi, '');
      enter = true;
    }
    
    // 处理JavaScript表达式
    if (/JS\(/i.test(keyInfo)) {
      const pattern = /JS\("(.+?)"\)/gi;
      const matches = [...keyInfo.matchAll(pattern)];
      
      for (const match of matches) {
        const jsResult = await this.seleniumService.executeJavaScript(match[1], null, 0);
        keyInfo = keyInfo.replace(match[0], jsResult.toString());
      }
    }
    
    const result = await this.seleniumService.findElementAcrossAllWindows(elementInfo);
    if (result.success && result.data) {
      await this.seleniumService.sendKeys(result.data, keyInfo, enter);
    }
  }

  /**
   * 试运行自定义JavaScript
   */
  private async trialCustomJavaScript(parameters: any, parentNodeStr?: string): Promise<void> {
    const code = parameters.code;
    const codeMode = parameters.codeMode;
    const waitTime = parameters.waitTime;
    
    if (codeMode === 0) {
      const result = await this.seleniumService.executeJavaScript(code, null, waitTime);
      const level = result === -1 ? 'info' : 'success';
      
      if (result != null) {
        this.websocketService.sendNotification(
          `JavaScript操作返回结果：${result}`,
          `JavaScript operation returns result: ${result}`,
          level
        );
      }
    } else if (codeMode === 2) { // 循环内的JS代码
      const parentNode = JSON.parse(parentNodeStr || '{}');
      let parentXPath = parentNode.parameters.xpath;
      if (parentNode.parameters.loopType === 2) {
        parentXPath = parentNode.parameters.pathList.split('\
')[0].trim();
      }
      
      const elementInfo = { iframe: parameters.iframe, xpath: parentXPath, id: -1 };
      const result = await this.seleniumService.findElementAcrossAllWindows(elementInfo);
      
      if (result.success && result.data) {
        const jsResult = await this.seleniumService.executeJavaScript(code, result.data, waitTime);
        const level = jsResult === -1 ? 'info' : 'success';
        
        if (jsResult != null) {
          this.websocketService.sendNotification(
            `JavaScript操作返回结果：${jsResult}`,
            `JavaScript operation returns result: ${jsResult}`,
            level
          );
        }
      }
    } else if (codeMode === 8) { // 刷新页面
      try {
        await this.seleniumService.refreshPage();
      } catch (error) {
        console.error('Failed to refresh page:', error);
      }
    }
  }

  /**
   * 试运行下拉选择
   */
  private async trialDropdownSelect(parameters: any, parentNodeStr?: string): Promise<void> {
    // prevent TypeScript noUnusedParameters error
    void parentNodeStr;
    const optionMode = parseInt(parameters.optionMode);
    let optionValue = parameters.optionValue;
    
    const elementInfo = {
      iframe: parameters.iframe || false,
      xpath: parameters.xpath,
      id: -1
    };
    
    const result = await this.seleniumService.findElementAcrossAllWindows(elementInfo);
    if (result.success && result.data) {
      await this.seleniumService.selectDropdownOption(result.data, optionMode, optionValue);
    }
  }

  /**
   * 试运行鼠标移动
   */
  private async trialMouseMove(parameters: any, parentNodeStr?: string): Promise<void> {
    let xpath = parameters.xpath;
    const iframe = parameters.iframe || false;
    
    if (xpath.includes('point(')) {
      xpath = '//body';
    }
    
    let elementInfo = { iframe, xpath, id: -1 };
    
    if (parameters.useLoop && !parameters.xpath.includes('point(')) {
      const parentNode = JSON.parse(parentNodeStr || '{}');
      let parentXPath = parentNode.parameters.xpath;
      if (parentNode.parameters.loopType === 2) {
        parentXPath = parentNode.parameters.pathList.split('\
')[0].trim();
      }
      elementInfo.xpath = parentXPath + elementInfo.xpath;
    }
    
    const result = await this.seleniumService.findElementAcrossAllWindows(elementInfo);
    if (result.success && result.data) {
      await this.seleniumService.moveMouse(result.data);
    }
  }

  /**
   * 试运行单个数据提取
   */
  private async trialSingleDataExtraction(parameters: any, parentNodeStr?: string): Promise<void> {
    const params = parameters.params;
    const i = parameters.index;
    const param = params[i];
    
    let xpath = param.relativeXPath;
    if (param.relative) {
      const parentNode = JSON.parse(parentNodeStr || '{}');
      let parentXPath = parentNode.parameters.xpath;
      if (parentNode.parameters.loopType === 2) {
        parentXPath = parentNode.parameters.pathList.split('\
')[0].trim();
      }
      xpath = parentXPath + xpath;
    }
    
    const elementInfo = { iframe: param.iframe, xpath, id: -1 };
    const result = await this.seleniumService.findElementAcrossAllWindows(elementInfo);
    
    if (result.success && result.data) {
      if (param.beforeJS) {
        await this.seleniumService.executeJavaScript(param.beforeJS, result.data, param.beforeJSWaitTime);
      }
      
      let extractedValue = '';
      let description = '';
      
      switch (param.contentType) {
        case 0: // 文本内容
          extractedValue = await this.seleniumService.getElementText(result.data);
          description = param.nodeType === 2 ? '获取的链接地址：' :
                       param.nodeType === 3 ? '获取的表单值：' :
                       param.nodeType === 4 ? '获取的图片地址：' :
                       '获取的文本内容：';
          break;
        case 1: // 不包含子元素的文本
          extractedValue = await this.seleniumService.getDirectText(result.data);
          description = '获取的内容：';
          break;
        case 2: // innerHTML
          extractedValue = await this.seleniumService.getElementAttribute(result.data, 'innerHTML');
          description = '获取的innerHTML：';
          break;
        case 3: // outerHTML
          extractedValue = await this.seleniumService.getElementAttribute(result.data, 'outerHTML');
          description = '获取的outerHTML：';
          break;
        case 4: // 背景图片
          extractedValue = await this.seleniumService.getElementCssValue(result.data, 'background-image');
          description = '获取的背景图片地址：';
          break;
        case 5: // 页面网址
          extractedValue = await this.seleniumService.getCurrentUrl();
          description = '获取的页面网址：';
          break;
        case 6: // 页面标题
          extractedValue = await this.seleniumService.getPageTitle();
          description = '获取的页面标题：';
          break;
        case 9: // JavaScript返回值
          extractedValue = await this.seleniumService.executeJavaScript(param.JS, result.data);
          description = 'JavaScript操作返回结果：';
          break;
        case 10: // 选择框值
          extractedValue = await this.seleniumService.getElementAttribute(result.data, 'value');
          description = '获取的选项值：';
          break;
        case 11: // 选择框文本
          extractedValue = await this.seleniumService.getSelectedOptionText(result.data);
          description = '获取的选项文本：';
          break;
        case 14: // 元素属性
          extractedValue = await this.seleniumService.getElementAttribute(result.data, param.JS);
          description = '获取的属性值：';
          break;
        case 15: // 常量值
          extractedValue = param.JS;
          description = '获取的常量值：';
          break;
        default:
          this.websocketService.sendNotification(
            '暂不支持测试此类型的数据提取，请在任务正式运行阶段测试是否有效。',
            'This type of data extraction is not supported for testing. Please test whether it is valid in the formal call stage.',
            'warning'
          );
          return;
      }
      
      if (param.afterJS) {
        await this.seleniumService.executeJavaScript(param.afterJS, result.data, param.afterJSWaitTime);
      }
      
      const englishDescription = description.replace('获取的', 'Obtained ').replace('：', ': ');
      this.websocketService.sendNotification(
        description + extractedValue,
        englishDescription + extractedValue,
        'success'
      );
    }
  }

  /**
   * 处理工具箱消息（与原main.js逻辑一致）
   */
  private handleToolboxMessage(message: any, show: boolean): void {
    console.log('Toolbox message:', message, 'show:', show);
    
    const messageType = show ? 'showAllToolboxes' : 'hideAllToolboxes';
    this.websocketService.sendMessageToWindow({
      type: messageType,
      message: {}
    });
    
    console.log(show ? 'Show all toolboxes' : 'Hide all toolboxes');
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    // 清理WebSocket连接
    this.allWindowSockets = [];
    this.allWindowSocketNames = [];
    
    // 清理任务队列
    this._taskQueue = [];
    // this._currentTask = null; // 预留属性
    this._isExecuting = false;
    
    console.log('Task service cleaned up');
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(): { queueSize: number; isExecuting: boolean } {
    return {
      queueSize: this._taskQueue.length,
      isExecuting: this._isExecuting
    };
  }
}