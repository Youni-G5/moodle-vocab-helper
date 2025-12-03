// content.js - Version corrigée avec détection garantie

(function () {
  "use strict";

  console.log("[Moodle Vocab Helper] Extension démarrée");

  const VOCAB_URL = chrome.runtime.getURL("vocab.json");
  const NOTIF_DISPLAY_MS = 8000;

  let vocabData = {};
  let notificationTimeout = null;

  // Fonction de normalisation simple
  function normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
      .trim();
  }

  // Créer le pop-up de notification
  function createNotificationElement() {
    let popup = document.getElementById("vocab-helper-popup");
    if (popup) return popup;

    popup = document.createElement("div");
    popup.id = "vocab-helper-popup";
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 20px 25px;
      border-radius: 10px;
      font-size: 20px;
      font-weight: bold;
      font-family: Arial, sans-serif;
      z-index: 999999999;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
      min-width: 250px;
      text-align: center;
      display: none;
    `;
    document.body.appendChild(popup);
    console.log("[Moodle Vocab Helper] Pop-up créé");
    return popup;
  }

  // Afficher la traduction
  function showTranslation(word, translation) {
    const popup = createNotificationElement();
    
    popup.innerHTML = `
      <div style="font-size: 16px; opacity: 0.8; margin-bottom: 8px;">${word}</div>
      <div style="font-size: 24px; color: #4CAF50;">↓ ${translation}</div>
    `;
    
    popup.style.display = "block";
    console.log(`[Moodle Vocab Helper] Affichage: ${word} → ${translation}`);

    // Masquer après 8 secondes
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
      popup.style.display = "none";
    }, NOTIF_DISPLAY_MS);
  }

  // Scanner le texte de la page
  function scanPage() {
    if (!vocabData || Object.keys(vocabData).length === 0) {
      console.log("[Moodle Vocab Helper] Vocabulaire vide, attente...");
      return;
    }

    // Récupérer tout le texte visible de la page
    const pageText = document.body.innerText || document.body.textContent || "";
    
    if (!pageText.trim()) {
      console.log("[Moodle Vocab Helper] Pas de texte sur la page");
      return;
    }

    console.log("[Moodle Vocab Helper] Scan de la page...");

    // Normaliser le texte de la page
    const normalizedText = normalize(pageText);
    
    // Extraire les mots (séparés par espaces, retours à la ligne, etc.)
    const words = normalizedText.split(/\s+/);
    
    console.log(`[Moodle Vocab Helper] ${words.length} mots trouvés sur la page`);

    // Chercher chaque mot du vocabulaire dans la page
    for (const [spanishWord, frenchTranslation] of Object.entries(vocabData)) {
      const normalizedSpanish = normalize(spanishWord);
      
      // Vérifier si le mot espagnol est dans la page
      if (words.includes(normalizedSpanish)) {
        console.log(`[Moodle Vocab Helper] Mot trouvé: ${spanishWord}`);
        showTranslation(spanishWord, frenchTranslation);
        return; // Afficher seulement le premier mot trouvé
      }
    }

    console.log("[Moodle Vocab Helper] Aucun mot du vocabulaire détecté");
  }

  // Charger le vocabulaire
  async function loadVocabulary() {
    try {
      console.log("[Moodle Vocab Helper] Chargement du vocabulaire...");
      const response = await fetch(VOCAB_URL);
      
      if (!response.ok) {
        console.error("[Moodle Vocab Helper] Erreur de chargement:", response.status);
        return;
      }

      vocabData = await response.json();
      console.log("[Moodle Vocab Helper] Vocabulaire chargé:", vocabData);
      console.log(`[Moodle Vocab Helper] ${Object.keys(vocabData).length} mots dans le vocabulaire`);

      // Scanner immédiatement après chargement
      scanPage();
    } catch (error) {
      console.error("[Moodle Vocab Helper] Erreur:", error);
    }
  }

  // Observer les changements de contenu
  function initObserver() {
    const observer = new MutationObserver(() => {
      console.log("[Moodle Vocab Helper] Changement détecté, rescan...");
      scanPage();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    console.log("[Moodle Vocab Helper] Observer activé");
  }

  // Initialisation
  async function init() {
    console.log("[Moodle Vocab Helper] Initialisation...");
    await loadVocabulary();
    initObserver();
    
    // Rescan quand la page est complètement chargée
    window.addEventListener("load", () => {
      console.log("[Moodle Vocab Helper] Page chargée, rescan");
      scanPage();
    });
  }

  // Démarrer l'extension
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
