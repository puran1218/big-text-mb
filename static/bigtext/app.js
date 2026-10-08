(() => {
  "use strict";

  const TAP_WINDOW_MS = 260;
  const HINT_DURATION_MS = 2500;
  const STORAGE_LAST_TEXT = "bigtext.lastText";
  const STORAGE_HINT_SEEN = "bigtext.doubleTapHintSeen";
  const STORAGE_THEME = "bigtext.theme";
  const THEMES = ["classic", "paper", "neon", "matrix", "amber", "sega"];
  const THEME_META = {
    classic: { color: "#050505", scheme: "dark" },
    paper: { color: "#f4f1ea", scheme: "light" },
    neon: { color: "#0a0a0f", scheme: "dark" },
    matrix: { color: "#0b0c14", scheme: "dark" },
    amber: { color: "#060505", scheme: "dark" },
    sega: { color: "#003da5", scheme: "dark" },
  };

  const I18N = {
    zh: {
      htmlLang: "zh-CN",
      docTitle: "大字 Big Text",
      appTitle: "大字",
      appTitleAnnot: "BIG TEXT",
      tagline: "输入文字，全屏放大给别人看",
      placeholder: "输入要显示的文字",
      show: "显示",
      clear: "清除",
      back: "返回",
      flash: "闪烁",
      flashStop: "停止闪烁",
      doubleTapHint: "双击屏幕开启闪动",
      landscapeHint: "横屏可以显示得更大",
      themeLabel: "主题",
      themeNames: {
        classic: "经典黑白",
        paper: "反色",
        neon: "青柠",
        matrix: "翡翠",
        amber: "琥珀",
        sega: "钴蓝",
        random: "随机",
      },
    },
    en: {
      htmlLang: "en",
      docTitle: "Big Text 大字",
      appTitle: "Big Text",
      appTitleAnnot: "大 字",
      tagline: "Type anything. Show it big.",
      placeholder: "Enter text to display",
      show: "Show",
      clear: "Clear",
      back: "Back",
      flash: "Flash",
      flashStop: "Stop flash",
      doubleTapHint: "Double-tap to toggle flash",
      landscapeHint: "Landscape gives your text more room",
      themeLabel: "Theme",
      themeNames: {
        classic: "Classic",
        paper: "Paper",
        neon: "Lime",
        matrix: "Jade",
        amber: "Amber",
        sega: "Cobalt",
        random: "Random",
      },
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
  const clearBtn = $("clearBtn");
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
  let themeSetting = "classic";
  let appliedTheme = "classic";
  let fitFrame = null;
  let landscapeHintTimer = null;
  let displayWasPortrait = false;

  // 不用 matchMedia(orientation)：部分环境里 resize 触发时它的状态还滞后
  function isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  function rollTheme(exclude) {
    const pool = THEMES.filter((t) => t !== exclude);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function applyTheme(id) {
    appliedTheme = id;
    document.documentElement.dataset.theme = id;
    const themeMeta = THEME_META[id];
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (themeColorMeta) themeColorMeta.content = themeMeta.color;
    if (colorSchemeMeta) colorSchemeMeta.content = themeMeta.scheme;
    document.documentElement.style.colorScheme = themeMeta.scheme;
    document.querySelectorAll(".theme-dot").forEach((dot) => {
      const marked = themeSetting === "random" ? "random" : appliedTheme;
      const on = dot.dataset.themeOption === marked;
      dot.classList.toggle("selected", on);
      dot.setAttribute("aria-checked", on ? "true" : "false");
    });
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
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* 隐私模式等场景下删除失败可忽略 */
      }
    },
  };

  const charCount = (value) => Array.from(value).length;

  function applyI18n() {
    document.documentElement.lang = lang.htmlLang;
    document.title = lang.docTitle;
    $("appTitle").textContent = lang.appTitle;
    $("appTitleAnnot").textContent = lang.appTitleAnnot;
    $("appTagline").textContent = lang.tagline;
    textInput.placeholder = lang.placeholder;
    showBtn.textContent = lang.show;
    clearBtn.textContent = lang.clear;
    backBtn.textContent = "‹ " + lang.back;
    flashBtn.textContent = lang.flash;
    doubleTapToast.textContent = lang.doubleTapHint;
    landscapeToast.textContent = lang.landscapeHint;
    $("themeLabel").textContent = lang.themeLabel;
    document.querySelectorAll(".theme-dot").forEach((dot) => {
      const id = dot.dataset.themeOption;
      dot.setAttribute("aria-label", lang.themeNames[id]);
    });
  }

  function updateEditorState() {
    const count = charCount(textInput.value);
    charCounter.textContent = count.toLocaleString();
    clearBtn.hidden = count === 0;
    showBtn.disabled = textInput.value.trim().length === 0;
  }

  function scheduleFit() {
    if (mode !== "display") return;
    if (fitFrame !== null) cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(() => {
      fitFrame = null;
      fitTextToStage();
    });
  }

  function syncVisualViewport() {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    const layoutHeight = Math.max(root.clientHeight, window.innerHeight);
    const keyboardOpen =
      mode === "editor" &&
      document.activeElement === textInput &&
      viewport &&
      viewport.scale < 1.1 &&
      viewport.height < layoutHeight - 120;

    root.classList.toggle("keyboard-open", Boolean(keyboardOpen));
    if (keyboardOpen) {
      root.style.setProperty("--keyboard-height", viewport.height + "px");
      root.style.setProperty("--keyboard-top", viewport.offsetTop + "px");
    } else {
      root.style.removeProperty("--keyboard-height");
      root.style.removeProperty("--keyboard-top");
    }
    scheduleFit();
  }

  function refitAfterOrientationChange() {
    scheduleFit();
    if (mode === "display") updateLandscapeToast();
    setTimeout(scheduleFit, 120);
    setTimeout(scheduleFit, 320);
  }

  // ---- 显示模式 ----

  // 二分寻找能装下全文的最大字号（用文字元素自身盒子，不含舞台内边距）
  function fitTextToStage() {
    const boxWidth = fitText.clientWidth;
    const boxHeight = fitText.clientHeight;
    if (!boxWidth || !boxHeight || !fitText.textContent) return;
    let low = 8;
    let high = Math.max(32, Math.floor(Math.max(boxWidth, boxHeight) * 1.5));
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
    const portrait = mode === "display" && isPortrait();
    if (!portrait) {
      displayWasPortrait = false;
      clearTimeout(landscapeHintTimer);
      landscapeHintTimer = null;
      landscapeToast.classList.remove("show");
      return;
    }
    if (displayWasPortrait) return;

    displayWasPortrait = true;
    landscapeToast.classList.add("show");
    landscapeHintTimer = setTimeout(() => {
      landscapeToast.classList.remove("show");
      landscapeHintTimer = null;
    }, HINT_DURATION_MS);
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
    textInput.blur();
    if (themeSetting === "random") {
      applyTheme(rollTheme(appliedTheme));
    }
    mode = "display";
    editorScreen.hidden = true;
    displayScreen.hidden = false;
    fitText.textContent = textInput.value;
    syncVisualViewport();
    updateLandscapeToast();
    maybeShowDoubleTapHint();
    fitTextToStage();
    scheduleFit();
    requestWakeLock();
  }

  function exitDisplay() {
    mode = "editor";
    setFlash(false);
    setControlsVisible(false);
    updateLandscapeToast();
    displayScreen.hidden = true;
    editorScreen.hidden = false;
    releaseWakeLock();
    requestAnimationFrame(syncVisualViewport);
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
    store.set(STORAGE_LAST_TEXT, textInput.value);
    updateEditorState();
  });

  textInput.addEventListener("focus", syncVisualViewport);
  textInput.addEventListener("blur", () => setTimeout(syncVisualViewport, 0));

  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    store.remove(STORAGE_LAST_TEXT);
    updateEditorState();
    textInput.focus();
    syncVisualViewport();
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

  document.querySelectorAll(".theme-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      themeSetting = dot.dataset.themeOption;
      store.set(STORAGE_THEME, themeSetting);
      applyTheme(themeSetting === "random" ? rollTheme(appliedTheme) : themeSetting);
    });
  });

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
    syncVisualViewport();
    if (mode === "display") updateLandscapeToast();
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncVisualViewport);
    window.visualViewport.addEventListener("scroll", syncVisualViewport);
  }

  window.addEventListener("orientationchange", refitAfterOrientationChange);
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener("change", refitAfterOrientationChange);
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(scheduleFit).observe(fitStage);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && mode === "display") {
      requestWakeLock();
    }
  });

  // ---- 初始化 ----

  applyI18n();
  syncVisualViewport();
  const storedTheme = store.get(STORAGE_THEME);
  themeSetting =
    storedTheme === "random" || THEMES.includes(storedTheme) ? storedTheme : "classic";
  applyTheme(themeSetting === "random" ? rollTheme() : themeSetting);
  textInput.value = store.get(STORAGE_LAST_TEXT) || "";
  updateEditorState();
  if (window.matchMedia("(pointer: fine)").matches) {
    textInput.focus();
  }

  // ?text=... 可直接进入显示模式；读取后从地址栏移除文本参数。
  const url = new URL(window.location.href);
  const urlText = url.searchParams.get("text");
  if (urlText && urlText.trim()) {
    textInput.value = urlText;
    updateEditorState();
    store.set(STORAGE_LAST_TEXT, textInput.value);
    url.searchParams.delete("text");
    history.replaceState(
      history.state,
      "",
      url.pathname + (url.search ? url.search : "") + url.hash
    );
    enterDisplay();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }
})();
