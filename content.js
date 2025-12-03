// content.js - Optimized for instant detection

(function () {
  "use strict";

  const VOCAB_URL = chrome.runtime.getURL("vocab.json");
  const NOTIF_DISPLAY_MS = 8000; // 8 secondes pour avoir le temps de lire
  const REGION_SELECTORS = ["#region-main", "#page", "body"];

  let normalizedIndex = new Map();
  let currentlyDisplayedWord = null;
  let observer = null;

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
    normalizedIndex = new Map();
    for (const [es, fr] of Object.entries(rawVocab)) {
      const norm = normalizeText(es);
      normalizedIndex.set(norm, { original: es, translation: fr });
    }
  }

  function createOrGetNotificationNode() {
    let node = document.getElementById("moodle-vocab-helper-toast");
    if (node) return node;

    node = document.createElement("div");
    node.id = "moodle-vocab-helper-toast";
    node.style.position = "fixed";
    node.style.top = "20px";
    node.style.right = "20px";
    node.style.zIndex = "9999999";
    node.style.background = "rgba(0, 0, 0, 0.95)";
    node.style.color = "#ffffff";
    node.style.padding = "16px 20px";
    node.style.borderRadius = "8px";
    node.style.fontSize = "18px";
    node.style.fontWeight = "600";
    node.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    node.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.5)";
    node.style.pointerEvents = "none";
    node.style.opacity = "0";
    node.style.transition = "opacity 100ms ease-out";
    node.style.minWidth = "200px";
    node.style.textAlign = "center";

    document.documentElement.appendChild(node);
    return node;
  }

  function showNotification(esWord, frWord) {
    if (!esWord || !frWord) return;

    // Autoriser l'affichage même si c'est le même mot (car nouvelle question)
    const displayKey = `${esWord}-${Date.now()}`;
    
    // Si un mot est déjà affiché, on le remplace immédiatement
    if (currentlyDisplayedWord) {
      clearTimeout(currentlyDisplayedWord);
    }

    const node = createOrGetNotificationNode();
    node.innerHTML = `<div style="font-size: 16px; opacity: 0.7; margin-bottom: 4px;">${esWord}</div><div style="font-size: 20px; font-weight: 700;">↓ ${frWord}</div>`;

    // Affichage instantané
    node.style.opacity = "1";

    // Masquer après le délai
    currentlyDisplayedWord = setTimeout(() => {
      node.style.opacity = "0";
      currentlyDisplayedWord = null;
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

    // Détection instantanée - premier mot trouvé est affiché immédiatement
    for (const token of tokens) {
      if (normalizedIndex.has(token)) {
        const wordData = normalizedIndex.get(token);
        showNotification(token, wordData.translation);
        return; // Afficher seulement le premier mot détecté
      }
    }
  }

  function initObserver() {
    const region = getTargetRegion();
    if (!region || observer) return;

    observer = new MutationObserver(() => {
      // Scan immédiat sans debounce pour réactivité maximale
      scanForWords();
    });

    observer.observe(region, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  async function loadVocab() {
    try {
      const resp = await fetch(VOCAB_URL);
      if (!resp.ok) return;
      const data = await resp.json();
      if (data && typeof data === "object") {
        buildIndex(data);
      }
    } catch (e) {
      // échec silencieux
    }
  }

  async function init() {
    await loadVocab();
    scanForWords(); // Scan initial immédiat
    initObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
