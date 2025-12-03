// content.js - Version isolée et garantie de fonctionner

(function() {
  'use strict';

  // Vérifier que nous sommes dans le bon contexte
  if (!chrome || !chrome.runtime) {
    return;
  }

  console.log('[VOCAB HELPER] Démarrage de l\'extension');

  let vocabulaire = {};
  let popup = null;

  // Créer le pop-up
  function creerPopup() {
    if (popup) return popup;

    popup = document.createElement('div');
    popup.id = 'vocab-helper-notification';
    popup.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      left: 20px !important;
      background: #000 !important;
      color: #fff !important;
      padding: 20px 30px !important;
      border-radius: 12px !important;
      font-size: 22px !important;
      font-weight: bold !important;
      font-family: Arial, sans-serif !important;
      z-index: 2147483647 !important;
      box-shadow: 0 8px 20px rgba(0,0,0,0.8) !important;
      display: none !important;
      min-width: 300px !important;
      text-align: center !important;
    `;

    document.documentElement.appendChild(popup);
    console.log('[VOCAB HELPER] Pop-up créé');
    return popup;
  }

  // Afficher la traduction
  function afficher(mot, traduction) {
    const p = creerPopup();
    p.innerHTML = `
      <div style="font-size: 18px; opacity: 0.8; margin-bottom: 10px;">${mot}</div>
      <div style="font-size: 26px; color: #4CAF50;">↓ ${traduction}</div>
    `;
    p.style.display = 'block';
    console.log(`[VOCAB HELPER] Affiché: ${mot} -> ${traduction}`);

    setTimeout(() => {
      p.style.display = 'none';
    }, 8000);
  }

  // Scanner la page
  function scanner() {
    if (Object.keys(vocabulaire).length === 0) {
      console.log('[VOCAB HELPER] Pas de vocabulaire');
      return;
    }

    const texte = (document.body.innerText || '').toLowerCase();
    console.log('[VOCAB HELPER] Scan de la page...');

    for (const [espagnol, francais] of Object.entries(vocabulaire)) {
      const motMin = espagnol.toLowerCase();
      if (texte.includes(motMin)) {
        console.log(`[VOCAB HELPER] Mot trouvé: ${espagnol}`);
        afficher(espagnol, francais);
        return;
      }
    }

    console.log('[VOCAB HELPER] Aucun mot trouvé');
  }

  // Charger le vocabulaire
  function charger() {
    const url = chrome.runtime.getURL('vocab.json');
    console.log('[VOCAB HELPER] Chargement:', url);

    fetch(url)
      .then(r => r.json())
      .then(data => {
        vocabulaire = data;
        console.log('[VOCAB HELPER] Vocabulaire chargé:', vocabulaire);
        scanner();
      })
      .catch(err => {
        console.error('[VOCAB HELPER] Erreur chargement:', err);
      });
  }

  // Observer les changements
  const observer = new MutationObserver(() => {
    scanner();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initialisation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', charger);
  } else {
    charger();
  }

  console.log('[VOCAB HELPER] Extension initialisée');
})();
