import { S, DEF, NATIVE_DEF } from './state';
import { cloneDef, getMode } from './utils';
import { tagMessageRoles, updateMaxItemKey } from './messages';
import { applyTheme } from './theme';
import { loadFont } from './font';
import { createFloatAvatars, setupScrollAvatar, updateAvatarContent } from './avatars';
import { setupKeyboard } from './navigation';
import { createSwitcher } from './buttons';
import { setupObservers } from './observers';
import { setNotepadState } from './notepad';
import { setupFormulaCopier } from './formula';
import { setupThinkCollapse } from './think-collapse';
import { setupUserCollapse } from './user-collapse';
import { setupCodeFold, setupCodeBlockHeight } from './code-collapse';

function init() {
    // 从 GM 存储加载持久化状态
    S.pageOn = GM_getValue(S.K.PAGE_ON, false);
    S.bubbleOn = GM_getValue(S.K.BUBBLE_ON, false);
    S.strongOn = GM_getValue(S.K.STRONG_ON, false);
    S.codeOn = GM_getValue(S.K.CODE_ON, false);
    S.fontOn = GM_getValue(S.K.FONT_ON, false);
    S.avatarOn = GM_getValue(S.K.AVATAR_ON, false);
    S.pageColors = GM_getValue(S.K.PAGE_COLORS, null) || cloneDef(DEF);
    S.bubbleColors = GM_getValue(S.K.BUBBLE_COLORS, { userBg: '#5686fe', userBgD: '#3a5bbf', aiBgL: '#f8fafc', aiBgD: '#1e2430' });
    if (!S.bubbleColors.userBgD) S.bubbleColors.userBgD = '#3a5bbf';
    S.strongColors = GM_getValue(S.K.STRONG_C, { light: '#1a1a2e', dark: '#e5e7eb' });
    S.codeColors = GM_getValue(S.K.CODE_C, { bgL: '#f0f4ff', bgD: '#1e2430', textL: '#5686fe', textD: '#8cb4ff' });
    S.nativeOn = GM_getValue(S.K.NATIVE_ON, false);
    S.nativeColors = GM_getValue(S.K.NATIVE_C, null) || cloneDef(NATIVE_DEF);
    S.fontSrc = GM_getValue(S.K.FONT_SRC, 'system');
    S.fontName = GM_getValue(S.K.FONT_NAME, '');
    S.avatarUName = GM_getValue(S.K.AVATAR_UNAME, '你');
    S.avatarAName = GM_getValue(S.K.AVATAR_ANAME, 'DeepSeek');
    S.avatarUC = GM_getValue(S.K.AVATAR_UC, '#5686fe');
    S.avatarAC = GM_getValue(S.K.AVATAR_AC, '#10a37f');
    S.avatarSize = GM_getValue(S.K.AVATAR_SIZE, 64);
    S.avatarUserImg = GM_getValue(S.K.AVATAR_UIMG, '');
    S.avatarAIImg = GM_getValue(S.K.AVATAR_AIMG, 'https://www.deepseek.com/favicon.ico');
    S.avatarGap = GM_getValue(S.K.AVATAR_GAP, 32);

    S.notepadOpen = GM_getValue(S.K.NOTEPAD_OPEN, false);
    S.notepadX = GM_getValue(S.K.NOTEPAD_X, 20);
    S.notepadY = GM_getValue(S.K.NOTEPAD_Y, 100);
    try { S.notepadFiles = JSON.parse(GM_getValue(S.K.NOTEPAD_FILES, '[]')); } catch (e) { S.notepadFiles = []; }
    S.notepadCurId = GM_getValue(S.K.NOTEPAD_CUR, null);

    S.formulaOn = GM_getValue(S.K.FORMULA_ON, false);
    S.showNotepadBtn = GM_getValue(S.K.SHOW_NP_BTN, true);
    S.showDarkBtn = GM_getValue(S.K.SHOW_DARK_BTN, true);

    S.autoThinkOn = GM_getValue(S.K.AUTO_THINK_ON, false);
    S.autoThinkMode = GM_getValue(S.K.AUTO_THINK_MODE, 'always');
    S.autoThinkDelay = GM_getValue(S.K.AUTO_THINK_DELAY, 500);

    S.autoCollapseUser = GM_getValue(S.K.AUTO_COLLAPSE_USER, false);

    S.codeFoldOn = GM_getValue(S.K.CODE_FOLD_ON, false);
    S.codeBlockHeightOn = GM_getValue(S.K.CODE_BLOCK_HEIGHT_ON, false);

    S.lang = GM_getValue(S.K.LANG, 'auto');

    S.focusInputShortcut = GM_getValue(S.K.FOCUS_INPUT_SHORTCUT, true);

    S.currentMode = getMode(); S.currentItemKey = 1; S.maxItemKey = 0;
    applyTheme(S.currentMode); tagMessageRoles();
    createSwitcher(); setupKeyboard(); setupObservers();
    loadFont(); createFloatAvatars(); setupScrollAvatar();

    // 恢复笔记面板状态
    if (S.notepadOpen) setNotepadState(true);
    setupFormulaCopier();
    if (S.autoThinkOn) setupThinkCollapse();
    if (S.autoCollapseUser) setupUserCollapse();
    if (S.codeFoldOn) setupCodeFold();
    if (S.codeBlockHeightOn) setupCodeBlockHeight();

    GM_addStyle('.ds-enhancer-page [data-virtual-list-item-key],.ds-enhancer-bubble [data-virtual-list-item-key],.ds-enhancer-sc [data-virtual-list-item-key]{min-height:0;}');

    setTimeout(function () { tagMessageRoles(); updateMaxItemKey(); }, 800);
    setTimeout(function () { tagMessageRoles(); updateMaxItemKey(); }, 1800);

    // 自动抓取页面中 DeepSeek 用户头像
    setTimeout(function () {
        if (!S.avatarUserImg) {
            var userAv = document.querySelector('img[src*="static.deepseek.com/user-avatar"]');
            if (userAv && userAv.src) {
                S.avatarUserImg = userAv.src;
                GM_setValue(S.K.AVATAR_UIMG, S.avatarUserImg);
                updateAvatarContent();
            }
        }
    }, 1500);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
