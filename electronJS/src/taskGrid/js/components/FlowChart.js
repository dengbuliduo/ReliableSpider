// 流程图组件 - 重构为Vue SPA架构

window.FlowChart = {
    template: `
        <div class="app-container" style="padding: 20px;">
            <el-row :gutter="20" class="mb-12">
                <el-col :span="12">
                    <h3>{{ LANG('Flow Chart~流程图') }}</h3>
                </el-col>
                <el-col :span="12" style="text-align: right;">
                    <el-button @click="gotoHome">
                        {{ LANG('Back to Task List~返回任务列表') }}
                    </el-button>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="24">
                    <el-card>
                        <template #header>
                            <span>{{ LANG('Flow Chart Designer~流程图设计器') }}</span>
                        </template>
                        
                        <div style="text-align: center; padding: 40px 0;">
                            <el-result
                                icon="warning"
                                :title="LANG('Feature Coming Soon~功能即将上线')"
                                :sub-title="LANG('The flow chart designer is under development and will be available in the next version.~流程图设计器正在开发中，将在下一个版本中提供。')"
                            >
                                <template #extra>
                                    <el-button type="primary" @click="gotoHome">
                                        {{ LANG('Return to Task List~返回任务列表') }}
                                    </el-button>
                                </template>
                            </el-result>
                            
                            <div style="margin-top: 30px;">
                                <el-steps :active="3" align-center>
                                    <el-step :title="LANG('Design~设计')" :description="LANG('Create task flow~创建任务流程')" />
                                    <el-step :title="LANG('Configure~配置')" :description="LANG('Set parameters~设置参数')" />
                                    <el-step :title="LANG('Execute~执行')" :description="LANG('Run automation~运行自动化')" />
                                </el-steps>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>
    `,
    mounted() {
        console.log('Flow Chart Component mounted');
    },
    methods: {
        gotoHome() {
            this.$router.push('/');
        },
        LANG(text) {
            const [en, zh] = text.split("~");
            return this.lang === 'zh' ? zh : en;
        }
    },
    computed: {
        lang() {
            return this.$route.query.lang || 'zh';
        }
    }
};