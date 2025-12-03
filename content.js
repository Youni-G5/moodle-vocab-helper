// content.js

(function () {
  "use strict";

  const VOCAB_URL = chrome.runtime.getURL("vocab.json");
  const NOTIF_DISPLAY_MS = 5000;
  const SCAN_DEBOUNCE_MS = 300;
  const REGION_SELECTORS = ["#region-main", "#page", "body"];

  let vocabMap = new Map();
  let normalizedIndex = new Map();
  let shownWordsCache = new Set();
  let observer = null;
  let scanTimeoutId = null;

  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}+/gu, "")
      .replace(/[^a-z\s]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    if (!text) return [];
    return text.split(" ").filter(Boolean);
  }

  function buildIndex(rawVocab) {
    vocabMap = new Map(Object.entries(rawVocab));
    normalizedIndex = new Map();

    for (const [es, fr] of Object.entries(rawVocab)) {
      const norm = normalizeText(es);
      normalizedIndex.set(norm, fr);
    }
  }

  function createOrGetNotificationNode() {
    let node = document.getElementById("moodle-vocab-helper-toast");
    if (node) return node;

    node = document.createElement("div");
    node.id = "moodle-vocab-helper-toast";
    node.style.position = "fixed";
    node.style.top = "12px";
    node.style.right = "12px";
    node.style.zIndex = "999999";
    node.style.background = "rgba(0, 0, 0, 0.8)";
    node.style.color = "#ffffff";
    node.style.padding = "10px 14px";
    node.style.borderRadius = "6px";
    node.style.fontSize = "14px";
    node.style.fontFamily =
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    node.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
    node.style.pointerEvents = "none";
    node.style.opacity = "0";
    node.style.transition = "opacity 150ms ease-out";

    document.documentElement.appendChild(node);
    return node;
  }

  function showNotification(esWord, frWord) {
    if (!esWord || !frWord) return;

    const cacheKey = esWord.toLowerCase();
    if (shownWordsCache.has(cacheKey)) return;
    shownWordsCache.add(cacheKey);

    const node = createOrGetNotificationNode();
    node.textContent = `${esWord} → ${frWord}`;

    requestAnimationFrame(() => {
      node.style.opacity = "1";
    });

    setTimeout(() => {
      node.style.opacity = "0";
    }, NOTIF_DISPLAY_MS);
  }

  function getTargetRegion() {
    for (const selector of REGION_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return document.body || document.documentElement;
  }

  function scanForWords() {
    if (!normalizedIndex || normalizedIndex.size === 0) return;

    const region = getTargetRegion();
    if (!region) return;

    const visibleText = region.innerText || region.textContent || "";
    const normalized = normalizeText(visibleText);
    const tokens = tokenize(normalized);

    if (!tokens.length) return;

    const uniqueTokens = Array.from(new Set(tokens));

    for (const token of uniqueTokens) {
      if (normalizedIndex.has(token)) {
        const fr = normalizedIndex.get(token);
        showNotification(token, fr);
      }
    }
  }

  function debouncedScan() {
    if (scanTimeoutId !== null) {
      clearTimeout(scanTimeoutId);
    }
    scanTimeoutId = setTimeout(scanForWords, SCAN_DEBOUNCE_MS);
  }

  function initObserver() {
    const region = getTargetRegion();
    if (!region || observer) return;

    observer = new MutationObserver(() => {
      debouncedScan();
    });

    observer.observe(region, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  async function loadVocab() {
    try {
      const resp = await fetch(VOCAB_URL, { cache: "no-cache" });
      if (!resp.ok) {
        return;
      }
      const data = await resp.json();
      if (data && typeof data === "object") {
        buildIndex(data);
      }
    } catch (e) {
      // échec silencieux pour ne pas casser la page
    }
  }

  async function init() {
    await loadVocab();
    debouncedScan();
    initObserver();

    window.addEventListener("load", debouncedScan, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
