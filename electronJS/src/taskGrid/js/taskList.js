// 任务列表脚本 - 非模块化版本
// 使用全局变量方式引入 Vue 和相关库

// 从URL获取参数
function getUrlParam(name) {
    const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    const r = window.location.search.substr(1).match(reg);
    if (r != null) return decodeURIComponent(r[2]);
    return "";
}

// 初始化应用
function initializeApp() {
    // 检查 Vue 是否已全局加载
    if (typeof Vue === 'undefined') {
        console.error('Vue is not loaded. Please include Vue.js first.');
        return;
    }
    
    // 检查 Element Plus 是否已全局加载
    if (typeof ElementPlus === 'undefined') {
        console.warn('Element Plus is not loaded. UI components may not work properly.');
    }
    
    const app = Vue.createApp({
        data() {
            return {
                search: '',
                list: [],
                lang: getUrlParam("lang") || 'en',
                type: 3,
                mobile: getUrlParam("mobile"),
                backEndAddressServiceWrapper: window.backEndAddressServiceWrapper || "http://localhost:8074"
            }
        },
        mounted() {
            console.log('Task List App mounted');
            this.loadTasks();
        },
        methods: {
            loadTasks() {
                const url = this.backEndAddressServiceWrapper + '/queryTasks';
                console.log('Loading tasks from:', url);
                
                fetch(url)
                    .then(response => response.json())
                    .then(re => {
                        console.log('Tasks loaded:', re);
                        this.list = re;
                        if (getUrlParam("type") == "1") {
                            this.type = 2;
                        }
                    })
                    .catch(error => {
                        console.error('Failed to load tasks:', error);
                        // 尝试备用路径
                        fetch('/queryTasks')
                            .then(response => response.json())
                            .then(re => {
                                this.list = re;
                            });
                    });
            },
            newTask() {
                window.location.href = "newTask.html?lang=" + this.lang + "&mobile=" + this.mobile + "&backEndAddressServiceWrapper=" + this.backEndAddressServiceWrapper;
            },
            deleteTask(row) {
                if (confirm('确认删除任务：' + row.name + '?')) {
                    const url = this.backEndAddressServiceWrapper + "/deleteTask?id=" + row.id;
                    fetch(url)
                        .then(() => {
                            this.loadTasks(); // 重新加载列表
                        });
                }
            },
            browseTask(row) {
                window.location.href = "taskInfo.html?id=" + row.id + "&lang=" + this.lang + "&backEndAddressServiceWrapper=" + this.backEndAddressServiceWrapper;
            },
            modifyTask(row) {
                console.log('Modify task:', row);
                // 这里可以添加修改逻辑
            },
            LANG(text) {
                const [en, zh] = text.split("~");
                return this.lang === 'zh' ? zh : en;
            },
            openExternal(url) {
                window.open(url, '_blank');
            },
            changeLang(lang) {
                this.lang = lang;
            },
            startDesign(lang) {
                window.location.href = "FlowChart.html?lang=" + lang;
            },
            startInvoke(lang) {
                window.location.href = "executeTask.html?lang=" + lang;
            }
        }
    });

    // 使用 Element Plus（全局方式）
    app.use(ElementPlus);

    // 挂载应用
    app.mount('#taskList');
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});