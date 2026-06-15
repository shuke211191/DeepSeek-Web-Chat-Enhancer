# DeepSeek Web Chat Enhancer

Tampermonkey 用户脚本，增强 [DeepSeek Chat](https://chat.deepseek.com) 的界面与交互体验。

本项目完全由AI生成。

## 代码参考

- 公式复制 - https://greasyfork.org/zh-CN/scripts/576764-deepseek-latex-copier-deepseek%E5%85%AC%E5%BC%8F%E5%A4%8D%E5%88%B6%E5%99%A8/code
- 单窗口记事本 - https://greasyfork.org/zh-CN/scripts/557500-deepseek%E5%8D%95%E7%AA%97%E5%8F%A3%E8%AE%B0%E4%BA%8B%E6%9C%AC-v2-0/code
- 折叠思考 - https://greasyfork.org/zh-CN/scripts/580006-deepseek%E9%BB%98%E8%AE%A4%E6%8A%98%E5%8F%A0%E6%80%9D%E8%80%83/code

## 功能

- **页面配色** — 自定义浅色/深色模式下的 8 组 CSS 变量（背景、主题色、文字、边框）
- **消息气泡** — 用户/AI 气泡背景色与文字色独立配置
- **强调/代码** — 自定义加粗强调色和行内代码背景色
- **字体** — 系统字体或 Google Fonts 自定义
- **浮动头像** — 用户与 AI 头像跟随当前对话位置，距视口中线最近的优先
- **方向键导航** — `←` `→` 在消息间跳转，滚出边界自动加载
- **自动折叠思考** — 两种模式（始终折叠 / 思考结束后延迟折叠），可配置延迟
- **自动折叠用户输入** — 超过 5 行的用户消息自动折叠，右下角按钮切换，支持滚动阅览
- **公式复制** — 双击 LaTeX 公式复制源码
- **单窗口笔记** — 可拖拽多文件笔记面板，支持 Markdown 导出

<p align="center">
  <img src="image/Showcase%201.webp" width="48%" alt="面板配置">
  <img src="image/Showcase%202.webp" width="48%" alt="功能展示">
</p>

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 打开 `dist/deepseek-enhancer.user.js`，复制全部内容
3. Tampermonkey → 新建脚本 → 粘贴 → 保存
4. 访问 [chat.deepseek.com](https://chat.deepseek.com) 即可使用

## 构建

```bash
npm install
npm run build     # 输出 dist/deepseek-enhancer.user.js
node --check dist/deepseek-enhancer.user.js   # 语法检查
```

## 项目结构

```
src/
├── main.js            入口：加载持久化 → 初始化子系统
├── state.js           全局状态 S、存储键 K、默认配色 DEF
├── utils.js           纯工具函数
├── messages.js        消息 DOM 操作与角色标记
├── theme.js           CSS 构造与应用
├── font.js            字体加载
├── avatars.js         浮动头像系统
├── navigation.js      方向键消息跳转
├── panel.js           两列配置面板
├── buttons.js         浮动按钮栏（原/自/笔记/深浅切换）
├── observers.js       MutationObserver + SPA 路由监听
├── notepad.js         可拖拽笔记面板
├── formula.js         LaTeX 公式双击复制
├── think-collapse.js  思考块自动折叠
├── user-collapse.js   用户消息自动折叠
└── header.txt         Tampermonkey 元数据块
```

详细架构见 [`doc/ARCHITECTURE.md`](doc/ARCHITECTURE.md)，开发指引见 [`AGENTS.md`](AGENTS.md)。

## 注意

请新建`sample`目录，在里面包含你保存的网页快照（在聊天页面用`Ctrl+S`保存的所有内容），以便AI读取页面实际架构。页面快照可能包含你的个人隐私，不要公开。

## 技术要点

- **GM API 外部化**：`GM_getValue` / `GM_setValue` 由 Vite 构建时设为 Rollup external，Tampermonkey 运行时注入
- **稳定选择器**：`.ds-message`、`.ds-markdown`、`.ds-think-content`、`.ds-assistant-message-main-content`、`.ds-virtual-list`
- **禁止使用哈希类名**：`_63c77b1`、`fbb737a4` 等随部署变化的 CSS Module 类名
- **虚拟列表**：DeepSeek 使用虚拟滚动，DOM 动态增删，需轮询重试机制

## 许可

MIT
