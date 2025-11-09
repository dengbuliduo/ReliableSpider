// Import existing translations
import enStrings from './en/strings.js';
import zhStrings from './zh/strings.js';

// Task-specific translations
const taskTranslations = {
    en: {
        'Task List': 'Task List',
        'View this table by direction keys on keyboard': 'View this table by direction keys on keyboard',
        'New Task': 'New Task',
        'No Task': 'No Task',
        'Task ID': 'Task ID',
        'Task Name': 'Task Name',
        'Please input keywords to search': 'Please input keywords to search',
        'View': 'View',
        'Modify': 'Modify',
        'Delete': 'Delete',
        'Are you sure to delete this task?': 'Are you sure to delete this task?',
        'Software Documentation': 'Software Documentation',
        'Ask questions here': 'Ask questions here',
        'See how to run task by schedule': 'See how to run task by schedule',
        'Loading hint': 'Loading official tutorials and Q&A platform from Github might be slow, please be patient.',
    },
    zh: {
        'Task List': '任务列表',
        'View this table by direction keys on keyboard': '按键盘方向键浏览此表格',
        'New Task': '创建新任务',
        'No Task': '暂无任务',
        'Task ID': '任务ID',
        'Task Name': '任务名称',
        'Please input keywords to search': '请输入关键词搜索',
        'View': '任务信息',
        'Modify': '修改任务',
        'Delete': '删除任务',
        'Are you sure to delete this task?': '确定要删除此任务吗？',
        'Software Documentation': '软件使用说明文档',
        'Ask questions here': '官方答疑平台',
        'See how to run task by schedule': '定时执行任务教程',
        'Loading hint': '提示：下方的官方教程和答疑平台均在Github，可能出现访问速度慢的问题，请耐心等待。',
    }
};

// Merge existing translations with task-specific translations
export const resources = {
    en: {
        translation: {
            ...enStrings,
            ...taskTranslations.en
        }
    },
    zh: {
        translation: {
            ...zhStrings,
            ...taskTranslations.zh
        }
    }
};