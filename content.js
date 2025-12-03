// content.js - Version professionnelle avec sidebar déplaçable

(function() {
  'use strict';

  if (!chrome || !chrome.runtime) return;

  console.log('[VOCAB HELPER] Démarrage');

  let vocabulaire = {};
  let sidebar = null;
  let motsDetectes = new Set();
  let isDragging = false;
  let currentX, currentY, initialX, initialY;

  // Créer la sidebar professionnelle
  function creerSidebar() {
    if (sidebar) return sidebar;

    sidebar = document.createElement('div');
    sidebar.id = 'vocab-helper-sidebar';
    sidebar.style.cssText = `
      position: fixed !important;
      top: 80px !important;
      right: 30px !important;
      width: 340px !important;
      max-height: 500px !important;
      background: rgba(255, 255, 255, 0.98) !important;
      border: 1px solid rgba(0, 0, 0, 0.08) !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      overflow: hidden !important;
      display: none !important;
      backdrop-filter: blur(20px) !important;
      transition: box-shadow 0.2s ease !important;
    `;

    // Header déplaçable
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important;
      color: #ffffff !important;
      padding: 16px 20px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px !important;
      text-transform: uppercase !important;
      cursor: move !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      user-select: none !important;
    `;
    header.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      Vocabulaire détecté
    `;

    // Drag functionality
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    const container = document.createElement('div');
    container.id = 'vocab-helper-list';
    container.style.cssText = `
      padding: 12px !important;
      max-height: 432px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    `;

    // Custom scrollbar
    const style = document.createElement('style');
    style.textContent = `
      #vocab-helper-list::-webkit-scrollbar {
        width: 6px;
      }
      #vocab-helper-list::-webkit-scrollbar-track {
        background: transparent;
      }
      #vocab-helper-list::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      #vocab-helper-list::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(style);

    sidebar.appendChild(header);
    sidebar.appendChild(container);
    document.documentElement.appendChild(sidebar);

    console.log('[VOCAB HELPER] Sidebar créée');
    return sidebar;
  }

  // Gestion du drag
  function dragStart(e) {
    if (e.target.closest('#vocab-helper-list')) return;
    isDragging = true;
    initialX = e.clientX - sidebar.offsetLeft;
    initialY = e.clientY - sidebar.offsetTop;
    sidebar.style.transition = 'none';
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    
    // Limites de l'écran
    const maxX = window.innerWidth - sidebar.offsetWidth;
    const maxY = window.innerHeight - sidebar.offsetHeight;
    
    currentX = Math.max(0, Math.min(currentX, maxX));
    currentY = Math.max(0, Math.min(currentY, maxY));
    
    sidebar.style.left = currentX + 'px';
    sidebar.style.top = currentY + 'px';
    sidebar.style.right = 'auto';
  }

  function dragEnd() {
    isDragging = false;
    sidebar.style.transition = 'box-shadow 0.2s ease';
  }

  // Ajouter une traduction
  function ajouterTraduction(motOriginal, traduction) {
    const cle = `${motOriginal.toLowerCase()}-${traduction.toLowerCase()}`;
    
    if (motsDetectes.has(cle)) return;
    
    motsDetectes.add(cle);
    const sb = creerSidebar();
    const container = document.getElementById('vocab-helper-list');

    const item = document.createElement('div');
    item.setAttribute('data-key', cle);
    item.style.cssText = `
      background: #fafafa !important;
      border: 1px solid rgba(0, 0, 0, 0.06) !important;
      border-radius: 8px !important;
      padding: 14px 16px !important;
      margin-bottom: 8px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      transition: all 0.15s ease !important;
    `;

    item.onmouseover = () => {
      item.style.background = '#f0f0f0';
      item.style.borderColor = 'rgba(0, 0, 0, 0.12)';
    };

    item.onmouseout = () => {
      item.style.background = '#fafafa';
      item.style.borderColor = 'rgba(0, 0, 0, 0.06)';
    };

    const texte = document.createElement('div');
    texte.style.cssText = `
      flex: 1 !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      color: #1a1a1a !important;
    `;
    texte.innerHTML = `
      <span style="font-weight: 600; color: #1a1a1a;">${motOriginal}</span>
      <span style="margin: 0 10px; color: #999; font-weight: 300;">→</span>
      <span style="color: #2563eb; font-weight: 500;">${traduction}</span>
    `;

    const btnCopy = document.createElement('button');
    btnCopy.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    btnCopy.title = 'Copier la traduction';
    btnCopy.style.cssText = `
      background: transparent !important;
      border: none !important;
      padding: 6px !important;
      cursor: pointer !important;
      opacity: 0.5 !important;
      transition: opacity 0.15s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 4px !important;
    `;

    btnCopy.onmouseover = () => {
      btnCopy.style.opacity = '1';
      btnCopy.style.background = 'rgba(0, 0, 0, 0.04)';
    };

    btnCopy.onmouseout = () => {
      btnCopy.style.opacity = '0.5';
      btnCopy.style.background = 'transparent';
    };

    btnCopy.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(traduction).then(() => {
        btnCopy.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        setTimeout(() => {
          btnCopy.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
        }, 1200);
      });
    };

    item.appendChild(texte);
    item.appendChild(btnCopy);
    container.appendChild(item);

    sb.style.display = 'block';
    console.log(`[VOCAB HELPER] Ajouté: ${motOriginal} → ${traduction}`);
  }

  // Normaliser
  function normaliser(texte) {
    return texte
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Détection améliorée avec plusieurs stratégies
  function detecterMot(texte, mot) {
    // Stratégie 1: Regex avec limites de mots
    const regex1 = new RegExp(`\\b${mot}\\b`, 'i');
    if (regex1.test(texte)) return true;

    // Stratégie 2: Normalisation complète
    const texteNorm = normaliser(texte);
    const motNorm = normaliser(mot);
    const regex2 = new RegExp(`\\b${motNorm}\\b`, 'i');
    if (regex2.test(texteNorm)) return true;

    // Stratégie 3: Split par espaces
    const mots = texteNorm.split(' ');
    return mots.includes(motNorm);
  }

  // Scanner avec détection améliorée
  function scanner() {
    if (Object.keys(vocabulaire).length === 0) {
      console.log('[VOCAB HELPER] Vocabulaire vide');
      return;
    }

    // Récupérer TOUT le texte (y compris inputs, textareas)
    let texteComplet = document.body.innerText || '';
    
    // Ajouter le contenu des champs de texte
    const inputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
    inputs.forEach(input => {
      texteComplet += ' ' + (input.value || input.textContent || '');
    });

    const motsPresents = new Map();
    console.log('[VOCAB HELPER] Scan en cours...');

    // Détecter avec stratégies multiples
    for (const [espagnol, francais] of Object.entries(vocabulaire)) {
      if (detecterMot(texteComplet, espagnol)) {
        if (!motsPresents.has(espagnol)) {
          motsPresents.set(espagnol, francais);
        }
      }
    }

    // Nettoyer les mots disparus
    const container = document.getElementById('vocab-helper-list');
    if (container) {
      const clesPresentesActuelles = new Set();
      for (const [esp, fra] of motsPresents.entries()) {
        clesPresentesActuelles.add(`${esp.toLowerCase()}-${fra.toLowerCase()}`);
      }

      const items = Array.from(container.querySelectorAll('[data-key]'));
      items.forEach(item => {
        const key = item.getAttribute('data-key');
        if (!clesPresentesActuelles.has(key)) {
          item.remove();
          motsDetectes.delete(key);
        }
      });
    }

    // Ajouter les nouveaux
    for (const [espagnol, francais] of motsPresents.entries()) {
      ajouterTraduction(espagnol, francais);
    }

    // Masquer si vide
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

  // Observer
  const observer = new MutationObserver(() => {
    scanner();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: false
  });

  // Scanner aussi sur input events
  document.addEventListener('input', () => {
    setTimeout(scanner, 100);
  }, true);

  // Initialisation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', charger);
  } else {
    charger();
  }

  console.log('[VOCAB HELPER] Extension prête');
})();
