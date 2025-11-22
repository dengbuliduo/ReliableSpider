<template>
  <div class="execute-task">
    <el-card class="app-container">
      <template #header>
        <div class="card-header">
          <span>执行任务</span>
          <el-button @click="$router.push('/')">返回列表</el-button>
        </div>
      </template>

      <div class="execution-controls">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>任务选择</span>
              </template>
              <el-select v-model="selectedTask" placeholder="请选择任务" style="width: 100%">
                <el-option
                  v-for="task in availableTasks"
                  :key="task.id"
                  :label="task.name"
                  :value="task.id"
                />
              </el-select>
            </el-card>
          </el-col>
          
          <el-col :span="16">
            <el-card>
              <template #header>
                <span>执行控制</span>
              </template>
              <div class="control-buttons">
                <el-button type="primary" :disabled="!selectedTask" @click="startTask">
                  <el-icon><video-play /></el-icon>
                  开始执行
                </el-button>
                <el-button type="warning" :disabled="!isRunning" @click="pauseTask">
                  <el-icon><video-pause /></el-icon>
                  暂停执行
                </el-button>
                <el-button type="danger" :disabled="!isRunning" @click="stopTask">
                  <el-icon><switch-button /></el-icon>
                  停止执行
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="execution-log" style="margin-top: 20px">
        <el-card>
          <template #header>
            <span>执行日志</span>
            <el-button size="small" @click="clearLog">清空日志</el-button>
          </template>
          <div class="log-content">
            <div v-for="(log, index) in executionLogs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-level" :class="log.level">{{ log.level }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { APP_CONFIG } from '../config/app.config'

interface Task {
  id: number
  name: string
  status: string
}

interface Log {
  time: string
  level: string
  message: string
}

const selectedTask = ref<number | null>(null)
const isRunning = ref(false)
const executionLogs = ref<Log[]>([])

const availableTasks = ref<Task[]>([])
const route = useRoute()
const API_BASE = `http://${APP_CONFIG.SERVER.HOST}:${APP_CONFIG.SERVER.PORT}`

const startTask = async () => {
  if (!selectedTask.value) {
    ElMessage.warning('请先选择任务')
    return
  }
  try {
    isRunning.value = true
    addLog('INFO', `触发任务执行：${selectedTask.value}`)
    const res = await fetch(`${API_BASE}/api/tasks/${selectedTask.value}/execute`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      addLog('SUCCESS', '后端执行已触发')
    } else {
      throw new Error(data.error || '触发执行失败')
    }
  } catch (e: any) {
    addLog('ERROR', e?.message || '任务执行触发失败')
  } finally {
    isRunning.value = false
  }
}

const pauseTask = () => {
  addLog('WARNING', '任务暂停')
  isRunning.value = false
}

const stopTask = () => {
  addLog('ERROR', '任务停止')
  isRunning.value = false
}

const clearLog = () => {
  executionLogs.value = []
}

const addLog = (level: string, message: string) => {
  const now = new Date()
  const time = now.toLocaleTimeString()
  executionLogs.value.push({ time, level, message })
}

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/tasks`)
    const data = await res.json()
    if (data.success && Array.isArray(data.tasks)) {
      availableTasks.value = data.tasks.map((t: any) => ({ id: t.id, name: t.name, status: t.status || '等待中' }))
      // 若路由带 id 参数，预选中
      const qId = Number(route.query.id)
      if (qId) {
        const exists = availableTasks.value.some(t => t.id === qId)
        if (exists) selectedTask.value = qId
      }
    }
  } catch (e) {
    console.error('加载任务列表失败', e)
  }
})
</script>

<style scoped>
.execute-task {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-buttons {
  display: flex;
  gap: 10px;
}

.log-content {
  height: 300px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
}

.log-item {
  display: flex;
  margin-bottom: 5px;
  font-family: 'Courier New', monospace;
}

.log-time {
  color: #666;
  margin-right: 10px;
  min-width: 80px;
}

.log-level {
  margin-right: 10px;
  min-width: 60px;
  font-weight: bold;
}

.log-level.INFO { color: #1890ff; }
.log-level.SUCCESS { color: #52c41a; }
.log-level.WARNING { color: #faad14; }
.log-level.ERROR { color: #f5222d; }
</style>