import { S } from './state';
import { getScrollContainer, getMode, isOurNode } from './utils';
import { tagMessageRoles, updateMaxItemKey, scheduleLightUpdate, collectMessages } from './messages';
import { applyTheme } from './theme';
import { scheduleAvatarUpdate, setupScrollAvatar, updateAvatarContent } from './avatars';
import { syncPanelMode } from './panel';

function waitForScrollContainer(cb) { var t = 0; var iv = setInterval(function () { t++; var sc = getScrollContainer(); if (sc) { clearInterval(iv); cb(sc); } else if (t >= 40) clearInterval(iv); }, 250); }

function setupMessageObserver() {
    waitForScrollContainer(function (sc) {
        if (S.msgObserver) { try { S.msgObserver.disconnect(); } catch (e) {} }
        S.msgObserver = new MutationObserver(function (mutations) {
            var up = false;
            for (var i = 0; i < mutations.length; i++) { var m = mutations[i]; if (!m.addedNodes || !m.addedNodes.length) continue; for (var j = 0; j < m.addedNodes.length; j++) { var n = m.addedNodes[j]; if (!(n instanceof Element)) continue; if (isOurNode(n)) continue; up = true; break; } if (up) break; }
            if (up) scheduleLightUpdate(250);
        });
        S.msgObserver.observe(sc, { childList: true, subtree: true }); scheduleLightUpdate(100);
    });
}

function setupBodyObserver() {
    if (S.bodyObserver) { try { S.bodyObserver.disconnect(); } catch (e) {} }
    S.bodyObserver = new MutationObserver(function () {
        var nm = getMode(); var tb = document.getElementById('dse-dark-toggle'); if (tb) tb.textContent = nm === 'dark' ? '☀' : '🌙';
        if (nm !== S.currentMode) { applyTheme(nm); tagMessageRoles(); scheduleAvatarUpdate(); if (S.panelVisible) syncPanelMode(); }
    });
    S.bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

function setupRouteWatcher() {
    var lastUrl = location.href; if (S.routeTimer) clearInterval(S.routeTimer);
    setupScrollAvatar();
    S.routeTimer = setInterval(function () {
        if (location.href !== lastUrl) { lastUrl = location.href; S.currentItemKey = 1; S.maxItemKey = 0; if (S.msgObserver) { try { S.msgObserver.disconnect(); } catch (e) {} S.msgObserver = null; }
            setTimeout(function () { setupMessageObserver(); setupScrollAvatar(); applyTheme(getMode()); tagMessageRoles(); updateMaxItemKey(); }, 600); }
    }, 1000);
}

export function setupObservers() { setupMessageObserver(); setupBodyObserver(); setupRouteWatcher(); }
