// ==UserScript==
// @name         DeepSeek Chat Enhancer Optimized
// @namespace    https://chat.deepseek.com/
// @version      3.1.0
// @description  配色+字体+头像+方向键消息跳转，性能优化版
// @author       You
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    // ─── 默认配色 ────────────────────────────────────────────────────
    var DEF = {
        light: {
            "--dsw-alias-bg-base": "#f2f4f8",
            "--dsw-alias-bg-layer-2": "#ffffff",
            "--dsw-alias-border-l1": "#d0d5dd",
            "--dsw-alias-border-l2": "#e0e4ea",
            "--dsw-alias-label-primary": "#1a1a2e",
            "--dsw-alias-label-secondary": "#6b7280",
            "--dsw-alias-label-tertiary": "#9ca3af",
            "--dsw-alias-brand-primary": "#5686fe",
            "--dsw-alias-brand-text": "#5686fe",
            "--dsw-alias-interactive-bg-hover": "rgba(86,134,254,0.08)",
            "--dsw-alias-interactive-bg-hover-solid": "rgba(86,134,254,0.12)",
            "--dsw-alias-markdown-inline-code": "#f0f4ff",
            "--dsw-alias-markdown-code-block": "#f5f7ff",
            "--dsw-alias-markdown-code-block-banner": "#eef1ff",
            "--dsw-alias-markdown-citation": "#f0f4ff",
            "--dsw-alias-markdown-tag": "#f0f4ff",
            "--dsw-alias-label-caption": "#9ca3af",
            "--dsw-alias-bg-overlay": "rgba(0,0,0,0.06)",
        },
        dark: {
            "--dsw-alias-bg-base": "#0f1419",
            "--dsw-alias-bg-layer-2": "#1a1e25",
            "--dsw-alias-border-l1": "#3a4050",
            "--dsw-alias-border-l2": "#2a303c",
            "--dsw-alias-label-primary": "#d1d5db",
            "--dsw-alias-label-secondary": "#8b95a5",
            "--dsw-alias-label-tertiary": "#606a7c",
            "--dsw-alias-brand-primary": "#5686fe",
            "--dsw-alias-brand-text": "#5686fe",
            "--dsw-alias-interactive-bg-hover": "rgba(86,134,254,0.12)",
            "--dsw-alias-interactive-bg-hover-solid": "rgba(86,134,254,0.18)",
            "--dsw-alias-markdown-inline-code": "#1e2430",
            "--dsw-alias-markdown-code-block": "#161b22",
            "--dsw-alias-markdown-code-block-banner": "#1b1f28",
            "--dsw-alias-markdown-citation": "#1e2430",
            "--dsw-alias-markdown-tag": "#1e2430",
            "--dsw-alias-label-caption": "#606a7c",
            "--dsw-alias-bg-overlay": "rgba(255,255,255,0.06)",
        },
    };

    // ─── 持久化 key ──────────────────────────────────────────────────
    var K = {
        PAGE_ON: "dse3_page",
        BUBBLE_ON: "dse3_bubble",

        PAGE_COLORS: "dse3_pc",
        BUBBLE_COLORS: "dse3_bc",

        STRONG_ON: "dse3_son",
        STRONG_C: "dse3_scol",

        CODE_ON: "dse3_con",
        CODE_C: "dse3_ccol",

        FONT_ON: "dse3_fon",
        FONT_SRC: "dse3_fsrc",
        FONT_NAME: "dse3_fname",

        AVATAR_ON: "dse3_avon",
        AVATAR_UNAME: "dse3_avun",
        AVATAR_ANAME: "dse3_avan",
        AVATAR_UC: "dse3_avuc",
        AVATAR_AC: "dse3_avac",
    };

    // ─── 状态 ────────────────────────────────────────────────────────
    var pageOn = GM_getValue(K.PAGE_ON, false);
    var bubbleOn = GM_getValue(K.BUBBLE_ON, false);
    var strongOn = GM_getValue(K.STRONG_ON, false);
    var codeOn = GM_getValue(K.CODE_ON, false);
    var fontOn = GM_getValue(K.FONT_ON, false);
    var avatarOn = GM_getValue(K.AVATAR_ON, false);

    var pageColors = GM_getValue(K.PAGE_COLORS, null) || cloneDef();

    var bubbleColors = GM_getValue(K.BUBBLE_COLORS, {
        userBg: "#5686fe",
        userText: "#ffffff",
        aiBgL: "#f8fafc",
        aiBgD: "#1e2430",
        aiTextL: "#1a1a2e",
        aiTextD: "#d1d5db",
    });

    var strongColors = GM_getValue(K.STRONG_C, {
        light: "#1a1a2e",
        dark: "#e5e7eb",
    });

    var codeColors = GM_getValue(K.CODE_C, {
        bgL: "#f0f4ff",
        bgD: "#1e2430",
        textL: "#5686fe",
        textD: "#8cb4ff",
    });

    var fontSrc = GM_getValue(K.FONT_SRC, "system");
    var fontName = GM_getValue(K.FONT_NAME, "");

    var avatarUName = GM_getValue(K.AVATAR_UNAME, "你");
    var avatarAName = GM_getValue(K.AVATAR_ANAME, "DeepSeek");
    var avatarUC = GM_getValue(K.AVATAR_UC, "#5686fe");
    var avatarAC = GM_getValue(K.AVATAR_AC, "#10a37f");

    var currentMode = "light";
    var currentItemKey = 1;
    var maxItemKey = 0;

    var styleEl = null;
    var fontLinkEl = null;
    var panelRef = null;
    var panelVisible = false;
    var panelMode = "light";

    var msgObserver = null;
    var bodyObserver = null;
    var routeTimer = null;
    var updateTimer = null;

    // ─── 工具 ────────────────────────────────────────────────────────
    function cloneObj(o) {
        return JSON.parse(JSON.stringify(o));
    }

    function cloneDef() {
        return cloneObj(DEF);
    }

    function esc(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function getMode() {
        return document.body.classList.contains("dark") ? "dark" : "light";
    }

    function getScrollContainer() {
        return (
            document.querySelector(".ds-virtual-list") ||
            document.querySelector('[class*="ds-virtual-list"]')
        );
    }

    function isOurNode(node) {
        if (!(node instanceof Element)) return true;

        if (
            node.id === "dse-ui" ||
            node.id === "dse-panel" ||
            node.id === "dse-css" ||
            node.id === "dse-font-link" ||
            node.id === "dse-font-style"
        ) {
            return true;
        }

        if (
            node.classList.contains("dse-fav-circle") ||
            node.classList.contains("dse-fav-name") ||
            node.closest("#dse-avatar-user") ||
            node.closest("#dse-avatar-ai") ||
            node.closest("#dse-ui") ||
            node.closest("#dse-panel")
        ) {
            return true;
        }

        return false;
    }

    function findItemByKey(key) {
        return document.querySelector(
            '[data-virtual-list-item-key="' + key + '"]',
        );
    }

    function updateMaxItemKey() {
        var items = document.querySelectorAll("[data-virtual-list-item-key]");
        for (var i = 0; i < items.length; i++) {
            var k = parseInt(items[i].dataset.virtualListItemKey, 10);
            if (!isNaN(k) && k > maxItemKey) maxItemKey = k;
        }
    }

    function scheduleLightUpdate(delay) {
        if (updateTimer) return;

        updateTimer = setTimeout(function () {
            updateTimer = null;

            tagMessageRoles();
            updateMaxItemKey();
        }, delay || 250);
    }

    // ─── 消息角色标记 ────────────────────────────────────────────────
    function collectMessages(root) {
        var arr = [];

        if (!root) root = document;

        if (root instanceof Element && root.matches(".ds-message")) {
            arr.push(root);
        }

        if (root.querySelectorAll) {
            var list = root.querySelectorAll(".ds-message");
            for (var i = 0; i < list.length; i++) {
                arr.push(list[i]);
            }
        }

        return arr;
    }

    function tagMessageRoles(root) {
        var msgs = collectMessages(root);

        for (var i = 0; i < msgs.length; i++) {
            var msg = msgs[i];
            if (msg.dataset.dsRole) continue;

            var role = msg.querySelector(".ds-assistant-message-main-content")
                ? "assistant"
                : "user";

            msg.dataset.dsRole = role;

            var item = msg.closest("[data-virtual-list-item-key]");
            if (item && !item.dataset.dsRole) {
                item.dataset.dsRole = role;
            }
        }
    }

    // ─── CSS 构造 ────────────────────────────────────────────────────
    function buildPageCSS(mode) {
        var vars = pageColors[mode] || DEF[mode];
        var css = ".ds-enhancer-page {\n";

        for (var k in vars) {
            if (Object.prototype.hasOwnProperty.call(vars, k)) {
                css += "  " + k + ": " + vars[k] + " !important;\n";
            }
        }

        css += "}\n";
        return css;
    }

    function buildBubbleCSS(mode) {
        var isDark = mode === "dark";
        var bc = bubbleColors;

        return [
            '.ds-enhancer-bubble [data-ds-role="user"] {',
            "  background:" + bc.userBg + " !important;",
            "  color:" + bc.userText + " !important;",
            "}",

            '.ds-enhancer-bubble [data-ds-role="user"] .fbb737a4,',
            '.ds-enhancer-bubble [data-ds-role="user"] p,',
            '.ds-enhancer-bubble [data-ds-role="user"] li,',
            '.ds-enhancer-bubble [data-ds-role="user"] h1,',
            '.ds-enhancer-bubble [data-ds-role="user"] h2,',
            '.ds-enhancer-bubble [data-ds-role="user"] h3,',
            '.ds-enhancer-bubble [data-ds-role="user"] h4 {',
            "  color:" + bc.userText + " !important;",
            "}",

            '.ds-enhancer-bubble [data-ds-role="user"] a {',
            "  color:" + bc.userText + " !important;",
            "  text-decoration: underline !important;",
            "}",

            '.ds-enhancer-bubble [data-ds-role="assistant"] {',
            "  background:" + (isDark ? bc.aiBgD : bc.aiBgL) + " !important;",
            "  color:" + (isDark ? bc.aiTextD : bc.aiTextL) + " !important;",
            "}",

            '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown p,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown li,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown h1,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown h2,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown h3,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown h4,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown em,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] ._74c0879,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] ._74c0879 *,',
            '.ds-enhancer-bubble [data-ds-role="assistant"] .dbe8cf4a {',
            "  color:" + (isDark ? bc.aiTextD : bc.aiTextL) + " !important;",
            "}",

            '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown a {',
            "  color:" + bc.userBg + " !important;",
            "}",
        ].join("\n");
    }

    function buildSCCSS(mode) {
        var isDark = mode === "dark";
        var css = [];

        if (strongOn) {
            var sc = isDark ? strongColors.dark : strongColors.light;
            css.push(
                ".ds-enhancer-sc .ds-markdown strong {" +
                    " color:" +
                    sc +
                    " !important;" +
                    "}",
            );
        }

        if (codeOn) {
            var bg = isDark ? codeColors.bgD : codeColors.bgL;
            var tc = isDark ? codeColors.textD : codeColors.textL;

            css.push(
                ".ds-enhancer-sc .ds-markdown code:not(.md-code-block code) {" +
                    " background:" +
                    bg +
                    " !important;" +
                    " color:" +
                    tc +
                    " !important;" +
                    "}",
            );
        }

        return css.join("\n");
    }

    // ─── 应用主题 ────────────────────────────────────────────────────
    function applyTheme(mode) {
        if (styleEl) {
            styleEl.remove();
            styleEl = null;
        }

        document.body.classList.remove(
            "ds-enhancer-page",
            "ds-enhancer-bubble",
            "ds-enhancer-sc",
        );

        var css = "";

        if (pageOn) {
            document.body.classList.add("ds-enhancer-page");
            css += buildPageCSS(mode);
        }

        if (bubbleOn) {
            document.body.classList.add("ds-enhancer-bubble");
            css += buildBubbleCSS(mode);
        }

        if (strongOn || codeOn) {
            document.body.classList.add("ds-enhancer-sc");
            css += buildSCCSS(mode);
        }

        if (css) {
            styleEl = document.createElement("style");
            styleEl.id = "dse-css";
            styleEl.textContent = css;
            document.head.appendChild(styleEl);
        }

        currentMode = mode;
    }

    // ─── 字体 ────────────────────────────────────────────────────────
    function loadFont() {
        if (fontLinkEl) {
            fontLinkEl.remove();
            fontLinkEl = null;
        }

        document.body.classList.remove("ds-enhancer-font");

        var oldStyle = document.getElementById("dse-font-style");
        if (oldStyle) oldStyle.remove();

        if (!fontOn || !fontName.trim()) return;

        document.body.classList.add("ds-enhancer-font");

        if (fontSrc === "google") {
            fontLinkEl = document.createElement("link");
            fontLinkEl.id = "dse-font-link";
            fontLinkEl.rel = "stylesheet";
            fontLinkEl.href =
                "https://fonts.googleapis.com/css2?family=" +
                encodeURIComponent(fontName.trim()).replace(/%20/g, "+") +
                "&display=swap";
            document.head.appendChild(fontLinkEl);
        }

        var s = document.createElement("style");
        s.id = "dse-font-style";
        s.textContent =
            ".ds-enhancer-font .ds-markdown," +
            ".ds-enhancer-font textarea," +
            ".ds-enhancer-font .fbb737a4 {" +
            'font-family:"' +
            fontName.trim().replace(/"/g, '\\"') +
            '",var(--dsw-font-family),system-ui,sans-serif !important;' +
            "}";

        document.head.appendChild(s);
    }

    // ─── 头像（浮动，仅2个DOM） ─────────────────────────────────────
    var avatarUserEl = null;
    var avatarAIEl = null;
    var avatarRAF = null;
    var avatarScrollContainer = null;
    var avatarScrollRetry = null;

    function createFloatAvatars() {
        if (avatarUserEl) return;

        var css =
            "#dse-avatar-ai,#dse-avatar-user{" +
            "position:fixed;" +
            "z-index:100;" +
            "display:flex;" +
            "flex-direction:column;" +
            "align-items:center;" +
            "gap:3px;" +
            "width:36px;" +
            "pointer-events:none;" +
            "transform:translateY(-50%);" +
            "}" +
            ".dse-fav-circle{" +
            "width:30px;" +
            "height:30px;" +
            "border-radius:50%;" +
            "display:flex;" +
            "align-items:center;" +
            "justify-content:center;" +
            "color:#fff;" +
            "font-size:14px;" +
            "font-weight:600;" +
            "box-shadow:0 2px 8px rgba(0,0,0,.18);" +
            "}" +
            ".dse-fav-name{" +
            "font-size:10px;" +
            "color:#9ca3af;" +
            "text-align:center;" +
            "max-width:36px;" +
            "overflow:hidden;" +
            "text-overflow:ellipsis;" +
            "white-space:nowrap;" +
            "line-height:1.2;" +
            "text-shadow:0 1px 2px rgba(0,0,0,.25);" +
            "}";

        GM_addStyle(css);

        avatarUserEl = document.createElement("div");
        avatarUserEl.id = "dse-avatar-user";
        avatarUserEl.style.display = "none";
        avatarUserEl.innerHTML =
            '<div class="dse-fav-circle"></div><div class="dse-fav-name"></div>';

        avatarAIEl = document.createElement("div");
        avatarAIEl.id = "dse-avatar-ai";
        avatarAIEl.style.display = "none";
        avatarAIEl.innerHTML =
            '<div class="dse-fav-circle"></div><div class="dse-fav-name"></div>';

        document.body.appendChild(avatarUserEl);
        document.body.appendChild(avatarAIEl);

        updateAvatarContent();
    }

    function updateAvatarContent() {
        if (!avatarUserEl) return;
        var uc = avatarUserEl.querySelector(".dse-fav-circle");
        var un = avatarUserEl.querySelector(".dse-fav-name");
        uc.style.background = avatarUC;
        uc.textContent = (avatarUName || "你").charAt(0);
        un.textContent = avatarUName || "你";

        var ac = avatarAIEl.querySelector(".dse-fav-circle");
        var an = avatarAIEl.querySelector(".dse-fav-name");
        ac.style.background = avatarAC;
        ac.textContent = (avatarAName || "D").charAt(0);
        an.textContent = avatarAName || "DeepSeek";
    }

    function getViewportForAvatar() {
        var sc = getScrollContainer();
        if (sc) {
            var r = sc.getBoundingClientRect();
            var extra = Math.min(80, r.height * 0.1);
            return { top: r.top + extra, bottom: r.bottom - extra };
        }
        return { top: 0, bottom: window.innerHeight };
    }

    function getRole(el) {
        if (el.dataset.dsRole) return el.dataset.dsRole;
        return el.querySelector(".ds-assistant-message-main-content")
            ? "assistant"
            : "user";
    }

    function clampNumber(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function getMessageContentBox(msg, role) {
        if (!msg) return null;

        if (role === "assistant") {
            return (
                msg.querySelector(".ds-assistant-message-main-content") ||
                msg.querySelector(".ds-markdown") ||
                msg
            );
        }

        // 用户消息不要用 [class*="user"]，容易误选到外层容器
        return (
            msg.querySelector(".fbb737a4") ||
            msg.querySelector(".ds-markdown") ||
            msg.querySelector("p") ||
            msg.firstElementChild ||
            msg
        );
    }

    function updateAvatarPositions() {
        avatarRAF = null;

        if (!avatarOn || !avatarUserEl || !avatarAIEl) {
            if (avatarUserEl) avatarUserEl.style.display = "none";
            if (avatarAIEl) avatarAIEl.style.display = "none";
            return;
        }

        var sc = getScrollContainer();

        var scrollRect = sc
            ? sc.getBoundingClientRect()
            : {
                  top: 0,
                  bottom: window.innerHeight,
                  left: 0,
                  right: window.innerWidth,
                  width: window.innerWidth,
                  height: window.innerHeight,
              };

        var viewport = {
            top: scrollRect.top,
            bottom: scrollRect.bottom,
            left: scrollRect.left,
            right: scrollRect.right,
            width: scrollRect.width || window.innerWidth,
            height: scrollRect.height || window.innerHeight,
        };

        var clampTop = viewport.top + 26;
        var clampBottom = viewport.bottom - 26;

        var msgs = document.querySelectorAll(".ds-message");

        var bestUser = null;
        var bestAI = null;

        var bestUserDist = Infinity;
        var bestAIDist = Infinity;

        for (var i = 0; i < msgs.length; i++) {
            var msg = msgs[i];
            var rect = msg.getBoundingClientRect();

            if (rect.height < 8) continue;
            if (rect.bottom <= viewport.top) continue;
            if (rect.top >= viewport.bottom) continue;

            var role = getRole(msg);

            var visibleTop = Math.max(rect.top, viewport.top);
            var visibleBottom = Math.min(rect.bottom, viewport.bottom);
            var visibleHeight = visibleBottom - visibleTop;

            if (visibleHeight <= 0) continue;

            /*
             * 核心逻辑：
             * 选择“当前可见区域里最靠近顶部”的消息。
             * 不再用 visibleHeight 参与加权，否则长消息会长期霸占头像。
             */
            var dist = Math.abs(visibleTop - viewport.top);

            if (role === "user") {
                if (dist < bestUserDist) {
                    bestUserDist = dist;
                    bestUser = msg;
                }
            } else if (role === "assistant") {
                if (dist < bestAIDist) {
                    bestAIDist = dist;
                    bestAI = msg;
                }
            }
        }

        function placeAvatar(avatarEl, msg, role) {
            if (!avatarEl) return;

            if (!msg) {
                avatarEl.style.display = "none";
                return;
            }

            var box = getMessageContentBox(msg, role);

            if (!box) {
                avatarEl.style.display = "none";
                return;
            }

            var rect = box.getBoundingClientRect();

            if (rect.height < 4 || rect.width < 4) {
                avatarEl.style.display = "none";
                return;
            }

            var avatarWidth = 36;
            var gap = 12;

            /*
             * 垂直位置：
             * 头像贴近当前可见部分顶部，而不是整条消息中心。
             */
            var visibleTop = Math.max(rect.top, viewport.top);
            var top = visibleTop + 22;

            top = clampNumber(top, clampTop, clampBottom);

            /*
             * 水平位置：
             * AI 头像在 AI 内容左侧；
             * 用户头像在用户内容右侧。
             */
            var left;

            if (role === "assistant") {
                left = rect.left - avatarWidth - gap;
            } else {
                left = rect.right + gap;
            }

            left = clampNumber(left, 8, window.innerWidth - avatarWidth - 8);

            avatarEl.style.display = "";
            avatarEl.style.top = top + "px";
            avatarEl.style.left = left + "px";
            avatarEl.style.right = "auto";
        }

        placeAvatar(avatarAIEl, bestAI, "assistant");
        placeAvatar(avatarUserEl, bestUser, "user");
    }

    function scheduleAvatarUpdate() {
        if (avatarRAF) return;
        avatarRAF = requestAnimationFrame(updateAvatarPositions);
    }

    function setAvatarState(on) {
        avatarOn = on;
        GM_setValue(K.AVATAR_ON, on);
        if (!on) {
            if (avatarUserEl) {
                avatarUserEl.style.display = "none";
                avatarAIEl.style.display = "none";
            }
        } else {
            createFloatAvatars();
            scheduleAvatarUpdate();
        }
        updateUI();
    }

    function applyAvatarSettings() {
        updateAvatarContent();
        if (avatarOn) {
            createFloatAvatars();
            scheduleAvatarUpdate();
        }
    }

    function setupScrollAvatar() {
        var sc = getScrollContainer();

        if (sc && sc !== avatarScrollContainer) {
            if (avatarScrollContainer) {
                try {
                    avatarScrollContainer.removeEventListener(
                        "scroll",
                        scheduleAvatarUpdate,
                    );
                } catch (e) {}
            }

            avatarScrollContainer = sc;

            avatarScrollContainer.addEventListener(
                "scroll",
                scheduleAvatarUpdate,
                { passive: true },
            );

            // 滚动监听器挂载成功，停止轮询重试
            if (avatarScrollRetry) {
                clearInterval(avatarScrollRetry);
                avatarScrollRetry = null;
            }
        } else if (!sc && !avatarScrollRetry) {
            // 滚动容器尚未就绪，每秒重试挂载
            avatarScrollRetry = setInterval(function () {
                var sc2 = getScrollContainer();
                if (sc2) {
                    clearInterval(avatarScrollRetry);
                    avatarScrollRetry = null;
                    setupScrollAvatar();
                }
            }, 1000);
        }

        window.removeEventListener("resize", scheduleAvatarUpdate);

        window.addEventListener("resize", scheduleAvatarUpdate, {
            passive: true,
        });

        scheduleAvatarUpdate();
    }

    // ─── 导航 ────────────────────────────────────────────────────────
    function getVirtualItems() {
        var nodes = document.querySelectorAll("[data-virtual-list-item-key]");
        var arr = [];

        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            var key = parseInt(el.dataset.virtualListItemKey, 10);

            if (isNaN(key)) continue;

            // 只保留真正包含消息的 item，避免 placeholder / loading 节点干扰
            if (!el.querySelector(".ds-message")) continue;

            arr.push({
                el: el,
                key: key,
            });
        }

        arr.sort(function (a, b) {
            return a.key - b.key;
        });

        return arr;
    }

    function getScrollViewportRect() {
        var sc = getScrollContainer();

        if (sc) {
            return sc.getBoundingClientRect();
        }

        return {
            top: 0,
            bottom: window.innerHeight,
            height: window.innerHeight,
        };
    }

    function getCurrentVisibleItem() {
        var items = getVirtualItems();

        if (!items.length) return null;

        var viewport = getScrollViewportRect();
        var centerY = viewport.top + viewport.height / 2;

        var best = null;
        var bestDist = Infinity;

        for (var i = 0; i < items.length; i++) {
            var rect = items[i].el.getBoundingClientRect();

            // 跳过完全不在视口附近的元素
            if (rect.bottom < viewport.top || rect.top > viewport.bottom) {
                continue;
            }

            var itemCenter = rect.top + rect.height / 2;
            var dist = Math.abs(itemCenter - centerY);

            if (dist < bestDist) {
                bestDist = dist;
                best = items[i];
            }
        }

        // 如果没有严格可见的，就退化为取距离视口中心最近的 DOM 项
        if (!best) {
            for (var j = 0; j < items.length; j++) {
                var r = items[j].el.getBoundingClientRect();
                var c = r.top + r.height / 2;
                var d = Math.abs(c - centerY);

                if (d < bestDist) {
                    bestDist = d;
                    best = items[j];
                }
            }
        }

        return best;
    }

    function scrollToItem(el) {
        if (!el) return;

        try {
            el.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        } catch (e) {
            el.scrollIntoView(false);
        }
    }

    function navigate(dir) {
        var items = getVirtualItems();

        if (!items.length) {
            updateMaxItemKey();
            return;
        }

        updateMaxItemKey();

        var current = getCurrentVisibleItem();

        if (!current) {
            current = items[0];
        }

        var index = -1;

        for (var i = 0; i < items.length; i++) {
            if (items[i].key === current.key) {
                index = i;
                break;
            }
        }

        if (index < 0) index = 0;

        var target = null;

        if (dir === "prev") {
            if (index > 0) {
                target = items[index - 1];
            } else {
                // 当前 DOM 中已经是最上方的渲染项，尝试向上滚动一屏，等待虚拟列表渲染
                var scUp = getScrollContainer();

                if (scUp) {
                    scUp.scrollBy({
                        top: -Math.max(300, scUp.clientHeight * 0.75),
                        behavior: "smooth",
                    });
                } else {
                    window.scrollBy({
                        top: -Math.max(300, window.innerHeight * 0.75),
                        behavior: "smooth",
                    });
                }

                setTimeout(function () {
                    var refreshed = getVirtualItems();
                    if (!refreshed.length) return;

                    // 向上滚动后，选择当前视口中心附近的项
                    var now = getCurrentVisibleItem();
                    if (now) {
                        currentItemKey = now.key;
                    }
                }, 350);

                return;
            }
        } else {
            if (index < items.length - 1) {
                target = items[index + 1];
            } else {
                // 当前 DOM 中已经是最下方的渲染项，尝试向下滚动一屏，等待虚拟列表渲染
                var scDown = getScrollContainer();

                if (scDown) {
                    scDown.scrollBy({
                        top: Math.max(300, scDown.clientHeight * 0.75),
                        behavior: "smooth",
                    });
                } else {
                    window.scrollBy({
                        top: Math.max(300, window.innerHeight * 0.75),
                        behavior: "smooth",
                    });
                }

                setTimeout(function () {
                    var now = getCurrentVisibleItem();
                    if (now) {
                        currentItemKey = now.key;
                    }
                }, 350);

                return;
            }
        }

        if (!target) return;

        currentItemKey = target.key;
        scrollToItem(target.el);
    }

    function setupKeyboard() {
        document.addEventListener(
            "keydown",
            function (e) {
                if (
                    e.ctrlKey &&
                    e.altKey &&
                    (e.key === "/" || e.code === "Slash")
                ) {
                    if (
                        e.target &&
                        (e.target.closest('[role="dialog"]') ||
                            e.target.closest('[role="menu"]'))
                    ) {
                        return;
                    }

                    e.preventDefault();

                    var ta = document.querySelector("textarea");
                    var sc = getScrollContainer();

                    if (document.activeElement === ta) {
                        if (sc) {
                            sc.setAttribute("tabindex", "0");
                            sc.focus({
                                preventScroll: true,
                            });
                        }
                    } else {
                        if (ta) ta.focus();
                    }

                    return;
                }

                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

                var el = document.activeElement;

                if (el) {
                    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT")
                        return;
                    if (
                        el.isContentEditable ||
                        el.getAttribute("role") === "textbox"
                    )
                        return;
                    if (
                        el.closest('[role="dialog"]') ||
                        el.closest('[role="menu"]')
                    )
                        return;
                    if (el.closest('[role="listbox"]') || el.closest("select"))
                        return;
                    if (el.closest("#dse-panel")) return;
                }

                e.preventDefault();
                e.stopPropagation();

                navigate(e.key === "ArrowLeft" ? "prev" : "next");
            },
            true,
        );
    }

    // ─── 面板 ────────────────────────────────────────────────────────
    var activePanelTab = "page";

    function syncPanelMode() {
        panelMode = getMode();
        var panel = document.getElementById("dse-panel");
        if (!panel) return;
        var tabs = panel.querySelectorAll(".dse-mode-tab");
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle("on", tabs[i].dataset.mode === panelMode);
        }
        renderPanelContent();
    }

    function bindToggle(id, cb) {
        var el = document.getElementById(id);
        if (!el) return;
        var n = el.cloneNode(true);
        el.parentNode.replaceChild(n, el);
        n.addEventListener("change", function () {
            cb(n.checked);
        });
    }

    function rebindPanelToggles() {
        bindToggle("dse-page-toggle", function (v) {
            pageOn = v;
            GM_setValue(K.PAGE_ON, v);
            applyAfter();
            renderPanelContent();
        });
        bindToggle("dse-bubble-toggle", function (v) {
            bubbleOn = v;
            GM_setValue(K.BUBBLE_ON, v);
            applyAfter();
            renderPanelContent();
        });
        bindToggle("dse-strong-toggle", function (v) {
            strongOn = v;
            GM_setValue(K.STRONG_ON, v);
            applyAfter();
            renderPanelContent();
        });
        bindToggle("dse-code-toggle", function (v) {
            codeOn = v;
            GM_setValue(K.CODE_ON, v);
            applyAfter();
            renderPanelContent();
        });
        bindToggle("dse-font-toggle", function (v) {
            fontOn = v;
            GM_setValue(K.FONT_ON, v);
            loadFont();
            updateUI();
            renderPanelContent();
        });
        bindToggle("dse-avatar-toggle", function (v) {
            setAvatarState(v);
            renderPanelContent();
        });
    }

    function applyAfter() {
        applyTheme(getMode());
        tagMessageRoles();
        updateUI();
    }

    function syncPanelLeftToggles() {
        var pageToggle = document.getElementById("dse-page-toggle");
        var bubbleToggle = document.getElementById("dse-bubble-toggle");
        var fontToggle = document.getElementById("dse-font-toggle");
        var avatarToggle = document.getElementById("dse-avatar-toggle");

        if (pageToggle) pageToggle.checked = pageOn;
        if (bubbleToggle) bubbleToggle.checked = bubbleOn;
        if (fontToggle) fontToggle.checked = fontOn;
        if (avatarToggle) avatarToggle.checked = avatarOn;
    }

    function renderPanelContent() {
        var right = document.getElementById("dse-panel-right");
        if (!right) return;
        if (!pageColors[panelMode]) {
            pageColors[panelMode] = cloneObj(DEF[panelMode]);
        }

        var html = "";

        function colorRow(key, label, g) {
            var val;
            if (g === "bubble") val = bubbleColors[key];
            else if (g === "strong") val = strongColors[key];
            else if (g === "code") val = codeColors[key];
            else val = pageColors[panelMode][key];
            return (
                '<div class="dse-r"><label>' +
                label +
                '</label><input type="color" data-k="' +
                key +
                '" data-g="' +
                g +
                '" value="' +
                (val || "#000000") +
                '"></div>'
            );
        }

        if (activePanelTab === "page") {
            html +=
                '<div class="dse-mode-tabs"><button class="dse-mode-tab' +
                (panelMode === "light" ? " on" : "") +
                '" data-mode="light">浅色模式</button><button class="dse-mode-tab' +
                (panelMode === "dark" ? " on" : "") +
                '" data-mode="dark">深色模式</button></div>';
            var keys = [
                "--dsw-alias-bg-base",
                "--dsw-alias-bg-layer-2",
                "--dsw-alias-brand-primary",
                "--dsw-alias-label-primary",
                "--dsw-alias-label-secondary",
                "--dsw-alias-label-tertiary",
                "--dsw-alias-border-l1",
                "--dsw-alias-border-l2",
            ];
            var labels = [
                "页面背景",
                "表面/卡片",
                "主题色",
                "主文字",
                "次文字",
                "辅助文字",
                "主边框",
                "次边框",
            ];
            for (var pi = 0; pi < keys.length; pi++) {
                html += colorRow(keys[pi], labels[pi], "page");
            }
        } else if (activePanelTab === "bubble") {
            html += colorRow("userBg", "用户气泡背景", "bubble");
            html += colorRow("userText", "用户气泡文字", "bubble");
            html += colorRow("aiBgL", "AI气泡背景(浅)", "bubble");
            html += colorRow("aiBgD", "AI气泡背景(深)", "bubble");
            html += colorRow("aiTextL", "AI气泡文字(浅)", "bubble");
            html += colorRow("aiTextD", "AI气泡文字(深)", "bubble");
        } else if (activePanelTab === "strongcode") {
            html +=
                '<div class="dse-toggler"><label class="tgl">自定义强调颜色</label><label class="dse-sw"><input id="dse-strong-toggle" type="checkbox"' +
                (strongOn ? " checked" : "") +
                '><span class="dse-sl"></span></label></div>';
            html +=
                '<div id="dse-strong-rows" style="' +
                (strongOn ? "" : "display:none") +
                '">';
            html += colorRow("light", "强调色(浅)", "strong");
            html += colorRow("dark", "强调色(深)", "strong");
            html += "</div>";
            html +=
                '<div class="dse-toggler"><label class="tgl">自定义行内代码</label><label class="dse-sw"><input id="dse-code-toggle" type="checkbox"' +
                (codeOn ? " checked" : "") +
                '><span class="dse-sl"></span></label></div>';
            html +=
                '<div id="dse-code-rows" style="' +
                (codeOn ? "" : "display:none") +
                '">';
            html += colorRow("bgL", "代码背景(浅)", "code");
            html += colorRow("bgD", "代码背景(深)", "code");
            html += colorRow("textL", "代码文字(浅)", "code");
            html += colorRow("textD", "代码文字(深)", "code");
            html += "</div>";
        } else if (activePanelTab === "font") {
            html +=
                '<div class="dse-r"><label>来源</label><select id="dse-font-src" class="dse-input"><option value="system"' +
                (fontSrc === "system" ? " selected" : "") +
                '>系统字体</option><option value="google"' +
                (fontSrc === "google" ? " selected" : "") +
                ">Google Fonts</option></select></div>";
            html +=
                '<div class="dse-r"><label>字体名称</label><input id="dse-font-name" class="dse-input" type="text" value="' +
                esc(fontName) +
                '"></div>';
        } else if (activePanelTab === "avatar") {
            html +=
                '<div class="dse-r"><label>你的名字</label><input id="dse-avatar-uname" class="dse-input" type="text" value="' +
                esc(avatarUName) +
                '"></div>';
            html +=
                '<div class="dse-r"><label>你的头像色</label><input type="color" data-k="avuc" data-g="avatar" value="' +
                avatarUC +
                '"></div>';
            html +=
                '<div class="dse-r"><label>AI名字</label><input id="dse-avatar-aname" class="dse-input" type="text" value="' +
                esc(avatarAName) +
                '"></div>';
            html +=
                '<div class="dse-r"><label>AI头像色</label><input type="color" data-k="avac" data-g="avatar" value="' +
                avatarAC +
                '"></div>';
        }

        right.innerHTML = html;

        var modeTabs = right.querySelectorAll(".dse-mode-tab");
        for (var ti = 0; ti < modeTabs.length; ti++) {
            (function (tab) {
                tab.addEventListener("click", function () {
                    panelMode = tab.dataset.mode;
                    renderPanelContent();
                });
            })(modeTabs[ti]);
        }

        rebindPanelToggles();
        syncPanelLeftToggles();
    }

    function selectPanelTab(name) {
        activePanelTab = name;

        var left = document.getElementById("dse-panel-left");
        if (left) {
            var items = left.querySelectorAll(".dse-tab-item");
            for (var i = 0; i < items.length; i++) {
                items[i].classList.toggle("on", items[i].dataset.tab === name);
            }
        }

        renderPanelContent();
    }

    function createPanel() {
        var existing = document.getElementById("dse-panel");
        if (existing) return existing;

        var panel = document.createElement("div");
        panel.id = "dse-panel";

        panel.innerHTML =
            "<style>" +
            "#dse-panel{position:fixed;bottom:110px;right:68px;z-index:99998;flex-direction:row;background:var(--dsw-alias-bg-layer-2,#fff);border:1px solid var(--dsw-alias-border-l2,#e0e4ea);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.15);font-family:system-ui,sans-serif;font-size:13px;width:430px;max-height:75vh;overflow:hidden;display:none;}" +
            ".dark #dse-panel{background:#1e2430;border-color:#3a4050;}" +
            "#dse-panel-left{flex-shrink:0;width:140px;padding:14px 0 14px 14px;border-right:1px solid var(--dsw-alias-border-l2);display:flex;flex-direction:column;gap:2px;overflow-y:auto;}" +
            "#dse-panel-left .dse-tab-item{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 8px 8px;border-radius:8px;cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:13px;transition:background .15s;user-select:none;}" +
            "#dse-panel-left .dse-tab-item:hover{background:var(--dsw-alias-interactive-bg-hover);}" +
            "#dse-panel-left .dse-tab-item.on{background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary);}" +
            "#dse-panel-left .dse-sw{position:relative;width:36px;height:18px;flex-shrink:0;}" +
            "#dse-panel-left .dse-sw input{opacity:0;width:0;height:0;}" +
            "#dse-panel-left .dse-sl{position:absolute;top:0;left:0;right:0;bottom:0;background:#ccc;border-radius:18px;cursor:pointer;transition:.2s;}" +
            '#dse-panel-left .dse-sl:before{content:"";position:absolute;height:12px;width:12px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;}' +
            "#dse-panel-left input:checked+.dse-sl{background:var(--dsw-alias-brand-primary,#5686fe);}" +
            "#dse-panel-left input:checked+.dse-sl:before{transform:translateX(18px);}" +
            "#dse-panel-left .dse-rst{width:calc(100% - 14px);padding:7px;margin-top:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;text-align:center;}" +
            "#dse-panel-left .dse-rst:hover{background:var(--dsw-alias-interactive-bg-hover);}" +
            "#dse-panel-right{flex:1;padding:14px;overflow-y:auto;min-width:0;}" +
            "#dse-panel .dse-mode-tabs{display:flex;gap:4px;margin-bottom:10px;}" +
            "#dse-panel .dse-mode-tab{flex:1;padding:5px;text-align:center;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary);background:transparent;}" +
            "#dse-panel .dse-mode-tab.on{background:var(--dsw-alias-brand-primary);color:#fff;border-color:var(--dsw-alias-brand-primary);}" +
            "#dse-panel .dse-r{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;gap:8px;}" +
            "#dse-panel .dse-r label{color:var(--dsw-alias-label-secondary);font-size:12px;flex-shrink:0;white-space:nowrap;}" +
            '#dse-panel input[type="color"]{width:30px;height:24px;border:1px solid var(--dsw-alias-border-l1);border-radius:5px;cursor:pointer;padding:0;flex-shrink:0;}' +
            "#dse-panel .dse-input{width:130px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:3px 6px;font-size:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}" +
            "#dse-panel .dse-toggler{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;}" +
            "#dse-panel .dse-toggler label.tgl{color:var(--dsw-alias-label-primary);font-size:13px;}" +
            "#dse-panel .dse-sw{position:relative;width:38px;height:20px;flex-shrink:0;}" +
            "#dse-panel .dse-sw input{opacity:0;width:0;height:0;}" +
            "#dse-panel .dse-sl{position:absolute;top:0;left:0;right:0;bottom:0;background:#ccc;border-radius:20px;cursor:pointer;transition:.2s;}" +
            '#dse-panel .dse-sl:before{content:"";position:absolute;height:14px;width:14px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;}' +
            "#dse-panel input:checked+.dse-sl{background:var(--dsw-alias-brand-primary,#5686fe);}" +
            "#dse-panel input:checked+.dse-sl:before{transform:translateX(18px);}" +
            "</style>" +
            '<div id="dse-panel-left">' +
            '<div class="dse-tab-item on" data-tab="page"><span>页面配色</span><label class="dse-sw"><input id="dse-page-toggle" type="checkbox"' +
            (pageOn ? " checked" : "") +
            '><span class="dse-sl"></span></label></div>' +
            '<div class="dse-tab-item" data-tab="bubble"><span>消息气泡</span><label class="dse-sw"><input id="dse-bubble-toggle" type="checkbox"' +
            (bubbleOn ? " checked" : "") +
            '><span class="dse-sl"></span></label></div>' +
            '<div class="dse-tab-item" data-tab="strongcode"><span>强调/代码</span></div>' +
            '<div class="dse-tab-item" data-tab="font"><span>字体</span><label class="dse-sw"><input id="dse-font-toggle" type="checkbox"' +
            (fontOn ? " checked" : "") +
            '><span class="dse-sl"></span></label></div>' +
            '<div class="dse-tab-item" data-tab="avatar"><span>头像</span><label class="dse-sw"><input id="dse-avatar-toggle" type="checkbox"' +
            (avatarOn ? " checked" : "") +
            '><span class="dse-sl"></span></label></div>' +
            '<button class="dse-rst">恢复默认</button>' +
            "</div>" +
            '<div id="dse-panel-right"></div>';

        document.body.appendChild(panel);

        panel.querySelectorAll(".dse-tab-item").forEach(function (item) {
            item.addEventListener("click", function (e) {
                if (e.target.closest(".dse-sw")) {
                    return;
                }
                selectPanelTab(item.dataset.tab);
            });
        });

        panel.addEventListener("input", function (e) {
            var inp = e.target;
            if (!inp.dataset.k) return;

            var key = inp.dataset.k;
            var val = inp.value;
            var g = inp.dataset.g;

            if (g === "page") {
                if (!pageColors[panelMode])
                    pageColors[panelMode] = cloneObj(DEF[panelMode]);
                pageColors[panelMode][key] = val;
                GM_setValue(K.PAGE_COLORS, pageColors);
            } else if (g === "bubble") {
                bubbleColors[key] = val;
                GM_setValue(K.BUBBLE_COLORS, bubbleColors);
            } else if (g === "strong") {
                strongColors[key] = val;
                GM_setValue(K.STRONG_C, strongColors);
            } else if (g === "code") {
                codeColors[key] = val;
                GM_setValue(K.CODE_C, codeColors);
            } else if (g === "avatar") {
                if (key === "avuc") {
                    avatarUC = val;
                    GM_setValue(K.AVATAR_UC, val);
                } else if (key === "avac") {
                    avatarAC = val;
                    GM_setValue(K.AVATAR_AC, val);
                }
                applyAvatarSettings();
                return;
            }

            if (
                (g === "page" && pageOn) ||
                (g === "bubble" && bubbleOn) ||
                g === "strong" ||
                g === "code"
            ) {
                applyTheme(getMode());
            }
        });

        panel.addEventListener("change", function (e) {
            if (e.target.id === "dse-font-src") {
                fontSrc = e.target.value;
                GM_setValue(K.FONT_SRC, fontSrc);
                loadFont();
            }

            if (e.target.id === "dse-font-name") {
                fontName = e.target.value;
                GM_setValue(K.FONT_NAME, fontName);
                loadFont();
            }

            if (e.target.id === "dse-avatar-uname") {
                avatarUName = e.target.value || "你";
                GM_setValue(K.AVATAR_UNAME, avatarUName);
                applyAvatarSettings();
            }

            if (e.target.id === "dse-avatar-aname") {
                avatarAName = e.target.value || "DeepSeek";
                GM_setValue(K.AVATAR_ANAME, avatarAName);
                applyAvatarSettings();
            }
        });

        panel.querySelector(".dse-rst").addEventListener("click", function () {
            pageOn = false;
            bubbleOn = false;
            strongOn = false;
            codeOn = false;
            fontOn = false;
            avatarOn = false;

            pageColors = cloneDef();

            bubbleColors = {
                userBg: "#5686fe",
                userText: "#ffffff",
                aiBgL: "#f8fafc",
                aiBgD: "#1e2430",
                aiTextL: "#1a1a2e",
                aiTextD: "#d1d5db",
            };

            strongColors = {
                light: "#1a1a2e",
                dark: "#e5e7eb",
            };

            codeColors = {
                bgL: "#f0f4ff",
                bgD: "#1e2430",
                textL: "#5686fe",
                textD: "#8cb4ff",
            };

            fontSrc = "system";
            fontName = "";

            avatarUName = "你";
            avatarAName = "DeepSeek";
            avatarUC = "#5686fe";
            avatarAC = "#10a37f";

            for (var kk in K) {
                if (Object.prototype.hasOwnProperty.call(K, kk)) {
                    try {
                        GM_deleteValue(K[kk]);
                    } catch (e) {
                        GM_setValue(K[kk], null);
                    }
                }
            }

            syncPanelMode();
            applyTheme(getMode());
            loadFont();
            updateUI();
            setAvatarState(false);
        });

        document.addEventListener("click", function (e) {
            if (
                !panel.contains(e.target) &&
                !e.target.closest("#dse-panel-trigger")
            ) {
                hidePanel();
            }
        });

        selectPanelTab("page");

        return panel;
    }
    // ─── UI 按钮 ─────────────────────────────────────────────────────
    function updateUI() {
        var el = document.getElementById("dse-ui");
        if (!el) return;

        var anyOn =
            pageOn || bubbleOn || fontOn || avatarOn || strongOn || codeOn;
        var btns = el.querySelectorAll("button");

        for (var i = 0; i < btns.length; i++) {
            var b = btns[i];

            if (b.id === "dse-dark-toggle") continue;

            if (b.id === "dse-panel-trigger") {
                b.classList.toggle("on", anyOn);
            } else if (b.dataset.t === "original") {
                b.classList.toggle("on", !anyOn);
            }
        }
    }

    function showPanel() {
        if (!panelRef) panelRef = createPanel();

        syncPanelMode();
        panelRef.style.display = "flex";
        panelVisible = true;
    }

    function hidePanel() {
        if (panelRef) {
            panelRef.style.display = "none";
        }

        panelVisible = false;
    }

    function createSwitcher() {
        if (document.getElementById("dse-ui")) return;

        var el = document.createElement("div");
        el.id = "dse-ui";

        el.innerHTML =
            "<style>" +
            "#dse-ui{position:fixed;bottom:110px;right:16px;z-index:99997;display:flex;flex-direction:column;gap:6px;font-family:system-ui,sans-serif;}" +
            "#dse-ui button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(128,128,128,0.3);background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);cursor:pointer;font-size:14px;transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,.12);color:#333;line-height:1;}" +
            ".dark #dse-ui button{background:rgba(30,35,45,0.85);color:#ccc;}" +
            "#dse-ui button:hover{transform:scale(1.1);border-color:#5686fe;}" +
            "#dse-ui button.on{border-color:#5686fe!important;box-shadow:0 0 0 2px rgba(86,134,254,0.4)!important;background:rgba(86,134,254,0.15)!important;}" +
            "</style>" +
            '<button data-t="original" title="原版" class="on">原</button>' +
            '<button id="dse-panel-trigger" title="自定义">自</button>' +
            '<button id="dse-dark-toggle" title="深色/浅色">' +
            (getMode() === "dark" ? "☀" : "🌙") +
            "</button>";

        document.body.appendChild(el);

        el.addEventListener("click", function (e) {
            var btn = e.target.closest("button");
            if (!btn) return;

            if (btn.id === "dse-dark-toggle") {
                document.body.classList.toggle("dark");

                if (document.body.classList.contains("dark")) {
                    document.body.setAttribute("data-ds-dark-theme", "");
                } else {
                    document.body.removeAttribute("data-ds-dark-theme");
                }

                btn.textContent = document.body.classList.contains("dark")
                    ? "☀"
                    : "🌙";

                applyTheme(getMode());

                if (panelVisible) syncPanelMode();

                return;
            }

            if (btn.id === "dse-panel-trigger") {
                if (!panelRef) panelRef = createPanel();

                if (panelVisible) {
                    hidePanel();
                } else {
                    showPanel();
                }
            } else if (btn.dataset.t === "original") {
                if (panelRef) panelRef.style.display = "none";

                pageOn = false;
                bubbleOn = false;
                strongOn = false;
                codeOn = false;

                GM_setValue(K.PAGE_ON, false);
                GM_setValue(K.BUBBLE_ON, false);
                GM_setValue(K.STRONG_ON, false);
                GM_setValue(K.CODE_ON, false);

                applyTheme(getMode());
                tagMessageRoles();
                loadFont();
                updateUI();
            }

            updateUI();
        });

        updateUI();
    }

    // ─── 观察器：性能优化版 ──────────────────────────────────────────
    function waitForScrollContainer(callback) {
        var tries = 0;
        var timer = setInterval(function () {
            tries++;

            var sc = getScrollContainer();

            if (sc) {
                clearInterval(timer);
                callback(sc);
                return;
            }

            if (tries >= 40) {
                clearInterval(timer);
            }
        }, 250);
    }

    function setupMessageObserver() {
        waitForScrollContainer(function (sc) {
            if (msgObserver) {
                try {
                    msgObserver.disconnect();
                } catch (e) {}
            }

            msgObserver = new MutationObserver(function (mutations) {
                var shouldUpdate = false;

                for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];

                    if (!m.addedNodes || m.addedNodes.length === 0) continue;

                    for (var j = 0; j < m.addedNodes.length; j++) {
                        var node = m.addedNodes[j];

                        if (!(node instanceof Element)) continue;
                        if (isOurNode(node)) continue;

                        shouldUpdate = true;
                        break;
                    }

                    if (shouldUpdate) break;
                }

                if (shouldUpdate) {
                    scheduleLightUpdate(250);
                }
            });

            msgObserver.observe(sc, {
                childList: true,
                subtree: true,
            });

            scheduleLightUpdate(100);
        });
    }

    function setupBodyObserver() {
        if (bodyObserver) {
            try {
                bodyObserver.disconnect();
            } catch (e) {}
        }

        bodyObserver = new MutationObserver(function () {
            var nm = getMode();

            var tb = document.getElementById("dse-dark-toggle");
            if (tb) tb.textContent = nm === "dark" ? "☀" : "🌙";

            if (nm !== currentMode) {
                applyTheme(nm);
                tagMessageRoles();
                scheduleAvatarUpdate();

                if (panelVisible) syncPanelMode();
            }
        });

        bodyObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
        });
    }

    function setupRouteWatcher() {
        var lastUrl = location.href;

        if (routeTimer) clearInterval(routeTimer);

        setupScrollAvatar();

        routeTimer = setInterval(function () {
            if (location.href !== lastUrl) {
                lastUrl = location.href;

                currentItemKey = 1;
                maxItemKey = 0;

                if (avatarUserEl) avatarUserEl.style.display = "none";
                if (avatarAIEl) avatarAIEl.style.display = "none";

                if (msgObserver) {
                    try {
                        msgObserver.disconnect();
                    } catch (e) {}
                    msgObserver = null;
                }

                setTimeout(function () {
                    setupMessageObserver();
                    setupScrollAvatar();
                    applyTheme(getMode());
                    tagMessageRoles();
                    updateMaxItemKey();
                    scheduleAvatarUpdate();
                }, 600);
            }
        }, 1000);
    }

    function setupObservers() {
        setupMessageObserver();
        setupBodyObserver();
        setupRouteWatcher();
    }

    // ─── 基础样式 ────────────────────────────────────────────────────
    GM_addStyle(
        ".ds-enhancer-page [data-virtual-list-item-key]," +
            ".ds-enhancer-bubble [data-virtual-list-item-key]," +
            ".ds-enhancer-sc [data-virtual-list-item-key]{" +
            "min-height:0;" +
            "}",
    );

    // ─── 入口 ────────────────────────────────────────────────────────
    function init() {
        currentMode = getMode();
        currentItemKey = 1;
        maxItemKey = 0;

        applyTheme(currentMode);
        tagMessageRoles();

        createSwitcher();
        setupKeyboard();
        setupObservers();

        loadFont();
        createFloatAvatars();
        setupScrollAvatar();

        setTimeout(function () {
            tagMessageRoles();
            updateMaxItemKey();
            scheduleAvatarUpdate();
        }, 800);

        setTimeout(function () {
            tagMessageRoles();
            updateMaxItemKey();
            scheduleAvatarUpdate();
        }, 1800);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, {
            once: true,
        });
    } else {
        init();
    }
})();
