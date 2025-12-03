// content.js - Version avancée avec sidebar persistant

(function() {
  'use strict';

  if (!chrome || !chrome.runtime) return;

  console.log('[VOCAB HELPER] Démarrage');

  let vocabulaire = {};
  let sidebar = null;
  let motsDetectes = new Set(); // Pour éviter les doublons

  // Créer la sidebar persistante
  function creerSidebar() {
    if (sidebar) return sidebar;

    sidebar = document.createElement('div');
    sidebar.id = 'vocab-helper-sidebar';
    sidebar.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 320px !important;
      max-height: 80vh !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border-radius: 16px !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important;
      z-index: 2147483647 !important;
      padding: 20px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      overflow-y: auto !important;
      display: none !important;
      backdrop-filter: blur(10px) !important;
    `;

    const titre = document.createElement('div');
    titre.style.cssText = `
      color: white !important;
      font-size: 18px !important;
      font-weight: 700 !important;
      margin-bottom: 15px !important;
      text-align: center !important;
      padding-bottom: 15px !important;
      border-bottom: 2px solid rgba(255,255,255,0.2) !important;
    `;
    titre.textContent = '📚 Traductions détectées';

    const container = document.createElement('div');
    container.id = 'vocab-helper-list';
    container.style.cssText = `
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
    `;

    sidebar.appendChild(titre);
    sidebar.appendChild(container);
    document.documentElement.appendChild(sidebar);

    console.log('[VOCAB HELPER] Sidebar créée');
    return sidebar;
  }

  // Ajouter une traduction dans la sidebar
  function ajouterTraduction(motOriginal, traduction) {
    const cle = `${motOriginal.toLowerCase()}-${traduction.toLowerCase()}`;
    
    // Vérifier si déjà affiché
    if (motsDetectes.has(cle)) {
      return;
    }
    
    motsDetectes.add(cle);
    const sb = creerSidebar();
    const container = document.getElementById('vocab-helper-list');

    const item = document.createElement('div');
    item.style.cssText = `
      background: rgba(255, 255, 255, 0.95) !important;
      border-radius: 10px !important;
      padding: 12px 15px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      transition: all 0.2s ease !important;
      cursor: pointer !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    `;

    item.onmouseover = () => {
      item.style.transform = 'translateX(-5px)';
      item.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    };

    item.onmouseout = () => {
      item.style.transform = 'translateX(0)';
      item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    };

    const texte = document.createElement('div');
    texte.style.cssText = `
      flex: 1 !important;
      font-size: 15px !important;
      color: #2d3748 !important;
    `;
    texte.innerHTML = `
      <span style="font-weight: 600; color: #667eea;">${motOriginal}</span>
      <span style="margin: 0 8px; color: #a0aec0;">→</span>
      <span style="font-weight: 600; color: #48bb78;">${traduction}</span>
    `;

    const btnCopy = document.createElement('button');
    btnCopy.textContent = '📋';
    btnCopy.title = 'Copier la traduction';
    btnCopy.style.cssText = `
      background: #667eea !important;
      border: none !important;
      border-radius: 6px !important;
      padding: 6px 10px !important;
      font-size: 16px !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
    `;

    btnCopy.onmouseover = () => {
      btnCopy.style.background = '#764ba2';
      btnCopy.style.transform = 'scale(1.1)';
    };

    btnCopy.onmouseout = () => {
      btnCopy.style.background = '#667eea';
      btnCopy.style.transform = 'scale(1)';
    };

    btnCopy.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(traduction).then(() => {
        btnCopy.textContent = '✔️';
        setTimeout(() => {
          btnCopy.textContent = '📋';
        }, 1000);
      });
    };

    item.appendChild(texte);
    item.appendChild(btnCopy);
    container.appendChild(item);

    sb.style.display = 'block';
    console.log(`[VOCAB HELPER] Ajouté: ${motOriginal} → ${traduction}`);
  }

  // Normaliser un mot (enlever accents, ponctuation)
  function normaliser(texte) {
    return texte
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  // Vérifier si un mot exact est présent (avec limites de mots)
  function estMotComplet(texte, mot) {
    const regex = new RegExp(`\\b${mot}\\b`, 'i');
    return regex.test(texte);
  }

  // Scanner la page avec détection exacte
  function scanner() {
    if (Object.keys(vocabulaire).length === 0) {
      console.log('[VOCAB HELPER] Vocabulaire vide');
      return;
    }

    const texteComplet = document.body.innerText || '';
    const texteNormalise = normaliser(texteComplet);
    const motsPresents = new Map(); // mot original -> traduction

    console.log('[VOCAB HELPER] Scan en cours...');

    // Détecter chaque mot du vocabulaire
    for (const [espagnol, francais] of Object.entries(vocabulaire)) {
      const motNormalise = normaliser(espagnol);
      
      // Vérification exacte : le mot doit être complet (limites de mots)
      if (estMotComplet(texteComplet, espagnol) || estMotComplet(texteNormalise, motNormalise)) {
        if (!motsPresents.has(espagnol)) {
          motsPresents.set(espagnol, francais);
        }
      }
    }

    // Vérifier quels mots ne sont plus sur la page
    const clesPresentesActuelles = new Set();
    for (const [esp, fra] of motsPresents.entries()) {
      clesPresentesActuelles.add(`${esp.toLowerCase()}-${fra.toLowerCase()}`);
    }

    // Supprimer les mots qui ne sont plus présents
    const container = document.getElementById('vocab-helper-list');
    if (container) {
      const nouveauxMotsDetectes = new Set();
      motsDetectes.forEach(cle => {
        if (clesPresentesActuelles.has(cle)) {
          nouveauxMotsDetectes.add(cle);
        } else {
          // Retirer de l'affichage
          const items = container.children;
          for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            const texte = item.querySelector('div').textContent;
            if (texte.toLowerCase().includes(cle.split('-')[0])) {
              container.removeChild(item);
            }
          }
        }
      });
      motsDetectes = nouveauxMotsDetectes;
    }

    // Ajouter les nouveaux mots détectés
    for (const [espagnol, francais] of motsPresents.entries()) {
      ajouterTraduction(espagnol, francais);
    }

    // Masquer la sidebar si aucun mot
    if (motsPresents.size === 0 && sidebar) {
      sidebar.style.display = 'none';
      motsDetectes.clear();
      if (container) container.innerHTML = '';
    }

    console.log(`[VOCAB HELPER] ${motsPresents.size} mot(s) détecté(s)`);
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
        console.error('[VOCAB HELPER] Erreur:', err);
      });
  }

  // Observer les changements de contenu
  const observer = new MutationObserver(() => {
    scanner();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Initialisation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', charger);
  } else {
    charger();
  }

  console.log('[VOCAB HELPER] Extension prête');
})();
