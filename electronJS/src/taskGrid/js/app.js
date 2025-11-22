// 统一的 Vue 应用入口 - 单页应用模式

// 检查依赖是否加载完成
function checkDependencies() {
    const required = ['Vue', 'VueRouter', 'ElementPlus', 'TaskList', 'NewTask', 'TaskInfo', 'ExecuteTask', 'FlowChart'];
    const missing = required.filter(dep => typeof window[dep] === 'undefined');
    
    if (missing.length > 0) {
        console.log('Waiting for dependencies:', missing);
        return false;
    }
    return true;
}

// 全局工具函数
function LANG(text, lang = 'zh') {
    const [en, zh] = text.split("~");
    return lang === 'zh' ? zh : en;
}

function getUrlParam(name) {
    const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    const r = window.location.search.substring(1).match(reg);
    if (r != null) return decodeURIComponent(r[2]);
    return "";
}

// 全局状态管理
const globalState = {
    lang: getUrlParam("lang") || 'zh',
    mobile: getUrlParam("mobile"),
    backEndAddressServiceWrapper: window.backEndAddressServiceWrapper || "http://localhost:8074",
    user_data_folder: ""
};

// 创建路由
function createRouter() {
    const routes = [
        {
            path: '/',
            name: 'TaskList',
            component: window.TaskList
        },
        {
            path: '/new-task',
            name: 'NewTask',
            component: window.NewTask
        },
        {
            path: '/task-info/:id',
            name: 'TaskInfo',
            component: window.TaskInfo
        },
        {
            path: '/execute-task',
            name: 'ExecuteTask',
            component: window.ExecuteTask
        },
        {
            path: '/flow-chart',
            name: 'FlowChart',
            component: window.FlowChart
        }
    ];

    return VueRouter.createRouter({
        history: VueRouter.createWebHashHistory(),
        routes,
    });
}

// 创建主应用
function createApp() {
    const router = createRouter();

    const app = Vue.createApp({
        data() {
            return {
                lang: globalState.lang,
                mobile: globalState.mobile
            }
        },
        mounted() {
            console.log('Vue App mounted in single page mode');
        },
        methods: {
            changeLang(lang) {
                this.lang = lang;
                const query = { ...this.$route.query, lang: lang };
                this.$router.push({ path: this.$route.path, query: query });
            },
            LANG(text) {
                return LANG(text, this.lang);
            }
        }
    });

    app.use(ElementPlus);
    app.use(router);

    return { app, router };
}

// 初始化应用
function initializeApp() {
    if (!checkDependencies()) {
        setTimeout(initializeApp, 100);
        return;
    }

    const { app, router } = createApp();
    app.mount('#app');
    
    console.log('Vue single page application initialized successfully');
}

// 导出全局函数和组件
window.LANG = LANG;
window.getUrlParam = getUrlParam;
window.globalState = globalState;
window.initializeApp = initializeApp;