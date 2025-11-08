# Vue.js + VueI18n 集成指南

## 项目结构

```
src/vue/
├── index.html          # 主HTML文件
├── main.js             # Vue应用入口
├── App.vue             # 根组件
├── locales/
│   └── index.js        # 国际化配置
└── components/
    ├── LanguageSelector.vue  # 语言选择器
    └── MainInterface.vue     # 主界面组件
```

## 功能特性

✅ **Vue 3 集成** - 使用最新的Vue 3 Composition API  
✅ **VueI18n 国际化** - 支持中英文切换  
✅ **响应式设计** - 适配不同屏幕尺寸  
✅ **现代化UI** - 美观的渐变背景和卡片设计  
✅ **组件化架构** - 可复用的组件结构  

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式
```bash
npm run dev
```
访问 http://localhost:3000

### 3. 构建生产版本
```bash
npm run build
```

### 4. 预览生产版本
```bash
npm run preview
```

## 国际化使用

### 添加新语言
1. 在 `src/vue/locales/index.js` 中添加新的语言配置
2. 在 `LanguageSelector.vue` 中添加语言选项

### 在组件中使用翻译
```vue
<template>
  <h1>{{ $t('app.title') }}</h1>
  <p>{{ $t('main.description') }}</p>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  setup() {
    const { t } = useI18n()
    console.log(t('app.title'))
  }
}
</script>
```

## 组件说明

### App.vue
- 根组件，包含应用的整体布局
- 集成语言选择器和主界面

### LanguageSelector.vue
- 语言切换组件
- 支持中英文切换
- 响应式设计

### MainInterface.vue
- 主界面组件
- 展示应用功能和操作按钮
- 包含功能卡片和操作区域

## 自定义主题

修改 `App.vue` 中的CSS变量来自定义主题：

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --primary-color: #667eea;
  --text-color: #333;
  --background-color: #f5f5f5;
}
```

## 与Electron集成

Vue应用构建后，可以在Electron中加载：

```javascript
// 在Electron主进程中
mainWindow.loadFile('dist/index.html')
```

## 开发建议

1. **组件拆分** - 将复杂功能拆分为更小的组件
2. **状态管理** - 考虑使用Pinia进行状态管理
3. **路由集成** - 添加Vue Router支持多页面
4. **UI组件库** - 集成Element Plus或Vuetify等UI库
5. **测试** - 添加Vue Test Utils进行单元测试