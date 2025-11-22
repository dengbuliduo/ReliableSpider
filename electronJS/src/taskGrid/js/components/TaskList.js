// 任务列表组件 - 重构为Vue SPA架构

window.TaskList = {
    template: `
        <div class="app-container" style="padding: 20px;">
            <el-row :gutter="20" class="mb-12">
                <el-col :span="12">
                    <h3>{{ LANG('Task List~任务列表') }}</h3>
                </el-col>
                <el-col :span="12" style="text-align: right;">
                    <el-button type="primary" @click="newTask">
                        {{ LANG('New Task~新任务') }}
                    </el-button>
                </el-col>
            </el-row>

            <el-row :gutter="20" class="mb-12">
                <el-col :span="8">
                    <el-input
                        v-model="search"
                        :placeholder="LANG('Search by task name~按任务名称搜索')"
                        clearable
                        @input="handleSearch"
                    >
                        <template #prefix>
                            <el-icon><search /></el-icon>
                        </template>
                    </el-input>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="24">
                    <el-table
                        :data="filteredList"
                        border
                        style="width: 100%"
                        v-loading="loading"
                    >
                        <el-table-column
                            prop="ID"
                            :label="LANG('Task ID~任务ID')"
                            width="100"
                        />
                        <el-table-column
                            prop="URL"
                            :label="LANG('Task URL~任务网址')"
                            min-width="200"
                            show-overflow-tooltip
                        />
                        <el-table-column
                            prop="Date"
                            :label="LANG('Create Date~创建日期')"
                            width="150"
                        />
                        <el-table-column
                            :label="LANG('Operations~操作')"
                            width="250"
                        >
                            <template #default="scope">
                                <el-button
                                    size="small"
                                    @click="viewTask(scope.row)"
                                >
                                    {{ LANG('View~查看') }}
                                </el-button>
                                <el-button
                                    size="small"
                                    type="success"
                                    @click="executeTask(scope.row)"
                                >
                                    {{ LANG('Execute~执行') }}
                                </el-button>
                                <el-button
                                    size="small"
                                    type="warning"
                                    @click="modifyTask(scope.row)"
                                >
                                    {{ LANG('Modify~修改') }}
                                </el-button>
                                <el-button
                                    size="small"
                                    type="danger"
                                    @click="deleteTask(scope.row)"
                                >
                                    {{ LANG('Delete~删除') }}
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-col>
            </el-row>
        </div>
    `,
    data() {
        return {
            search: '',
            list: [],
            loading: false,
            filteredList: []
        }
    },
    mounted() {
        console.log('Task List Component mounted in SPA mode');
        this.loadTasks();
    },
    methods: {
        loadTasks() {
            this.loading = true;
            const url = this.backEndAddressServiceWrapper + '/queryTasks';
            
            fetch(url)
                .then(response => response.json())
                .then(re => {
                    this.list = re;
                    this.filteredList = re;
                    this.loading = false;
                })
                .catch(error => {
                    console.error('Failed to load tasks:', error);
                    this.loading = false;
                });
        },
        handleSearch() {
            if (!this.search.trim()) {
                this.filteredList = this.list;
                return;
            }
            this.filteredList = this.list.filter(item => 
                item.URL && item.URL.toLowerCase().includes(this.search.toLowerCase())
            );
        },
        newTask() {
            this.$router.push('/new-task');
        },
        viewTask(row) {
            this.$router.push(`/task-info/${row.ID}`);
        },
        executeTask(row) {
            this.$router.push({
                path: '/execute-task',
                query: { id: row.ID }
            });
        },
        modifyTask(row) {
            this.$router.push({
                path: '/flow-chart',
                query: { id: row.ID }
            });
        },
        deleteTask(row) {
            this.$confirm(
                this.LANG('Are you sure to delete this task?~确定要删除这个任务吗？'),
                this.LANG('Warning~警告'),
                {
                    confirmButtonText: this.LANG('OK~确定'),
                    cancelButtonText: this.LANG('Cancel~取消'),
                    type: 'warning'
                }
            ).then(() => {
                this.loading = true;
                const url = this.backEndAddressServiceWrapper + '/deleteTask?id=' + row.ID;
                
                fetch(url, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            this.$message.success(this.LANG('Delete successfully~删除成功'));
                            this.loadTasks();
                        } else {
                            this.$message.error(result.message || this.LANG('Delete failed~删除失败'));
                        }
                    })
                    .catch(error => {
                        console.error('Delete failed:', error);
                        this.$message.error(this.LANG('Delete failed~删除失败'));
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            }).catch(() => {
                this.$message.info(this.LANG('Delete canceled~删除已取消'));
            });
        },
        LANG(text) {
            const [en, zh] = text.split("~");
            return this.lang === 'zh' ? zh : en;
        }
    },
    computed: {
        lang() {
            return this.$route.query.lang || 'zh';
        },
        backEndAddressServiceWrapper() {
            return this.$route.query.backEndAddressServiceWrapper || window.backEndAddressServiceWrapper || "http://localhost:8074";
        }
    }
};