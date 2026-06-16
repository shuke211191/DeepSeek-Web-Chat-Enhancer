# DeepSeek Web Chat Enhancer — 变更日志

## v4.3.0 (2026-06-16)

### 新增功能
- **中英双语切换** — 界面语言支持自动/中文/English 三态选择，面板所有标签、按钮文字、笔记面板即时切换
- **独立"语言"选项卡** — 面板新增语言选项卡（位于头像与"其他"之间），含语言选择器

### 新增模块
- `i18n.js` — 翻译字典（~90 条中英映射）、`t()`/`getLang()`/`refreshLang()` 双语文案系统

### BUG 修复
- **头像不跟随新消息** — `scheduleLightUpdate` 追加 `scheduleAvatarUpdate()`，新消息出现后自动刷新头像位置
- **流式对话角色误判** — `getRole()` fallback 增加 `.ds-think-content` 检测，AI 思考阶段也能正确识别 assistant
- **移除哈希类名** — `getMessageContentBox` 去掉 `.fbb737a4`，改用 `.ds-markdown` 稳定选择器
- **头像锚点始终跟随思考块** — assistant 锚点优先级：`.ds-think-content` → `.ds-assistant-message-main-content`

### 功能改进
- 面板左侧选项卡标签和"恢复默认"按钮随语言切换实时更新

---

## v4.2.0 (2026-06-16)

### 新增功能
- **代码块折叠** — 在代码块标题栏插入折叠/展开按钮，点击切换代码内容显示/隐藏
- **限制代码块高度** — 代码内容区域最大 `60vh` 可滚动，超出显示原生滚动条
- 两个功能独立开关，位于面板"强调/代码"选项卡底部

### 新增模块
- `code-collapse.js` — 代码块折叠与高度限制（各自独立的 MutationObserver + 轮询）

### 功能改进
- 代码块相关开关归入"强调/代码"选项卡

---

## v4.1.0 (2026-06-15)

### 新增功能
- **自动折叠思考块** — 两种模式（始终折叠 / 思考结束后延迟折叠），可配置 0~10000ms 延迟
- **自动折叠用户输入** — 超过 5 行时右下角按钮折叠/展开，折叠态支持滚动阅览
- **面板优化** — 消息气泡/头像选项卡分隔线，其他选项卡重排

### 功能改进
- **头像定位优化** — 距视口中线最近的优先（原为距顶部最近），AI 头像优先跟随思考块

### 新增模块
- `think-collapse.js` — 思考块自动折叠（基于 `.ds-think-content` 稳定选择器）
- `user-collapse.js` — 用户消息自动折叠（动态测行高，`overflow-y: auto` 抽屉式阅览）

### BUG 修复
- 修复原版按钮点击后面板选项卡开关不同步

---

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
