# DeepSeek Web Chat Enhancer — 变更日志

## v4.0.0 (2026-06-15)

### 架构变更
- **模块化拆分**：将单文件 1774 行拆分为 10 个 ES 模块
  - `state.js` — 共享状态对象、存储键常量、默认配色
  - `utils.js` — 纯工具函数（cloneObj, esc, getMode, getScrollContainer…）
  - `messages.js` — 消息角色标记、定时轻度更新
  - `theme.js` — CSS 构造（buildPageCSS / buildBubbleCSS / buildSCCSS）和应用
  - `font.js` — 字体加载（系统字体 / Google Fonts）
  - `avatars.js` — 浮动头像全部功能（创建、定位、更新）
  - `navigation.js` — 消息间跳转导航 + 键盘监听
  - `panel.js` — 两列面板 UI + 事件处理
  - `buttons.js` — 浮动按钮（原/自/☀🌙）
  - `observers.js` — MutationObserver + SPA 路由监听
- **构建系统**：引入 Vite 作为构建工具，IIFE 格式输出，GM_* API 外部化
- **Git 管理**：初始化本地仓库，每次变更独立提交

### BUG 修复
- 滚动监听器增加轮询重试：若 VirtualList 未就绪，每秒重试挂载直到成功
- `scheduleLightUpdate` 移除头像更新调用，避免 AI 流式输出时头像频繁跳动
- `getMessageContentBox` 用户消息回退链增加 `msg.firstElementChild`
- 重置 handler 移除冗余的 `updateAvatarContent()` 调用

---

## v3.2.0 (2026-06-15)

### 功能变更
- **两列面板**：左侧选项卡（页面配色/消息气泡/强调代码/字体/头像），右侧动态配置
- **取消强调/代码总开关**：`strongOn` / `codeOn` 各自独立

### 清理
- 移除 `scOn` 全局变量及所有引用
- 移除 DeepSeek 蓝色预设按钮（仅保留原/自/☀🌙）

---

## v3.1.0 (2026-06-15)

### 功能
- 浮动头像（2 个 DOM，scroll + rAF 定位）
- 头像垂直钳位（消息滚出视口时吸附顶部）
- 基于消息内容盒子的水平定位
- 消息间方向键跳转导航
- 自定义字体（Google Fonts + 系统字体）
- Ctrl+Alt+/ 焦点切换

### 面板
- 单列布局，页面配色 / 消息气泡 / 强调代码 / 字体 / 头像配置区
- 各区域独立开关控制

---

## v2.x ~ v1.x

### 早期版本
- 基础配色方案（原版 / DeepSeek 蓝 / 自定义）
- 方向键消息间跳转
- 单开关主题切换 → 三独立开关演进
- 每个消息注入头像 DOM → 浮动只读头像
- CSS 变量覆盖方案
