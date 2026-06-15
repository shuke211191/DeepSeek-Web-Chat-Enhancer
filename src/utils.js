export function cloneObj(o) { return JSON.parse(JSON.stringify(o)); }
export function cloneDef(def) { return cloneObj(def); }
export function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
export function getMode() { return document.body.classList.contains('dark') ? 'dark' : 'light'; }
export function getScrollContainer() { return document.querySelector('.ds-virtual-list') || document.querySelector('[class*="ds-virtual-list"]'); }

export function isOurNode(node) {
    if (!(node instanceof Element)) return true;
    if (node.id === 'dse-ui' || node.id === 'dse-panel' || node.id === 'dse-css' || node.id === 'dse-font-link' || node.id === 'dse-font-style') return true;
    if (node.classList.contains('dse-fav-circle') || node.classList.contains('dse-fav-name') || node.closest('#dse-avatar-user') || node.closest('#dse-avatar-ai') || node.closest('#dse-ui') || node.closest('#dse-panel')) return true;
    return false;
}

export function findItemByKey(key) { return document.querySelector('[data-virtual-list-item-key="' + key + '"]'); }

import { S } from './state';

export function updateUI() {
    var el = document.getElementById('dse-ui'); if (!el) return;
    var anyOn = S.pageOn || S.bubbleOn || S.fontOn || S.avatarOn || S.strongOn || S.codeOn;
    var btns = el.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
        var b = btns[i]; if (b.id === 'dse-dark-toggle') continue;
        if (b.id === 'dse-panel-trigger') b.classList.toggle('on', anyOn);
        else if (b.id === 'dse-notepad-trigger') b.classList.toggle('on', S.notepadOpen);
        else if (b.dataset.t === 'original') b.classList.toggle('on', !anyOn);
    }
}
