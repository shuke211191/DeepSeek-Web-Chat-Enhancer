# DeepSeek Chat Enhancer — 模块文档

## 架构概述

```
src/
├── main.js         入口：加载 GM 存储 → 初始化各子系统
├── state.js        全局共享状态对象 S、存储键 K、默认配色 DEF
├── utils.js        纯工具函数（无副作用）
├── messages.js     消息 DOM 操作与角色标记
├── theme.js        CSS 构造与应用
├── font.js         字体加载
├── avatars.js      浮动头像系统
├── navigation.js   消息跳转导航 + 键盘事件
├── panel.js        两列配置面板
├── buttons.js      浮动按钮 UI
├── observers.js    MutationObserver + 路由监听
└── header.txt      Tampermonkey 元数据块
```

## 模块职责

### `state.js`
导出三个对象：
- `DEF` — 默认浅色/深色 CSS 变量配色表（不可变）
- `K` — GM 存储键名常量
- `S` — 全局可变状态对象

所有模块通过 `import { S } from './state'` 共享状态。状态修改即生效，无需事件总线。

### `utils.js`
纯工具函数，不依赖 S。
- `cloneObj(o)` / `cloneDef(def)` — 深拷贝
- `esc(s)` — HTML 转义
- `getMode()` — 返回 `'light'` / `'dark'`
- `getScrollContainer()` — 返回 `.ds-virtual-list` 元素
- `isOurNode(node)` — 判断是否脚本自身创建的节点
- `findItemByKey(key)` — 按 `data-virtual-list-item-key` 查找

### `messages.js`
- `collectMessages(root)` — 收集 `.ds-message` 元素
- `tagMessageRoles(root)` — 标记 `dataset.dsRole`（user/assistant）
- `updateMaxItemKey()` — 更新最大消息 key
- `scheduleLightUpdate(delay)` — debounced 定时更新

### `theme.js`
- `buildPageCSS(mode)` — 构造 CSS 变量覆盖（`.ds-enhancer-page`）
- `buildBubbleCSS(mode)` — 构造消息气泡颜色 CSS
- `buildSCCSS(mode)` — 构造强调/代码颜色 CSS
- `applyTheme(mode)` — 根据 S 中的开关状态注入/清除样式

### `font.js`
- `loadFont()` — 根据 S.fontOn / S.fontSrc / S.fontName 加载或清除字体

### `avatars.js`
- `createFloatAvatars()` — 创建 2 个 fixed-position DOM
- `updateAvatarContent()` — 更新头像文字和颜色
- `updateAvatarPositions()` — rAF 回调：找最顶部可见消息，计算定位
- `scheduleAvatarUpdate()` — 请求 rAF（防重入）
- `setAvatarState(on)` / `applyAvatarSettings()` — 开关和设置暴露
- `setupScrollAvatar()` — 挂载 scroll/resize 监听 + 轮询重试

### `navigation.js`
- `getVirtualItems()` — 收集并排序所有 `[data-virtual-list-item-key]`
- `getCurrentVisibleItem()` — 视口中心附近的消息
- `navigate(dir)` — ←/→ 跳转逻辑（含滚一屏回退）
- `setupKeyboard()` — 注册 Ctrl+Alt+/ 和 ArrowLeft/Right 快捷键

### `panel.js`
- `createPanel()` — 创建两列面板 DOM + 事件绑定
- `syncPanelMode()` — 深色/浅色选项卡同步
- `renderPanelContent()` — 按 `S.activePanelTab` 渲染右列
- `selectPanelTab(name)` — 切换选项卡
- `rebindPanelToggles()` — 重新绑定所有开关事件

### `buttons.js`
- `createSwitcher()` — 创建浮动按钮（原/自/☀🌙）
- `updateUI()` — 高亮当前活跃按钮
- `applyAfter()` — 应用主题 + 标记角色 + 更新 UI

### `observers.js`
- `setupMessageObserver()` — 监听 VirtualList 子节点变化
- `setupBodyObserver()` — 监听 `body.dark` 类变化
- `setupRouteWatcher()` — 每秒检测 URL 变化（SPA 路由）
- `setupObservers()` — 启动全部观察器

### `main.js`
- 从 GM 存储加载持久化状态到 S
- 初始化各子系统的启动顺序
- 注入基础 CSS（min-height 重置）

## 构建

```bash
npm run build    # 输出到 dist/deepseek-enhancer.user.js
npm run dev      # Vite dev server（仅语法检查）
```

构建配置：
- IIFE 格式，单文件输出
- `GM_*` API 外部化，由 Tampermonkey 运行时提供
- header.txt 作为 output banner 插入文件头部
- 不压缩，保留可读性

## 依赖图

```
main.js
  ├── state.js ────────────────── (所有模块)
  ├── utils.js                   (独立)
  ├── messages.js ── state, utils
  ├── theme.js ───── state
  ├── font.js ────── state
  ├── avatars.js ─── state, utils
  ├── navigation.js ─ state, utils, messages
  ├── panel.js ───── state, utils, theme, font, avatars, buttons
  ├── buttons.js ─── state, utils, messages, theme, font, panel
  ├── observers.js ─ state, utils, messages, theme, avatars, panel
  └── header.txt
```
