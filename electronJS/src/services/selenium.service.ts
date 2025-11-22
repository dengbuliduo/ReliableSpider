// ============================================
// Selenium WebDriver服务类
// ============================================

import { Builder, By } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import { ServiceBuilder } from 'selenium-webdriver/chrome';
import { join } from 'path';
import { APP_CONFIG } from '../config/app.config';
import { 
  DriverOptions, 
  ElementFinderOptions, 
  ClickOptions, 
  JavaScriptExecutionOptions, 
  OperationResult,
  BrowserWindowState 
} from '../types/selenium';

export class SeleniumService {
  private driver: any = null;
  private currentHandle: string | null = null;
  private oldHandles: string[] = [];
  private handlePairs: { [key: number]: string } = {};
  private driverOptions: DriverOptions | null = null;

  constructor() {
    this.initializeDriverOptions();
  }

  /**
   * 初始化驱动路径配置
   */
  private initializeDriverOptions(): void {
    const platform = process.platform;
    const arch = process.arch;
    let driverPath = '';
    let chromeBinaryPath = '';
    let executePath = '';

    if (platform === 'win32' && arch === 'ia32') {
      driverPath = join(__dirname, APP_CONFIG.PLATFORM_PATHS.WIN32_IA32.DRIVER);
      chromeBinaryPath = join(__dirname, APP_CONFIG.PLATFORM_PATHS.WIN32_IA32.CHROME);
      executePath = join(__dirname, APP_CONFIG.PLATFORM_PATHS.WIN32_IA32.EXECUTE);
    } else if (platform === 'win32' && arch === 'x64') {
      driverPath = join(__dirname, APP_CONFIG.PLATFORM_PATHS.WIN32_X64.DRIVER);
      chromeBinaryPath = join(__dirname, APP_CONFIG.PLATFORM_PATHS.WIN32_X64.CHROME);
      executePath = join(__dirname, APP_CONFIG.PLATFORM_PATHS.WIN32_X64.EXECUTE);
    } else if (platform === 'darwin') {
      driverPath = join(__dirname, APP_CONFIG.PLATFORM_PATHS.DARWIN.DRIVER);
      chromeBinaryPath = join(__dirname, APP_CONFIG.PLATFORM_PATHS.DARWIN.CHROME);
      executePath = join(__dirname, APP_CONFIG.PLATFORM_PATHS.DARWIN.EXECUTE);
    } else if (platform === 'linux') {
      driverPath = join(__dirname, 'chrome_linux64/chromedriver_linux64');
      chromeBinaryPath = join(__dirname, 'chrome_linux64/chrome');
      executePath = join(__dirname, 'chrome_linux64/execute_linux64.sh');
    }

    this.driverOptions = {
      driverPath,
      chromeBinaryPath,
      executePath
    };

    console.log('Driver options:', this.driverOptions);
  }

  /**
   * 启动浏览器驱动
   */
  async startDriver(): Promise<OperationResult> {
    try {
      if (!this.driverOptions) {
        return { success: false, error: 'Driver options not initialized' };
      }

      const service = new ServiceBuilder(this.driverOptions.driverPath);
      const options = new chrome.Options();
      
      options.setChromeBinaryPath(this.driverOptions.chromeBinaryPath);
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-blink-features=AutomationControlled');
      options.addArguments('--disable-extensions');
      options.excludeSwitches('enable-automation');

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeService(service)
        .setChromeOptions(options)
        .build();

      // 获取当前窗口句柄
      this.currentHandle = await this.driver.getWindowHandle();
      
      return { success: true, data: this.driver };
    } catch (error) {
      console.error('Failed to start driver:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 关闭浏览器驱动
   */
  async stopDriver(): Promise<OperationResult> {
    try {
      if (this.driver) {
        await this.driver.quit();
        this.driver = null;
        this.currentHandle = null;
        this.oldHandles = [];
        this.handlePairs = {};
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to stop driver:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 递归查找元素（支持iframe）
   */
  async findElementRecursive(
    driver: any, 
    by: any, 
    value: string, 
    frames: any[]
  ): Promise<any> {
    for (const frame of frames) {
      try {
        // 尝试切换到iframe
        try {
          await driver.switchTo().frame(frame);
        } catch (error: any) {
          if (error.name.indexOf('StaleElement') >= 0) {
            // 如果iframe已失效，切换到父frame再重试
            await driver.switchTo().parentFrame();
            await driver.switchTo().frame(frame);
          } else {
            throw error;
          }
        }

        let element;
        try {
          // 在当前iframe中查找元素
          element = await driver.findElement(by(value));
          return element;
        } catch (error: any) {
          if (error.name.indexOf('NoSuchElement') >= 0) {
            // 元素未找到，递归查找嵌套iframe
            const nestedFrames = await driver.findElements(By.tagName('iframe'));
            if (nestedFrames.length > 0) {
              element = await this.findElementRecursive(driver, by, value, nestedFrames);
              if (element) {
                return element;
              }
            }
          } else {
            console.error(`Exception while processing frame: ${error}`);
          }
        }
      } catch (error) {
        console.error(`Exception while processing frame: ${error}`);
      }
    }

    throw new Error(`Element ${value} not found in any frame or iframe`);
  }

  /**
   * 查找元素（支持iframe和跨窗口）
   */
  async findElement(options: ElementFinderOptions): Promise<OperationResult> {
    try {
      if (!this.driver) {
        return { success: false, error: 'Driver not started' };
      }

      // 切换到主文档
      await this.driver.switchTo().defaultContent();

      if (options.iframe) {
        const frames = await this.driver.findElements(By.tagName('iframe'));
        if (frames.length === 0) {
          return { 
            success: false, 
            error: `No iframes found while searching for ${options.xpath}` 
          };
        }
        
        const element = await this.findElementRecursive(
          this.driver, 
          By.xpath, 
          options.xpath, 
          frames
        );
        
        return { success: true, data: element };
      } else {
        // 在主文档中查找元素
        const element = await this.driver.findElement(By.xpath(options.xpath));
        return { success: true, data: element };
      }
    } catch (error) {
      console.error('Failed to find element:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 在所有窗口中查找元素
   */
  async findElementAcrossAllWindows(
    options: ElementFinderOptions,
    notifyBrowser = true,
    scrollIntoView = true
  ): Promise<OperationResult> {
    try {
      if (!this.driver) {
        return { success: false, error: 'Driver not started' };
      }

      const handles = await this.driver.getAllWindowHandles();
      let contentHandle = this.currentHandle;
      const oldHandle = this.currentHandle;

      // 确定搜索顺序
      const order = [
        ...handles.filter((handle: string) => handle !== this.currentHandle && handle !== contentHandle),
        this.currentHandle!,
        contentHandle!
      ];

      let len = order.length;
      let element = null;

      while (len > 0) {
        try {
          const handle = order[len - 1];
          if (handle && handles.includes(handle)) {
            await this.driver.switchTo().window(handle);
            this.currentHandle = handle;
          }

          const result = await this.findElement(options);
          if (result.success) {
            element = result.data;
            break;
          }
        } catch {
          len--;
          if (len === 0) {
            break;
          }
        }
      }

      if (!element && notifyBrowser) {
        // 切换回原窗口
        if (oldHandle && handles.includes(oldHandle)) {
          await this.driver.switchTo().window(oldHandle);
          this.currentHandle = oldHandle;
        }
        
        return { 
          success: false, 
          error: `Cannot find element with XPath: ${options.xpath}` 
        };
      }

      // 滚动到元素位置
      if (element && scrollIntoView) {
        try {
          const script = `arguments[0].scrollIntoView({block: "center", inline: "center"});`;
          await this.driver.executeScript(script, element);
        } catch {
          console.log('Cannot scrollIntoView');
        }
      }

      return { success: true, data: element };
    } catch (error) {
      console.error('Failed to find element across windows:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 点击元素（重载方法，支持字符串类型）
   */
  async clickElement(element: any, clickType?: string): Promise<OperationResult> {
    try {
      if (!this.driver) {
        return { success: false, error: 'Driver not started' };
      }

      const { Key } = await import('selenium-webdriver');
      
      if (clickType === 'double') {
        await this.driver.actions().doubleClick(element).perform();
      } else if (clickType === 'loopClickEvery') {
        // 新标签页打开（Ctrl+Click 或 Cmd+Click）
        if (process.platform === 'darwin') {
          await this.driver.actions()
            .keyDown(Key.COMMAND)
            .click(element)
            .keyUp(Key.COMMAND)
            .perform();
        } else {
          await this.driver.actions()
            .keyDown(Key.CONTROL)
            .click(element)
            .keyUp(Key.CONTROL)
            .perform();
        }
      } else if (clickType && clickType.includes('point(')) {
        // 点击坐标
        const point = clickType.substring(6, clickType.length - 1).split(',');
        const x = parseInt(point[0]);
        const y = parseInt(point[1]);
        const script = `document.elementFromPoint(${x}, ${y}).click();`;
        await this.driver.executeScript(script, element);
      } else {
        // 默认单击
        await element.click();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to click element:', error);
      // 尝试使用 JavaScript 点击
      try {
        await this.driver.executeScript("arguments[0].click();", element);
        return { success: true };
      } catch (jsError) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
  }

  /**
   * 点击元素（原始方法）
   */
  async clickElementWithOptions(options: ClickOptions): Promise<OperationResult> {
    try {
      if (options.clickType === 'double') {
        await this.driver.actions().doubleClick(options.element).perform();
      } else if (options.clickType === 'loopClickEvery') {
        // 新标签页打开
        await options.element.click();
      } else {
        // 默认单击
        await options.element.click();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to click element:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 执行JavaScript代码（重载方法，支持直接传参）
   */
  async executeJavaScript(code: string, element?: any, waitTime?: number): Promise<any> {
    try {
      if (!this.driver) {
        throw new Error('Driver not started');
      }

      let result: any;
      
      if (element) {
        result = await this.driver.executeScript(code, element);
      } else {
        result = await this.driver.executeScript(code);
      }

      if (waitTime && waitTime > 0) {
        await this.driver.sleep(waitTime);
      }

      return result;
    } catch (error) {
      console.error('Failed to execute JavaScript:', error);
      return -1;
    }
  }

  /**
   * 执行JavaScript代码（原始方法）
   */
  async executeJavaScriptWithOptions(options: JavaScriptExecutionOptions): Promise<OperationResult> {
    try {
      if (!this.driver) {
        return { success: false, error: 'Driver not started' };
      }

      let result: any;
      
      if (options.element) {
        result = await this.driver.executeScript(options.code, options.element);
      } else {
        result = await this.driver.executeScript(options.code);
      }

      if (options.waitTime && options.waitTime > 0) {
        await this.driver.sleep(options.waitTime);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to execute JavaScript:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 获取当前窗口状态
   */
  async getBrowserWindowState(): Promise<BrowserWindowState> {
    if (!this.driver) {
      return { windowHandles: [], currentHandle: null, activeWindow: null };
    }

    const handles = await this.driver.getAllWindowHandles();
    return {
      windowHandles: handles,
      currentHandle: this.currentHandle,
      activeWindow: this.currentHandle
    };
  }

  /**
   * 获取驱动状态
   */
  getDriverState() {
    return {
      driver: this.driver !== null,
      currentHandle: this.currentHandle,
      oldHandles: this.oldHandles,
      handlePairs: this.handlePairs
    };
  }

  /**
   * 检查服务是否就绪
   */
  isReady(): boolean {
    return this.driver !== null;
  }

  /**
   * 导航到指定URL
   */
  async navigateTo(url: string): Promise<OperationResult> {
    try {
      if (!this.driver) {
        return { success: false, error: 'Driver not started' };
      }
      
      await this.driver.get(url);
      return { success: true };
    } catch (error) {
      console.error('Failed to navigate to URL:', url, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 发送键盘输入
   */
  async sendKeys(element: any, text: string, enter = false): Promise<OperationResult> {
    try {
      if (!this.driver) {
        return { success: false, error: 'Driver not started' };
      }

      const { Key } = await import('selenium-webdriver');
      
      await element.sendKeys(Key.HOME, Key.chord(Key.SHIFT, Key.END), text);
      
      if (enter) {
        await element.sendKeys(Key.ENTER);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to send keys:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 移动鼠标到元素
   */
  async moveMouse(element: any): Promise<OperationResult> {
    try {
      if (!this.driver) {
        return { success: false, error: 'Driver not started' };
      }
      
      await this.driver.actions().move({ origin: element }).perform();
      return { success: true };
    } catch (error) {
      console.error('Failed to move mouse:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 刷新页面
   */
  async refreshPage(): Promise<OperationResult> {
    try {
      if (!this.driver) {
        return { success: false, error: 'Driver not started' };
      }
      
      await this.driver.navigate().refresh();
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh page:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 选择下拉框选项
   */
  async selectDropdownOption(element: any, optionMode: number, optionValue: string): Promise<OperationResult> {
    try {
      if (!this.driver) {
        return { success: false, error: 'Driver not started' };
      }
      // Use browser-side JavaScript for robust <select> interactions
      switch (optionMode) {
        case 0: // 切换到下一个选项
          const script = `var options = arguments[0].options;
            for (var i = 0; i < options.length; i++) {
              if (options[i].selected) {
                options[i].selected = false;
                if (i == options.length - 1) {
                  options[0].selected = true;
                } else {
                  options[i + 1].selected = true;
                }
                break;
              }
            }`;
          await this.driver.executeScript(script, element);
          break;
        case 1:
          const byIndexScript = `
            var idx = parseInt(arguments[1]);
            if (!isNaN(idx)) { arguments[0].selectedIndex = idx; }
          `;
          await this.driver.executeScript(byIndexScript, element, optionValue);
          break;
        case 2:
          const byValueScript = `
            var val = arguments[1];
            var opts = arguments[0].options;
            for (var i = 0; i < opts.length; i++) {
              if (opts[i].value === val) { arguments[0].selectedIndex = i; break; }
            }
          `;
          await this.driver.executeScript(byValueScript, element, optionValue);
          break;
        case 3:
          const byTextScript = `
            var t = arguments[1];
            var opts = arguments[0].options;
            for (var i = 0; i < opts.length; i++) {
              if (opts[i].text === t) { arguments[0].selectedIndex = i; break; }
            }
          `;
          await this.driver.executeScript(byTextScript, element, optionValue);
          break;
        default:
          throw new Error('Invalid option mode');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to select dropdown option:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 获取元素文本
   */
  async getElementText(element: any): Promise<string> {
    try {
      if (!this.driver) {
        throw new Error('Driver not started');
      }
      return await element.getText();
    } catch (error) {
      console.error('Failed to get element text:', error);
      return '';
    }
  }

  /**
   * 获取元素直接文本（不包括子元素）
   */
  async getDirectText(element: any): Promise<string> {
    try {
      if (!this.driver) {
        throw new Error('Driver not started');
      }
      
      const command = `var arr = [];
        var content = arguments[0];
        for(var i = 0, len = content.childNodes.length; i < len; i++) {
          if(content.childNodes[i].nodeType === 3){
            arr.push(content.childNodes[i].nodeValue);
          }
        }
        var str = arr.join(" ");
        return str;`;
      
      let result = await this.driver.executeScript(command, element);
      return result.replace(/\n/g, '').replace(/\s+/g, ' ');
    } catch (error) {
      console.error('Failed to get direct text:', error);
      return '';
    }
  }

  /**
   * 获取元素属性
   */
  async getElementAttribute(element: any, attributeName: string): Promise<string> {
    try {
      if (!this.driver) {
        throw new Error('Driver not started');
      }
      return await element.getAttribute(attributeName);
    } catch (error) {
      console.error('Failed to get element attribute:', error);
      return '';
    }
  }

  /**
   * 获取元素CSS值
   */
  async getElementCssValue(element: any, propertyName: string): Promise<string> {
    try {
      if (!this.driver) {
        throw new Error('Driver not started');
      }
      return await element.getCssValue(propertyName);
    } catch (error) {
      console.error('Failed to get element CSS value:', error);
      return '';
    }
  }

  /**
   * 获取当前页面URL
   */
  async getCurrentUrl(): Promise<string> {
    try {
      if (!this.driver) {
        throw new Error('Driver not started');
      }
      return await this.driver.getCurrentUrl();
    } catch (error) {
      console.error('Failed to get current URL:', error);
      return '';
    }
  }

  /**
   * 获取页面标题
   */
  async getPageTitle(): Promise<string> {
    try {
      if (!this.driver) {
        throw new Error('Driver not started');
      }
      return await this.driver.getTitle();
    } catch (error) {
      console.error('Failed to get page title:', error);
      return '';
    }
  }

  /**
   * 获取选择框选中的选项文本
   */
  async getSelectedOptionText(element: any): Promise<string> {
    try {
      if (!this.driver) {
        throw new Error('Driver not started');
      }

      const script = `
        var el = arguments[0];
        if (!el) return '';
        try {
          var idx = el.selectedIndex;
          if (idx == null || idx < 0) return '';
          var opt = el.options[idx];
          return opt ? opt.text : '';
        } catch (e) {
          return '';
        }
      `;
      const text = await this.driver.executeScript(script, element);
      return typeof text === 'string' ? text : '';
    } catch (error) {
      console.error('Failed to get selected option text:', error);
      return '';
    }
  }

  /**
   * 关闭服务
   */
  async shutdown(): Promise<void> {
    try {
      if (this.driver) {
        await this.driver.quit();
        this.driver = null;
      }
      console.log('Selenium service shutdown completed');
    } catch (error) {
      console.error('Error during Selenium service shutdown:', error);
    }
  }
}