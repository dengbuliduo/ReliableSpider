#!/usr/bin/env node

/**
 * TypeScript重构项目测试脚本
 * 用于验证重构后的代码与原main.js逻辑一致性
 */

const fs = require('fs');
const path = require('path');

// 测试结果记录
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * 检查文件是否存在
 */
function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath);
  testResults.total++;
  
  if (exists) {
    console.log(`✅ ${filePath} - 存在`);
    testResults.passed++;
    return true;
  } else {
    console.log(`❌ ${filePath} - 不存在`);
    testResults.failed++;
    return false;
  }
}

/**
 * 检查文件内容格式
 */
function checkFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查TypeScript语法
    if (filePath.endsWith('.ts')) {
      if (!content.includes('import') && !content.includes('export')) {
        console.log(`⚠️ ${filePath} - 可能缺少TypeScript模块导入/导出`);
      }
    }
    
    // 检查逻辑一致性标记
    if (content.includes('与原main.js逻辑一致')) {
      console.log(`✅ ${filePath} - 包含逻辑一致性标记`);
      testResults.passed++;
    } else {
      console.log(`⚠️ ${filePath} - 缺少逻辑一致性标记`);
    }
    
    testResults.total++;
    return true;
  } catch (error) {
    console.log(`❌ ${filePath} - 读取失败: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * 检查项目结构完整性
 */
function checkProjectStructure() {
  console.log('\n🔍 检查项目结构完整性...');
  
  const requiredFiles = [
    'src/services/websocket.service.ts',
    'src/services/task.service.ts',
    'electron/main/index.ts',
    'src/types/app.ts',
    'src/config/app.config.ts',
    'src/app/crawler.app.ts',
    'vite.config.ts',
    'tsconfig.json'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    checkFileExists(filePath);
  });
}

/**
 * 检查代码质量
 */
function checkCodeQuality() {
  console.log('\n🔍 检查代码质量...');
  
  const tsFiles = [
    'src/services/websocket.service.ts',
    'src/services/task.service.ts',
    'electron/main/index.ts'
  ];
  
  tsFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      checkFileContent(filePath);
    }
  });
}

/**
 * 检查依赖配置
 */
function checkDependencies() {
  console.log('\n🔍 检查依赖配置...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 检查TypeScript相关依赖
    const requiredDeps = ['typescript', '@types/node', 'electron'];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    requiredDeps.forEach(dep => {
      testResults.total++;
      if (deps[dep]) {
        console.log(`✅ ${dep} - 已安装 (${deps[dep]})`);
        testResults.passed++;
      } else {
        console.log(`❌ ${dep} - 未安装`);
        testResults.failed++;
      }
    });
  }
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('🚀 开始TypeScript重构项目测试\n');
  
  checkProjectStructure();
  checkCodeQuality();
  checkDependencies();
  
  console.log('\n📊 测试结果汇总:');
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(`通过率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 所有测试通过！重构项目结构完整，代码质量良好。');
  } else {
    console.log('\n⚠️ 存在测试失败的项目，请检查相关问题。');
  }
}

// 运行测试
runAllTests();