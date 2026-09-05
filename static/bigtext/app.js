(() => {
  "use strict";

  const MAX_CHARS = 200;
  const WARN_AT = 180;
  const TAP_WINDOW_MS = 260;
  const HINT_DURATION_MS = 2500;
  const STORAGE_LAST_TEXT = "bigtext.lastText";
  const STORAGE_HINT_SEEN = "bigtext.doubleTapHintSeen";

  const I18N = {
    zh: {
      htmlLang: "zh-CN",
      docTitle: "大字 Big Text",
      appTitle: "大字",
      appTitleAnnot: "BIG TEXT",
      tagline: "输入一句话，全屏放大给别人看",
      placeholder: "输入要显示的文字",
      show: "显示",
      back: "返回",
      flash: "闪烁",
      flashStop: "停止闪烁",
      doubleTapHint: "双击屏幕开启闪动",
      landscapeHint: "横过手机展示更清楚",
    },
    en: {
      htmlLang: "en",
      docTitle: "Big Text 大字",
      appTitle: "Big Text",
      appTitleAnnot: "大 字",
      tagline: "Type one line. Show it big.",
      placeholder: "Enter text to display",
      show: "Show",
      back: "Back",
      flash: "Flash",
      flashStop: "Stop flash",
      doubleTapHint: "Double-tap to toggle flash",
      landscapeHint: "Turn phone for better display",
    },
  };

  const lang = (navigator.language || "en").toLowerCase().startsWith("zh")
    ? I18N.zh
    : I18N.en;

  const $ = (id) => document.getElementById(id);
  const editorScreen = $("editorScreen");
  const displayScreen = $("displayScreen");
  const textInput = $("textInput");
  const charCounter = $("charCounter");
  const showBtn = $("showBtn");
  const fitStage = $("fitStage");
  const fitText = $("fitText");
  const flashOverlay = $("flashOverlay");
  const controlsOverlay = $("controlsOverlay");
  const backBtn = $("backBtn");
  const flashBtn = $("flashBtn");
  const landscapeToast = $("landscapeToast");
  const doubleTapToast = $("doubleTapToast");

  let mode = "editor";
  let flashOn = false;
  let controlsVisible = false;
  let tapTimer = null;
  let hintTimer = null;
  let wakeLock = null;

  // 不用 matchMedia(orientation)：部分环境里 resize 触发时它的状态还滞后
  function isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  const store = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* 隐私模式等场景下写入失败可忽略 */
      }
    },
  };

  const charCount = (s) => Array.from(s).length;

  function clampToLimit(s) {
    const points = Array.from(s);
    return points.length > MAX_CHARS ? points.slice(0, MAX_CHARS).join("") : s;
  }

  function applyI18n() {
    document.documentElement.lang = lang.htmlLang;
    document.title = lang.docTitle;
    $("appTitle").textContent = lang.appTitle;
    $("appTitleAnnot").textContent = lang.appTitleAnnot;
    $("appTagline").textContent = lang.tagline;
    textInput.placeholder = lang.placeholder;
    showBtn.textContent = lang.show;
    backBtn.textContent = "‹ " + lang.back;
    flashBtn.textContent = lang.flash;
    doubleTapToast.textContent = lang.doubleTapHint;
    landscapeToast.textContent = lang.landscapeHint;
  }

  function updateEditorState() {
    const count = charCount(textInput.value);
    charCounter.textContent = count + "/" + MAX_CHARS;
    charCounter.classList.toggle("warn", count >= WARN_AT);
    showBtn.disabled = textInput.value.trim().length === 0;
  }

  // ---- 显示模式 ----

  // 二分寻找能装下全文的最大字号（用文字元素自身盒子，不含舞台内边距）
  function fitTextToStage() {
    const boxWidth = fitText.clientWidth;
    const boxHeight = fitText.clientHeight;
    if (!boxWidth || !boxHeight || !fitText.textContent) return;
    let low = 12;
    let high = Math.floor(Math.max(boxWidth, boxHeight) * 1.2);
    let best = low;
    while (low <= high) {
      const mid = (low + high) >> 1;
      fitText.style.fontSize = mid + "px";
      if (fitText.scrollWidth <= boxWidth && fitText.scrollHeight <= boxHeight) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    fitText.style.fontSize = best + "px";
  }

  function setFlash(on) {
    flashOn = on && mode === "display";
    flashOverlay.classList.toggle("on", flashOn);
    flashBtn.classList.toggle("active", flashOn);
    flashBtn.textContent = flashOn ? lang.flashStop : lang.flash;
  }

  function setControlsVisible(visible) {
    controlsVisible = visible;
    controlsOverlay.classList.toggle("show", visible);
  }

  function updateLandscapeToast() {
    landscapeToast.classList.toggle("show", mode === "display" && isPortrait());
  }

  function maybeShowDoubleTapHint() {
    if (store.get(STORAGE_HINT_SEEN) === "1") return;
    doubleTapToast.classList.add("show");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      doubleTapToast.classList.remove("show");
      store.set(STORAGE_HINT_SEEN, "1");
    }, HINT_DURATION_MS);
  }

  function enterDisplay() {
    if (!textInput.value.trim()) return;
    mode = "display";
    editorScreen.hidden = true;
    displayScreen.hidden = false;
    fitText.textContent = textInput.value;
    updateLandscapeToast();
    maybeShowDoubleTapHint();
    // 同步先算一次，rAF 兜底（后台面板里 rAF 可能被节流）
    fitTextToStage();
    requestAnimationFrame(fitTextToStage);
    requestWakeLock();
  }

  function exitDisplay() {
    mode = "editor";
    setFlash(false);
    setControlsVisible(false);
    landscapeToast.classList.remove("show");
    displayScreen.hidden = true;
    editorScreen.hidden = false;
    releaseWakeLock();
  }

  // ---- 屏幕常亮（Wake Lock） ----

  async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
      const lock = await navigator.wakeLock.request("screen");
      wakeLock = lock;
      lock.addEventListener("release", () => {
        if (wakeLock === lock) wakeLock = null;
      });
    } catch {
      wakeLock = null;
    }
  }

  function releaseWakeLock() {
    if (!wakeLock) return;
    const lock = wakeLock;
    wakeLock = null;
    lock.release().catch(() => {});
  }

  // ---- 事件 ----

  textInput.addEventListener("input", () => {
    const clamped = clampToLimit(textInput.value);
    if (clamped !== textInput.value) textInput.value = clamped;
    store.set(STORAGE_LAST_TEXT, clamped);
    updateEditorState();
  });

  showBtn.addEventListener("click", () => {
    if (!textInput.value.trim()) return;
    store.set(STORAGE_LAST_TEXT, textInput.value);
    enterDisplay();
  });

  // 单击切换控制层，双击切换闪烁：先等 260ms 判定是否为双击
  displayScreen.addEventListener("click", (event) => {
    if (event.target.closest(".pill")) return;
    if (tapTimer !== null) {
      clearTimeout(tapTimer);
      tapTimer = null;
      setFlash(!flashOn);
      return;
    }
    tapTimer = setTimeout(() => {
      tapTimer = null;
      setControlsVisible(!controlsVisible);
    }, TAP_WINDOW_MS);
  });

  backBtn.addEventListener("click", exitDisplay);
  flashBtn.addEventListener("click", () => setFlash(!flashOn));

  document.addEventListener("keydown", (event) => {
    if (mode !== "display") return;
    if (event.key === "Escape") {
      exitDisplay();
    } else if (event.key === " " || event.key.toLowerCase() === "f") {
      event.preventDefault();
      setFlash(!flashOn);
    }
  });

  window.addEventListener("resize", () => {
    if (mode === "display") {
      fitTextToStage();
      updateLandscapeToast();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && mode === "display") {
      requestWakeLock();
    }
  });

  // ---- 初始化 ----

  applyI18n();
  textInput.value = store.get(STORAGE_LAST_TEXT) || "";
  updateEditorState();
  if (window.matchMedia("(pointer: fine)").matches) {
    textInput.focus();
  }

  // ?text=... 直接进入显示模式（可配合 iOS 快捷指令实现语音唤起）
  const urlText = new URLSearchParams(window.location.search).get("text");
  if (urlText && urlText.trim()) {
    textInput.value = clampToLimit(urlText);
    updateEditorState();
    store.set(STORAGE_LAST_TEXT, textInput.value);
    enterDisplay();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }
})();
