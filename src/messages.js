import { S } from './state';
import { scheduleAvatarUpdate } from './avatars';

export function updateMaxItemKey() {
    var items = document.querySelectorAll('[data-virtual-list-item-key]');
    for (var i = 0; i < items.length; i++) {
        var k = parseInt(items[i].dataset.virtualListItemKey, 10);
        if (!isNaN(k) && k > S.maxItemKey) S.maxItemKey = k;
    }
}

export function collectMessages(root) {
    var arr = [];
    if (!root) root = document;
    if (root instanceof Element && root.matches('.ds-message')) arr.push(root);
    if (root.querySelectorAll) {
        var list = root.querySelectorAll('.ds-message');
        for (var i = 0; i < list.length; i++) arr.push(list[i]);
    }
    return arr;
}

export function tagMessageRoles(root) {
    var msgs = collectMessages(root);

    for (var i = 0; i < msgs.length; i++) {
        var msg = msgs[i];

        var role =
        msg.querySelector(".ds-assistant-message-main-content") ||
        msg.querySelector(".ds-think-content")
            ? "assistant"
            : "user";

        if (!msg.dataset.dsRole || msg.dataset.dsRole === "user" || role === "assistant") {
        msg.dataset.dsRole = role;
        }

        var item = msg.closest("[data-virtual-list-item-key]");
        if (item && (!item.dataset.dsRole || item.dataset.dsRole === "user" || role === "assistant")) {
        item.dataset.dsRole = role;
        }
    }
}

export function scheduleLightUpdate(delay) {
    if (S.updateTimer) return;
    S.updateTimer = setTimeout(function () {
        S.updateTimer = null;
        tagMessageRoles();
        updateMaxItemKey();
        scheduleAvatarUpdate();
    }, delay || 250);
}
