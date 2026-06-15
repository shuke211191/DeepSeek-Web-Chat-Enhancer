import { S } from './state';

var THINK_SEL = '.ds-think-content';
var POLL_MS = 1000;

var processed = new WeakSet();
var pendingTimers = new Map();
var observedEls = new Map();
var pollTimer = null;
var bodyObs = null;

function findHeader(thinkContent) {
    var w = thinkContent.parentElement;
    return w ? w.firstElementChild : null;
}

function statusText(header) {
    var span = header.querySelector('span');
    return span ? span.textContent : '';
}

function isComplete(header) {
    var t = statusText(header);
    return t.indexOf('已思考') !== -1 || t.indexOf('Thought') !== -1;
}

function doCollapse(thinkContent) {
    if (processed.has(thinkContent)) return;
    var header = findHeader(thinkContent);
    if (!header) return;
    processed.add(thinkContent);
    header.click();
}

function scheduleCollapse(thinkContent) {
    if (pendingTimers.has(thinkContent)) return;
    var delay = S.autoThinkDelay || 0;
    if (delay <= 0) { doCollapse(thinkContent); return; }
    var timer = setTimeout(function () {
        doCollapse(thinkContent);
        pendingTimers.delete(thinkContent);
    }, delay);
    pendingTimers.set(thinkContent, timer);
}

function watchCompletion(thinkContent, header) {
    if (observedEls.has(thinkContent)) return;
    var obs = new MutationObserver(function () {
        if (isComplete(header)) {
            obs.disconnect();
            observedEls.delete(thinkContent);
            scheduleCollapse(thinkContent);
        }
    });
    obs.observe(header, { childList: true, subtree: true, characterData: true });
    observedEls.set(thinkContent, obs);
}

function processOne(thinkContent) {
    if (processed.has(thinkContent)) return;
    var header = findHeader(thinkContent);
    if (!header) return;

    if (S.autoThinkMode === 'always') {
        doCollapse(thinkContent);
    } else {
        if (isComplete(header)) scheduleCollapse(thinkContent);
        watchCompletion(thinkContent, header);
    }
}

function processAll() {
    var list = document.querySelectorAll(THINK_SEL);
    for (var i = 0; i < list.length; i++) processOne(list[i]);
}

export function setupThinkCollapse() {
    if (!S.autoThinkOn) return;
    if (bodyObs) { try { bodyObs.disconnect(); } catch (e) {} bodyObs = null; }
    bodyObs = new MutationObserver(processAll);
    bodyObs.observe(document.body, { childList: true, subtree: true });
    processAll();
    if (pollTimer) clearTimeout(pollTimer);
    function poll() { if (!S.autoThinkOn) return; processAll(); pollTimer = setTimeout(poll, POLL_MS); }
    pollTimer = setTimeout(poll, 3000);
}

export function resetThinkCollapse() {
    pendingTimers.forEach(function (t) { clearTimeout(t); });
    pendingTimers = new Map();
    observedEls.forEach(function (o) { try { o.disconnect(); } catch (e) {} });
    observedEls = new Map();
    processed = new WeakSet();
    processAll();
}

export function stopThinkCollapse() {
    if (bodyObs) { try { bodyObs.disconnect(); } catch (e) {} bodyObs = null; }
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
    pendingTimers.forEach(function (t) { clearTimeout(t); });
    pendingTimers = new Map();
    observedEls.forEach(function (o) { try { o.disconnect(); } catch (e) {} });
    observedEls = new Map();
    processed = new WeakSet();
}
