import enLocale from './locale/en/strings.js';
import zhLocale from './locale/zh/strings.js';

// helper to get URL params
function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return "";
}

// Use the UMD builds loaded by index.html (no bundler resolution required)
const i18next = window.i18next;
const LanguageDetector = window.i18nextBrowserLanguageDetector;

const resources = {
    en: { translation: enLocale },
    zh: { translation: zhLocale }
};

const appOptions = {
    data() {
        return {
            init: true,
            lang: '-',
            user_data_folder: getUrlParam("user_data_folder"),
            copyright: 0,
            step: 0,
            newest_version: '-',
        }
    },
    mounted() {
        this.copyright = parseInt(getUrlParam("copyright"));
        if (this.copyright == 0) {
            this.step = -1;
        }
        this.lang = getUrlParam("lang");
        if (this.lang == 'undefined' || this.lang == '') {
            this.lang = '-';
        }
        // fetch latest version
        const request = new XMLHttpRequest();
        request.open('GET', `https://api.github.com/repos/NaiboWang/ReliableSpider/releases/latest`);
        request.setRequestHeader('User-Agent', 'JavaScript');
        request.onload = () => {
            try {
                const release = JSON.parse(request.responseText);
                this.newest_version = release.tag_name;
            } catch (e) {}
        };
        request.onerror = function() { console.error('Error: failed to get latest version.'); };
        request.send();
    },
    methods: {
        changeLang(lang = 'zh') {
            this.lang = lang;
            i18next.changeLanguage(lang);
            try { window.electronAPI.changeLang(lang); } catch (e) {}
        },
        acceptAgreement() {
            this.step = 0;
            try { window.electronAPI.acceptAgreement(); } catch (e) {}
        },
        startDesign(lang, with_data = false, mobile = false) {
            if (with_data) {
                if (this.user_data_folder == null || this.user_data_folder == "") {
                    if (lang == 'zh') alert("请指定用户信息目录"); else alert("Please specify the user information directory");
                    return;
                }
                try { window.electronAPI.startDesign(lang, this.user_data_folder, mobile); } catch (e) {}
            } else {
                try { window.electronAPI.startDesign(lang, '', mobile); } catch (e) {}
            }
        },
        startInvoke(lang) {
            try { window.electronAPI.startInvoke(lang); } catch (e) {}
        }
    }
};

// Initialize i18next in the renderer (UMD mode)
i18next.use(LanguageDetector).init({
    resources,
    fallbackLng: 'en',
    debug: false,
}, (err, t) => {
    if (err) console.error('i18next init error', err);

    // Create Vue app and inject i18next.t as $t for template usage after i18next is ready
    const app = Vue.createApp(appOptions);
    app.config.globalProperties.$t = function (key) { return i18next.t(key); };
    const vm = app.mount('#app');

    // Small helper to bind i18next text into static parts of the page that aren't reactive via Vue
    function localizeStatic() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = i18next.t(key);
        });
    }

    i18next.on('languageChanged', (lng) => {
        try { vm.lang = lng; } catch (e) {}
        localizeStatic();
    });

    // initial localization for static nodes
    localizeStatic();
});