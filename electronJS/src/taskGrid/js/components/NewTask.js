// 新任务组件 - 重构为Vue SPA架构

window.NewTask = {
    template: `
        <div class="app-container" style="padding: 20px;">
            <el-row :gutter="20" class="mb-12">
                <el-col :span="12">
                    <h3>{{ LANG('New Task~新任务') }}</h3>
                </el-col>
                <el-col :span="12" style="text-align: right;">
                    <el-button @click="gotoHome">
                        {{ LANG('Back to Task List~返回任务列表') }}
                    </el-button>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="24">
                    <el-form label-width="150px">
                        <el-form-item :label="LANG('Please Input URL (http or https):~请输入网页网址（以http或https开头）')">
                            <el-input
                                v-model="links"
                                type="textarea"
                                :rows="4"
                                :placeholder="LANG('Enter one URL per line~每行输入一个网址')"
                            />
                        </el-form-item>
                    </el-form>
                </el-col>
            </el-row>

            <el-row :gutter="20" class="mb-12">
                <el-col :span="24" style="text-align: center;">
                    <el-button type="primary" size="large" @click="startDesign">
                        {{ LANG('Start Design~开始设计') }}
                    </el-button>
                </el-col>
            </el-row>

            <el-row v-if="mobile" class="mb-12">
                <el-col :span="24">
                    <el-alert
                        :title="LANG('Mobile Design Tips~手机模式设计提示')"
                        type="info"
                        :closable="false"
                    >
                        <div v-if="language=='zh'">
                            <p>提示：手机模式设计时如果没有出现操作提示框，请按键盘的Ctrl+Shift+I组合键（MacOS为Command+Option+I组合键）打开开发者工具，然后<b>双击</b>"切换设备"按钮，即可正常出现并使用操作提示框。</p>
                        </div>
                        <div v-else>
                            <p>Tip: If the operation prompt box does not appear when designing in mobile mode, please press the Ctrl+Shift+I key combination (MacOS is the Command+Option+I key combination) to open the developer tool, and then <b>double-click</b> the "Toggle Device Toolbar" button, you can normally appear and use the operation toolbox.</p>
                        </div>
                        <img src="../img/toggle.png" alt="" style="width: 100%;height: 100%">
                    </el-alert>
                </el-col>
            </el-row>
        </div>
    `,
    data() {
        return {
            links: "",
            ws: null
        }
    },
    mounted() {
        console.log('New Task Component mounted in SPA mode');
        this.links = this.LANG("https://www.ebay.com~https://www.baidu.com");
        this.initWebSocket();
    },
    methods: {
        gotoHome() {
            this.$router.push('/');
        },
        startDesign() {
            if (!this.links.trim()) {
                this.$message.warning(this.LANG('Please enter at least one URL~请输入至少一个网址'));
                return;
            }

            const urls = this.links.split('\n').filter(url => url.trim()).map(url => url.trim());
            
            // 发送WebSocket消息开始设计
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const message = {
                    type: 1,
                    message: {
                        id: 1,
                        urls: urls
                    }
                };
                this.ws.send(JSON.stringify(message));
                this.$message.success(this.LANG('Design started~设计已开始'));
            } else {
                this.$message.error(this.LANG('WebSocket connection is not available~WebSocket连接不可用'));
            }
        },
        initWebSocket() {
            const wsport = this.$route.query.wsport;
            if (wsport) {
                this.ws = new WebSocket("ws://localhost:" + wsport);
                this.ws.onopen = () => {
                    console.log("WebSocket connected");
                    const message = {
                        type: 0,
                        message: {
                            id: 1,
                        }
                    };
                    this.ws.send(JSON.stringify(message));
                };
                this.ws.onclose = () => {
                    console.log("WebSocket connection closed");
                };
                this.ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                };
            }
        },
        LANG(text) {
            const [en, zh] = text.split("~");
            return this.language === 'zh' ? zh : en;
        }
    },
    computed: {
        language() {
            return this.$route.query.lang || 'zh';
        },
        mobile() {
            return this.$route.query.mobile;
        },
        backEndAddressServiceWrapper() {
            return this.$route.query.backEndAddressServiceWrapper || window.backEndAddressServiceWrapper || "http://localhost:8074";
        }
    }
};