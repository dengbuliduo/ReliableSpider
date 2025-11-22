import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入组件
import App from './App.vue'
import TaskList from './views/TaskList.vue'
import NewTask from './views/NewTask.vue'
import TaskInfo from './views/TaskInfo.vue'
import ExecuteTask from './views/ExecuteTask.vue'
import FlowChart from './views/FlowChart.vue'

// 路由配置
const routes = [
  { path: '/', component: TaskList },
  { path: '/new-task', component: NewTask },
  { path: '/task-info/:id', component: TaskInfo, props: true },
  { path: '/execute-task', component: ExecuteTask },
  { path: '/flow-chart', component: FlowChart }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 创建 Vue 应用
const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(ElementPlus)
app.use(router)

// 挂载应用
app.mount('#app')