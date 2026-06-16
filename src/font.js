import { S } from './state';

export function loadFont() {
    if (S.fontLinkEl) { S.fontLinkEl.remove(); S.fontLinkEl = null; }
    document.body.classList.remove('ds-enhancer-font');
    var old = document.getElementById('dse-font-style'); if (old) old.remove();
    if (!S.fontOn || !S.fontName.trim()) return;
    document.body.classList.add('ds-enhancer-font');
    if (S.fontSrc === 'google') {
        S.fontLinkEl = document.createElement('link'); S.fontLinkEl.id = 'dse-font-link'; S.fontLinkEl.rel = 'stylesheet';
        S.fontLinkEl.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(S.fontName.trim()).replace(/%20/g, '+') + '&display=swap';
        document.head.appendChild(S.fontLinkEl);
    }
    var s = document.createElement('style'); s.id = 'dse-font-style';
    s.textContent = '.ds-enhancer-font .ds-markdown,.ds-enhancer-font textarea,.ds-enhancer-font .ds-message > div{font-family:"' + S.fontName.trim().replace(/"/g, '\\"') + '",var(--dsw-font-family),system-ui,sans-serif!important;}';
    document.head.appendChild(s);
}
