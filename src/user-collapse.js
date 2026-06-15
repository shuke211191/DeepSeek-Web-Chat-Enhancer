import { S } from './state';

var MAX_LINES = 5;
var POLL_MS = 1000;

var processed = new WeakSet();
var observer = null;
var pollTimer = null;

function getUserBubble(msg) {
    if (msg.dataset.dsRole !== 'user') return null;
    var b = msg.firstElementChild;
    return b && b.textContent ? b : null;
}

function countLines(bubble) {
    var style = getComputedStyle(bubble);
    var lh = parseFloat(style.lineHeight) || 24;
    return Math.ceil(bubble.scrollHeight / lh);
}

function addFoldButton(bubble) {
    if (processed.has(bubble)) return;
    processed.add(bubble);

    var lines = countLines(bubble);
    if (lines <= MAX_LINES) return;

    bubble.classList.add('dse-usr-bubble');

    var style = getComputedStyle(bubble);
    var lh = parseFloat(style.lineHeight) || 24;
    var pt = parseFloat(style.paddingTop) || 0;
    var pb = parseFloat(style.paddingBottom) || 0;
    bubble._dseLineH = lh;
    bubble._dsePad = pt + pb;

    var maxH = lh * MAX_LINES + pt + pb;
    bubble.classList.add('dse-usr-folded');
    bubble.style.maxHeight = maxH + 'px';

    var btn = document.createElement('button');
    btn.className = 'dse-usr-fold-btn';
    btn.innerHTML = '\u25BE';
    btn.title = '折叠/展开';
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (bubble.classList.contains('dse-usr-folded')) {
            bubble.classList.remove('dse-usr-folded');
            bubble.style.maxHeight = '';
            btn.innerHTML = '\u25B4';
        } else {
            bubble.classList.add('dse-usr-folded');
            bubble.style.maxHeight = (bubble._dseLineH * MAX_LINES + bubble._dsePad) + 'px';
            btn.innerHTML = '\u25BE';
        }
    });
    bubble.appendChild(btn);
}

function processAll() {
    var msgs = document.querySelectorAll('.ds-message[data-ds-role="user"]');
    for (var i = 0; i < msgs.length; i++) {
        var bubble = getUserBubble(msgs[i]);
        if (bubble) addFoldButton(bubble);
    }
}

export function setupUserCollapse() {
    if (!S.autoCollapseUser) return;
    GM_addStyle(
        '.dse-usr-folded{overflow-y:auto;}' +
        '.dse-usr-fold-btn{position:sticky;bottom:4px;display:block;margin-left:auto;margin-right:12px;width:40px;height:40px;border:none;background:rgba(128,128,128,0.15);border-radius:12px;cursor:pointer;font-size:22px;line-height:40px;padding:0;text-align:center;color:var(--dsw-alias-label-secondary,#6b7280);opacity:0;transition:opacity .15s;z-index:1;}' +
        '.dse-usr-bubble:hover .dse-usr-fold-btn{opacity:1;}' +
        '.dse-usr-fold-btn:hover{opacity:1!important;background:rgba(128,128,128,0.35);}'
    );
    if (observer) { try { observer.disconnect(); } catch (e) {} }
    observer = new MutationObserver(processAll);
    observer.observe(document.body, { childList: true, subtree: true });
    processAll();
    if (pollTimer) clearTimeout(pollTimer);
    function poll() { if (!S.autoCollapseUser) return; processAll(); pollTimer = setTimeout(poll, POLL_MS); }
    pollTimer = setTimeout(poll, 3000);
}

export function stopUserCollapse() {
    if (observer) { try { observer.disconnect(); } catch (e) {} observer = null; }
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
    var btns = document.querySelectorAll('.dse-usr-fold-btn');
    for (var i = 0; i < btns.length; i++) btns[i].remove();
    var folded = document.querySelectorAll('.dse-usr-folded');
    for (var j = 0; j < folded.length; j++) {
        folded[j].classList.remove('dse-usr-folded');
        folded[j].style.maxHeight = '';
    }
    var bubbles = document.querySelectorAll('.dse-usr-bubble');
    for (var k = 0; k < bubbles.length; k++) bubbles[k].classList.remove('dse-usr-bubble');
    processed = new WeakSet();
}
