<template>
  <div class="flow-chart">
    <el-card class="app-container">
      <template #header>
        <div class="card-header">
          <span>任务流程图</span>
          <el-button @click="$router.push('/')">返回列表</el-button>
        </div>
      </template>

      <div class="flow-container">
        <div class="flow-nodes">
          <div v-for="(node, index) in flowNodes" :key="index" class="flow-node" :class="node.status">
            <div class="node-icon">
              <el-icon v-if="node.status === 'completed'"><check /></el-icon>
              <el-icon v-else-if="node.status === 'active'"><loading /></el-icon>
              <el-icon v-else><clock /></el-icon>
            </div>
            <div class="node-content">
              <div class="node-title">{{ node.title }}</div>
              <div class="node-description">{{ node.description }}</div>
            </div>
            <div class="node-time" v-if="node.time">{{ node.time }}</div>
          </div>
        </div>
      </div>

      <div class="flow-controls" style="margin-top: 20px; text-align: center">
        <el-button type="primary" @click="startFlow">开始流程</el-button>
        <el-button @click="resetFlow">重置流程</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

interface FlowNode {
  title: string
  description: string
  status: 'pending' | 'active' | 'completed'
  time?: string
}

const flowNodes = ref<FlowNode[]>([
  {
    title: '任务初始化',
    description: '准备执行环境和参数',
    status: 'pending'
  },
  {
    title: '数据采集',
    description: '从目标网站采集数据',
    status: 'pending'
  },
  {
    title: '数据处理',
    description: '清洗和转换采集的数据',
    status: 'pending'
  },
  {
    title: '数据存储',
    description: '将处理后的数据保存到数据库',
    status: 'pending'
  },
  {
    title: '任务完成',
    description: '任务执行完成并生成报告',
    status: 'pending'
  }
])

const startFlow = async () => {
  for (let i = 0; i < flowNodes.value.length; i++) {
    // 设置当前节点为激活状态
    flowNodes.value[i].status = 'active'
    flowNodes.value[i].time = new Date().toLocaleTimeString()
    
    // 模拟每个步骤的执行时间
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 设置当前节点为完成状态
    flowNodes.value[i].status = 'completed'
    
    // 如果是最后一个节点，显示完成消息
    if (i === flowNodes.value.length - 1) {
      ElMessage.success('任务流程执行完成')
    }
  }
}

const resetFlow = () => {
  flowNodes.value.forEach(node => {
    node.status = 'pending'
    node.time = undefined
  })
}
</script>

<style scoped>
.flow-chart {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flow-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.flow-nodes {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.flow-node {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  border: 2px solid #e4e7ed;
  transition: all 0.3s;
  min-width: 300px;
}

.flow-node.pending {
  background: #f5f7fa;
  color: #909399;
}

.flow-node.active {
  border-color: #409eff;
  background: #ecf5ff;
  color: #409eff;
}

.flow-node.completed {
  border-color: #67c23a;
  background: #f0f9eb;
  color: #67c23a;
}

.node-icon {
  font-size: 24px;
  margin-right: 15px;
}

.node-content {
  flex: 1;
}

.node-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.node-description {
  font-size: 12px;
  opacity: 0.8;
}

.node-time {
  font-size: 12px;
  opacity: 0.7;
}
</style>