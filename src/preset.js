import { S } from './state';
import { t } from './i18n';

var EXCLUDE_KEYS = {
    'dse3_npf': true,
    'dse3_npc': true,
    'dse3_avui': true,
    'dse3_lang': true
};

function getKnownKeys() {
    var keys = [];
    for (var k in S.K) {
        if (Object.prototype.hasOwnProperty.call(S.K, k)) {
            var storageKey = S.K[k];
            if (!EXCLUDE_KEYS[storageKey]) keys.push(storageKey);
        }
    }
    return keys;
}

function timestamp() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
}

export function exportPreset() {
    var keys = getKnownKeys();
    var settings = {};
    for (var i = 0; i < keys.length; i++) {
        var val = GM_getValue(keys[i], undefined);
        if (val !== undefined && val !== null) settings[keys[i]] = val;
    }
    var data = {
        __preset_version: 1,
        __app_version: '4.6.0',
        __exported_at: new Date().toISOString(),
        settings: settings
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'deepseek-enhancer-preset-' + timestamp() + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 200);
}

export function importPreset(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
        var text = reader.result;
        var data;
        try { data = JSON.parse(text); }
        catch (e) { alert(t('预设文件格式无效')); return; }
        if (!data || data.__preset_version !== 1 || !data.settings || typeof data.settings !== 'object') {
            alert(t('预设文件格式无效'));
            return;
        }
        var known = {};
        var keys = getKnownKeys();
        for (var i = 0; i < keys.length; i++) known[keys[i]] = true;
        if (!confirm(t('导入预设将覆盖当前所有设置并刷新页面，确定继续？'))) return;
        var applied = 0;
        for (var key in data.settings) {
            if (Object.prototype.hasOwnProperty.call(data.settings, key) && known[key]) {
                GM_setValue(key, data.settings[key]);
                applied++;
            }
        }
        location.reload();
    };
    reader.onerror = function () { alert(t('预设文件格式无效')); };
    reader.readAsText(file, 'utf-8');
}
