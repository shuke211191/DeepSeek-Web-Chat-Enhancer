import { S } from './state';
import { getMode, updateUI } from './utils';
import { tagMessageRoles } from './messages';
import { applyTheme, applyAfter } from './theme';
import { loadFont } from './font';
import { setAvatarState } from './avatars';
import { createPanel, syncPanelMode, renderPanelContent } from './panel';
import { toggleNotepad } from './notepad';
import { stopThinkCollapse } from './think-collapse';
import { stopUserCollapse } from './user-collapse';
import { stopCodeFold, stopCodeBlockHeight } from './code-collapse';
import { t } from './i18n';

export function createSwitcher() {
    if (document.getElementById('dse-ui')) return;
    var el = document.createElement('div'); el.id = 'dse-ui';
    el.innerHTML = '<style>#dse-ui{position:fixed;bottom:110px;right:16px;z-index:99997;display:flex;flex-direction:column;gap:6px;font-family:system-ui,sans-serif;}#dse-ui button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(128,128,128,0.3);background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);cursor:pointer;font-size:14px;transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,.12);color:#333;line-height:1;}.dark #dse-ui button{background:rgba(30,35,45,0.85);color:#ccc;}#dse-ui button:hover{transform:scale(1.1);border-color:#5686fe;}#dse-ui button.on{border-color:#5686fe!important;box-shadow:0 0 0 2px rgba(86,134,254,0.4)!important;background:rgba(86,134,254,0.15)!important;}</style><button data-t="original" title="' + t('原版') + '" class="on">' + t('原') + '</button><button id="dse-panel-trigger" title="' + t('自定义') + '">⚙</button><button id="dse-notepad-trigger" title="' + t('笔记') + '" style="' + (S.showNotepadBtn ? '' : 'display:none;') + '">📝</button><button id="dse-dark-toggle" title="' + t('深色/浅色') + '" style="' + (S.showDarkBtn ? '' : 'display:none;') + '">' + (getMode() === 'dark' ? '☀' : '🌙') + '</button>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
        var btn = e.target.closest('button'); if (!btn) return;
        if (btn.id === 'dse-dark-toggle') {
            document.body.classList.toggle('dark');
            if (document.body.classList.contains('dark')) document.body.setAttribute('data-ds-dark-theme', ''); else document.body.removeAttribute('data-ds-dark-theme');
            btn.textContent = document.body.classList.contains('dark') ? '☀' : '🌙';
            applyTheme(getMode()); if (S.panelVisible) syncPanelMode(); return;
        }
        if (btn.id === 'dse-panel-trigger') {
            if (!S.panelRef) S.panelRef = createPanel();
            if (S.panelRef.style.display === 'flex') { S.panelRef.style.display = 'none'; S.panelVisible = false; }
            else { syncPanelMode(); S.panelRef.style.display = 'flex'; S.panelVisible = true; }
        } else if (btn.dataset.t === 'original') {
            if (S.panelRef) S.panelRef.style.display = 'none';
            S.pageOn = false; S.bubbleOn = false; S.strongOn = false; S.codeOn = false; S.fontOn = false;
            GM_setValue(S.K.PAGE_ON, false); GM_setValue(S.K.BUBBLE_ON, false); GM_setValue(S.K.STRONG_ON, false); GM_setValue(S.K.CODE_ON, false); GM_setValue(S.K.FONT_ON, false);
            setAvatarState(false);
            S.autoThinkOn = false; GM_setValue(S.K.AUTO_THINK_ON, false); stopThinkCollapse();
            S.autoCollapseUser = false; GM_setValue(S.K.AUTO_COLLAPSE_USER, false); stopUserCollapse();
            S.codeFoldOn = false; GM_setValue(S.K.CODE_FOLD_ON, false); stopCodeFold();
            S.codeBlockHeightOn = false; GM_setValue(S.K.CODE_BLOCK_HEIGHT_ON, false); stopCodeBlockHeight();
            S.focusInputShortcut = true; GM_setValue(S.K.FOCUS_INPUT_SHORTCUT, true);
            applyTheme(getMode()); tagMessageRoles(); loadFont(); updateUI();
            if (S.panelVisible) renderPanelContent();
        } else if (btn.id === 'dse-notepad-trigger') {
            toggleNotepad();
        }
        updateUI();
    });
    updateUI();
}
