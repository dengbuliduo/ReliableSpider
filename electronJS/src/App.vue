<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <div class="app-header">
      <el-row :gutter="16" style="align-items:center">
        <el-col :xs="12" :sm="6">
          <h3 style="margin: 0; color: var(--el-color-primary)">ReliableSpider</h3>
        </el-col>
        <el-col :xs="12" :sm="18" style="text-align: right;">
          <el-button-group>
            <el-button 
              :type="$route.path === '/' ? 'primary' : 'default'" 
              @click="$router.push('/')">
              任务列表
            </el-button>
            <el-button 
              :type="$route.path === '/new-task' ? 'primary' : 'default'" 
              @click="$router.push('/new-task')">
              创建新任务
            </el-button>
            <el-button 
              :type="$route.path === '/execute-task' ? 'primary' : 'default'" 
              @click="$router.push('/execute-task')">
              执行任务
            </el-button>
            <el-button 
              :type="$route.path === '/flow-chart' ? 'primary' : 'default'" 
              @click="$router.push('/flow-chart')">
              流程图
            </el-button>
            <el-dropdown @command="changeLang" trigger="click">
              <el-button type="primary">
                <span style="margin-right:8px">{{ lang === 'zh' ? '中文' : 'English' }}</span>
                <el-icon class="el-icon--right">
                  <arrow-down />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="zh">
                    <el-icon v-if="lang === 'zh'" style="margin-right:6px"><check /></el-icon>
                    中文
                  </el-dropdown-item>
                  <el-dropdown-item command="en">
                    <el-icon v-if="lang === 'en'" style="margin-right:6px"><check /></el-icon>
                    English
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-button-group>
        </el-col>
      </el-row>
    </div>
    
    <!-- 路由视图 -->
    <div class="router-view">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const lang = ref('zh')

const changeLang = (command: string) => {
  lang.value = command
}

// 监听 Electron 菜单事件
onMounted(() => {
  if (window.electronAPI) {
    window.electronAPI.onNewTask(() => {
      router.push('/new-task')
    })
  }
})
</script>

<style scoped>
.app-header {
  background: var(--el-bg-color); 
  border-bottom: 1px solid var(--el-border-color-lighter); 
  padding: 10px 20px;
}

.router-view {
  min-height: calc(100vh - 80px);
  padding: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .el-col {
    width: 100%;
    margin-bottom: 1rem;
  }
  
  .app-header {
    margin: 20px 10px;
    padding: 0 10px;
  }
}
</style>