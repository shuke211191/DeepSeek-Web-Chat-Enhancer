// 与 DeepSeek 站点原生主题偏好对齐
// 站点用 appKit 存储句柄把主题偏好存在 localStorage：
//   key   = __appKit_@deepseek/chat_themePreference
//   value = JSON.stringify({ value: 'system'|'light'|'dark', __version: '0' })
// 启动时按该值重设 body：light/dark 类互斥、深色时 data-ds-dark-theme="dark"。
// 因此脚本的深浅色切换必须写回同一个键，否则刷新后被站点覆盖（表现为"记不住"）。

var APP_ID = '@deepseek/chat';
var KEY_PREFIX = '__appKit_';
var KEY_SUFFIX = '_themePreference';
var DEFAULT_VERSION = '0';

function exactKey() { return KEY_PREFIX + APP_ID + KEY_SUFFIX; }

// 键名随站点 appId 变化：优先精确键，其次扫描同前缀同后缀的键
export function findThemeKey() {
    var exact = exactKey(), i, k;
    try {
        for (i = 0; i < localStorage.length; i++) { if (localStorage.key(i) === exact) return exact; }
        for (i = 0; i < localStorage.length; i++) {
            k = localStorage.key(i) || '';
            if (k.indexOf(KEY_PREFIX) === 0 && k.slice(-KEY_SUFFIX.length) === KEY_SUFFIX) return k;
        }
    } catch (e) {}
    return exact;
}

// 返回 'system' | 'light' | 'dark'，读不到返回 null
export function readSiteTheme() {
    try {
        var raw = localStorage.getItem(findThemeKey());
        if (!raw) return null;
        var v = JSON.parse(raw).value;
        return (v === 'dark' || v === 'light' || v === 'system') ? v : null;
    } catch (e) { return null; }
}

// 解析为实际生效的 'light' | 'dark'（system 时读系统偏好，与站点 getOsTheme 一致）
export function resolveSiteTheme() {
    var v = readSiteTheme();
    if (v === 'light' || v === 'dark') return v;
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
}

// 取现有 __version；无记录/脏数据/存储不可用时回落 '0'（站点据此判断是否重置为默认）
function storedVersion(key) {
    try {
        var obj = JSON.parse(localStorage.getItem(key) || 'null');
        return (obj && obj.__version != null) ? obj.__version : DEFAULT_VERSION;
    } catch (e) { return DEFAULT_VERSION; }
}

// 写回站点原生偏好
export function saveSiteTheme(mode) {
    var key = findThemeKey(), version = storedVersion(key);
    try { localStorage.setItem(key, JSON.stringify({ value: mode, __version: version })); } catch (e) {}
}

// 复刻站点 o()：两态互斥、属性值为 'dark'、change-theme 期间禁用过渡
export function applySiteTheme(mode) {
    var body = document.body;
    body.classList.add('change-theme');
    if (mode === 'dark') {
        body.classList.remove('light'); body.classList.add('dark');
        body.dataset.dsDarkTheme = 'dark';
    } else {
        body.classList.remove('dark'); body.classList.add('light');
        body.removeAttribute('data-ds-dark-theme');
    }
    setTimeout(function () { body.classList.remove('change-theme'); }, 0);
}

// 切换：先对齐 DOM，再写站点原生偏好
export function setSiteTheme(mode) { applySiteTheme(mode); saveSiteTheme(mode); }
