// 任务详情组件 - 重构为Vue SPA架构

window.TaskInfo = {
    template: `
        <div class="app-container" style="padding: 20px;">
            <el-row :gutter="20" class="mb-12">
                <el-col :span="12">
                    <h3>{{ LANG('Task Details~任务详情') }}</h3>
                </el-col>
                <el-col :span="12" style="text-align: right;">
                    <el-button @click="gotoHome">
                        {{ LANG('Back to Task List~返回任务列表') }}
                    </el-button>
                </el-col>
            </el-row>

            <el-row v-if="show" :gutter="20">
                <el-col :span="24">
                    <el-card>
                        <template #header>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span>{{ LANG('Task Information~任务信息') }}</span>
                                <div>
                                    <el-button type="primary" @click="modifyTask(task.ID, task.URL)">
                                        {{ LANG('Modify~修改') }}
                                    </el-button>
                                    <el-button type="success" @click="invokeTask(task.ID)">
                                        {{ LANG('Execute~执行') }}
                                    </el-button>
                                </div>
                            </div>
                        </template>
                        
                        <el-descriptions :column="2" border>
                            <el-descriptions-item :label="LANG('Task ID~任务ID')">
                                {{ task.ID }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="LANG('URL~网址')">
                                <a :href="task.URL" target="_blank">{{ task.URL }}</a>
                            </el-descriptions-item>
                            <el-descriptions-item :label="LANG('Create Date~创建日期')">
                                {{ task.Date }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="LANG('Status~状态')">
                                <el-tag :type="getStatusType(task.Status)">{{ getStatusText(task.Status) }}</el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item :label="LANG('Description~描述')" :span="2">
                                {{ task.Description || LANG('No description~暂无描述') }}
                            </el-descriptions-item>
                        </el-descriptions>
                    </el-card>
                </el-col>
            </el-row>

            <el-row v-else>
                <el-col :span="24" style="text-align: center;">
                    <el-skeleton :rows="5" animated />
                </el-col>
            </el-row>
        </div>
    `,
    data() {
        return {
            task: {},
            show: false
        }
    },
    mounted() {
        console.log('Task Info Component mounted with task ID:', this.taskId);
        this.loadTaskInfo();
    },
    methods: {
        loadTaskInfo() {
            fetch(this.backEndAddressServiceWrapper + "/queryTask?id=" + this.taskId)
                .then(response => response.json())
                .then(result => {
                    this.task = result;
                    this.show = true;
                })
                .catch(error => {
                    console.error('Failed to load task info:', error);
                    this.$message.error(this.LANG('Failed to load task information~加载任务信息失败'));
                });
        },
        gotoHome() {
            this.$router.push('/');
        },
        modifyTask(id, url) {
            this.$router.push({
                path: '/flow-chart',
                query: {
                    id: id,
                    backEndAddressServiceWrapper: this.backEndAddressServiceWrapper
                }
            });
        },
        invokeTask(id) {
            this.$router.push({
                path: '/execute-task',
                query: {
                    id: id,
                    backEndAddressServiceWrapper: this.backEndAddressServiceWrapper
                }
            });
        },
        getStatusType(status) {
            switch(status) {
                case 'completed': return 'success';
                case 'running': return 'warning';
                case 'error': return 'danger';
                default: return 'info';
            }
        },
        getStatusText(status) {
            const statusMap = {
                'completed': this.LANG('Completed~已完成'),
                'running': this.LANG('Running~运行中'),
                'error': this.LANG('Error~错误'),
                'pending': this.LANG('Pending~待处理')
            };
            return statusMap[status] || this.LANG('Unknown~未知');
        },
        LANG(text) {
            const [en, zh] = text.split("~");
            return this.lang === 'zh' ? zh : en;
        }
    },
    computed: {
        taskId() {
            return this.$route.params.id;
        },
        lang() {
            return this.$route.query.lang || 'zh';
        },
        backEndAddressServiceWrapper() {
            return this.$route.query.backEndAddressServiceWrapper || window.backEndAddressServiceWrapper || "http://localhost:8074";
        }
    }
};