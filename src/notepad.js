import { S } from './state';
import { getScrollContainer, updateUI } from './utils';

var NOTIFY_TIMER = null;

function notify(msg, type) {
    var el = document.createElement('div');
    var bg = type === 'error' ? '#e74c3c' : type === 'success' ? '#10a37f' : '#3498db';
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:' + bg + ';color:#fff;padding:10px 18px;border-radius:6px;z-index:10001;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,.2);pointer-events:none;';
    el.textContent = msg;
    document.body.appendChild(el);
    clearTimeout(NOTIFY_TIMER);
    NOTIFY_TIMER = setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2500);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export function createNotepad() {
    if (S.notepadPanel) return;
    var container = getScrollContainer();
    var bounds = container ? container.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };

    var panel = document.createElement('div');
    panel.id = 'dse-notepad';
    panel.style.cssText = 'position:fixed;width:320px;height:420px;background:var(--dsw-alias-bg-layer-2,#fff);border:1px solid var(--dsw-alias-border-l2,#e0e4ea);border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.18);z-index:99996;font-family:var(--dsw-font-family),system-ui,sans-serif;display:none;flex-direction:column;overflow:hidden;resize:both;min-width:220px;min-height:200px;';

    panel.innerHTML =
        '<div class="np-header" style="background:var(--dsw-alias-bg-base,#f5f5f5);padding:7px 10px;cursor:move;display:flex;justify-content:space-between;align-items:center;user-select:none;border-radius:10px 10px 0 0;border-bottom:1px solid var(--dsw-alias-border-l2,#e0e4ea);">' +
        '<span style="font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)">📝 笔记</span>' +
        '<div style="display:flex;gap:4px;">' +
        '<button class="np-btn" id="np-btn-new" title="新建">📄</button>' +
        '<button class="np-btn" id="np-btn-dl" title="下载.md">📥</button>' +
        '<button class="np-btn" id="np-btn-close" title="关闭">✕</button>' +
        '</div></div>' +
        '<div class="np-body" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;">' +
        '<div style="padding:4px 8px;display:flex;align-items:center;gap:4px;background:var(--dsw-alias-bg-base,#fafafa);border-bottom:1px solid var(--dsw-alias-border-l2,#e0e4ea);">' +
        '<select id="np-file-select" style="flex:1;padding:3px 4px;border:1px solid var(--dsw-alias-border-l1,#ddd);border-radius:4px;font-size:11px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary);height:24px;min-width:0;">' +
        '<option value="">选择文件...</option></select>' +
        '<button class="np-btn-sm" id="np-btn-rename" title="重命名">✏️</button>' +
        '<button class="np-btn-sm" id="np-btn-delete" title="删除">🗑️</button>' +
        '</div>' +
        '<textarea id="np-textarea" placeholder="在此记录..." style="flex:1;width:100%;border:0;padding:8px 10px;font-size:14px;line-height:1.5;resize:none;outline:none;font-family:var(--dsw-font-family),Consolas,monospace;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary);box-sizing:border-box;"></textarea>' +
        '</div>' +
        '<div style="padding:3px 8px;border-top:1px solid var(--dsw-alias-border-l2,#e0e4ea);display:flex;justify-content:space-between;font-size:11px;color:var(--dsw-alias-label-tertiary,#888);min-height:20px;">' +
        '<span id="np-char-count">字符: 0</span>' +
        '<span id="np-file-info"></span>' +
        '<span id="np-save-status">本地存储</span>' +
        '</div>';

    document.body.appendChild(panel);

    // 内联样式
    var style = document.createElement('style');
    style.id = 'dse-np-style';
    style.textContent =
        '#dse-notepad .np-btn{background:rgba(128,128,128,.1);border:1px solid transparent;border-radius:4px;color:var(--dsw-alias-label-primary);cursor:pointer;font-size:13px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;transition:background .15s;}' +
        '#dse-notepad .np-btn:hover{background:rgba(128,128,128,.2);}' +
        '#dse-notepad .np-btn-sm{background:rgba(128,128,128,.08);border:1px solid var(--dsw-alias-border-l1);border-radius:3px;cursor:pointer;font-size:11px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);flex-shrink:0;}' +
        '#dse-notepad .np-btn-sm:hover{background:rgba(128,128,128,.15);}' +
        '#dse-notepad textarea::-webkit-scrollbar{width:6px;}' +
        '#dse-notepad textarea::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l1);border-radius:3px;}';
    document.head.appendChild(style);

    // 缓存 DOM 引用
    var fileSelect = panel.querySelector('#np-file-select');
    var textarea = panel.querySelector('#np-textarea');
    var charCount = panel.querySelector('#np-char-count');
    var fileInfo = panel.querySelector('#np-file-info');
    var saveStatus = panel.querySelector('#np-save-status');

    // ─── 文件操作 ──────────────────────────────────────────────────
    var files = S.notepadFiles || [];
    var curId = S.notepadCurId;

    function saveStorage() {
        try { GM_setValue(S.K.NOTEPAD_FILES, JSON.stringify(files)); } catch (e) {}
        GM_setValue(S.K.NOTEPAD_CUR, curId);
    }

    function getCurFile() { for (var i = 0; i < files.length; i++) { if (files[i].id === curId) return files[i]; } return null; }

    function refreshSelect() {
        fileSelect.innerHTML = '<option value="">选择文件...</option>';
        for (var i = 0; i < files.length; i++) {
            var opt = document.createElement('option');
            opt.value = files[i].id;
            opt.textContent = files[i].title;
            if (files[i].id === curId) opt.selected = true;
            fileSelect.appendChild(opt);
        }
    }

    function updateCharCount() { charCount.textContent = '字符: ' + textarea.value.length; }

    function saveFile() {
        var f = getCurFile(); if (!f) return;
        f.content = textarea.value;
        f.updateTime = Date.now();
        saveStorage();
        fileInfo.textContent = f.title + ' - ' + new Date(f.updateTime).toLocaleString();
        saveStatus.textContent = '已保存';
    }

    function loadFile(f) {
        var prev = getCurFile();
        if (prev && prev.id !== f.id) { prev.content = textarea.value; prev.updateTime = Date.now(); }
        curId = f.id;
        GM_setValue(S.K.NOTEPAD_CUR, curId);
        S.notepadCurId = curId;
        textarea.value = f.content || '';
        updateCharCount();
        fileInfo.textContent = f.title + ' - ' + new Date(f.updateTime).toLocaleString();
        refreshSelect();
        saveStorage();
    }

    function createFile() {
        var title = prompt('新文件标题:', '笔记');
        if (!title) return;
        var f = { id: Date.now().toString(), title: title, content: '', createTime: Date.now(), updateTime: Date.now() };
        // 存旧文件
        var prev = getCurFile(); if (prev) { prev.content = textarea.value; prev.updateTime = Date.now(); }
        files.unshift(f);
        if (files.length > 30) files.length = 30;
        curId = f.id;
        saveStorage();
        S.notepadFiles = files;
        S.notepadCurId = curId;
        textarea.value = '';
        refreshSelect();
        updateCharCount();
        fileInfo.textContent = f.title;
    }

    function renameFile() {
        var f = getCurFile(); if (!f) return;
        var t = prompt('新标题:', f.title);
        if (t && t !== f.title) { f.title = t; f.updateTime = Date.now(); saveStorage(); refreshSelect(); fileInfo.textContent = t + ' - ' + new Date(f.updateTime).toLocaleString(); }
    }

    function deleteFile() {
        var f = getCurFile(); if (!f) return;
        if (!confirm('删除 "' + f.title + '"？')) return;
        files = files.filter(function (x) { return x.id !== f.id; });
        S.notepadFiles = files;
        if (curId === f.id) { curId = files.length > 0 ? files[0].id : null; S.notepadCurId = curId; }
        saveStorage();
        refreshSelect();
        if (curId) { loadFile(files[0]); } else { textarea.value = ''; updateCharCount(); fileInfo.textContent = ''; }
    }

    function downloadMd() {
        var f = getCurFile(); if (!f) return;
        var name = (f.title || 'note').replace(/[^\w\u4e00-\u9fa5]/g, '_') + '.md';
        var blob = new Blob([f.content || ''], { type: 'text/markdown;charset=utf-8' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 200);
    }

    // ─── 事件绑定 ──────────────────────────────────────────────────
    panel.querySelector('#np-btn-close').addEventListener('click', function () {
        var f = getCurFile(); if (f) { f.content = textarea.value; f.updateTime = Date.now(); saveStorage(); }
        toggleNotepad();
    });
    panel.querySelector('#np-btn-new').addEventListener('click', createFile);
    panel.querySelector('#np-btn-dl').addEventListener('click', downloadMd);
    panel.querySelector('#np-btn-rename').addEventListener('click', renameFile);
    panel.querySelector('#np-btn-delete').addEventListener('click', deleteFile);

    textarea.addEventListener('input', function () { updateCharCount(); saveFile(); });

    fileSelect.addEventListener('change', function () {
        if (!fileSelect.value) return;
        var targeted = null;
        for (var i = 0; i < files.length; i++) { if (files[i].id === fileSelect.value) { targeted = files[i]; break; } }
        if (targeted) loadFile(targeted);
    });

    // ─── 拖拽 ──────────────────────────────────────────────────────
    var headerEl = panel.querySelector('.np-header');
    var isDrag = false, sx = 0, sy = 0, ix = 0, iy = 0;
    headerEl.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        isDrag = true; sx = e.clientX; sy = e.clientY; ix = panel.offsetLeft; iy = panel.offsetTop;
        panel.style.transition = 'none';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
        if (!isDrag) return;
        var bounds2 = (getScrollContainer() || { getBoundingClientRect: function () { return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }; } }).getBoundingClientRect();
        var nx = clamp(ix + e.clientX - sx, bounds2.left, bounds2.right - panel.offsetWidth);
        var ny = clamp(iy + e.clientY - sy, bounds2.top, bounds2.bottom - 60);
        panel.style.left = nx + 'px'; panel.style.top = ny + 'px';
        S.notepadX = nx; S.notepadY = ny;
    });
    document.addEventListener('mouseup', function () {
        if (!isDrag) return;
        isDrag = false; panel.style.transition = ''; document.body.style.userSelect = '';
        GM_setValue(S.K.NOTEPAD_X, S.notepadX); GM_setValue(S.K.NOTEPAD_Y, S.notepadY);
    });

    // 保存引用
    panel._textarea = textarea;
    panel._select = fileSelect;
    panel._refreshSelect = refreshSelect;
    panel._loadFile = loadFile;
    panel._saveStorage = saveStorage;
    panel._getCurFile = getCurFile;
    panel._files = files;

    S.notepadPanel = panel;

    // 初始化文件列表
    if (files.length === 0) {
        var f = { id: '1', title: '笔记', content: '', createTime: Date.now(), updateTime: Date.now() };
        files.push(f); curId = '1'; S.notepadFiles = files; S.notepadCurId = curId; saveStorage();
    }
    S.notepadFiles = files; S.notepadCurId = curId;
    refreshSelect();
    var initFile = getCurFile();
    if (initFile) { textarea.value = initFile.content || ''; updateCharCount(); fileInfo.textContent = initFile.title; }

    // 位置 — 初始在 ds-virtual-list 左上角
    var sc2 = getScrollContainer();
    var b2 = sc2 ? sc2.getBoundingClientRect() : { left: 20, top: 100 };
    S.notepadX = S.notepadX || b2.left + 8;
    S.notepadY = S.notepadY || b2.top + 8;
    panel.style.left = S.notepadX + 'px';
    panel.style.top = S.notepadY + 'px';
}

export function setNotepadState(on) {
    S.notepadOpen = on;
    GM_setValue(S.K.NOTEPAD_OPEN, on);
    if (!S.notepadPanel) createNotepad();
    S.notepadPanel.style.display = on ? 'flex' : 'none';
    updateUI();
}

export function toggleNotepad() {
    setNotepadState(!S.notepadOpen);
}

