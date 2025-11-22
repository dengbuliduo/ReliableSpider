<template>
  <div class="task-list">
    <el-card class="app-container">
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
          <el-button type="primary" @click="$router.push('/new-task')">
            <el-icon><plus /></el-icon>
            新建任务
          </el-button>
        </div>
      </template>

      <el-table :data="taskList" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="任务名称" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="viewTask(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="executeTask(scope.row)">执行</el-button>
            <el-button size="small" type="danger" @click="deleteTask(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { APP_CONFIG } from '../config/app.config'

interface Task {
  id: number
  name: string
  status: string
  createdAt: string
}

const router = useRouter()
const taskList = ref<Task[]>([])
const API_BASE = `http://${APP_CONFIG.SERVER.HOST}:${APP_CONFIG.SERVER.PORT}`

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '运行中': 'success',
    '已停止': 'danger',
    '等待中': 'warning'
  }
  return statusMap[status] || 'info'
}

const viewTask = (task: Task) => {
  router.push(`/task-info/${task.id}`)
}

const loadTasks = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/tasks`)
    const data = await res.json()
    if (data.success && Array.isArray(data.tasks)) {
      taskList.value = data.tasks.map((t: any) => ({
        id: t.id,
        name: t.name,
        status: t.status || '等待中',
        createdAt: t.created_at || ''
      }))
    }
  } catch (e) {
    console.error('加载任务失败', e)
  }
}

const executeTask = async (task: Task) => {
  try {
    await fetch(`${API_BASE}/api/tasks/${task.id}/execute`, { method: 'POST' })
    // 跳转到执行页面或提示
    router.push('/execute-task')
  } catch (e) {
    console.error('执行任务失败', e)
  }
}

const deleteTask = async (task: Task) => {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${task.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      await loadTasks()
    }
  } catch (e) {
    console.error('删除任务失败', e)
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-container {
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>