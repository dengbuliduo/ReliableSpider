// 执行任务组件 - 重构为Vue SPA架构

window.ExecuteTask = {
    template: `
        <div class="app-container" style="padding: 20px;">
            <el-row :gutter="20" class="mb-12">
                <el-col :span="12">
                    <h3>{{ LANG('Execute Task~执行任务') }}</h3>
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
                                <span>{{ LANG('Task Execution~任务执行') }} - {{ task.URL }}</span>
                                <el-button type="primary" @click="startExecution">
                                    {{ LANG('Start Execution~开始执行') }}
                                </el-button>
                            </div>
                        </template>
                        
                        <el-form label-width="150px">
                            <el-form-item :label="LANG('Task ID~任务ID')">
                                {{ task.ID }}
                            </el-form-item>
                            <el-form-item :label="LANG('Task URL~任务网址')">
                                <a :href="task.URL" target="_blank">{{ task.URL }}</a>
                            </el-form-item>
                            <el-form-item :label="LANG('Execution Parameters~执行参数')">
                                <el-input v-model="command" :placeholder="LANG('Enter execution command~输入执行命令')" />
                            </el-form-item>
                            <el-form-item :label="LANG('Upload Excel File~上传Excel文件')">
                                <el-upload
                                    action=""
                                    :auto-upload="false"
                                    :show-file-list="false"
                                    @change="handleFileUpload"
                                >
                                    <el-button type="primary">{{ LANG('Select File~选择文件') }}</el-button>
                                    <template #tip>
                                        <div class="el-upload__tip">{{ fileUploadStatus }}</div>
                                    </template>
                                </el-upload>
                            </el-form-item>
                            <el-form-item :label="LANG('Execution Log~执行日志')">
                                <el-input
                                    type="textarea"
                                    :rows="6"
                                    v-model="executionLog"
                                    readonly
                                    placeholder="执行日志将在这里显示..."
                                />
                            </el-form-item>
                        </el-form>
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
            show: false,
            command: "./reliablespider_executestage ",
            executionLog: "",
            fileUploadStatus: "Status: Waiting for upload~状态：等待上传",
            ws: null
        }
    },
    mounted() {
        console.log('Execute Task Component mounted with task ID:', this.taskId);
        this.loadTaskData();
        this.initWebSocket();
    },
    methods: {
        loadTaskData() {
            fetch(this.backEndAddressServiceWrapper + "/queryTask?id=" + this.taskId)
                .then(response => response.json())
                .then(result => {
                    this.task = result;
                    this.show = true;
                })
                .catch(error => {
                    console.error('Failed to load task data:', error);
                    this.$message.error(this.LANG('Failed to load task data~加载任务数据失败'));
                });
        },
        gotoHome() {
            this.$router.push('/');
        },
        startExecution() {
            if (!this.command.trim()) {
                this.$message.warning(this.LANG('Please enter execution command~请输入执行命令'));
                return;
            }

            this.executionLog = this.LANG('Starting execution...~开始执行...');
            
            // 通过WebSocket发送执行命令
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const message = {
                    type: 2,
                    message: {
                        taskId: this.taskId,
                        command: this.command
                    }
                };
                this.ws.send(JSON.stringify(message));
                this.$message.success(this.LANG('Execution started~执行已开始'));
            } else {
                this.$message.error(this.LANG('WebSocket connection is not available~WebSocket连接不可用'));
            }
        },
        handleFileUpload(file) {
            this.fileUploadStatus = this.LANG('File selected: ' + file.name + '~文件已选择: ' + file.name);
            this.file = file;
        },
        initWebSocket() {
            const wsport = this.$route.query.wsport;
            if (wsport) {
                this.ws = new WebSocket("ws://localhost:" + wsport);
                this.ws.onopen = () => {
                    console.log("Execute Task WebSocket connected");
                    const message = {
                        type: 0,
                        message: { id: 1 }
                    };
                    this.ws.send(JSON.stringify(message));
                };
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.executionLog += '\n' + data.message;
                };
                this.ws.onclose = () => {
                    console.log("Execute Task WebSocket connection closed");
                };
            }
        },
        LANG(text) {
            const [en, zh] = text.split("~");
            return this.lang === 'zh' ? zh : en;
        }
    },
    computed: {
        taskId() {
            return this.$route.query.id;
        },
        lang() {
            return this.$route.query.lang || 'zh';
        },
        backEndAddressServiceWrapper() {
            return this.$route.query.backEndAddressServiceWrapper || window.backEndAddressServiceWrapper || "http://localhost:8074";
        }
    }
};