// ============================================
// TypeScript构建脚本
// ============================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { copyFile, mkdir, readdir, stat } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

async function buildElectron(): Promise<void> {
  console.log('Building Electron application...');
  
  try {
    // 构建Electron主进程
    console.log('Building Electron main process...');
    await execAsync('npx tsc --project tsconfig.electron.json');
    
    // 构建渲染进程
    console.log('Building renderer process...');
    await execAsync('npx vite build');
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function copyFiles(): Promise<void> {
  console.log('Copying necessary files...');
  
  try {
    // 确保dist目录存在
    await mkdir('dist', { recursive: true });
    
    // 复制必要的静态文件
    const filesToCopy = [
      'package.json',
      'favicon.ico',
      'config.json'
    ];
    
    for (const file of filesToCopy) {
      try {
        await copyFile(file, join('dist', file));
        console.log(`Copied ${file} to dist/`);
      } catch (error) {
        console.warn(`Failed to copy ${file}:`, error);
      }
    }
    
    console.log('File copying completed!');
  } catch (error) {
    console.error('File copying failed:', error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  console.log('Starting TypeScript migration build process...');
  
  // 构建应用程序
  await buildElectron();
  
  // 复制文件
  await copyFiles();
  
  console.log('\nBuild process completed!');
  console.log('You can now run the application with: npm start');
}

// 运行构建脚本
if (require.main === module) {
  main().catch(console.error);
}

export { buildElectron, copyFiles };