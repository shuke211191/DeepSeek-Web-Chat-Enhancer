import { S, DEF } from './state';
import { cloneDef, getMode } from './utils';
import { tagMessageRoles, updateMaxItemKey } from './messages';
import { applyTheme } from './theme';
import { loadFont } from './font';
import { createFloatAvatars, setupScrollAvatar } from './avatars';
import { setupKeyboard } from './navigation';
import { createSwitcher } from './buttons';
import { setupObservers } from './observers';

function init() {
    // 从 GM 存储加载持久化状态
    S.pageOn = GM_getValue(S.K.PAGE_ON, false);
    S.bubbleOn = GM_getValue(S.K.BUBBLE_ON, false);
    S.strongOn = GM_getValue(S.K.STRONG_ON, false);
    S.codeOn = GM_getValue(S.K.CODE_ON, false);
    S.fontOn = GM_getValue(S.K.FONT_ON, false);
    S.avatarOn = GM_getValue(S.K.AVATAR_ON, false);
    S.pageColors = GM_getValue(S.K.PAGE_COLORS, null) || cloneDef(DEF);
    S.bubbleColors = GM_getValue(S.K.BUBBLE_COLORS, { userBg: '#5686fe', userText: '#ffffff', aiBgL: '#f8fafc', aiBgD: '#1e2430', aiTextL: '#1a1a2e', aiTextD: '#d1d5db' });
    S.strongColors = GM_getValue(S.K.STRONG_C, { light: '#1a1a2e', dark: '#e5e7eb' });
    S.codeColors = GM_getValue(S.K.CODE_C, { bgL: '#f0f4ff', bgD: '#1e2430', textL: '#5686fe', textD: '#8cb4ff' });
    S.fontSrc = GM_getValue(S.K.FONT_SRC, 'system');
    S.fontName = GM_getValue(S.K.FONT_NAME, '');
    S.avatarUName = GM_getValue(S.K.AVATAR_UNAME, '你');
    S.avatarAName = GM_getValue(S.K.AVATAR_ANAME, 'DeepSeek');
    S.avatarUC = GM_getValue(S.K.AVATAR_UC, '#5686fe');
    S.avatarAC = GM_getValue(S.K.AVATAR_AC, '#10a37f');

    S.currentMode = getMode(); S.currentItemKey = 1; S.maxItemKey = 0;
    applyTheme(S.currentMode); tagMessageRoles();
    createSwitcher(); setupKeyboard(); setupObservers();
    loadFont(); createFloatAvatars(); setupScrollAvatar();

    GM_addStyle('.ds-enhancer-page [data-virtual-list-item-key],.ds-enhancer-bubble [data-virtual-list-item-key],.ds-enhancer-sc [data-virtual-list-item-key]{min-height:0;}');

    setTimeout(function () { tagMessageRoles(); updateMaxItemKey(); }, 800);
    setTimeout(function () { tagMessageRoles(); updateMaxItemKey(); }, 1800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
