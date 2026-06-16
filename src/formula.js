import { S } from './state';
import { t } from './i18n';

var STYLE_ID = 'dse-formula-style';

export function setupFormulaCopier() {
    if (S.formulaOn) {
        enableFormula();
    } else {
        disableFormula();
    }
}

function enableFormula() {
    if (!document.getElementById(STYLE_ID)) {
        var s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent =
            '.katex{transition:background-color .3s,border-radius .3s;transition-delay:.1s;position:relative;}' +
            '.katex:hover{background-color:rgba(86,134,254,.12)!important;border-radius:6px;cursor:pointer;}' +
            '.katex-display:hover::after{content:"' + t('双击复制 LaTeX') + '";position:absolute;right:0;top:-18px;font-size:11px;color:#9ca3af;pointer-events:none;opacity:.8;font-family:sans-serif;}' +
            '.dse-formula-tip{position:fixed;background:rgba(30,30,30,.85);color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;font-family:sans-serif;backdrop-filter:blur(4px);pointer-events:none;z-index:9999999;transform:translateY(10px) translateX(-50%);opacity:0;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:all .3s cubic-bezier(.25,.8,.25,1);}' +
            '.dse-formula-tip.show{transform:translateY(0) translateX(-50%);opacity:1;}';
        document.head.appendChild(s);
    }

    document.addEventListener('dblclick', onDblClick);
    document.addEventListener('copy', onCopy, true);
}

function disableFormula() {
    var s = document.getElementById(STYLE_ID); if (s) s.remove();
    document.removeEventListener('dblclick', onDblClick);
    document.removeEventListener('copy', onCopy, true);
}

function showTip(msg, x, y) {
    var t = document.createElement('div'); t.className = 'dse-formula-tip'; t.textContent = msg;
    if (x !== undefined) { t.style.left = x + 'px'; t.style.top = (y - 30) + 'px'; }
    else { t.style.left = '50%'; t.style.bottom = '40px'; }
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 1200);
}

function onDblClick(e) {
    var kb = e.target.closest('.katex'); if (!kb) return;
    window.getSelection().removeAllRanges();
    var ann = kb.querySelector('annotation[encoding="application/x-tex"]');
    if (!ann) return;
    var tex = ann.textContent;
    var isDisp = kb.classList.contains('katex-display') || (kb.parentElement && kb.parentElement.classList.contains('katex-display'));
    var out = isDisp ? '\n$$ ' + tex + ' $$\n' : '$' + tex + '$';
    navigator.clipboard.writeText(out).then(function () { showTip(t('已复制 LaTeX'), e.clientX, e.clientY); }).catch(function () {});
}

function onCopy(e) {
    var sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    var range = sel.getRangeAt(0);

    function closestKatex(node) {
        if (!node) return null;
        var cur = node.nodeType === 3 ? node.parentElement : node;
        while (cur && cur !== document.body) { if (cur.classList && (cur.classList.contains('katex') || cur.classList.contains('katex-display'))) return cur; cur = cur.parentElement; }
        return null;
    }

    var sk = closestKatex(range.startContainer); if (sk) range.setStartBefore(sk);
    var ek = closestKatex(range.endContainer); if (ek) range.setEndAfter(ek);

    var div = document.createElement('div'); div.appendChild(range.cloneContents());
    var kns = Array.from(div.querySelectorAll('.katex')); if (kns.length === 0) return;
    e.preventDefault();

    kns.forEach(function (katex) {
        var ann = katex.querySelector('annotation[encoding="application/x-tex"]'); if (!ann) return;
        var tex = ann.textContent;
        var isDisp = katex.classList.contains('katex-display') || (katex.parentElement && katex.parentElement.classList.contains('katex-display'));
        var rp = isDisp ? '\n$$ ' + tex + ' $$\n' : '$' + tex + '$';
        var tn = document.createTextNode(rp);
        if (isDisp && katex.parentElement && katex.parentElement.classList.contains('katex-display')) katex.parentElement.replaceWith(tn);
        else katex.replaceWith(tn);
    });

    document.body.appendChild(div);
    div.style.cssText = 'position:fixed;left:-9999px;top:-9999px;white-space:pre-wrap;';
    var clean = div.innerText;
    document.body.removeChild(div);

    if (e.clipboardData) { e.clipboardData.setData('text/plain', clean); e.clipboardData.setData('text/html', '<pre>' + clean + '</pre>'); }
    showTip(t('已提取 LaTeX'));
}
