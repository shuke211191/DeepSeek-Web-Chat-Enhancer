// ==UserScript==
// @name         DeepSeek Chat Enhancer
// @namespace    https://chat.deepseek.com/
// @version      4.0.0
// @description  配色+字体+浮动头像+方向键跳转，模块化版本
// @author       hjx
// @license      MIT
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-end
// ==/UserScript==
(function() {
  "use strict";
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
      "--dsw-alias-bg-overlay": "rgba(0,0,0,0.06)"
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
      "--dsw-alias-bg-overlay": "rgba(255,255,255,0.06)"
    }
  };
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
    AVATAR_SIZE: "dse3_avsz",
    AVATAR_UIMG: "dse3_avui",
    AVATAR_AIMG: "dse3_avai",
    AVATAR_GAP: "dse3_avgp",
    NOTEPAD_OPEN: "dse3_npo",
    NOTEPAD_FILES: "dse3_npf",
    NOTEPAD_CUR: "dse3_npc",
    NOTEPAD_X: "dse3_npx",
    NOTEPAD_Y: "dse3_npy"
  };
  var S = {
    pageOn: false,
    bubbleOn: false,
    strongOn: false,
    codeOn: false,
    fontOn: false,
    avatarOn: false,
    pageColors: null,
    bubbleColors: { userBg: "#5686fe", userText: "#ffffff", aiBgL: "#f8fafc", aiBgD: "#1e2430", aiTextL: "#1a1a2e", aiTextD: "#d1d5db" },
    strongColors: { light: "#1a1a2e", dark: "#e5e7eb" },
    codeColors: { bgL: "#f0f4ff", bgD: "#1e2430", textL: "#5686fe", textD: "#8cb4ff" },
    fontSrc: "system",
    fontName: "",
    avatarUName: "你",
    avatarAName: "DeepSeek",
    avatarUC: "#5686fe",
    avatarAC: "#10a37f",
    avatarSize: 64,
    avatarUserImg: "",
    avatarAIImg: "https://www.deepseek.com/favicon.ico",
    avatarGap: 32,
    currentMode: "light",
    currentItemKey: 1,
    maxItemKey: 0,
    styleEl: null,
    fontLinkEl: null,
    panelRef: null,
    panelVisible: false,
    panelMode: "light",
    activePanelTab: "page",
    msgObserver: null,
    bodyObserver: null,
    routeTimer: null,
    updateTimer: null,
    avatarUserEl: null,
    avatarAIEl: null,
    avatarRAF: null,
    avatarScrollContainer: null,
    avatarScrollRetry: null,
    notepadOpen: false,
    notepadFiles: [],
    notepadCurId: null,
    notepadX: 20,
    notepadY: 100,
    notepadPanel: null
  };
  S.K = K;
  function cloneObj(o) {
    return JSON.parse(JSON.stringify(o));
  }
  function cloneDef(def) {
    return cloneObj(def);
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function getMode() {
    return document.body.classList.contains("dark") ? "dark" : "light";
  }
  function getScrollContainer() {
    return document.querySelector(".ds-virtual-list") || document.querySelector('[class*="ds-virtual-list"]');
  }
  function isOurNode(node) {
    if (!(node instanceof Element)) return true;
    if (node.id === "dse-ui" || node.id === "dse-panel" || node.id === "dse-css" || node.id === "dse-font-link" || node.id === "dse-font-style") return true;
    if (node.classList.contains("dse-fav-circle") || node.classList.contains("dse-fav-name") || node.closest("#dse-avatar-user") || node.closest("#dse-avatar-ai") || node.closest("#dse-ui") || node.closest("#dse-panel")) return true;
    return false;
  }
  function updateUI() {
    var el = document.getElementById("dse-ui");
    if (!el) return;
    var anyOn = S.pageOn || S.bubbleOn || S.fontOn || S.avatarOn || S.strongOn || S.codeOn;
    var btns = el.querySelectorAll("button");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.id === "dse-dark-toggle") continue;
      if (b.id === "dse-panel-trigger") b.classList.toggle("on", anyOn);
      else if (b.id === "dse-notepad-trigger") b.classList.toggle("on", S.notepadOpen);
      else if (b.dataset.t === "original") b.classList.toggle("on", !anyOn);
    }
  }
  function updateMaxItemKey() {
    var items = document.querySelectorAll("[data-virtual-list-item-key]");
    for (var i = 0; i < items.length; i++) {
      var k = parseInt(items[i].dataset.virtualListItemKey, 10);
      if (!isNaN(k) && k > S.maxItemKey) S.maxItemKey = k;
    }
  }
  function collectMessages(root) {
    var arr = [];
    if (!root) root = document;
    if (root instanceof Element && root.matches(".ds-message")) arr.push(root);
    if (root.querySelectorAll) {
      var list = root.querySelectorAll(".ds-message");
      for (var i = 0; i < list.length; i++) arr.push(list[i]);
    }
    return arr;
  }
  function tagMessageRoles(root) {
    var msgs = collectMessages(root);
    for (var i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      if (msg.dataset.dsRole) continue;
      var role = msg.querySelector(".ds-assistant-message-main-content") ? "assistant" : "user";
      msg.dataset.dsRole = role;
      var item = msg.closest("[data-virtual-list-item-key]");
      if (item && !item.dataset.dsRole) item.dataset.dsRole = role;
    }
  }
  function scheduleLightUpdate(delay) {
    if (S.updateTimer) return;
    S.updateTimer = setTimeout(function() {
      S.updateTimer = null;
      tagMessageRoles();
      updateMaxItemKey();
    }, delay || 250);
  }
  function buildPageCSS(mode) {
    var vars = S.pageColors[mode] || DEF[mode];
    var css = ".ds-enhancer-page {\n";
    for (var k in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, k)) css += "  " + k + ": " + vars[k] + " !important;\n";
    }
    return css + "}\n";
  }
  function buildBubbleCSS(mode) {
    var isDark = mode === "dark", bc = S.bubbleColors;
    return [
      '.ds-enhancer-bubble [data-ds-role="user"] { background:' + bc.userBg + " !important; color:" + bc.userText + " !important; }",
      '.ds-enhancer-bubble [data-ds-role="user"] .fbb737a4,.ds-enhancer-bubble [data-ds-role="user"] p,.ds-enhancer-bubble [data-ds-role="user"] li,.ds-enhancer-bubble [data-ds-role="user"] h1,.ds-enhancer-bubble [data-ds-role="user"] h2,.ds-enhancer-bubble [data-ds-role="user"] h3,.ds-enhancer-bubble [data-ds-role="user"] h4{color:' + bc.userText + "!important;}",
      '.ds-enhancer-bubble [data-ds-role="user"] a{color:' + bc.userText + "!important;text-decoration:underline!important;}",
      '.ds-enhancer-bubble [data-ds-role="assistant"]{background:' + (isDark ? bc.aiBgD : bc.aiBgL) + "!important;color:" + (isDark ? bc.aiTextD : bc.aiTextL) + "!important;}",
      '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown,.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown p,.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown li,.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown h1,.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown h2,.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown h3,.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown h4,.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown em,.ds-enhancer-bubble [data-ds-role="assistant"] ._74c0879,.ds-enhancer-bubble [data-ds-role="assistant"] ._74c0879 *,.ds-enhancer-bubble [data-ds-role="assistant"] .dbe8cf4a{color:' + (isDark ? bc.aiTextD : bc.aiTextL) + "!important;}",
      '.ds-enhancer-bubble [data-ds-role="assistant"] .ds-markdown a{color:' + bc.userBg + "!important;}"
    ].join("\n");
  }
  function buildSCCSS(mode) {
    var isDark = mode === "dark", css = [];
    if (S.strongOn) {
      var sc = isDark ? S.strongColors.dark : S.strongColors.light;
      css.push(".ds-enhancer-sc .ds-markdown strong{color:" + sc + "!important;}");
    }
    if (S.codeOn) {
      var bg = isDark ? S.codeColors.bgD : S.codeColors.bgL, tc = isDark ? S.codeColors.textD : S.codeColors.textL;
      css.push(".ds-enhancer-sc .ds-markdown code:not(.md-code-block code){background:" + bg + "!important;color:" + tc + "!important;}");
    }
    return css.join("\n");
  }
  function applyTheme(mode) {
    if (S.styleEl) {
      S.styleEl.remove();
      S.styleEl = null;
    }
    document.body.classList.remove("ds-enhancer-page", "ds-enhancer-bubble", "ds-enhancer-sc");
    var css = "";
    if (S.pageOn) {
      document.body.classList.add("ds-enhancer-page");
      css += buildPageCSS(mode);
    }
    if (S.bubbleOn) {
      document.body.classList.add("ds-enhancer-bubble");
      css += buildBubbleCSS(mode);
    }
    if (S.strongOn || S.codeOn) {
      document.body.classList.add("ds-enhancer-sc");
      css += buildSCCSS(mode);
    }
    if (css) {
      S.styleEl = document.createElement("style");
      S.styleEl.id = "dse-css";
      S.styleEl.textContent = css;
      document.head.appendChild(S.styleEl);
    }
    S.currentMode = mode;
  }
  function applyAfter() {
    applyTheme(getMode());
    tagMessageRoles();
    updateUI();
  }
  function loadFont() {
    if (S.fontLinkEl) {
      S.fontLinkEl.remove();
      S.fontLinkEl = null;
    }
    document.body.classList.remove("ds-enhancer-font");
    var old = document.getElementById("dse-font-style");
    if (old) old.remove();
    if (!S.fontOn || !S.fontName.trim()) return;
    document.body.classList.add("ds-enhancer-font");
    if (S.fontSrc === "google") {
      S.fontLinkEl = document.createElement("link");
      S.fontLinkEl.id = "dse-font-link";
      S.fontLinkEl.rel = "stylesheet";
      S.fontLinkEl.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(S.fontName.trim()).replace(/%20/g, "+") + "&display=swap";
      document.head.appendChild(S.fontLinkEl);
    }
    var s = document.createElement("style");
    s.id = "dse-font-style";
    s.textContent = '.ds-enhancer-font .ds-markdown,.ds-enhancer-font textarea,.ds-enhancer-font .fbb737a4{font-family:"' + S.fontName.trim().replace(/"/g, '\\"') + '",var(--dsw-font-family),system-ui,sans-serif!important;}';
    document.head.appendChild(s);
  }
  var avatarUserEl = null;
  var avatarAIEl = null;
  var avatarRAF = null;
  var avatarScrollContainer = null;
  var avatarScrollRetry = null;
  Object.defineProperty(S, "avatarUserEl", { get: function() {
    return avatarUserEl;
  }, set: function(v) {
    avatarUserEl = v;
  }, configurable: true });
  Object.defineProperty(S, "avatarAIEl", { get: function() {
    return avatarAIEl;
  }, set: function(v) {
    avatarAIEl = v;
  }, configurable: true });
  Object.defineProperty(S, "avatarRAF", { get: function() {
    return avatarRAF;
  }, set: function(v) {
    avatarRAF = v;
  }, configurable: true });
  function createFloatAvatars() {
    if (avatarUserEl) {
      applyAvatarSize();
      return;
    }
    GM_addStyle(
      "#dse-avatar-ai,#dse-avatar-user{position:fixed;z-index:100;display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;transform:translateY(-50%);}.dse-fav-circle{display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;background-size:cover;background-position:center;box-shadow:0 2px 8px rgba(0,0,0,.18);}.dse-fav-name{font-size:10px;color:#9ca3af;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2;text-shadow:0 1px 2px rgba(0,0,0,.25);}"
    );
    avatarUserEl = document.createElement("div");
    avatarUserEl.id = "dse-avatar-user";
    avatarUserEl.style.display = "none";
    avatarUserEl.innerHTML = '<div class="dse-fav-circle"></div><div class="dse-fav-name"></div>';
    avatarAIEl = document.createElement("div");
    avatarAIEl.id = "dse-avatar-ai";
    avatarAIEl.style.display = "none";
    avatarAIEl.innerHTML = '<div class="dse-fav-circle"></div><div class="dse-fav-name"></div>';
    document.body.appendChild(avatarUserEl);
    document.body.appendChild(avatarAIEl);
    applyAvatarSize();
    updateAvatarContent();
  }
  function applyAvatarStyle(el, size) {
    var sz = size + "px";
    var circle = el.querySelector(".dse-fav-circle");
    if (circle) {
      circle.style.width = sz;
      circle.style.height = sz;
      circle.style.borderRadius = "50%";
      circle.style.fontSize = Math.round(size * 0.5) + "px";
    }
    var name = el.querySelector(".dse-fav-name");
    if (name) {
      name.style.maxWidth = Math.max(48, size * 2.2) + "px";
      name.style.fontSize = Math.round(size * 0.28) + "px";
    }
    el.style.width = sz;
  }
  function applyAvatarSize() {
    if (!avatarUserEl) return;
    var size = S.avatarSize || 30;
    applyAvatarStyle(avatarUserEl, size);
    applyAvatarStyle(avatarAIEl, size);
    scheduleAvatarUpdate();
  }
  function updateAvatarContent() {
    if (!avatarUserEl) return;
    S.avatarSize || 30;
    function fill(circle, nameEl, imgUrl, color, name) {
      if (imgUrl) {
        circle.style.backgroundImage = "url(" + imgUrl + ")";
        circle.style.backgroundSize = "cover";
        circle.style.backgroundPosition = "center";
        circle.style.backgroundColor = "transparent";
        circle.textContent = "";
      } else {
        circle.style.backgroundImage = "";
        circle.style.backgroundSize = "";
        circle.style.backgroundColor = color;
        circle.textContent = (name || "").charAt(0);
      }
      nameEl.textContent = name || "";
    }
    fill(avatarUserEl.querySelector(".dse-fav-circle"), avatarUserEl.querySelector(".dse-fav-name"), S.avatarUserImg, S.avatarUC, S.avatarUName);
    fill(avatarAIEl.querySelector(".dse-fav-circle"), avatarAIEl.querySelector(".dse-fav-name"), S.avatarAIImg, S.avatarAC, S.avatarAName);
  }
  function getRole(el) {
    if (el.dataset.dsRole) return el.dataset.dsRole;
    return el.querySelector(".ds-assistant-message-main-content") ? "assistant" : "user";
  }
  function clampNumber(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function getMessageContentBox(msg, role) {
    if (!msg) return null;
    if (role === "assistant") return msg.querySelector(".ds-assistant-message-main-content") || msg.querySelector(".ds-markdown") || msg;
    return msg.querySelector(".fbb737a4") || msg.querySelector(".ds-markdown") || msg.querySelector("p") || msg.firstElementChild || msg;
  }
  function updateAvatarPositions() {
    avatarRAF = null;
    if (!S.avatarOn || !avatarUserEl || !avatarAIEl) {
      if (avatarUserEl) {
        avatarUserEl.style.display = "none";
        avatarAIEl.style.display = "none";
      }
      return;
    }
    var sc = getScrollContainer();
    var scrollRect = sc ? sc.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth, width: window.innerWidth, height: window.innerHeight };
    var viewport = { top: scrollRect.top, bottom: scrollRect.bottom, left: scrollRect.left, right: scrollRect.right, width: scrollRect.width || window.innerWidth, height: scrollRect.height || window.innerHeight };
    var clampTop = viewport.top + 26, clampBottom = viewport.bottom - 26;
    var msgs = document.querySelectorAll(".ds-message");
    var bestUser = null, bestAI = null, bestUserDist = Infinity, bestAIDist = Infinity;
    for (var i = 0; i < msgs.length; i++) {
      var msg = msgs[i], rect = msg.getBoundingClientRect();
      if (rect.height < 8 || rect.bottom <= viewport.top || rect.top >= viewport.bottom) continue;
      var role = getRole(msg);
      var visibleTop = Math.max(rect.top, viewport.top);
      var visibleBottom = Math.min(rect.bottom, viewport.bottom);
      if (visibleBottom <= visibleTop) continue;
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
    function placeAvatar(avatarEl, msg2, role2) {
      if (!avatarEl || !msg2) {
        if (avatarEl) avatarEl.style.display = "none";
        return;
      }
      var box = getMessageContentBox(msg2, role2);
      if (!box) {
        avatarEl.style.display = "none";
        return;
      }
      var rect2 = box.getBoundingClientRect();
      if (rect2.height < 4 || rect2.width < 4) {
        avatarEl.style.display = "none";
        return;
      }
      var avatarWidth = S.avatarSize || 30, gap = S.avatarGap || 12;
      var visibleTop2 = Math.max(rect2.top, viewport.top);
      var top = clampNumber(visibleTop2 + avatarWidth / 2 + 2, clampTop, clampBottom);
      var left = role2 === "assistant" ? rect2.left - avatarWidth - gap : rect2.right + gap;
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
    S.avatarOn = on;
    GM_setValue(S.K.AVATAR_ON, on);
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
    if (S.avatarOn) {
      createFloatAvatars();
      scheduleAvatarUpdate();
    }
  }
  function setupScrollAvatar() {
    var sc = getScrollContainer();
    if (sc && sc !== avatarScrollContainer) {
      if (avatarScrollContainer) {
        try {
          avatarScrollContainer.removeEventListener("scroll", scheduleAvatarUpdate);
        } catch (e) {
        }
      }
      avatarScrollContainer = sc;
      avatarScrollContainer.addEventListener("scroll", scheduleAvatarUpdate, { passive: true });
      if (avatarScrollRetry) {
        clearInterval(avatarScrollRetry);
        avatarScrollRetry = null;
      }
    } else if (!sc && !avatarScrollRetry) {
      avatarScrollRetry = setInterval(function() {
        var sc2 = getScrollContainer();
        if (sc2) {
          clearInterval(avatarScrollRetry);
          avatarScrollRetry = null;
          setupScrollAvatar();
        }
      }, 1e3);
    }
    window.removeEventListener("resize", scheduleAvatarUpdate);
    window.addEventListener("resize", scheduleAvatarUpdate, { passive: true });
    scheduleAvatarUpdate();
  }
  function getVirtualItems() {
    var nodes = document.querySelectorAll("[data-virtual-list-item-key]"), arr = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i], key = parseInt(el.dataset.virtualListItemKey, 10);
      if (isNaN(key) || !el.querySelector(".ds-message")) continue;
      arr.push({ el, key });
    }
    arr.sort(function(a, b) {
      return a.key - b.key;
    });
    return arr;
  }
  function getScrollViewportRect() {
    var sc = getScrollContainer();
    if (sc) return sc.getBoundingClientRect();
    return { top: 0, bottom: window.innerHeight, height: window.innerHeight };
  }
  function getCurrentVisibleItem() {
    var items = getVirtualItems();
    if (!items.length) return null;
    var viewport = getScrollViewportRect(), centerY = viewport.top + viewport.height / 2, best = null, bestDist = Infinity;
    for (var i = 0; i < items.length; i++) {
      var rect = items[i].el.getBoundingClientRect();
      if (rect.bottom < viewport.top || rect.top > viewport.bottom) continue;
      var c = rect.top + rect.height / 2, d = Math.abs(c - centerY);
      if (d < bestDist) {
        bestDist = d;
        best = items[i];
      }
    }
    if (!best) {
      for (var j = 0; j < items.length; j++) {
        var r2 = items[j].el.getBoundingClientRect(), c2 = r2.top + r2.height / 2, d2 = Math.abs(c2 - centerY);
        if (d2 < bestDist) {
          bestDist = d2;
          best = items[j];
        }
      }
    }
    return best;
  }
  function scrollToItem(el) {
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
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
    if (!current) current = items[0];
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
        var scUp = getScrollContainer();
        if (scUp) scUp.scrollBy({ top: -Math.max(300, scUp.clientHeight * 0.75), behavior: "smooth" });
        else window.scrollBy({ top: -Math.max(300, window.innerHeight * 0.75), behavior: "smooth" });
        setTimeout(function() {
          var now = getCurrentVisibleItem();
          if (now) S.currentItemKey = now.key;
        }, 350);
        return;
      }
    } else {
      if (index < items.length - 1) {
        target = items[index + 1];
      } else {
        var scDown = getScrollContainer();
        if (scDown) scDown.scrollBy({ top: Math.max(300, scDown.clientHeight * 0.75), behavior: "smooth" });
        else window.scrollBy({ top: Math.max(300, window.innerHeight * 0.75), behavior: "smooth" });
        setTimeout(function() {
          var now = getCurrentVisibleItem();
          if (now) S.currentItemKey = now.key;
        }, 350);
        return;
      }
    }
    if (!target) return;
    S.currentItemKey = target.key;
    scrollToItem(target.el);
  }
  function setupKeyboard() {
    document.addEventListener("keydown", function(e) {
      if (e.ctrlKey && e.altKey && (e.key === "/" || e.code === "Slash")) {
        if (e.target && (e.target.closest('[role="dialog"]') || e.target.closest('[role="menu"]'))) return;
        e.preventDefault();
        var ta = document.querySelector("textarea"), sc = getScrollContainer();
        if (document.activeElement === ta) {
          if (sc) {
            sc.setAttribute("tabindex", "0");
            sc.focus({ preventScroll: true });
          }
        } else {
          if (ta) ta.focus();
        }
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var el = document.activeElement;
      if (el) {
        if (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable || el.getAttribute("role") === "textbox" || el.closest('[role="dialog"]') || el.closest('[role="menu"]') || el.closest('[role="listbox"]') || el.closest("select") || el.closest("#dse-panel")) return;
      }
      e.preventDefault();
      e.stopPropagation();
      navigate(e.key === "ArrowLeft" ? "prev" : "next");
    }, true);
  }
  function syncPanelMode() {
    S.panelMode = getMode();
    var panel = document.getElementById("dse-panel");
    if (!panel) return;
    var tabs = panel.querySelectorAll(".dse-mode-tab");
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle("on", tabs[i].dataset.mode === S.panelMode);
    renderPanelContent();
  }
  function bindToggle(id, cb) {
    var el = document.getElementById(id);
    if (!el) return;
    var n = el.cloneNode(true);
    el.parentNode.replaceChild(n, el);
    n.addEventListener("change", function() {
      cb(n.checked);
    });
  }
  function rebindPanelToggles() {
    bindToggle("dse-page-toggle", function(v) {
      S.pageOn = v;
      GM_setValue(S.K.PAGE_ON, v);
      applyAfter();
      renderPanelContent();
    });
    bindToggle("dse-bubble-toggle", function(v) {
      S.bubbleOn = v;
      GM_setValue(S.K.BUBBLE_ON, v);
      applyAfter();
      renderPanelContent();
    });
    bindToggle("dse-strong-toggle", function(v) {
      S.strongOn = v;
      GM_setValue(S.K.STRONG_ON, v);
      applyAfter();
      renderPanelContent();
    });
    bindToggle("dse-code-toggle", function(v) {
      S.codeOn = v;
      GM_setValue(S.K.CODE_ON, v);
      applyAfter();
      renderPanelContent();
    });
    bindToggle("dse-font-toggle", function(v) {
      S.fontOn = v;
      GM_setValue(S.K.FONT_ON, v);
      loadFont();
      updateUI();
      renderPanelContent();
    });
    bindToggle("dse-avatar-toggle", function(v) {
      setAvatarState(v);
      renderPanelContent();
    });
  }
  function renderPanelContent() {
    var right = document.getElementById("dse-panel-right");
    if (!right) return;
    if (!S.pageColors[S.panelMode]) S.pageColors[S.panelMode] = cloneObj(DEF[S.panelMode]);
    var html = "";
    function colorRow(key, label, g) {
      var val = g === "bubble" ? S.bubbleColors[key] : g === "strong" ? S.strongColors[key] : g === "code" ? S.codeColors[key] : S.pageColors[S.panelMode][key];
      return '<div class="dse-r"><label>' + label + '</label><input type="color" data-k="' + key + '" data-g="' + g + '" value="' + (val || "#000") + '"></div>';
    }
    if (S.activePanelTab === "page") {
      html += '<div class="dse-mode-tabs"><button class="dse-mode-tab' + (S.panelMode === "light" ? " on" : "") + '" data-mode="light">浅色模式</button><button class="dse-mode-tab' + (S.panelMode === "dark" ? " on" : "") + '" data-mode="dark">深色模式</button></div>';
      var keys = ["--dsw-alias-bg-base", "--dsw-alias-bg-layer-2", "--dsw-alias-brand-primary", "--dsw-alias-label-primary", "--dsw-alias-label-secondary", "--dsw-alias-label-tertiary", "--dsw-alias-border-l1", "--dsw-alias-border-l2"];
      var labels = ["页面背景", "表面/卡片", "主题色", "主文字", "次文字", "辅助文字", "主边框", "次边框"];
      for (var pi = 0; pi < keys.length; pi++) html += colorRow(keys[pi], labels[pi], "page");
    } else if (S.activePanelTab === "bubble") {
      html += colorRow("userBg", "用户气泡背景", "bubble") + colorRow("userText", "用户气泡文字", "bubble") + colorRow("aiBgL", "AI气泡背景(浅)", "bubble") + colorRow("aiBgD", "AI气泡背景(深)", "bubble") + colorRow("aiTextL", "AI气泡文字(浅)", "bubble") + colorRow("aiTextD", "AI气泡文字(深)", "bubble");
    } else if (S.activePanelTab === "strongcode") {
      html += '<div class="dse-toggler"><label class="tgl">自定义强调颜色</label><label class="dse-sw"><input id="dse-strong-toggle" type="checkbox"' + (S.strongOn ? " checked" : "") + '><span class="dse-sl"></span></label></div>';
      html += '<div id="dse-strong-rows" style="' + (S.strongOn ? "" : "display:none") + '">' + colorRow("light", "强调色(浅)", "strong") + colorRow("dark", "强调色(深)", "strong") + "</div>";
      html += '<div class="dse-toggler"><label class="tgl">自定义行内代码</label><label class="dse-sw"><input id="dse-code-toggle" type="checkbox"' + (S.codeOn ? " checked" : "") + '><span class="dse-sl"></span></label></div>';
      html += '<div id="dse-code-rows" style="' + (S.codeOn ? "" : "display:none") + '">' + colorRow("bgL", "代码背景(浅)", "code") + colorRow("bgD", "代码背景(深)", "code") + colorRow("textL", "代码文字(浅)", "code") + colorRow("textD", "代码文字(深)", "code") + "</div>";
    } else if (S.activePanelTab === "font") {
      html += '<div class="dse-r"><label>来源</label><select id="dse-font-src" class="dse-input"><option value="system"' + (S.fontSrc === "system" ? " selected" : "") + '>系统字体</option><option value="google"' + (S.fontSrc === "google" ? " selected" : "") + ">Google Fonts</option></select></div>";
      html += '<div class="dse-r"><label>字体名称</label><input id="dse-font-name" class="dse-input" type="text" value="' + esc(S.fontName) + '"></div>';
    } else if (S.activePanelTab === "avatar") {
      html += '<div class="dse-r"><label>你的名字</label><input id="dse-avatar-uname" class="dse-input" type="text" value="' + esc(S.avatarUName) + '"></div>';
      html += '<div class="dse-r"><label>你的头像色</label><input type="color" data-k="avuc" data-g="avatar" value="' + S.avatarUC + '"></div>';
      html += '<div class="dse-r"><label>你的头像图</label><input id="dse-avatar-uimg" class="dse-input" type="text" placeholder="图片URL" value="' + esc(S.avatarUserImg) + '"></div>';
      html += '<div class="dse-r"><label>AI名字</label><input id="dse-avatar-aname" class="dse-input" type="text" value="' + esc(S.avatarAName) + '"></div>';
      html += '<div class="dse-r"><label>AI头像色</label><input type="color" data-k="avac" data-g="avatar" value="' + S.avatarAC + '"></div>';
      html += '<div class="dse-r"><label>AI头像图</label><input id="dse-avatar-aimg" class="dse-input" type="text" placeholder="图片URL" value="' + esc(S.avatarAIImg) + '"></div>';
      html += '<div class="dse-r"><label>头像大小</label><input id="dse-avatar-size" type="range" min="16" max="128" step="4" value="' + (S.avatarSize || 30) + '" style="width:100px"><span style="font-size:11px;color:var(--dsw-alias-label-secondary);margin-left:4px">' + (S.avatarSize || 30) + "px</span></div>";
      html += '<div class="dse-r"><label>头像间距</label><input id="dse-avatar-gap" type="range" min="4" max="64" step="2" value="' + (S.avatarGap || 12) + '" style="width:100px"><span style="font-size:11px;color:var(--dsw-alias-label-secondary);margin-left:4px">' + (S.avatarGap || 12) + "px</span></div>";
    }
    right.innerHTML = html;
    var modeTabs = right.querySelectorAll(".dse-mode-tab");
    for (var ti = 0; ti < modeTabs.length; ti++) {
      (function(tab) {
        tab.addEventListener("click", function(e) {
          e.stopPropagation();
          S.panelMode = tab.dataset.mode;
          renderPanelContent();
        });
      })(modeTabs[ti]);
    }
    rebindPanelToggles();
  }
  function selectPanelTab(name) {
    S.activePanelTab = name;
    var left = document.getElementById("dse-panel-left");
    if (left) {
      var items = left.querySelectorAll(".dse-tab-item");
      for (var i = 0; i < items.length; i++) items[i].classList.toggle("on", items[i].dataset.tab === name);
    }
    renderPanelContent();
  }
  function createPanel() {
    var existing = document.getElementById("dse-panel");
    if (existing) return existing;
    var panel = document.createElement("div");
    panel.id = "dse-panel";
    panel.innerHTML = '<style>#dse-panel{position:fixed;bottom:110px;right:68px;z-index:99998;flex-direction:row;background:var(--dsw-alias-bg-layer-2,#fff);border:1px solid var(--dsw-alias-border-l2,#e0e4ea);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.15);font-family:system-ui,sans-serif;font-size:13px;width:430px;max-height:75vh;overflow:hidden;display:none;}.dark #dse-panel{background:#1e2430;border-color:#3a4050;}#dse-panel-left{flex-shrink:0;width:140px;padding:12px 12px 12px 12px;border-right:1px solid var(--dsw-alias-border-l2);display:flex;flex-direction:column;gap:2px;overflow-y:auto;}#dse-panel-left .dse-tab-item{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 8px 8px;border-radius:8px;cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:13px;transition:background .15s;user-select:none;}#dse-panel-left .dse-tab-item:hover{background:var(--dsw-alias-interactive-bg-hover);}#dse-panel-left .dse-tab-item.on{background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary);}#dse-panel-left .dse-sw{position:relative;width:36px;height:18px;flex-shrink:0;}#dse-panel-left .dse-sw input{opacity:0;width:0;height:0;}#dse-panel-left .dse-sl{position:absolute;top:0;left:0;right:0;bottom:0;background:#ccc;border-radius:18px;cursor:pointer;transition:.2s;}#dse-panel-left .dse-sl:before{content:"";position:absolute;height:12px;width:12px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;}#dse-panel-left input:checked+.dse-sl{background:var(--dsw-alias-brand-primary,#5686fe);}#dse-panel-left input:checked+.dse-sl:before{transform:translateX(18px);}#dse-panel-left .dse-rst{width:calc(100% - 14px);padding:7px;margin-top:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;text-align:center;}#dse-panel-left .dse-rst:hover{background:var(--dsw-alias-interactive-bg-hover);}#dse-panel-right{flex:1;padding:14px;overflow-y:auto;min-width:0;}#dse-panel .dse-mode-tabs{display:flex;gap:4px;margin-bottom:10px;}#dse-panel .dse-mode-tab{flex:1;padding:5px;text-align:center;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary);background:transparent;}#dse-panel .dse-mode-tab.on{background:var(--dsw-alias-brand-primary);color:#fff;border-color:var(--dsw-alias-brand-primary);}#dse-panel .dse-r{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;gap:8px;}#dse-panel .dse-r label{color:var(--dsw-alias-label-secondary);font-size:12px;flex-shrink:0;white-space:nowrap;}#dse-panel input[type=color]{width:30px;height:24px;border:1px solid var(--dsw-alias-border-l1);border-radius:5px;cursor:pointer;padding:0;flex-shrink:0;}#dse-panel .dse-input{width:130px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:3px 6px;font-size:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}#dse-panel .dse-toggler{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;}#dse-panel .dse-toggler label.tgl{color:var(--dsw-alias-label-primary);font-size:13px;}#dse-panel .dse-sw{position:relative;width:38px;height:20px;flex-shrink:0;}#dse-panel .dse-sw input{opacity:0;width:0;height:0;}#dse-panel .dse-sl{position:absolute;top:0;left:0;right:0;bottom:0;background:#ccc;border-radius:20px;cursor:pointer;transition:.2s;}#dse-panel .dse-sl:before{content:"";position:absolute;height:14px;width:14px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;}#dse-panel input:checked+.dse-sl{background:var(--dsw-alias-brand-primary,#5686fe);}#dse-panel input:checked+.dse-sl:before{transform:translateX(18px);}</style><div id="dse-panel-left"><div class="dse-tab-item on" data-tab="page"><span>页面配色</span><label class="dse-sw"><input id="dse-page-toggle" type="checkbox"' + (S.pageOn ? " checked" : "") + '><span class="dse-sl"></span></label></div><div class="dse-tab-item" data-tab="bubble"><span>消息气泡</span><label class="dse-sw"><input id="dse-bubble-toggle" type="checkbox"' + (S.bubbleOn ? " checked" : "") + '><span class="dse-sl"></span></label></div><div class="dse-tab-item" data-tab="strongcode"><span>强调/代码</span></div><div class="dse-tab-item" data-tab="font"><span>字体</span><label class="dse-sw"><input id="dse-font-toggle" type="checkbox"' + (S.fontOn ? " checked" : "") + '><span class="dse-sl"></span></label></div><div class="dse-tab-item" data-tab="avatar"><span>头像</span><label class="dse-sw"><input id="dse-avatar-toggle" type="checkbox"' + (S.avatarOn ? " checked" : "") + '><span class="dse-sl"></span></label></div><button class="dse-rst">恢复默认</button></div><div id="dse-panel-right"></div>';
    document.body.appendChild(panel);
    panel.querySelectorAll(".dse-tab-item").forEach(function(item) {
      item.addEventListener("click", function(e) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "LABEL") return;
        selectPanelTab(item.dataset.tab);
      });
    });
    panel.addEventListener("input", function(e) {
      var inp = e.target;
      if (!inp.dataset.k) return;
      var key = inp.dataset.k, val = inp.value, g = inp.dataset.g;
      if (g === "page") {
        if (!S.pageColors[S.panelMode]) S.pageColors[S.panelMode] = cloneObj(DEF[S.panelMode]);
        S.pageColors[S.panelMode][key] = val;
        GM_setValue(S.K.PAGE_COLORS, S.pageColors);
      } else if (g === "bubble") {
        S.bubbleColors[key] = val;
        GM_setValue(S.K.BUBBLE_COLORS, S.bubbleColors);
      } else if (g === "strong") {
        S.strongColors[key] = val;
        GM_setValue(S.K.STRONG_C, S.strongColors);
      } else if (g === "code") {
        S.codeColors[key] = val;
        GM_setValue(S.K.CODE_C, S.codeColors);
      } else if (g === "avatar") {
        if (key === "avuc") {
          S.avatarUC = val;
          GM_setValue(S.K.AVATAR_UC, val);
        } else {
          S.avatarAC = val;
          GM_setValue(S.K.AVATAR_AC, val);
        }
        applyAvatarSettings();
        return;
      }
      if (S.pageOn && g === "page" || S.bubbleOn && g === "bubble" || g === "strong" || g === "code") applyTheme(getMode());
    });
    panel.addEventListener("change", function(e) {
      if (e.target.id === "dse-font-src") {
        S.fontSrc = e.target.value;
        GM_setValue(S.K.FONT_SRC, S.fontSrc);
        loadFont();
      }
      if (e.target.id === "dse-font-name") {
        S.fontName = e.target.value;
        GM_setValue(S.K.FONT_NAME, S.fontName);
        loadFont();
      }
      if (e.target.id === "dse-avatar-uname") {
        S.avatarUName = e.target.value || "你";
        GM_setValue(S.K.AVATAR_UNAME, S.avatarUName);
        applyAvatarSettings();
      }
      if (e.target.id === "dse-avatar-aname") {
        S.avatarAName = e.target.value || "DeepSeek";
        GM_setValue(S.K.AVATAR_ANAME, S.avatarAName);
        applyAvatarSettings();
      }
      if (e.target.id === "dse-avatar-uimg") {
        S.avatarUserImg = e.target.value;
        GM_setValue(S.K.AVATAR_UIMG, S.avatarUserImg);
        applyAvatarSettings();
      }
      if (e.target.id === "dse-avatar-aimg") {
        S.avatarAIImg = e.target.value;
        GM_setValue(S.K.AVATAR_AIMG, S.avatarAIImg);
        applyAvatarSettings();
      }
      if (e.target.id === "dse-avatar-size") {
        S.avatarSize = parseInt(e.target.value, 10) || 30;
        GM_setValue(S.K.AVATAR_SIZE, S.avatarSize);
        applyAvatarSize();
        var s = e.target.nextElementSibling;
        if (s) s.textContent = S.avatarSize + "px";
      }
      if (e.target.id === "dse-avatar-gap") {
        S.avatarGap = parseInt(e.target.value, 10) || 12;
        GM_setValue(S.K.AVATAR_GAP, S.avatarGap);
        scheduleAvatarUpdate();
        var g = e.target.nextElementSibling;
        if (g) g.textContent = S.avatarGap + "px";
      }
    });
    panel.querySelector(".dse-rst").addEventListener("click", function() {
      S.pageColors = cloneDef(DEF);
      S.bubbleColors = { userBg: "#5686fe", userText: "#ffffff", aiBgL: "#f8fafc", aiBgD: "#1e2430", aiTextL: "#1a1a2e", aiTextD: "#d1d5db" };
      S.strongColors = { light: "#1a1a2e", dark: "#e5e7eb" };
      S.codeColors = { bgL: "#f0f4ff", bgD: "#1e2430", textL: "#5686fe", textD: "#8cb4ff" };
      S.fontSrc = "system";
      S.fontName = "";
      S.avatarUName = "你";
      S.avatarAName = "DeepSeek";
      S.avatarUC = "#5686fe";
      S.avatarAC = "#10a37f";
      S.avatarSize = 64;
      S.avatarUserImg = "";
      S.avatarAIImg = "https://www.deepseek.com/favicon.ico";
      S.avatarGap = 32;
      for (var kk in S.K) {
        if (Object.prototype.hasOwnProperty.call(S.K, kk)) {
          try {
            GM_deleteValue(S.K[kk]);
          } catch (ex) {
            GM_setValue(S.K[kk], null);
          }
        }
      }
      syncPanelMode();
      applyTheme(getMode());
      loadFont();
      updateUI();
      applyAvatarSettings();
      applyAvatarSize();
    });
    document.addEventListener("click", function(e) {
      if (!panel.contains(e.target) && !e.target.closest("#dse-panel-trigger")) {
        panel.style.display = "none";
        S.panelVisible = false;
      }
    });
    selectPanelTab("page");
    return panel;
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function createNotepad() {
    if (S.notepadPanel) return;
    var container = getScrollContainer();
    container ? container.getBoundingClientRect() : {};
    var panel = document.createElement("div");
    panel.id = "dse-notepad";
    panel.style.cssText = "position:fixed;width:320px;height:420px;background:var(--dsw-alias-bg-layer-2,#fff);border:1px solid var(--dsw-alias-border-l2,#e0e4ea);border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.18);z-index:99996;font-family:var(--dsw-font-family),system-ui,sans-serif;display:none;flex-direction:column;overflow:hidden;resize:both;min-width:220px;min-height:200px;";
    panel.innerHTML = '<div class="np-header" style="background:var(--dsw-alias-bg-base,#f5f5f5);padding:7px 10px;cursor:move;display:flex;justify-content:space-between;align-items:center;user-select:none;border-radius:10px 10px 0 0;border-bottom:1px solid var(--dsw-alias-border-l2,#e0e4ea);"><span style="font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)">📝 笔记</span><div style="display:flex;gap:4px;"><button class="np-btn" id="np-btn-new" title="新建">📄</button><button class="np-btn" id="np-btn-dl" title="下载.md">📥</button><button class="np-btn" id="np-btn-close" title="关闭">✕</button></div></div><div class="np-body" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;"><div style="padding:4px 8px;display:flex;align-items:center;gap:4px;background:var(--dsw-alias-bg-base,#fafafa);border-bottom:1px solid var(--dsw-alias-border-l2,#e0e4ea);"><select id="np-file-select" style="flex:1;padding:3px 4px;border:1px solid var(--dsw-alias-border-l1,#ddd);border-radius:4px;font-size:11px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary);height:24px;min-width:0;"><option value="">选择文件...</option></select><button class="np-btn-sm" id="np-btn-rename" title="重命名">✏️</button><button class="np-btn-sm" id="np-btn-delete" title="删除">🗑️</button></div><textarea id="np-textarea" placeholder="在此记录..." style="flex:1;width:100%;border:0;padding:8px 10px;font-size:14px;line-height:1.5;resize:none;outline:none;font-family:var(--dsw-font-family),Consolas,monospace;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary);box-sizing:border-box;"></textarea></div><div style="padding:3px 8px;border-top:1px solid var(--dsw-alias-border-l2,#e0e4ea);display:flex;justify-content:space-between;font-size:11px;color:var(--dsw-alias-label-tertiary,#888);min-height:20px;"><span id="np-char-count">字符: 0</span><span id="np-file-info"></span><span id="np-save-status">本地存储</span></div>';
    document.body.appendChild(panel);
    var style = document.createElement("style");
    style.id = "dse-np-style";
    style.textContent = "#dse-notepad .np-btn{background:rgba(128,128,128,.1);border:1px solid transparent;border-radius:4px;color:var(--dsw-alias-label-primary);cursor:pointer;font-size:13px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;transition:background .15s;}#dse-notepad .np-btn:hover{background:rgba(128,128,128,.2);}#dse-notepad .np-btn-sm{background:rgba(128,128,128,.08);border:1px solid var(--dsw-alias-border-l1);border-radius:3px;cursor:pointer;font-size:11px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);flex-shrink:0;}#dse-notepad .np-btn-sm:hover{background:rgba(128,128,128,.15);}#dse-notepad textarea::-webkit-scrollbar{width:6px;}#dse-notepad textarea::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l1);border-radius:3px;}";
    document.head.appendChild(style);
    var fileSelect = panel.querySelector("#np-file-select");
    var textarea = panel.querySelector("#np-textarea");
    var charCount = panel.querySelector("#np-char-count");
    var fileInfo = panel.querySelector("#np-file-info");
    var saveStatus = panel.querySelector("#np-save-status");
    var files = S.notepadFiles || [];
    var curId = S.notepadCurId;
    function saveStorage() {
      try {
        GM_setValue(S.K.NOTEPAD_FILES, JSON.stringify(files));
      } catch (e) {
      }
      GM_setValue(S.K.NOTEPAD_CUR, curId);
    }
    function getCurFile() {
      for (var i = 0; i < files.length; i++) {
        if (files[i].id === curId) return files[i];
      }
      return null;
    }
    function refreshSelect() {
      fileSelect.innerHTML = '<option value="">选择文件...</option>';
      for (var i = 0; i < files.length; i++) {
        var opt = document.createElement("option");
        opt.value = files[i].id;
        opt.textContent = files[i].title;
        if (files[i].id === curId) opt.selected = true;
        fileSelect.appendChild(opt);
      }
    }
    function updateCharCount() {
      charCount.textContent = "字符: " + textarea.value.length;
    }
    function saveFile() {
      var f2 = getCurFile();
      if (!f2) return;
      f2.content = textarea.value;
      f2.updateTime = Date.now();
      saveStorage();
      fileInfo.textContent = f2.title + " - " + new Date(f2.updateTime).toLocaleString();
      saveStatus.textContent = "已保存";
    }
    function loadFile(f2) {
      var prev = getCurFile();
      if (prev && prev.id !== f2.id) {
        prev.content = textarea.value;
        prev.updateTime = Date.now();
      }
      curId = f2.id;
      GM_setValue(S.K.NOTEPAD_CUR, curId);
      S.notepadCurId = curId;
      textarea.value = f2.content || "";
      updateCharCount();
      fileInfo.textContent = f2.title + " - " + new Date(f2.updateTime).toLocaleString();
      refreshSelect();
      saveStorage();
    }
    function createFile() {
      var title = prompt("新文件标题:", "笔记");
      if (!title) return;
      var f2 = { id: Date.now().toString(), title, content: "", createTime: Date.now(), updateTime: Date.now() };
      var prev = getCurFile();
      if (prev) {
        prev.content = textarea.value;
        prev.updateTime = Date.now();
      }
      files.unshift(f2);
      if (files.length > 30) files.length = 30;
      curId = f2.id;
      saveStorage();
      S.notepadFiles = files;
      S.notepadCurId = curId;
      textarea.value = "";
      refreshSelect();
      updateCharCount();
      fileInfo.textContent = f2.title;
    }
    function renameFile() {
      var f2 = getCurFile();
      if (!f2) return;
      var t = prompt("新标题:", f2.title);
      if (t && t !== f2.title) {
        f2.title = t;
        f2.updateTime = Date.now();
        saveStorage();
        refreshSelect();
        fileInfo.textContent = t + " - " + new Date(f2.updateTime).toLocaleString();
      }
    }
    function deleteFile() {
      var f2 = getCurFile();
      if (!f2) return;
      if (!confirm('删除 "' + f2.title + '"？')) return;
      files = files.filter(function(x) {
        return x.id !== f2.id;
      });
      S.notepadFiles = files;
      if (curId === f2.id) {
        curId = files.length > 0 ? files[0].id : null;
        S.notepadCurId = curId;
      }
      saveStorage();
      refreshSelect();
      if (curId) {
        loadFile(files[0]);
      } else {
        textarea.value = "";
        updateCharCount();
        fileInfo.textContent = "";
      }
    }
    function downloadMd() {
      var f2 = getCurFile();
      if (!f2) return;
      var name = (f2.title || "note").replace(/[^\w\u4e00-\u9fa5]/g, "_") + ".md";
      var blob = new Blob([f2.content || ""], { type: "text/markdown;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(function() {
        URL.revokeObjectURL(a.href);
      }, 200);
    }
    panel.querySelector("#np-btn-close").addEventListener("click", function() {
      var f2 = getCurFile();
      if (f2) {
        f2.content = textarea.value;
        f2.updateTime = Date.now();
        saveStorage();
      }
      toggleNotepad();
    });
    panel.querySelector("#np-btn-new").addEventListener("click", createFile);
    panel.querySelector("#np-btn-dl").addEventListener("click", downloadMd);
    panel.querySelector("#np-btn-rename").addEventListener("click", renameFile);
    panel.querySelector("#np-btn-delete").addEventListener("click", deleteFile);
    textarea.addEventListener("input", function() {
      updateCharCount();
      saveFile();
    });
    fileSelect.addEventListener("change", function() {
      if (!fileSelect.value) return;
      var targeted = null;
      for (var i = 0; i < files.length; i++) {
        if (files[i].id === fileSelect.value) {
          targeted = files[i];
          break;
        }
      }
      if (targeted) loadFile(targeted);
    });
    var headerEl = panel.querySelector(".np-header");
    var isDrag = false, sx = 0, sy = 0, ix = 0, iy = 0;
    headerEl.addEventListener("mousedown", function(e) {
      if (e.button !== 0) return;
      isDrag = true;
      sx = e.clientX;
      sy = e.clientY;
      ix = panel.offsetLeft;
      iy = panel.offsetTop;
      panel.style.transition = "none";
      document.body.style.userSelect = "none";
      e.preventDefault();
    });
    document.addEventListener("mousemove", function(e) {
      if (!isDrag) return;
      var bounds2 = (getScrollContainer() || { getBoundingClientRect: function() {
        return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      } }).getBoundingClientRect();
      var nx = clamp(ix + e.clientX - sx, bounds2.left, bounds2.right - panel.offsetWidth);
      var ny = clamp(iy + e.clientY - sy, bounds2.top, bounds2.bottom - 60);
      panel.style.left = nx + "px";
      panel.style.top = ny + "px";
      S.notepadX = nx;
      S.notepadY = ny;
    });
    document.addEventListener("mouseup", function() {
      if (!isDrag) return;
      isDrag = false;
      panel.style.transition = "";
      document.body.style.userSelect = "";
      GM_setValue(S.K.NOTEPAD_X, S.notepadX);
      GM_setValue(S.K.NOTEPAD_Y, S.notepadY);
    });
    panel._textarea = textarea;
    panel._select = fileSelect;
    panel._refreshSelect = refreshSelect;
    panel._loadFile = loadFile;
    panel._saveStorage = saveStorage;
    panel._getCurFile = getCurFile;
    panel._files = files;
    S.notepadPanel = panel;
    if (files.length === 0) {
      var f = { id: "1", title: "笔记", content: "", createTime: Date.now(), updateTime: Date.now() };
      files.push(f);
      curId = "1";
      S.notepadFiles = files;
      S.notepadCurId = curId;
      saveStorage();
    }
    S.notepadFiles = files;
    S.notepadCurId = curId;
    refreshSelect();
    var initFile = getCurFile();
    if (initFile) {
      textarea.value = initFile.content || "";
      updateCharCount();
      fileInfo.textContent = initFile.title;
    }
    var sc2 = getScrollContainer();
    var b2 = sc2 ? sc2.getBoundingClientRect() : { left: 20, top: 100 };
    S.notepadX = S.notepadX || b2.left + 8;
    S.notepadY = S.notepadY || b2.top + 8;
    panel.style.left = S.notepadX + "px";
    panel.style.top = S.notepadY + "px";
  }
  function setNotepadState(on) {
    S.notepadOpen = on;
    GM_setValue(S.K.NOTEPAD_OPEN, on);
    if (!S.notepadPanel) createNotepad();
    S.notepadPanel.style.display = on ? "flex" : "none";
    updateUI();
  }
  function toggleNotepad() {
    setNotepadState(!S.notepadOpen);
  }
  function createSwitcher() {
    if (document.getElementById("dse-ui")) return;
    var el = document.createElement("div");
    el.id = "dse-ui";
    el.innerHTML = '<style>#dse-ui{position:fixed;bottom:110px;right:16px;z-index:99997;display:flex;flex-direction:column;gap:6px;font-family:system-ui,sans-serif;}#dse-ui button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(128,128,128,0.3);background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);cursor:pointer;font-size:14px;transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,.12);color:#333;line-height:1;}.dark #dse-ui button{background:rgba(30,35,45,0.85);color:#ccc;}#dse-ui button:hover{transform:scale(1.1);border-color:#5686fe;}#dse-ui button.on{border-color:#5686fe!important;box-shadow:0 0 0 2px rgba(86,134,254,0.4)!important;background:rgba(86,134,254,0.15)!important;}</style><button data-t="original" title="原版" class="on">原</button><button id="dse-panel-trigger" title="自定义">自</button><button id="dse-notepad-trigger" title="笔记">📝</button><button id="dse-dark-toggle" title="深色/浅色">' + (getMode() === "dark" ? "☀" : "🌙") + "</button>";
    document.body.appendChild(el);
    el.addEventListener("click", function(e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      if (btn.id === "dse-dark-toggle") {
        document.body.classList.toggle("dark");
        if (document.body.classList.contains("dark")) document.body.setAttribute("data-ds-dark-theme", "");
        else document.body.removeAttribute("data-ds-dark-theme");
        btn.textContent = document.body.classList.contains("dark") ? "☀" : "🌙";
        applyTheme(getMode());
        if (S.panelVisible) syncPanelMode();
        return;
      }
      if (btn.id === "dse-panel-trigger") {
        if (!S.panelRef) S.panelRef = createPanel();
        if (S.panelRef.style.display === "flex") {
          S.panelRef.style.display = "none";
          S.panelVisible = false;
        } else {
          syncPanelMode();
          S.panelRef.style.display = "flex";
          S.panelVisible = true;
        }
      } else if (btn.dataset.t === "original") {
        if (S.panelRef) S.panelRef.style.display = "none";
        S.pageOn = false;
        S.bubbleOn = false;
        S.strongOn = false;
        S.codeOn = false;
        S.fontOn = false;
        GM_setValue(S.K.PAGE_ON, false);
        GM_setValue(S.K.BUBBLE_ON, false);
        GM_setValue(S.K.STRONG_ON, false);
        GM_setValue(S.K.CODE_ON, false);
        GM_setValue(S.K.FONT_ON, false);
        setAvatarState(false);
        applyTheme(getMode());
        tagMessageRoles();
        loadFont();
        updateUI();
      } else if (btn.id === "dse-notepad-trigger") {
        toggleNotepad();
      }
      updateUI();
    });
    updateUI();
  }
  function waitForScrollContainer(cb) {
    var t = 0;
    var iv = setInterval(function() {
      t++;
      var sc = getScrollContainer();
      if (sc) {
        clearInterval(iv);
        cb(sc);
      } else if (t >= 40) clearInterval(iv);
    }, 250);
  }
  function setupMessageObserver() {
    waitForScrollContainer(function(sc) {
      if (S.msgObserver) {
        try {
          S.msgObserver.disconnect();
        } catch (e) {
        }
      }
      S.msgObserver = new MutationObserver(function(mutations) {
        var up = false;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (!m.addedNodes || !m.addedNodes.length) continue;
          for (var j = 0; j < m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (!(n instanceof Element)) continue;
            if (isOurNode(n)) continue;
            up = true;
            break;
          }
          if (up) break;
        }
        if (up) scheduleLightUpdate(250);
      });
      S.msgObserver.observe(sc, { childList: true, subtree: true });
      scheduleLightUpdate(100);
    });
  }
  function setupBodyObserver() {
    if (S.bodyObserver) {
      try {
        S.bodyObserver.disconnect();
      } catch (e) {
      }
    }
    S.bodyObserver = new MutationObserver(function() {
      var nm = getMode();
      var tb = document.getElementById("dse-dark-toggle");
      if (tb) tb.textContent = nm === "dark" ? "☀" : "🌙";
      if (nm !== S.currentMode) {
        applyTheme(nm);
        tagMessageRoles();
        scheduleAvatarUpdate();
        if (S.panelVisible) syncPanelMode();
      }
    });
    S.bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
  function setupRouteWatcher() {
    var lastUrl = location.href;
    if (S.routeTimer) clearInterval(S.routeTimer);
    setupScrollAvatar();
    S.routeTimer = setInterval(function() {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        S.currentItemKey = 1;
        S.maxItemKey = 0;
        if (S.msgObserver) {
          try {
            S.msgObserver.disconnect();
          } catch (e) {
          }
          S.msgObserver = null;
        }
        setTimeout(function() {
          setupMessageObserver();
          setupScrollAvatar();
          applyTheme(getMode());
          tagMessageRoles();
          updateMaxItemKey();
        }, 600);
      }
    }, 1e3);
  }
  function setupObservers() {
    setupMessageObserver();
    setupBodyObserver();
    setupRouteWatcher();
  }
  function init() {
    S.pageOn = GM_getValue(S.K.PAGE_ON, false);
    S.bubbleOn = GM_getValue(S.K.BUBBLE_ON, false);
    S.strongOn = GM_getValue(S.K.STRONG_ON, false);
    S.codeOn = GM_getValue(S.K.CODE_ON, false);
    S.fontOn = GM_getValue(S.K.FONT_ON, false);
    S.avatarOn = GM_getValue(S.K.AVATAR_ON, false);
    S.pageColors = GM_getValue(S.K.PAGE_COLORS, null) || cloneDef(DEF);
    S.bubbleColors = GM_getValue(S.K.BUBBLE_COLORS, { userBg: "#5686fe", userText: "#ffffff", aiBgL: "#f8fafc", aiBgD: "#1e2430", aiTextL: "#1a1a2e", aiTextD: "#d1d5db" });
    S.strongColors = GM_getValue(S.K.STRONG_C, { light: "#1a1a2e", dark: "#e5e7eb" });
    S.codeColors = GM_getValue(S.K.CODE_C, { bgL: "#f0f4ff", bgD: "#1e2430", textL: "#5686fe", textD: "#8cb4ff" });
    S.fontSrc = GM_getValue(S.K.FONT_SRC, "system");
    S.fontName = GM_getValue(S.K.FONT_NAME, "");
    S.avatarUName = GM_getValue(S.K.AVATAR_UNAME, "你");
    S.avatarAName = GM_getValue(S.K.AVATAR_ANAME, "DeepSeek");
    S.avatarUC = GM_getValue(S.K.AVATAR_UC, "#5686fe");
    S.avatarAC = GM_getValue(S.K.AVATAR_AC, "#10a37f");
    S.avatarSize = GM_getValue(S.K.AVATAR_SIZE, 64);
    S.avatarUserImg = GM_getValue(S.K.AVATAR_UIMG, "");
    S.avatarAIImg = GM_getValue(S.K.AVATAR_AIMG, "https://www.deepseek.com/favicon.ico");
    S.avatarGap = GM_getValue(S.K.AVATAR_GAP, 32);
    S.notepadOpen = GM_getValue(S.K.NOTEPAD_OPEN, false);
    S.notepadX = GM_getValue(S.K.NOTEPAD_X, 20);
    S.notepadY = GM_getValue(S.K.NOTEPAD_Y, 100);
    try {
      S.notepadFiles = JSON.parse(GM_getValue(S.K.NOTEPAD_FILES, "[]"));
    } catch (e) {
      S.notepadFiles = [];
    }
    S.notepadCurId = GM_getValue(S.K.NOTEPAD_CUR, null);
    S.currentMode = getMode();
    S.currentItemKey = 1;
    S.maxItemKey = 0;
    applyTheme(S.currentMode);
    tagMessageRoles();
    createSwitcher();
    setupKeyboard();
    setupObservers();
    loadFont();
    createFloatAvatars();
    setupScrollAvatar();
    if (S.notepadOpen) setNotepadState(true);
    GM_addStyle(".ds-enhancer-page [data-virtual-list-item-key],.ds-enhancer-bubble [data-virtual-list-item-key],.ds-enhancer-sc [data-virtual-list-item-key]{min-height:0;}");
    setTimeout(function() {
      tagMessageRoles();
      updateMaxItemKey();
    }, 800);
    setTimeout(function() {
      tagMessageRoles();
      updateMaxItemKey();
    }, 1800);
    setTimeout(function() {
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
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
