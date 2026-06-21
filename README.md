# DeepSeek Web Chat Enhancer

Tampermonkey 用户脚本，增强 [DeepSeek 网页端](https://chat.deepseek.com) 的界面与交互体验。

>本项目完全由AI生成。理论上此脚本的bug不会导致任何UI显示以外的问题。

## 代码参考

- 公式复制 - https://greasyfork.org/zh-CN/scripts/576764-deepseek-latex-copier-deepseek%E5%85%AC%E5%BC%8F%E5%A4%8D%E5%88%B6%E5%99%A8/code
- 单窗口记事本 - https://greasyfork.org/zh-CN/scripts/557500-deepseek%E5%8D%95%E7%AA%97%E5%8F%A3%E8%AE%B0%E4%BA%8B%E6%9C%AC-v2-0/code
- 折叠思考 - https://greasyfork.org/zh-CN/scripts/580006-deepseek%E9%BB%98%E8%AE%A4%E6%8A%98%E5%8F%A0%E6%80%9D%E8%80%83/code
- 代码块折叠 - https://greasyfork.org/zh-CN/scripts/576019-deepseek%E4%BB%A3%E7%A0%81%E5%9D%97%E6%8A%98%E5%8F%A0/code

## 功能

- **开关**  
&emsp;&emsp;所有功能可选择是否开启
- **配色**  
&emsp;&emsp;1. 自定义浅色/深色模式下的页面配色（背景、主题色、文字、边框）  
&emsp;&emsp;2. 自定义对话气泡的背景色与文字色  
&emsp;&emsp;3. 自定义加粗强调色和行内代码背景色
- **字体**  
&emsp;&emsp;自定义字体。可使用系统字体或 Google Fonts
- **头像**  
&emsp;&emsp;添加头像功能。用户与 AI 头像跟随对话气泡，距视口中线最近的优先
- **导航**  
&emsp;&emsp;1. 使用键盘`←` `→` 在消息间跳转  
&emsp;&emsp;2. 使用`Ctrl + Alt + /`快速定位到输入框
- **折叠**  
&emsp;&emsp;1. 自动折叠思考块  
&emsp;&emsp;2. 自动折叠用户输入：超过 5 行的用户消息自动折叠，右下角按钮切换，支持滚动阅览  
&emsp;&emsp;3. 自动折叠代码块：在代码块标题栏插入折叠/展开按钮，点击切换代码显示
- **限制代码块高度**  
&emsp;&emsp;限制代码内容最大高度为 60vh，超出后可滚动查看
- **公式复制**  
&emsp;&emsp;1. 双击 LaTeX 公式复制源码  
&emsp;&emsp;2. 直接复制时也将复制源码
- **简单笔记本**  
&emsp;&emsp;可拖拽多文件笔记面板，支持 Markdown 导出。所有内容存储在本地。
- **多语言**  
&emsp;&emsp;界面语言自动/中文/English 三态切换
- **预设**  
&emsp;&emsp;支持导入/导出预设

<p align="center">
  <img src="image/Showcase%201.webp" width="48%" alt="面板配置">
  <img src="image/Showcase%202.webp" width="48%" alt="功能展示">
</p>

<br/>

>[!NOTE]
>此项目不包含任何侵入式修改，仅增强网页端浏览体验。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 打开 `dist/deepseek-enhancer.user.js`，复制全部内容
3. Tampermonkey → 新建脚本 → 粘贴 → 保存
4. 访问 [chat.deepseek.com](https://chat.deepseek.com) 即可使用

## 构建

### 环境要求

- [Node.js](https://nodejs.org/) ≥ 18
- [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展

### 构建方法
```bash
npm install
npm run build     # 输出 dist/deepseek-enhancer.user.js
node --check dist/deepseek-enhancer.user.js   # 语法检查
```

## 项目结构

```text
dist/                  构建产物
doc/                   文档
sample/                保存的网页快照
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
├── code-collapse.js   代码块折叠与高度限制
├── i18n.js            中英双语文案系统
└── header.txt         Tampermonkey 元数据块
```

详细架构见 [`doc/ARCHITECTURE.md`](doc/ARCHITECTURE.md)，开发指引见 [`AGENTS.md`](AGENTS.md)。

## 注意

>[!IMPORTANT]
>请新建`sample`目录，在里面包含你保存的网页快照（在聊天页面用`Ctrl+S`保存的所有内容），以便AI读取页面实际架构。页面快照可能包含你的个人隐私，不要公开。  
>保存的页面快照应当包含脚本涉及的所有元素，例如公式、代码、强调等等。你也可以保存多个专门的对话页面（例如某个页面有很多公式，另一个页面有很多代码），这种情况下最好让AI读取所有页面，否则AI可能无法正确理解页面架构。

## 许可

MIT
