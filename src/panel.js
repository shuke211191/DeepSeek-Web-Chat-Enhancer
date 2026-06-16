import { S, DEF } from './state';
import { cloneObj, cloneDef, esc, getMode, updateUI } from './utils';
import { applyTheme, applyAfter } from './theme';
import { loadFont } from './font';
import { setAvatarState, applyAvatarSettings, applyAvatarSize, scheduleAvatarUpdate } from './avatars';
import { setupFormulaCopier } from './formula';
import { setupThinkCollapse, resetThinkCollapse, stopThinkCollapse } from './think-collapse';
import { setupUserCollapse, stopUserCollapse } from './user-collapse';
import { setupCodeFold, stopCodeFold, setupCodeBlockHeight, stopCodeBlockHeight } from './code-collapse';
import { t, refreshLang } from './i18n';

export function syncPanelMode() {
    S.panelMode = getMode();
    var panel = document.getElementById('dse-panel'); if (!panel) return;
    var tabs = panel.querySelectorAll('.dse-mode-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].dataset.mode === S.panelMode);
    renderPanelContent();
}

function bindToggle(id, cb) { var el = document.getElementById(id); if (!el) return; var n = el.cloneNode(true); el.parentNode.replaceChild(n, el); n.addEventListener('change', function () { cb(n.checked); }); }

function rebindPanelToggles() {
    bindToggle('dse-page-toggle', function (v) { S.pageOn = v; GM_setValue(S.K.PAGE_ON, v); applyAfter(); renderPanelContent(); });
    bindToggle('dse-bubble-toggle', function (v) { S.bubbleOn = v; GM_setValue(S.K.BUBBLE_ON, v); applyAfter(); renderPanelContent(); });
    bindToggle('dse-strong-toggle', function (v) { S.strongOn = v; GM_setValue(S.K.STRONG_ON, v); applyAfter(); renderPanelContent(); });
    bindToggle('dse-code-toggle', function (v) { S.codeOn = v; GM_setValue(S.K.CODE_ON, v); applyAfter(); renderPanelContent(); });
    bindToggle('dse-font-toggle', function (v) { S.fontOn = v; GM_setValue(S.K.FONT_ON, v); loadFont(); updateUI(); renderPanelContent(); });
    bindToggle('dse-avatar-toggle', function (v) { setAvatarState(v); renderPanelContent(); });
    bindToggle('dse-formula-toggle', function (v) { S.formulaOn = v; GM_setValue(S.K.FORMULA_ON, v); setupFormulaCopier(); renderPanelContent(); });
    bindToggle('dse-npbtn-toggle', function (v) { S.showNotepadBtn = v; GM_setValue(S.K.SHOW_NP_BTN, v); var b = document.getElementById('dse-notepad-trigger'); if (b) b.style.display = v ? '' : 'none'; updateUI(); renderPanelContent(); });
    bindToggle('dse-darkbtn-toggle', function (v) { S.showDarkBtn = v; GM_setValue(S.K.SHOW_DARK_BTN, v); var b = document.getElementById('dse-dark-toggle'); if (b) b.style.display = v ? '' : 'none'; updateUI(); renderPanelContent(); });
    bindToggle('dse-think-toggle', function (v) { S.autoThinkOn = v; GM_setValue(S.K.AUTO_THINK_ON, v); if (v) setupThinkCollapse(); else stopThinkCollapse(); renderPanelContent(); });
    bindToggle('dse-code-fold-toggle', function (v) { S.codeFoldOn = v; GM_setValue(S.K.CODE_FOLD_ON, v); if (v) setupCodeFold(); else stopCodeFold(); renderPanelContent(); });
    bindToggle('dse-code-height-toggle', function (v) { S.codeBlockHeightOn = v; GM_setValue(S.K.CODE_BLOCK_HEIGHT_ON, v); if (v) setupCodeBlockHeight(); else stopCodeBlockHeight(); renderPanelContent(); });
    bindToggle('dse-user-fold-toggle', function (v) { S.autoCollapseUser = v; GM_setValue(S.K.AUTO_COLLAPSE_USER, v); if (v) setupUserCollapse(); else stopUserCollapse(); renderPanelContent(); });
    bindToggle('dse-focus-toggle', function (v) { S.focusInputShortcut = v; GM_setValue(S.K.FOCUS_INPUT_SHORTCUT, v); });
}

function syncPanelLeftToggles() {
    var pageToggle = document.getElementById("dse-page-toggle");
    var bubbleToggle = document.getElementById("dse-bubble-toggle");
    var fontToggle = document.getElementById("dse-font-toggle");
    var avatarToggle = document.getElementById("dse-avatar-toggle");

    if (pageToggle) pageToggle.checked = S.pageOn;
    if (bubbleToggle) bubbleToggle.checked = S.bubbleOn;
    if (fontToggle) fontToggle.checked = S.fontOn;
    if (avatarToggle) avatarToggle.checked = S.avatarOn;
}

export function renderPanelContent() {
    var right = document.getElementById('dse-panel-right'); if (!right) return;
    if (!S.pageColors[S.panelMode]) S.pageColors[S.panelMode] = cloneObj(DEF[S.panelMode]);

    var html = '';
    function colorRow(key, label, g) {
        var val = g === 'bubble' ? S.bubbleColors[key] : g === 'strong' ? S.strongColors[key] : g === 'code' ? S.codeColors[key] : S.pageColors[S.panelMode][key];
        return '<div class="dse-r"><label>' + t(label) + '</label><input type="color" data-k="' + key + '" data-g="' + g + '" value="' + (val || '#000') + '"></div>';
    }

    if (S.activePanelTab === 'page') {
        html += '<div class="dse-mode-tabs"><button class="dse-mode-tab' + (S.panelMode === 'light' ? ' on' : '') + '" data-mode="light">' + t('浅色模式') + '</button><button class="dse-mode-tab' + (S.panelMode === 'dark' ? ' on' : '') + '" data-mode="dark">' + t('深色模式') + '</button></div>';
        html += '<div class="dse-grid">' + colorRow('--dsw-alias-bg-base','页面背景','page') + colorRow('--dsw-alias-bg-layer-2','表面/卡片','page') + colorRow('--dsw-alias-brand-primary','主题色','page') + '</div>';
        html += '<div class="dse-sep"></div><div class="dse-grid">' + colorRow('--dsw-alias-label-primary','主文字','page') + colorRow('--dsw-alias-label-secondary','次文字','page') + colorRow('--dsw-alias-label-tertiary','辅助文字','page') + '</div>';
        html += '<div class="dse-sep"></div><div class="dse-grid">' + colorRow('--dsw-alias-border-l1','主边框','page') + colorRow('--dsw-alias-border-l2','次边框','page') + '</div>';
    } else if (S.activePanelTab === 'bubble') {
        html += '<div class="dse-section-label">' + t('用户气泡') + '</div><div class="dse-grid">' + colorRow('userBg','背景','bubble') + colorRow('userText','文字','bubble') + '</div>';
        html += '<div class="dse-sep"></div><div class="dse-section-label">' + t('AI气泡') + '</div><div class="dse-grid">' + colorRow('aiBgL','背景(浅)','bubble') + colorRow('aiBgD','背景(深)','bubble') + colorRow('aiTextL','文字(浅)','bubble') + colorRow('aiTextD','文字(深)','bubble') + '</div>';
    } else if (S.activePanelTab === 'strongcode') {
        html += '<div class="dse-toggler"><label class="tgl">' + t('自定义强调颜色') + '</label><label class="dse-sw"><input id="dse-strong-toggle" type="checkbox"' + (S.strongOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
        html += '<div id="dse-strong-rows" style="' + (S.strongOn ? '' : 'display:none') + '"><div class="dse-grid">' + colorRow('light','浅色','strong') + colorRow('dark','深色','strong') + '</div></div>';
        html += '<div class="dse-toggler"><label class="tgl">' + t('自定义行内代码') + '</label><label class="dse-sw"><input id="dse-code-toggle" type="checkbox"' + (S.codeOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
        html += '<div id="dse-code-rows" style="' + (S.codeOn ? '' : 'display:none') + '"><div class="dse-grid">' + colorRow('bgL','背景(浅)','code') + colorRow('bgD','背景(深)','code') + colorRow('textL','文字(浅)','code') + colorRow('textD','文字(深)','code') + '</div></div>';
        html += '<div class="dse-sep"></div>';
        html += '<div class="dse-toggler"><label class="tgl">' + t('启用代码块折叠') + '</label><label class="dse-sw"><input id="dse-code-fold-toggle" type="checkbox"' + (S.codeFoldOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
        html += '<div class="dse-toggler"><label class="tgl">' + t('限制代码块高度') + '</label><label class="dse-sw"><input id="dse-code-height-toggle" type="checkbox"' + (S.codeBlockHeightOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
    } else if (S.activePanelTab === 'lang') {
        html += '<div class="dse-r"><label>' + t('界面语言') + '</label>' +
            '<select id="dse-lang" class="dse-input">' +
            '<option value="auto"' + (S.lang === 'auto' ? ' selected' : '') + '>' + t('自动') + '</option>' +
            '<option value="zh"' + (S.lang === 'zh' ? ' selected' : '') + '>中文</option>' +
            '<option value="en"' + (S.lang === 'en' ? ' selected' : '') + '>English</option>' +
            '</select></div>';
    } else if (S.activePanelTab === 'font') {
        html += '<div class="dse-r"><label>' + t('来源') + '</label><select id="dse-font-src" class="dse-input"><option value="system"' + (S.fontSrc === 'system' ? ' selected' : '') + '>' + t('系统字体') + '</option><option value="google"' + (S.fontSrc === 'google' ? ' selected' : '') + '>Google Fonts</option></select></div>';
        html += '<div class="dse-r"><label>' + t('字体名称') + '</label><input id="dse-font-name" class="dse-input" type="text" value="' + esc(S.fontName) + '"></div>';
    } else if (S.activePanelTab === 'avatar') {
        html += '<div class="dse-r"><label>' + t('你的头像色') + '</label><input type="color" data-k="avuc" data-g="avatar" value="' + S.avatarUC + '"></div>';
        html += '<div class="dse-r"><label>' + t('你的名字') + '</label><input id="dse-avatar-uname" class="dse-input" type="text" value="' + esc(S.avatarUName) + '"></div>';
        html += '<div class="dse-r"><label>' + t('你的头像图') + '</label><input id="dse-avatar-uimg" class="dse-input" type="text" placeholder="' + t('图片URL') + '" value="' + esc(S.avatarUserImg) + '"></div>';
        html += '<div class="dse-sep"></div>';
        html += '<div class="dse-r"><label>' + t('AI头像色') + '</label><input type="color" data-k="avac" data-g="avatar" value="' + S.avatarAC + '"></div>';
        html += '<div class="dse-r"><label>' + t('AI名字') + '</label><input id="dse-avatar-aname" class="dse-input" type="text" value="' + esc(S.avatarAName) + '"></div>';
        html += '<div class="dse-r"><label>' + t('AI头像图') + '</label><input id="dse-avatar-aimg" class="dse-input" type="text" placeholder="' + t('图片URL') + '" value="' + esc(S.avatarAIImg) + '"></div>';
        html += '<div class="dse-sep"></div>';
        html += '<div class="dse-r"><label>' + t('头像大小') + '</label><input id="dse-avatar-size" type="range" min="16" max="128" step="4" value="' + (S.avatarSize || 30) + '" style="width:120px"><span style="font-size:11px;color:var(--dsw-alias-label-secondary);margin-left:4px">' + (S.avatarSize || 30) + 'px</span></div>';
        html += '<div class="dse-r"><label>' + t('头像间距') + '</label><input id="dse-avatar-gap" type="range" min="4" max="64" step="2" value="' + (S.avatarGap || 12) + '" style="width:120px"><span style="font-size:11px;color:var(--dsw-alias-label-secondary);margin-left:4px">' + (S.avatarGap || 12) + 'px</span></div>';
    } else if (S.activePanelTab === 'other') {
        html += '<div class="dse-toggler"><label class="tgl">' + t('显示笔记按钮') + '</label><label class="dse-sw"><input id="dse-npbtn-toggle" type="checkbox"' + (S.showNotepadBtn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
        html += '<div class="dse-toggler"><label class="tgl">' + t('显示深浅色切换按钮') + '</label><label class="dse-sw"><input id="dse-darkbtn-toggle" type="checkbox"' + (S.showDarkBtn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
        html += '<div class="dse-sep"></div>';
        html += '<div class="dse-toggler"><label class="tgl">' + t('启用公式复制') + '</label><label class="dse-sw"><input id="dse-formula-toggle" type="checkbox"' + (S.formulaOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
        html += '<div class="dse-toggler"><label class="tgl">' + t('自动折叠用户输入') + '</label><label class="dse-sw"><input id="dse-user-fold-toggle" type="checkbox"' + (S.autoCollapseUser ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
        html += '<div class="dse-toggler"><label class="tgl">' + t('自动折叠思考块') + '</label><label class="dse-sw"><input id="dse-think-toggle" type="checkbox"' + (S.autoThinkOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
        if (S.autoThinkOn) {
            html += '<div id="dse-think-rows"><div class="dse-r"><label>' + t('折叠模式') + '</label><select id="dse-think-mode" class="dse-input"><option value="always"' + (S.autoThinkMode === 'always' ? ' selected' : '') + '>' + t('始终折叠') + '</option><option value="after_think"' + (S.autoThinkMode === 'after_think' ? ' selected' : '') + '>' + t('思考结束后折叠') + '</option></select></div>';
            html += '<div class="dse-r"' + (S.autoThinkMode !== 'after_think' ? ' style="display:none"' : '') + '><label>' + t('延迟 (ms)') + '</label><input id="dse-think-delay" class="dse-input" type="number" min="0" max="10000" step="100" value="' + S.autoThinkDelay + '"></div></div>';
        }
        html += '<div class="dse-sep"></div>';
        html += '<div class="dse-toggler"><label class="tgl">' + t('快速定位到输入框 (Ctrl+Alt+/)') + '</label><label class="dse-sw"><input id="dse-focus-toggle" type="checkbox"' + (S.focusInputShortcut ? ' checked' : '') + '><span class="dse-sl"></span></label></div>';
    }
    right.innerHTML = html;

    var modeTabs = right.querySelectorAll('.dse-mode-tab');
    for (var ti = 0; ti < modeTabs.length; ti++) {
        (function (tab) { tab.addEventListener('click', function (e) { e.stopPropagation(); S.panelMode = tab.dataset.mode; renderPanelContent(); }); })(modeTabs[ti]);
    }
    rebindPanelToggles();
    syncPanelLeftToggles();
}

function selectPanelTab(name) {
    S.activePanelTab = name;
    var left = document.getElementById('dse-panel-left');
    if (left) { var items = left.querySelectorAll('.dse-tab-item'); for (var i = 0; i < items.length; i++) items[i].classList.toggle('on', items[i].dataset.tab === name); }
    renderPanelContent();
}

export function createPanel() {
    var existing = document.getElementById('dse-panel'); if (existing) return existing;
    var panel = document.createElement('div'); panel.id = 'dse-panel';
    panel.innerHTML =
        '<style>#dse-panel{position:fixed;bottom:110px;right:68px;z-index:99998;flex-direction:row;background:var(--dsw-alias-bg-layer-2,#fff);border:1px solid var(--dsw-alias-border-l2,#e0e4ea);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.15);font-family:system-ui,sans-serif;font-size:13px;width:430px;max-height:75vh;overflow:hidden;display:none;}.dark #dse-panel{background:#1e2430;border-color:#3a4050;}' +
        '#dse-panel-left{flex-shrink:0;width:140px;padding:12px 12px 12px 12px;border-right:1px solid var(--dsw-alias-border-l2);display:flex;flex-direction:column;gap:2px;overflow-y:auto;}' +
        '#dse-panel-left .dse-tab-item{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 8px 8px;border-radius:8px;cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:13px;transition:background .15s;user-select:none;}' +
        '#dse-panel-left .dse-tab-item:hover{background:var(--dsw-alias-interactive-bg-hover);}#dse-panel-left .dse-tab-item.on{background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary);}' +
        '#dse-panel-left .dse-sw{position:relative;width:36px;height:18px;flex-shrink:0;}#dse-panel-left .dse-sw input{opacity:0;width:0;height:0;}' +
        '#dse-panel-left .dse-sl{position:absolute;top:0;left:0;right:0;bottom:0;background:#ccc;border-radius:18px;cursor:pointer;transition:.2s;}#dse-panel-left .dse-sl:before{content:"";position:absolute;height:12px;width:12px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;}' +
        '#dse-panel-left input:checked+.dse-sl{background:var(--dsw-alias-brand-primary,#5686fe);}#dse-panel-left input:checked+.dse-sl:before{transform:translateX(18px);}' +
        '#dse-panel-left .dse-rst{width:calc(100% - 14px);padding:7px;margin-top:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;text-align:center;}' +
        '#dse-panel-left .dse-rst:hover{background:var(--dsw-alias-interactive-bg-hover);}#dse-panel-right{flex:1;padding:14px;overflow-y:auto;min-width:0;}' +
        '#dse-panel .dse-mode-tabs{display:flex;gap:4px;margin-bottom:10px;}#dse-panel .dse-mode-tab{flex:1;padding:6px;text-align:center;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary);background:transparent;}#dse-panel .dse-mode-tab.on{background:var(--dsw-alias-brand-primary);color:#fff;border-color:var(--dsw-alias-brand-primary);}' +
        '#dse-panel .dse-r{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;gap:8px;padding:3px 4px;border-radius:6px;transition:background .15s;}#dse-panel .dse-r:hover{background:var(--dsw-alias-interactive-bg-hover);}#dse-panel .dse-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;}#dse-panel .dse-section-label{font-size:11px;color:var(--dsw-alias-label-tertiary);margin:4px 0 2px;letter-spacing:.5px;}#dse-panel .dse-r label{color:var(--dsw-alias-label-secondary);font-size:12.5px;flex-shrink:0;white-space:nowrap;}#dse-panel input[type=color]{width:32px;height:26px;border:1px solid var(--dsw-alias-border-l1);border-radius:5px;cursor:pointer;padding:0;flex-shrink:0;}' +
        '#dse-panel .dse-input{width:130px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:3px 6px;font-size:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}#dse-panel .dse-toggler{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;padding:4px 0;}#dse-panel .dse-toggler label.tgl{color:var(--dsw-alias-label-primary);font-size:13px;}' +
        '#dse-panel .dse-sw{position:relative;width:38px;height:20px;flex-shrink:0;}#dse-panel .dse-sw input{opacity:0;width:0;height:0;}#dse-panel .dse-sl{position:absolute;top:0;left:0;right:0;bottom:0;background:#ccc;border-radius:20px;cursor:pointer;transition:.2s;}#dse-panel .dse-sl:before{content:"";position:absolute;height:14px;width:14px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;}#dse-panel input:checked+.dse-sl{background:var(--dsw-alias-brand-primary,#5686fe);}#dse-panel input:checked+.dse-sl:before{transform:translateX(18px);}#dse-panel .dse-sep{border-top:1px solid var(--dsw-alias-border-l1,#e0e4ea);margin:10px 0;}</style>' +
        '<div id="dse-panel-left">' +
        '<div class="dse-tab-item on" data-tab="page"><span>' + t('页面配色') + '</span><label class="dse-sw"><input id="dse-page-toggle" type="checkbox"' + (S.pageOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>' +
        '<div class="dse-tab-item" data-tab="bubble"><span>' + t('消息气泡') + '</span><label class="dse-sw"><input id="dse-bubble-toggle" type="checkbox"' + (S.bubbleOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>' +
        '<div class="dse-tab-item" data-tab="strongcode"><span>' + t('强调/代码') + '</span></div>' +
        '<div class="dse-tab-item" data-tab="font"><span>' + t('字体') + '</span><label class="dse-sw"><input id="dse-font-toggle" type="checkbox"' + (S.fontOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>' +
        '<div class="dse-tab-item" data-tab="avatar"><span>' + t('头像') + '</span><label class="dse-sw"><input id="dse-avatar-toggle" type="checkbox"' + (S.avatarOn ? ' checked' : '') + '><span class="dse-sl"></span></label></div>' +
        '<div class="dse-tab-item" data-tab="lang"><span>' + t('语言') + '</span></div>' +
        '<div class="dse-tab-item" data-tab="other"><span>' + t('其他') + '</span></div>' +
        '<div class="dse-sep"></div><button class="dse-rst">' + t('恢复默认') + '</button></div><div id="dse-panel-right"></div>';
    document.body.appendChild(panel);

    panel.querySelectorAll('.dse-tab-item').forEach(function (item) {
        item.addEventListener('click', function (e) { if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return; selectPanelTab(item.dataset.tab); });
    });

    panel.addEventListener('input', function (e) {
        var inp = e.target; if (!inp.dataset.k) return;
        var key = inp.dataset.k, val = inp.value, g = inp.dataset.g;
        if (g === 'page') { if (!S.pageColors[S.panelMode]) S.pageColors[S.panelMode] = cloneObj(DEF[S.panelMode]); S.pageColors[S.panelMode][key] = val; GM_setValue(S.K.PAGE_COLORS, S.pageColors); }
        else if (g === 'bubble') { S.bubbleColors[key] = val; GM_setValue(S.K.BUBBLE_COLORS, S.bubbleColors); }
        else if (g === 'strong') { S.strongColors[key] = val; GM_setValue(S.K.STRONG_C, S.strongColors); }
        else if (g === 'code') { S.codeColors[key] = val; GM_setValue(S.K.CODE_C, S.codeColors); }
        else if (g === 'avatar') { if (key === 'avuc') { S.avatarUC = val; GM_setValue(S.K.AVATAR_UC, val); } else { S.avatarAC = val; GM_setValue(S.K.AVATAR_AC, val); } applyAvatarSettings(); return; }
        if (S.pageOn && g === 'page' || S.bubbleOn && g === 'bubble' || g === 'strong' || g === 'code') applyTheme(getMode());
    });

    panel.addEventListener('change', function (e) {
        if (e.target.id === 'dse-font-src') { S.fontSrc = e.target.value; GM_setValue(S.K.FONT_SRC, S.fontSrc); loadFont(); }
        if (e.target.id === 'dse-font-name') { S.fontName = e.target.value; GM_setValue(S.K.FONT_NAME, S.fontName); loadFont(); }
        if (e.target.id === 'dse-avatar-uname') { S.avatarUName = e.target.value || t('你'); GM_setValue(S.K.AVATAR_UNAME, S.avatarUName); applyAvatarSettings(); }
        if (e.target.id === 'dse-avatar-aname') { S.avatarAName = e.target.value || 'DeepSeek'; GM_setValue(S.K.AVATAR_ANAME, S.avatarAName); applyAvatarSettings(); }
        if (e.target.id === 'dse-avatar-uimg') { S.avatarUserImg = e.target.value; GM_setValue(S.K.AVATAR_UIMG, S.avatarUserImg); applyAvatarSettings(); }
        if (e.target.id === 'dse-avatar-aimg') { S.avatarAIImg = e.target.value; GM_setValue(S.K.AVATAR_AIMG, S.avatarAIImg); applyAvatarSettings(); }
        if (e.target.id === 'dse-avatar-size') { S.avatarSize = parseInt(e.target.value, 10) || 30; GM_setValue(S.K.AVATAR_SIZE, S.avatarSize); applyAvatarSize(); var s = e.target.nextElementSibling; if (s) s.textContent = S.avatarSize + 'px'; }
        if (e.target.id === 'dse-avatar-gap') { S.avatarGap = parseInt(e.target.value, 10) || 12; GM_setValue(S.K.AVATAR_GAP, S.avatarGap); scheduleAvatarUpdate(); var g = e.target.nextElementSibling; if (g) g.textContent = S.avatarGap + 'px'; }
        if (e.target.id === 'dse-think-mode') { S.autoThinkMode = e.target.value; GM_setValue(S.K.AUTO_THINK_MODE, S.autoThinkMode); renderPanelContent(); resetThinkCollapse(); }
        if (e.target.id === 'dse-think-delay') { var v = parseInt(e.target.value, 10); S.autoThinkDelay = isNaN(v) || v < 0 ? 0 : Math.min(v, 10000); GM_setValue(S.K.AUTO_THINK_DELAY, S.autoThinkDelay); }
        if (e.target.id === 'dse-lang') { S.lang = e.target.value; GM_setValue(S.K.LANG, S.lang); refreshLang(); renderPanelContent(); }
    });

    panel.querySelector('.dse-rst').addEventListener('click', function () {
        S.pageColors = cloneDef(DEF);
        S.bubbleColors = { userBg: '#5686fe', userText: '#ffffff', aiBgL: '#f8fafc', aiBgD: '#1e2430', aiTextL: '#1a1a2e', aiTextD: '#d1d5db' };
        S.strongColors = { light: '#1a1a2e', dark: '#e5e7eb' }; S.codeColors = { bgL: '#f0f4ff', bgD: '#1e2430', textL: '#5686fe', textD: '#8cb4ff' };
        S.fontSrc = 'system'; S.fontName = ''; S.avatarUName = t('你'); S.avatarAName = 'DeepSeek'; S.avatarUC = '#5686fe'; S.avatarAC = '#10a37f';
        S.avatarSize = 64; S.avatarUserImg = ''; S.avatarAIImg = 'https://www.deepseek.com/favicon.ico'; S.avatarGap = 32;
        S.formulaOn = false; S.showNotepadBtn = true; S.showDarkBtn = true;
        S.autoThinkOn = false; S.autoThinkMode = 'always'; S.autoThinkDelay = 500;
        stopThinkCollapse();
        S.autoCollapseUser = false; stopUserCollapse();
        S.focusInputShortcut = true;
        for (var kk in S.K) { if (Object.prototype.hasOwnProperty.call(S.K, kk)) { try { GM_deleteValue(S.K[kk]); } catch (ex) { GM_setValue(S.K[kk], null); } } }
        syncPanelMode(); applyTheme(getMode()); loadFont(); updateUI(); applyAvatarSettings(); applyAvatarSize();
    });

    document.addEventListener('click', function (e) { if (!panel.contains(e.target) && !e.target.closest('#dse-panel-trigger')) { panel.style.display = 'none'; S.panelVisible = false; } });
    selectPanelTab('page');
    return panel;
}
