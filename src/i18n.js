import { S } from './state';

var dict = {
    // buttons.js
    '原版': 'Original',
    '原': 'Orig',
    '自定义': 'Settings',
    '笔记': 'Notes',
    '深色/浅色': 'Dark/Light',

    // code-collapse.js
    '折叠代码': 'Fold Code',
    '展开代码': 'Unfold Code',

    // formula.js
    '双击复制 LaTeX': 'Double-click to copy LaTeX',
    '已复制 LaTeX': 'LaTeX copied',
    '已提取 LaTeX': 'LaTeX extracted',

    // notepad.js
    '📝 笔记': '📝 Notes',
    '新建': 'New',
    '下载.md': 'Download .md',
    '关闭': 'Close',
    '选择文件...': 'Select file...',
    '重命名': 'Rename',
    '删除': 'Delete',
    '在此记录...': 'Type here...',
    '字符: 0': 'Chars: 0',
    '字符: ': 'Chars: ',
    '本地存储': 'Local Storage',
    '已保存': 'Saved',
    '新文件标题:': 'New file title:',
    '新标题:': 'New title:',
    '删除 "': 'Delete "',
    '"？': '"?',

    // panel.js - tabs
    '页面配色': 'Page Colors',
    '消息气泡': 'Bubbles',
    '强调/代码': 'Emphasis/Code',
    '字体': 'Font',
    '头像': 'Avatar',
    '语言': 'Language',
    '其他': 'Other',
    '恢复默认': 'Reset',

    // panel.js - page tab
    '浅色模式': 'Light Mode',
    '深色模式': 'Dark Mode',
    '页面背景': 'Page Bg',
    '表面/卡片': 'Surface/Card',
    '主题色': 'Accent',
    '主文字': 'Prim Text',
    '次文字': 'Sec Text',
    '辅助文字': 'Tert Text',
    '主边框': 'Border 1',
    '次边框': 'Border 2',

    // panel.js - bubble tab
    '用户气泡': 'User Bubble',
    '背景': 'Bg',
    '文字': 'Text',
    'AI气泡': 'AI Bubble',
    '背景(浅)': 'Bg (Light)',
    '背景(深)': 'Bg (Dark)',
    '文字(浅)': 'Text (Light)',
    '文字(深)': 'Text (Dark)',

    // panel.js - strongcode tab
    '自定义强调颜色': 'Custom Emphasis Color',
    '浅色': 'Light',
    '深色': 'Dark',
    '自定义行内代码': 'Custom Inline Code',
    '启用代码块折叠': 'Code Block Fold',
    '限制代码块高度': 'Code Block Height',

    // panel.js - lang tab
    '界面语言': 'Language',
    '自动': 'Auto',

    // panel.js - font tab
    '来源': 'Source',
    '系统字体': 'System Font',
    '字体名称': 'Font Name',

    // panel.js - avatar tab
    '你的头像色': 'Your Avatar Color',
    '你的名字': 'Your Name',
    '你的头像图': 'Your Avatar Image',
    '图片URL': 'Image URL',
    'AI头像色': 'AI Avatar Color',
    'AI名字': 'AI Name',
    'AI头像图': 'AI Avatar Image',
    '头像大小': 'Avatar Size',
    '头像间距': 'Avatar Gap',

    // panel.js - other tab
    '显示笔记按钮': 'Show Notes Button',
    '显示深浅色切换按钮': 'Show Dark Toggle',
    '启用公式复制': 'Formula Copy',
    '自动折叠用户输入': 'Auto-Fold User Input',
    '自动折叠思考块': 'Auto-Fold Think',
    '折叠模式': 'Fold Mode',
    '始终折叠': 'Always Fold',
    '思考结束后折叠': 'After Thinking',
    '延迟 (ms)': 'Delay (ms)',
    '快速定位到输入框 (Ctrl+Alt+/)': 'Focus Input (Ctrl+Alt+/)',

    // user-collapse.js
    '折叠/展开': 'Fold/Unfold',

    // default values
    '你': 'You'
};

export function getLang() {
    if (S.lang === 'zh') return 'zh';
    if (S.lang === 'en') return 'en';
    var navLang = (navigator.language || '').toLowerCase();
    return navLang.startsWith('zh') ? 'zh' : 'en';
}

export function t(str) {
    if (getLang() === 'en' && dict[str] !== undefined) return dict[str];
    return str;
}

export function refreshLang() {
    var origBtn = document.querySelector('#dse-ui button[data-t="original"]');
    if (origBtn) { origBtn.title = t('原版'); origBtn.textContent = t('原'); }
    var trig = document.getElementById('dse-panel-trigger');
    if (trig) trig.title = t('自定义');
    var npTrig = document.getElementById('dse-notepad-trigger');
    if (npTrig) npTrig.title = t('笔记');
    var darkBtn = document.getElementById('dse-dark-toggle');
    if (darkBtn) darkBtn.title = t('深色/浅色');

    var foldBtns = document.querySelectorAll('.dse-code-fold-btn');
    for (var i = 0; i < foldBtns.length; i++) {
        var b = foldBtns[i];
        b.title = b.innerHTML === '\u25BE' ? t('折叠代码') : t('展开代码');
    }

    var userFoldBtns = document.querySelectorAll('.dse-usr-fold-btn');
    for (var j = 0; j < userFoldBtns.length; j++) {
        userFoldBtns[j].title = t('折叠/展开');
    }

    var tabLabels = { page: '页面配色', bubble: '消息气泡', strongcode: '强调/代码', font: '字体', avatar: '头像', lang: '语言', other: '其他' };
    var items = document.querySelectorAll('#dse-panel-left .dse-tab-item');
    for (var k = 0; k < items.length; k++) {
        var tab = items[k].dataset.tab;
        if (tab && tabLabels[tab]) {
            var span = items[k].querySelector('span');
            if (span) span.textContent = t(tabLabels[tab]);
        }
    }

    var rst = document.querySelector('#dse-panel-left .dse-rst');
    if (rst) rst.textContent = t('恢复默认');
}
