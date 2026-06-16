import { S } from './state';

var POLL_MS = 1000;

var foldObserver = null;
var foldPollTimer = null;

var heightObserver = null;
var heightPollTimer = null;

function addFoldButton(block) {
    if (block.querySelector('.dse-code-fold-btn')) return;

    var banner = block.querySelector('.md-code-block-banner-wrap');
    if (!banner) return;

    var pre = block.querySelector('pre');
    if (!pre) return;

    var firstBtn = banner.querySelector('[role="button"], button');
    if (!firstBtn) return;
    var container = firstBtn.parentElement;

    var btn = document.createElement('button');
    btn.className = 'dse-code-fold-btn';
    btn.title = '折叠代码';
    btn.innerHTML = '\u25BE';

    var collapsed = false;
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (collapsed) {
            pre.style.display = '';
            btn.innerHTML = '\u25BE';
            btn.title = '折叠代码';
            collapsed = false;
        } else {
            pre.style.display = 'none';
            btn.innerHTML = '\u25B8';
            btn.title = '展开代码';
            collapsed = true;
        }
    });

    container.insertBefore(btn, firstBtn);
}

function processFoldAll() {
    var blocks = document.querySelectorAll('.md-code-block');
    for (var i = 0; i < blocks.length; i++) addFoldButton(blocks[i]);
}

function removeFoldButtons() {
    var btns = document.querySelectorAll('.dse-code-fold-btn');
    for (var i = 0; i < btns.length; i++) btns[i].remove();
    var pres = document.querySelectorAll('.md-code-block pre');
    for (var j = 0; j < pres.length; j++) pres[j].style.display = '';
}

export function setupCodeFold() {
    if (!S.codeFoldOn) return;
    GM_addStyle(
        '.dse-code-fold-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;margin-right:2px;border:none;background:none;color:inherit;cursor:pointer;border-radius:4px;font-size:14px;line-height:1;opacity:0.6;transition:opacity .15s,background .15s;flex-shrink:0;}' +
        '.dse-code-fold-btn:hover{opacity:1;background:rgba(128,128,128,0.15);}'
    );
    if (foldObserver) { try { foldObserver.disconnect(); } catch (e) {} }
    foldObserver = new MutationObserver(processFoldAll);
    foldObserver.observe(document.body, { childList: true, subtree: true });
    processFoldAll();
    if (foldPollTimer) clearTimeout(foldPollTimer);
    function poll() { if (!S.codeFoldOn) return; processFoldAll(); foldPollTimer = setTimeout(poll, POLL_MS); }
    foldPollTimer = setTimeout(poll, 3000);
}

export function stopCodeFold() {
    if (foldObserver) { try { foldObserver.disconnect(); } catch (e) {} foldObserver = null; }
    if (foldPollTimer) { clearTimeout(foldPollTimer); foldPollTimer = null; }
    removeFoldButtons();
}

function addHeightLimit(block) {
    var pre = block.querySelector('pre');
    if (pre) pre.classList.add('dse-code-block-limited');
}

function processHeightAll() {
    var blocks = document.querySelectorAll('.md-code-block');
    for (var i = 0; i < blocks.length; i++) addHeightLimit(blocks[i]);
}

function removeHeightLimits() {
    var pres = document.querySelectorAll('.dse-code-block-limited');
    for (var i = 0; i < pres.length; i++) pres[i].classList.remove('dse-code-block-limited');
}

export function setupCodeBlockHeight() {
    if (!S.codeBlockHeightOn) return;
    GM_addStyle('.dse-code-block-limited{max-height:60vh!important;overflow-y:auto!important;}');
    if (heightObserver) { try { heightObserver.disconnect(); } catch (e) {} }
    heightObserver = new MutationObserver(processHeightAll);
    heightObserver.observe(document.body, { childList: true, subtree: true });
    processHeightAll();
    if (heightPollTimer) clearTimeout(heightPollTimer);
    function poll() { if (!S.codeBlockHeightOn) return; processHeightAll(); heightPollTimer = setTimeout(poll, POLL_MS); }
    heightPollTimer = setTimeout(poll, 3000);
}

export function stopCodeBlockHeight() {
    if (heightObserver) { try { heightObserver.disconnect(); } catch (e) {} heightObserver = null; }
    if (heightPollTimer) { clearTimeout(heightPollTimer); heightPollTimer = null; }
    removeHeightLimits();
}
