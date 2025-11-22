<template>
  <div class="task-info">
    <el-card class="app-container">
      <template #header>
        <div class="card-header">
          <span>任务详情 - {{ taskInfo.name }}</span>
          <el-button @click="$router.push('/')">返回列表</el-button>
        </div>
      </template>

      <el-descriptions title="任务基本信息" :column="2" border>
        <el-descriptions-item label="任务ID">{{ taskInfo.id }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ taskInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">{{ taskInfo.type }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag :type="getStatusType(taskInfo.status)">{{ taskInfo.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ taskInfo.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="最后执行时间">{{ taskInfo.lastExecuted }}</el-descriptions-item>
        <el-descriptions-item label="目标URL" :span="2">{{ taskInfo.url }}</el-descriptions-item>
        <el-descriptions-item label="任务描述" :span="2">{{ taskInfo.description }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 20px">
        <el-button type="primary" @click="executeTask">执行任务</el-button>
        <el-button @click="editTask">编辑任务</el-button>
        <el-button type="danger" @click="deleteTask">删除任务</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { APP_CONFIG } from '../config/app.config'

interface TaskInfo {
  id: number
  name: string
  type: string
  status: string
  createdAt: string
  lastExecuted: string
  url: string
  description: string
}

const route = useRoute()
const router = useRouter()
const taskInfo = ref<TaskInfo>({
  id: 0,
  name: '',
  type: '',
  status: '',
  createdAt: '',
  lastExecuted: '',
  url: '',
  description: ''
})

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '运行中': 'success',
    '已停止': 'danger',
    '等待中': 'warning'
  }
  return statusMap[status] || 'info'
}

const API_BASE = `http://${APP_CONFIG.SERVER.HOST}:${APP_CONFIG.SERVER.PORT}`

const executeTask = async () => {
  try {
    if (!taskInfo.value.id) return
    const res = await fetch(`${API_BASE}/api/tasks/${taskInfo.value.id}/execute`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('已触发任务执行')
      router.push({ path: '/execute-task', query: { id: String(taskInfo.value.id) } })
    } else {
      throw new Error(data.error || '触发执行失败')
    }
  } catch (e: any) {
    console.error('执行任务失败', e)
    ElMessage.error(e?.message || '执行任务失败')
  }
}

const editTask = () => {
  ElMessage.info('编辑功能开发中')
}

const deleteTask = () => {
  ElMessageBox.confirm('确定要删除这个任务吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      if (!taskInfo.value.id) return
      const res = await fetch(`${API_BASE}/api/tasks/${taskInfo.value.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        ElMessage.success('任务删除成功')
        router.push('/')
      } else {
        throw new Error(data.error || '删除失败')
      }
    } catch (e: any) {
      console.error('删除任务失败', e)
      ElMessage.error(e?.message || '删除任务失败')
    }
  }).catch(() => {})
}

// 获取任务详情
onMounted(async () => {
  const taskId = Number(route.params.id)
  if (!taskId) return
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}`)
    const data = await res.json()
    if (data.success && data.task) {
      const t = data.task
      const typeLabel = ({1:'数据采集',2:'网站监控',3:'API测试'} as Record<number,string>)[t.type] || String(t.type)
      taskInfo.value = {
        id: t.id,
        name: t.name,
        type: typeLabel,
        status: t.status || '等待中',
        createdAt: t.created_at || '',
        lastExecuted: t.last_executed_at || '',
        url: t.url || '',
        description: t.description || ''
      }
    } else {
      throw new Error(data.error || '任务不存在')
    }
  } catch (e: any) {
    console.error('加载任务详情失败', e)
    ElMessage.error(e?.message || '加载任务详情失败')
  }
})
</script>

<style scoped>
.task-info {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>