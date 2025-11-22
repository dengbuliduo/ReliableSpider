<template>
  <div class="new-task">
    <el-card class="app-container">
      <template #header>
        <div class="card-header">
          <span>创建新任务</span>
          <el-button @click="$router.push('/')">返回列表</el-button>
        </div>
      </template>

      <el-form :model="form" label-width="120px" style="max-width: 600px">
        <el-form-item label="任务名称">
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        
        <el-form-item label="任务类型">
          <el-select v-model="form.type" placeholder="请选择任务类型">
            <el-option label="数据采集" value="collect" />
            <el-option label="网站监控" value="monitor" />
            <el-option label="API测试" value="api" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标URL">
          <el-input v-model="form.url" placeholder="请输入目标URL" />
        </el-form-item>
        
        <el-form-item label="执行间隔">
          <el-input-number v-model="form.interval" :min="1" :max="1440" />
          <span style="margin-left: 10px">分钟</span>
        </el-form-item>
        
        <el-form-item label="任务描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="createTask">创建任务</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { APP_CONFIG } from '../config/app.config'

interface TaskForm {
  name: string
  type: string
  url: string
  interval: number
  description: string
}

const form = reactive<TaskForm>({
  name: '',
  type: '',
  url: '',
  interval: 30,
  description: ''
})

const router = useRouter()
const API_BASE = `http://${APP_CONFIG.SERVER.HOST}:${APP_CONFIG.SERVER.PORT}`

const createTask = async () => {
  if (!form.name.trim()) {
    ElMessage.error('请输入任务名称')
    return
  }

  // 映射类型到数字（与后端约定）
  const typeMap: Record<string, number> = { collect: 1, monitor: 2, api: 3 }
  const payload = {
    name: form.name,
    type: typeMap[form.type] || 0,
    url: form.url || undefined,
    description: form.description || undefined,
    interval_seconds: Math.max(1, Number(form.interval || 30)) * 60
  }

  try {
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.success && data.taskId) {
      ElMessage.success('任务创建成功')
      // 跳转到详情页
      router.push(`/task-info/${data.taskId}`)
      // 重置表单
      resetForm()
    } else {
      throw new Error(data.error || '创建任务失败')
    }
  } catch (e: any) {
    console.error('创建任务失败', e)
    ElMessage.error(e?.message || '创建任务失败')
  }
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    type: '',
    url: '',
    interval: 30,
    description: ''
  })
}
</script>

<style scoped>
.new-task {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>