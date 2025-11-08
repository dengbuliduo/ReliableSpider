# Vue Router 集成指南

## 🎯 已完成的功能

### 1. **路由系统配置**
- ✅ Vue Router 4.x 集成
- ✅ 路由守卫和权限控制
- ✅ 动态页面标题设置
- ✅ 路由懒加载支持
- ✅ 404 页面处理

### 2. **页面路由结构**
```
/                 - 首页 (Home)
/tasks            - 任务管理 (TaskManager)
/settings         - 设置页面 (Settings)
/about            - 关于页面 (About)
/*                - 404 页面 (NotFound)
```

### 3. **核心功能特性**

#### 🔧 **路由配置** (`src/vue/router/index.js`)
- **历史模式**: 使用 HTML5 History API
- **路由守卫**: 支持权限验证和页面标题设置
- **懒加载**: 异步加载页面组件
- **滚动行为**: 智能的页面滚动控制

#### 🏠 **首页** (`src/vue/views/Home.vue`)
- 欢迎界面和功能介绍
- 快速开始引导
- 功能特性展示
- 响应式设计

#### 📋 **任务管理** (`src/vue/views/TaskManager.vue`)
- 任务列表展示
- 任务状态管理 (待运行/运行中/已完成)
- 任务操作 (运行/编辑/删除)
- 空状态处理

#### ⚙️ **设置页面** (`src/vue/views/Settings.vue`)
- **通用设置**: 语言、主题切换
- **爬虫设置**: 请求延迟、重试次数、超时时间
- **导出设置**: 默认格式、自动保存
- **高级设置**: 调试模式、日志级别

#### ℹ️ **关于页面** (`src/vue/views/About.vue`)
- 版本信息展示
- 技术栈介绍
- 相关链接
- 贡献者列表

#### ❌ **404 页面** (`src/vue/views/NotFound.vue`)
- 友好的错误提示
- 返回首页和上页功能
- 响应式设计

## 🚀 快速开始

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

## 🔧 路由使用示例

### 基本路由导航
```vue
<template>
  <!-- 使用 router-link 进行导航 -->
  <router-link to="/">首页</router-link>
  <router-link to="/tasks">任务管理</router-link>
  
  <!-- 编程式导航 -->
  <button @click="goToTasks">去任务管理</button>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    
    const goToTasks = () => {
      router.push('/tasks')
    }
    
    return { goToTasks }
  }
}
</script>
```

### 路由参数和查询
```vue
<script>
import { useRoute } from 'vue-router'

export default {
  setup() {
    const route = useRoute()
    
    // 获取路由参数
    const taskId = route.params.id
    
    // 获取查询参数
    const searchQuery = route.query.q
    
    return { taskId, searchQuery }
  }
}
</script>
```

## 🌐 国际化支持

所有页面都支持中英文切换，翻译配置在 `src/vue/locales/index.js` 中。

### 添加新语言
1. 在 locales 配置中添加新的语言
2. 更新 LanguageSelector 组件
3. 确保所有翻译键都有对应翻译

## 📱 响应式设计

所有页面都采用响应式设计，支持：
- **桌面端**: 大屏幕优化布局
- **平板端**: 中等屏幕适配
- **移动端**: 小屏幕友好界面

## 🔒 权限控制

路由支持权限控制，在路由配置中设置 `requiresAuth: true` 即可启用：

```javascript
{
  path: '/admin',
  name: 'Admin',
  component: Admin,
  meta: {
    requiresAuth: true,
    title: 'routes.admin'
  }
}
```

## 🎨 自定义主题

支持主题切换功能：
- **浅色主题**: 明亮舒适的界面
- **深色主题**: 护眼夜间模式
- **自动主题**: 跟随系统设置

## 🔧 开发建议

### 1. **路由命名规范**
- 使用 kebab-case 命名路由路径
- 使用 PascalCase 命名路由名称
- 保持路由结构清晰

### 2. **组件组织**
- 页面组件放在 `views/` 目录
- 可复用组件放在 `components/` 目录
- 按功能模块组织文件结构

### 3. **性能优化**
- 使用路由懒加载减少初始包大小
- 合理使用路由守卫避免不必要的重定向
- 优化页面组件加载性能

### 4. **错误处理**
- 实现完整的 404 页面
- 添加网络错误处理
- 提供友好的错误提示

## 📈 扩展功能

### 计划中的功能
- [ ] 路由动画过渡效果
- [ ] 面包屑导航
- [ ] 路由标签页管理
- [ ] 路由权限分级
- [ ] 路由缓存策略

### 技术栈升级
- [ ] 集成 Pinia 状态管理
- [ ] 添加 TypeScript 支持
- [ ] 集成 UI 组件库
- [ ] 添加单元测试

## 🐛 常见问题

### Q: 路由不生效怎么办？
A: 检查路由配置是否正确，确保使用了正确的路由模式。

### Q: 如何添加新的页面？
A: 在 `views/` 目录创建新组件，在路由配置中添加对应路由。

### Q: 如何实现路由权限？
A: 在路由守卫中添加权限验证逻辑，根据用户角色控制访问。

### Q: 如何优化路由性能？
A: 使用路由懒加载，合理拆分代码块，优化组件加载顺序。

---

**Vue Router 集成已完成！** 🎉

现在您可以享受完整的单页面应用体验，包括路由导航、页面切换、权限控制等功能。