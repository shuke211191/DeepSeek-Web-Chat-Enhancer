import { S } from './state';
import { getScrollContainer, getMode, updateUI } from './utils';

export var avatarUserEl = null; var avatarAIEl = null; var avatarRAF = null; var avatarScrollContainer = null; var avatarScrollRetry = null;

Object.defineProperty(S, 'avatarUserEl', { get: function() { return avatarUserEl; }, set: function(v) { avatarUserEl = v; }, configurable: true });
Object.defineProperty(S, 'avatarAIEl', { get: function() { return avatarAIEl; }, set: function(v) { avatarAIEl = v; }, configurable: true });
Object.defineProperty(S, 'avatarRAF', { get: function() { return avatarRAF; }, set: function(v) { avatarRAF = v; }, configurable: true });

export function createFloatAvatars() {
    if (avatarUserEl) { applyAvatarSize(); return; }
    GM_addStyle(
        '#dse-avatar-ai,#dse-avatar-user{position:fixed;z-index:100;display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;transform:translateY(-50%);}' +
        '.dse-fav-circle{display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;background-size:cover;background-position:center;box-shadow:0 2px 8px rgba(0,0,0,.18);}' +
        '.dse-fav-name{font-size:10px;color:#9ca3af;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2;text-shadow:0 1px 2px rgba(0,0,0,.25);}'
    );

    avatarUserEl = document.createElement('div'); avatarUserEl.id = 'dse-avatar-user'; avatarUserEl.style.display = 'none';
    avatarUserEl.innerHTML = '<div class="dse-fav-circle"></div><div class="dse-fav-name"></div>';
    avatarAIEl = document.createElement('div'); avatarAIEl.id = 'dse-avatar-ai'; avatarAIEl.style.display = 'none';
    avatarAIEl.innerHTML = '<div class="dse-fav-circle"></div><div class="dse-fav-name"></div>';
    document.body.appendChild(avatarUserEl); document.body.appendChild(avatarAIEl);
    applyAvatarSize();
    updateAvatarContent();
}

function applyAvatarStyle(el, size) {
    var sz = size + 'px';
    var circle = el.querySelector('.dse-fav-circle');
    if (circle) { circle.style.width = sz; circle.style.height = sz; circle.style.borderRadius = '50%'; circle.style.fontSize = Math.round(size * 0.5) + 'px'; }
    var name = el.querySelector('.dse-fav-name');
    if (name) {name.style.maxWidth = Math.max(48, size * 2.2) + "px";name.style.fontSize = Math.round(size * 0.28) + 'px'; }
    el.style.width = sz;
}

export function applyAvatarSize() {
    if (!avatarUserEl) return;
    var size = S.avatarSize || 30;
    applyAvatarStyle(avatarUserEl, size);
    applyAvatarStyle(avatarAIEl, size);
    scheduleAvatarUpdate();
}

export function updateAvatarContent() {
    if (!avatarUserEl) return;
    var size = S.avatarSize || 30;

    function fill(circle, nameEl, imgUrl, color, name) {
        if (imgUrl) {
            circle.style.backgroundImage = 'url(' + imgUrl + ')';
            circle.style.backgroundSize = 'cover';
            circle.style.backgroundPosition = 'center';
            circle.style.backgroundColor = 'transparent';
            circle.textContent = '';
        } else {
            circle.style.backgroundImage = '';
            circle.style.backgroundSize = '';
            circle.style.backgroundColor = color;
            circle.textContent = (name || '').charAt(0);
        }
        nameEl.textContent = name || '';
    }

    fill(avatarUserEl.querySelector('.dse-fav-circle'), avatarUserEl.querySelector('.dse-fav-name'), S.avatarUserImg, S.avatarUC, S.avatarUName);
    fill(avatarAIEl.querySelector('.dse-fav-circle'), avatarAIEl.querySelector('.dse-fav-name'), S.avatarAIImg, S.avatarAC, S.avatarAName);
}

function getViewportForAvatar() {
    var sc = getScrollContainer();
    if (sc) { var r = sc.getBoundingClientRect(); var extra = Math.min(80, r.height * 0.1); return { top: r.top + extra, bottom: r.bottom - extra }; }
    return { top: 0, bottom: window.innerHeight };
}

function getRole(el) {
    if (
    el.querySelector(".ds-assistant-message-main-content") ||
    el.querySelector(".ds-think-content")) {
        return "assistant";
    }

    if (el.dataset.dsRole) return el.dataset.dsRole;
    return "user"; 

}
function clampNumber(v, min, max) { return Math.max(min, Math.min(max, v)); }

function getMessageContentBox(msg, role) {
    if (!msg) return null;
    if (role === 'assistant') {
        var think = msg.querySelector('.ds-think-content');
        if (think && think.getBoundingClientRect().height >= 4) return think;
        return msg.querySelector('.ds-assistant-message-main-content') || msg.querySelector('.ds-markdown') || msg;
    }
    return msg.querySelector('.ds-markdown') || msg.querySelector('p') || msg.firstElementChild || msg;
}

export function updateAvatarPositions() {
    avatarRAF = null;
    if (!S.avatarOn || !avatarUserEl || !avatarAIEl) { if (avatarUserEl) { avatarUserEl.style.display = 'none'; avatarAIEl.style.display = 'none'; } return; }
    var sc = getScrollContainer();
    var scrollRect = sc ? sc.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth, width: window.innerWidth, height: window.innerHeight };
    var viewport = { top: scrollRect.top, bottom: scrollRect.bottom, left: scrollRect.left, right: scrollRect.right, width: scrollRect.width || window.innerWidth, height: scrollRect.height || window.innerHeight };
    var clampTop = viewport.top + 26, clampBottom = viewport.bottom - 26;
    var viewportCenter = (viewport.top + viewport.bottom) / 2;
    var msgs = document.querySelectorAll('.ds-message');
    var bestUser = null, bestAI = null, bestUserDist = Infinity, bestAIDist = Infinity;

    for (var i = 0; i < msgs.length; i++) {
        var msg = msgs[i], rect = msg.getBoundingClientRect();
        if (rect.height < 8 || rect.bottom <= viewport.top || rect.top >= viewport.bottom) continue;
        var role = getRole(msg);
        var visibleTop = Math.max(rect.top, viewport.top);
        var visibleBottom = Math.min(rect.bottom, viewport.bottom);
        if (visibleBottom <= visibleTop) continue;
        var msgCenter = (rect.top + rect.bottom) / 2;
        var dist = Math.abs(msgCenter - viewportCenter);
        if (role === 'user') { if (dist < bestUserDist) { bestUserDist = dist; bestUser = msg; } }
        else if (role === 'assistant') { if (dist < bestAIDist) { bestAIDist = dist; bestAI = msg; } }
    }

    function placeAvatar(avatarEl, msg, role) {
        if (!avatarEl || !msg) { if (avatarEl) avatarEl.style.display = 'none'; return; }
        var box = getMessageContentBox(msg, role); if (!box) { avatarEl.style.display = 'none'; return; }
        var rect = box.getBoundingClientRect(); if (rect.height < 4 || rect.width < 4) { avatarEl.style.display = 'none'; return; }
        var avatarWidth = S.avatarSize || 30, gap = S.avatarGap || 12;
        var visibleTop = Math.max(rect.top, viewport.top);
        var top = clampNumber(visibleTop + avatarWidth / 2 + 2, clampTop, clampBottom);
        var left = role === 'assistant' ? rect.left - avatarWidth - gap : rect.right + gap;
        left = clampNumber(left, 8, window.innerWidth - avatarWidth - 8);
        avatarEl.style.display = ''; avatarEl.style.top = top + 'px'; avatarEl.style.left = left + 'px'; avatarEl.style.right = 'auto';
    }

    placeAvatar(avatarAIEl, bestAI, 'assistant');
    placeAvatar(avatarUserEl, bestUser, 'user');
}

export function scheduleAvatarUpdate() { if (avatarRAF) return; avatarRAF = requestAnimationFrame(updateAvatarPositions); }

export function setAvatarState(on) {
    S.avatarOn = on; GM_setValue(S.K.AVATAR_ON, on);
    if (!on) { if (avatarUserEl) { avatarUserEl.style.display = 'none'; avatarAIEl.style.display = 'none'; } }
    else { createFloatAvatars(); scheduleAvatarUpdate(); }
    updateUI();
}

export function applyAvatarSettings() { updateAvatarContent(); if (S.avatarOn) { createFloatAvatars(); scheduleAvatarUpdate(); } }

export function setupScrollAvatar() {
    var sc = getScrollContainer();
    if (sc && sc !== avatarScrollContainer) {
        if (avatarScrollContainer) { try { avatarScrollContainer.removeEventListener('scroll', scheduleAvatarUpdate); } catch (e) {} }
        avatarScrollContainer = sc;
        avatarScrollContainer.addEventListener('scroll', scheduleAvatarUpdate, { passive: true });
        if (avatarScrollRetry) { clearInterval(avatarScrollRetry); avatarScrollRetry = null; }
    } else if (!sc && !avatarScrollRetry) {
        avatarScrollRetry = setInterval(function () { var sc2 = getScrollContainer(); if (sc2) { clearInterval(avatarScrollRetry); avatarScrollRetry = null; setupScrollAvatar(); } }, 1000);
    }
    window.removeEventListener('resize', scheduleAvatarUpdate);
    window.addEventListener('resize', scheduleAvatarUpdate, { passive: true });
    scheduleAvatarUpdate();
}
