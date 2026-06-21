import { S, DEF, NATIVE_DEF } from './state';
import { getMode } from './utils';
import { tagMessageRoles } from './messages';
import { updateUI } from './utils';

export function buildPageCSS(mode) {
    var vars = S.pageColors[mode] || DEF[mode];
    var css = '.ds-enhancer-page {\n';
    for (var k in vars) { if (Object.prototype.hasOwnProperty.call(vars, k)) css += '  ' + k + ': ' + vars[k] + ' !important;\n'; }
    return css + '}\n';
}

export function buildBubbleCSS(mode) {
    var isDark = mode === 'dark', bc = S.bubbleColors;
    return [
        '.ds-enhancer-bubble .ds-message[data-ds-role="user"] > div{background:' + (isDark ? bc.userBgD : bc.userBg) + '!important;}',
        '.ds-enhancer-bubble [data-ds-role="assistant"]{background:' + (isDark ? bc.aiBgD : bc.aiBgL) + '!important;}'
    ].join('\n');
}

export function buildSCCSS(mode) {
    var isDark = mode === 'dark', css = [];
    if (S.strongOn) { var sc = isDark ? S.strongColors.dark : S.strongColors.light; css.push('.ds-enhancer-sc .ds-markdown strong{color:' + sc + '!important;}'); }
    if (S.codeOn) { var bg = isDark ? S.codeColors.bgD : S.codeColors.bgL, tc = isDark ? S.codeColors.textD : S.codeColors.textL; css.push('.ds-enhancer-sc .ds-markdown code:not(.md-code-block code){background:' + bg + '!important;color:' + tc + '!important;}'); }
    return css.join('\n');
}

export function buildNativeCSS(mode) {
    var c = (S.nativeColors && S.nativeColors[mode]) || NATIVE_DEF[mode];
    return [
        '.ds-enhancer-native [data-ds-role="assistant"] .ds-markdown h1,.ds-enhancer-native [data-ds-role="assistant"] .ds-markdown h2,.ds-enhancer-native [data-ds-role="assistant"] .ds-markdown h3,.ds-enhancer-native [data-ds-role="assistant"] .ds-markdown h4{color:' + c.h + '!important;}',
        '.ds-enhancer-native [data-ds-role="user"] h1,.ds-enhancer-native [data-ds-role="user"] h2,.ds-enhancer-native [data-ds-role="user"] h3,.ds-enhancer-native [data-ds-role="user"] h4{color:' + c.h + '!important;}',
        '.ds-enhancer-native [data-ds-role] .ds-markdown hr{border-color:' + c.hr + '!important;background:' + c.hr + '!important;}',
        '.ds-enhancer-native [data-ds-role] .ds-markdown blockquote{color:' + c.quote + '!important;border-left-color:' + c.quoteBorder + '!important;}',
        '.ds-enhancer-native [data-ds-role="assistant"] .ds-markdown a{color:' + c.a + '!important;}',
        '.ds-enhancer-native [data-ds-role="user"] a{color:' + c.a + '!important;}',
        '.ds-enhancer-native [data-ds-role] .ds-markdown table,.ds-enhancer-native [data-ds-role] .ds-markdown th,.ds-enhancer-native [data-ds-role] .ds-markdown td{border-color:' + c.table + '!important;}',
        '.ds-enhancer-native [data-ds-role] .ds-markdown th{background-color:' + c.thBg + '!important;color:' + c.thText + '!important;}'
    ].join('\n');
}

export function applyTheme(mode) {
    if (S.styleEl) { S.styleEl.remove(); S.styleEl = null; }
    document.body.classList.remove('ds-enhancer-page', 'ds-enhancer-bubble', 'ds-enhancer-sc', 'ds-enhancer-native');
    var css = '';
    if (S.pageOn) { document.body.classList.add('ds-enhancer-page'); css += buildPageCSS(mode); }
    if (S.bubbleOn) { document.body.classList.add('ds-enhancer-bubble'); css += buildBubbleCSS(mode); }
    if (S.strongOn || S.codeOn) { document.body.classList.add('ds-enhancer-sc'); css += buildSCCSS(mode); }
    if (S.nativeOn) { document.body.classList.add('ds-enhancer-native'); css += buildNativeCSS(mode); }
    if (css) { S.styleEl = document.createElement('style'); S.styleEl.id = 'dse-css'; S.styleEl.textContent = css; document.head.appendChild(S.styleEl); }
    S.currentMode = mode;
}

export function applyAfter() {
    applyTheme(getMode()); tagMessageRoles(); updateUI();
}
