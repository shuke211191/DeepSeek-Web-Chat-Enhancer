# AGENTS.md

## 构建
- 构建前注意更新header.txt与ARCHITECTURE.md
- `npm run build` — Vite 构建，输出 `dist/deepseek-enhancer.user.js`（安装到 Tampermonkey 的最终文件）
- `npm run dev` — Vite dev（仅语法检查，无热更新）
- 构建后语法检查：`node --check dist/deepseek-enhancer.user.js`

## 架构关键点

### 状态管理
- 所有可变状态在 `S` 对象 (`src/state.js`) 中，模块通过 `import { S } from './state'` 读写
- `GM_getValue` / `GM_setValue` 在模块顶层调用会失败（GM API 仅在运行时可用），所有持久化在 `main.js` 的 `init()` 中加载
- **`S.K` 必须手动赋值**：`state.js` 末尾 `S.K = K`，否则运行时报 `S.K is undefined`

### GM API 外部化
- `vite.config.js` 将 `GM_*` API 设为 Rollup `external`，构建产物中保持为裸标识符，由 Tampermonkey 运行时注入
- 源文件中直接写 `GM_getValue(...)`，无需 `window.` 前缀

### Header 注入
- `src/header.txt` 是 `// ==UserScript==` 元数据块，通过自定义 Rollup 插件 `generateBundle` hook 插入输出顶部
- **不要用 `output.banner`**：Vite lib + IIFE 模式下 banner 会被包在 IIFE 内部

### 循环依赖
- `buttons.js` → `panel.js` 是唯一允许的单向依赖
- **禁止** `panel.js` 或 `avatars.js` 导入 `buttons.js`（`updateUI` 在 `utils.js`，`applyAfter` 在 `theme.js`）

## DOM 注意事项

### 稳定选择器 vs CSS Module 哈希
| ✅ 稳定可用 | ❌ 哈希类，随部署变化 |
|------------|---------------------|
| `.ds-message`, `.ds-assistant-message-main-content`, `.ds-markdown`, `.ds-think-content` | `_63c77b1`, `d29f3d7d`, `fbb737a4` |
| `.ds-virtual-list`, `[data-virtual-list-item-key]` | `_2bd7b35`, `_9663006` |
| `body.dark` | `_4f9bf79`, `_81e7b5e` |

- `data-ds-role="user"|"assistant"` 由 `tagMessageRoles()` 动态标记，可在 CSS 中使用

### 虚拟列表
- DeepSeek 使用虚拟列表，`[data-virtual-list-item-key]` 元素会随滚动动态增删
- 导航通过 `getCurrentVisibleItem()` 找视口中心项 → ±1 移动；边界外则滚一屏等待 350ms 重渲染
- `getScrollContainer()` 在页面加载早期可能返回 `null`→ `setupScrollAvatar()` 有 `setInterval` 轮询重试

### 面板 innerHTML 陷阱
- `renderPanelContent()` 用 `right.innerHTML =` 替换右列 → 销毁旧 DOM 和事件
- 面板内点击必须 `e.stopPropagation()`，否则冒泡到 document 关闭处理导致面板关闭
- 开关使用 `cloneNode(true)` + `replaceChild` + `addEventListener('change')` 模式重新绑定

### DeepSeek 主题
- 深色模式：`body.classList.toggle('dark')` + `data-ds-dark-theme` 属性
- 自定义配色：覆盖 `--dsw-alias-*` CSS 变量（`theme.js` → `buildPageCSS`）
- `body.dark` 变化后 `MutationObserver` 自动重新应用主题

## 测试
- 无自动化测试。手动将 `dist/deepseek-enhancer.user.js` 安装到 Tampermonkey → 在 `chat.deepseek.com` 验证
- `sample/` 目录含页面离线快照，仅供 DOM 结构参考，不可运行（CORS 拦截）
- 详细架构见 `doc/ARCHITECTURE.md`
