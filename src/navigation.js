import { S } from './state';
import { getScrollContainer } from './utils';

export function getVirtualItems() {
    var nodes = document.querySelectorAll('[data-virtual-list-item-key]'), arr = [];
    for (var i = 0; i < nodes.length; i++) { var el = nodes[i], key = parseInt(el.dataset.virtualListItemKey, 10); if (isNaN(key) || !el.querySelector('.ds-message')) continue; arr.push({ el: el, key: key }); }
    arr.sort(function (a, b) { return a.key - b.key; }); return arr;
}

function getScrollViewportRect() { var sc = getScrollContainer(); if (sc) return sc.getBoundingClientRect(); return { top: 0, bottom: window.innerHeight, height: window.innerHeight }; }

function getCurrentVisibleItem() {
    var items = getVirtualItems(); if (!items.length) return null;
    var viewport = getScrollViewportRect(), centerY = viewport.top + viewport.height / 2, best = null, bestDist = Infinity;
    for (var i = 0; i < items.length; i++) { var rect = items[i].el.getBoundingClientRect(); if (rect.bottom < viewport.top || rect.top > viewport.bottom) continue; var c = rect.top + rect.height / 2, d = Math.abs(c - centerY); if (d < bestDist) { bestDist = d; best = items[i]; } }
    if (!best) { for (var j = 0; j < items.length; j++) { var r2 = items[j].el.getBoundingClientRect(), c2 = r2.top + r2.height / 2, d2 = Math.abs(c2 - centerY); if (d2 < bestDist) { bestDist = d2; best = items[j]; } } }
    return best;
}

function scrollToItem(el) { if (!el) return; try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { el.scrollIntoView(false); } }

export function navigate(dir) {
    var items = getVirtualItems(); if (!items.length) { updateMaxItemKey(); return; }
    updateMaxItemKey();
    var current = getCurrentVisibleItem(); if (!current) current = items[0];
    var index = -1; for (var i = 0; i < items.length; i++) { if (items[i].key === current.key) { index = i; break; } }
    if (index < 0) index = 0;
    var target = null;
    if (dir === 'prev') {
        if (index > 0) { target = items[index - 1]; } else {
            var scUp = getScrollContainer(); if (scUp) scUp.scrollBy({ top: -Math.max(300, scUp.clientHeight * 0.75), behavior: 'smooth' }); else window.scrollBy({ top: -Math.max(300, window.innerHeight * 0.75), behavior: 'smooth' });
            setTimeout(function () { var now = getCurrentVisibleItem(); if (now) S.currentItemKey = now.key; }, 350); return;
        }
    } else {
        if (index < items.length - 1) { target = items[index + 1]; } else {
            var scDown = getScrollContainer(); if (scDown) scDown.scrollBy({ top: Math.max(300, scDown.clientHeight * 0.75), behavior: 'smooth' }); else window.scrollBy({ top: Math.max(300, window.innerHeight * 0.75), behavior: 'smooth' });
            setTimeout(function () { var now = getCurrentVisibleItem(); if (now) S.currentItemKey = now.key; }, 350); return;
        }
    }
    if (!target) return; S.currentItemKey = target.key; scrollToItem(target.el);
}

export function setupKeyboard() {
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.altKey && (e.key === '/' || e.code === 'Slash')) {
            if (!S.focusInputShortcut) return;
            if (e.target && (e.target.closest('[role="dialog"]') || e.target.closest('[role="menu"]'))) return;
            e.preventDefault();
            var ta = document.querySelector('textarea'), sc = getScrollContainer();
            if (document.activeElement === ta) { if (sc) { sc.setAttribute('tabindex', '0'); sc.focus({ preventScroll: true }); } } else { if (ta) ta.focus(); }
            return;
        }
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        var el = document.activeElement; if (el) { if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable || el.getAttribute('role') === 'textbox' || el.closest('[role="dialog"]') || el.closest('[role="menu"]') || el.closest('[role="listbox"]') || el.closest('select') || el.closest('#dse-panel')) return; }
        e.preventDefault(); e.stopPropagation();
        navigate(e.key === 'ArrowLeft' ? 'prev' : 'next');
    }, true);
}

import { updateMaxItemKey } from './messages';
