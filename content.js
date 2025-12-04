// content.js - Version avec bouton minimiser

(function() {
  'use strict';

  if (!chrome || !chrome.runtime) return;

  console.log('[VOCAB HELPER] Démarrage');

  let vocabulaire = {};
  let sidebar = null;
  let floatingBtn = null;
  let motsDetectes = new Set();
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  let isMinimized = false;

  // Créer le bouton flottant
  function creerBoutonFlottant() {
    if (floatingBtn) return floatingBtn;

    floatingBtn = document.createElement('button');
    floatingBtn.id = 'vocab-helper-float-btn';
    floatingBtn.title = 'Ouvrir le vocabulaire';
    floatingBtn.style.cssText = `
      position: fixed !important;
      bottom: 30px !important;
      right: 30px !important;
      width: 56px !important;
      height: 56px !important;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important;
      border: none !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
      cursor: pointer !important;
      display: none !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 2147483646 !important;
      transition: all 0.3s ease !important;
    `;

    floatingBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    `;

    floatingBtn.onmouseover = () => {
      floatingBtn.style.transform = 'scale(1.1)';
      floatingBtn.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.4)';
    };

    floatingBtn.onmouseout = () => {
      floatingBtn.style.transform = 'scale(1)';
      floatingBtn.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    };

    floatingBtn.onclick = () => {
      ouvrirSidebar();
    };

    document.documentElement.appendChild(floatingBtn);
    console.log('[VOCAB HELPER] Bouton flottant créé');
    return floatingBtn;
  }

  // Ouvrir la sidebar
  function ouvrirSidebar() {
    if (!sidebar) creerSidebar();
    sidebar.style.display = 'block';
    floatingBtn.style.display = 'none';
    isMinimized = false;
  }

  // Fermer la sidebar
  function fermerSidebar() {
    if (sidebar) sidebar.style.display = 'none';
    floatingBtn.style.display = 'flex';
    isMinimized = true;
  }

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
      max-height: 580px !important;
      background: rgba(255, 255, 255, 0.98) !important;
      border: 1px solid rgba(0, 0, 0, 0.08) !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      overflow: hidden !important;
      display: block !important;
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
      justify-content: space-between !important;
      user-select: none !important;
    `;

    const headerLeft = document.createElement('div');
    headerLeft.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    `;
    headerLeft.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <span>Vocabulaire</span>
    `;

    // Bouton fermer
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    closeBtn.title = 'Minimiser';
    closeBtn.style.cssText = `
      background: transparent !important;
      border: none !important;
      padding: 4px !important;
      cursor: pointer !important;
      opacity: 0.7 !important;
      transition: opacity 0.2s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 4px !important;
    `;

    closeBtn.onmouseover = () => {
      closeBtn.style.opacity = '1';
      closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    };

    closeBtn.onmouseout = () => {
      closeBtn.style.opacity = '0.7';
      closeBtn.style.background = 'transparent';
    };

    closeBtn.onclick = (e) => {
      e.stopPropagation();
      fermerSidebar();
    };

    header.appendChild(headerLeft);
    header.appendChild(closeBtn);

    // Drag functionality
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Barre de recherche
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      padding: 16px 16px 12px 16px !important;
      background: #fafafa !important;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
    `;

    const searchWrapper = document.createElement('div');
    searchWrapper.style.cssText = `
      position: relative !important;
      display: flex !important;
      align-items: center !important;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Rechercher un mot...';
    searchInput.id = 'vocab-search-input';
    searchInput.style.cssText = `
      width: 100% !important;
      padding: 10px 40px 10px 38px !important;
      border: 1px solid rgba(0, 0, 0, 0.12) !important;
      border-radius: 8px !important;
      font-size: 14px !important;
      background: white !important;
      outline: none !important;
      transition: all 0.2s ease !important;
      font-family: inherit !important;
    `;

    searchInput.onfocus = () => {
      searchInput.style.borderColor = '#2563eb';
      searchInput.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
    };

    searchInput.onblur = () => {
      searchInput.style.borderColor = 'rgba(0, 0, 0, 0.12)';
      searchInput.style.boxShadow = 'none';
    };

    const searchIcon = document.createElement('div');
    searchIcon.style.cssText = `
      position: absolute !important;
      left: 12px !important;
      pointer-events: none !important;
      color: #999 !important;
    `;
    searchIcon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    `;

    const clearBtn = document.createElement('button');
    clearBtn.id = 'vocab-search-clear';
    clearBtn.style.cssText = `
      position: absolute !important;
      right: 8px !important;
      background: transparent !important;
      border: none !important;
      padding: 6px !important;
      cursor: pointer !important;
      opacity: 0 !important;
      transition: opacity 0.2s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: #666 !important;
    `;
    clearBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    clearBtn.onclick = () => {
      searchInput.value = '';
      clearBtn.style.opacity = '0';
      raffraichirAffichage();
      searchInput.focus();
    };

    clearBtn.onmouseover = () => {
      clearBtn.style.color = '#1a1a1a';
    };

    clearBtn.onmouseout = () => {
      clearBtn.style.color = '#666';
    };

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearBtn.style.opacity = query ? '1' : '0';
      
      if (query) {
        afficherResultatsRecherche(query);
      } else {
        raffraichirAffichage();
      }
    });

    searchWrapper.appendChild(searchIcon);
    searchWrapper.appendChild(searchInput);
    searchWrapper.appendChild(clearBtn);
    searchContainer.appendChild(searchWrapper);

    const container = document.createElement('div');
    container.id = 'vocab-helper-list';
    container.style.cssText = `
      padding: 12px !important;
      max-height: 432px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    `;

    container.innerHTML = `
      <div style="text-align: center; padding: 32px 20px; color: #999; font-size: 13px;">
        Aucun mot détecté.<br>
        <span style="font-size: 12px; margin-top: 8px; display: block;">Utilisez la recherche ci-dessus</span>
      </div>
    `;

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
      #vocab-search-input::placeholder {
        color: #999;
      }
    `;
    document.head.appendChild(style);

    sidebar.appendChild(header);
    sidebar.appendChild(searchContainer);
    sidebar.appendChild(container);
    document.documentElement.appendChild(sidebar);

    console.log('[VOCAB HELPER] Sidebar créée');
    return sidebar;
  }

  function raffraichirAffichage() {
    const container = document.getElementById('vocab-helper-list');
    if (!container) return;

    container.innerHTML = '';
    const motsAffiches = Array.from(motsDetectes);
    
    if (motsAffiches.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px 20px; color: #999; font-size: 13px;">
          Aucun mot détecté.<br>
          <span style="font-size: 12px; margin-top: 8px; display: block;">Utilisez la recherche ci-dessus</span>
        </div>
      `;
      return;
    }

    motsAffiches.forEach(cle => {
      const [espagnol, francais] = cle.split('-');
      ajouterItemAuto(espagnol, francais, cle);
    });
  }

  function ajouterItemAuto(motOriginal, traduction, cle) {
    const container = document.getElementById('vocab-helper-list');
    if (!container) return;

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

    const btnCopy = creerBoutonCopie(traduction);
    item.appendChild(texte);
    item.appendChild(btnCopy);
    container.appendChild(item);
  }

  function afficherResultatsRecherche(query) {
    const container = document.getElementById('vocab-helper-list');
    if (!container) return;

    const queryNorm = normaliser(query);
    const resultats = [];

    for (const [espagnol, francais] of Object.entries(vocabulaire)) {
      const espagnolNorm = normaliser(espagnol);
      if (espagnolNorm === queryNorm || espagnolNorm.includes(queryNorm)) {
        resultats.push({ espagnol, francais, exacte: espagnolNorm === queryNorm });
      }
    }

    resultats.sort((a, b) => {
      if (a.exacte && !b.exacte) return -1;
      if (!a.exacte && b.exacte) return 1;
      return a.espagnol.localeCompare(b.espagnol);
    });

    container.innerHTML = '';

    if (resultats.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px 20px; color: #999; font-size: 13px;">
          Aucun résultat pour "<strong style="color: #1a1a1a;">${query}</strong>"
        </div>
      `;
      return;
    }

    const resultatsAffiches = resultats.slice(0, 10);
    resultatsAffiches.forEach(({ espagnol, francais }) => {
      ajouterItemRecherche(espagnol, francais);
    });

    if (resultats.length > 10) {
      const moreInfo = document.createElement('div');
      moreInfo.style.cssText = `text-align: center; padding: 12px; color: #999; font-size: 12px;`;
      moreInfo.textContent = `... et ${resultats.length - 10} autre(s) résultat(s)`;
      container.appendChild(moreInfo);
    }
  }

  function ajouterItemRecherche(motOriginal, traduction) {
    const container = document.getElementById('vocab-helper-list');
    if (!container) return;

    const item = document.createElement('div');
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
    texte.style.cssText = `flex: 1 !important; font-size: 14px !important; line-height: 1.5 !important; color: #1a1a1a !important;`;
    texte.innerHTML = `
      <span style="font-weight: 600; color: #1a1a1a;">${motOriginal}</span>
      <span style="margin: 0 10px; color: #999; font-weight: 300;">→</span>
      <span style="color: #2563eb; font-weight: 500;">${traduction}</span>
    `;

    const btnCopy = creerBoutonCopie(traduction);
    item.appendChild(texte);
    item.appendChild(btnCopy);
    container.appendChild(item);
  }

  function creerBoutonCopie(traduction) {
    const btnCopy = document.createElement('button');
    btnCopy.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    btnCopy.title = 'Copier';
    btnCopy.style.cssText = `
      background: transparent !important;
      border: none !important;
      padding: 6px !important;
      cursor: pointer !important;
      opacity: 0.5 !important;
      transition: opacity 0.15s ease !important;
      display: flex !important;
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
        btnCopy.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => {
          btnCopy.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        }, 1200);
      });
    };

    return btnCopy;
  }

  function dragStart(e) {
    if (e.target.closest('#vocab-helper-list') || e.target.closest('#vocab-search-input') || e.target.closest('button')) return;
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

  function ajouterTraduction(motOriginal, traduction) {
    const cle = `${motOriginal.toLowerCase()}-${traduction.toLowerCase()}`;
    if (motsDetectes.has(cle)) return;
    
    motsDetectes.add(cle);
    const sb = creerSidebar();
    const searchInput = document.getElementById('vocab-search-input');
    if (searchInput && searchInput.value.trim()) return;

    ajouterItemAuto(motOriginal, traduction, cle);
    console.log(`[VOCAB HELPER] Ajouté: ${motOriginal} → ${traduction}`);
  }

  function normaliser(texte) {
    return texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function detecterMot(texte, mot) {
    const regex1 = new RegExp(`\\b${mot}\\b`, 'i');
    if (regex1.test(texte)) return true;
    const texteNorm = normaliser(texte);
    const motNorm = normaliser(mot);
    const regex2 = new RegExp(`\\b${motNorm}\\b`, 'i');
    if (regex2.test(texteNorm)) return true;
    return texteNorm.split(' ').includes(motNorm);
  }

  function scanner() {
    if (Object.keys(vocabulaire).length === 0) return;
    const searchInput = document.getElementById('vocab-search-input');
    if (searchInput && searchInput.value.trim()) return;

    let texteComplet = document.body.innerText || '';
    const inputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
    inputs.forEach(input => {
      texteComplet += ' ' + (input.value || input.textContent || '');
    });

    const motsPresents = new Map();
    for (const [espagnol, francais] of Object.entries(vocabulaire)) {
      if (detecterMot(texteComplet, espagnol)) {
        if (!motsPresents.has(espagnol)) {
          motsPresents.set(espagnol, francais);
        }
      }
    }

    const clesPresentesActuelles = new Set();
    for (const [esp, fra] of motsPresents.entries()) {
      clesPresentesActuelles.add(`${esp.toLowerCase()}-${fra.toLowerCase()}`);
    }

    const aSupprimer = [];
    motsDetectes.forEach(cle => {
      if (!clesPresentesActuelles.has(cle)) {
        aSupprimer.push(cle);
      }
    });

    aSupprimer.forEach(cle => motsDetectes.delete(cle));

    for (const [espagnol, francais] of motsPresents.entries()) {
      ajouterTraduction(espagnol, francais);
    }

    if (!searchInput || !searchInput.value.trim()) {
      raffraichirAffichage();
    }
  }

  function charger() {
    const url = chrome.runtime.getURL('vocab.json');
    console.log('[VOCAB HELPER] Chargement:', url);

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Erreur HTTP: ' + r.status);
        return r.text();
      })
      .then(text => {
        try {
          vocabulaire = JSON.parse(text);
          console.log('[VOCAB HELPER] Vocabulaire chargé:', Object.keys(vocabulaire).length, 'mots');
          creerSidebar();
          creerBoutonFlottant();
          scanner();
        } catch (e) {
          console.error('[VOCAB HELPER] Erreur JSON:', e.message);
          console.error('[VOCAB HELPER] Texte:', text.substring(0, 200));
        }
      })
      .catch(err => {
        console.error('[VOCAB HELPER] Erreur chargement:', err);
      });
  }

  const observer = new MutationObserver(() => {
    scanner();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: false
  });

  document.addEventListener('input', () => {
    setTimeout(scanner, 100);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', charger);
  } else {
    charger();
  }

  console.log('[VOCAB HELPER] Extension prête');
})();
