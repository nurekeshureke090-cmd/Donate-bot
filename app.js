/**
 * ==========================================================================
 * TELEGRAM MINI APP - PLAYPAY STORE (app.js)
 * Fully dynamic game store integrated with Telegram WebApp & PlayPay Proxy
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- Telegram WebApp Instance ---
  const tg = window.Telegram?.WebApp || null;

  // --- State ---
  const state = {
    games: [],
    filteredGames: [],
    selectedGame: null,
    packages: [],
    selectedPackage: null,
    playerId: '',
    serverId: '',
    verifiedPlayer: null,
    isLoadingGames: false,
    isLoadingPackages: false,
    checkIdTimeout: null
  };

  // --- DOM Elements ---
  const elements = {
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    searchInput: document.getElementById('gameSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    gamesCountBadge: document.getElementById('gamesCountBadge'),
    gamesSkeleton: document.getElementById('gamesSkeleton'),
    gamesGrid: document.getElementById('gamesGrid'),
    emptyState: document.getElementById('emptyState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    retryFetchBtn: document.getElementById('retryFetchBtn'),

    // Modal
    modalOverlay: document.getElementById('modalOverlay'),
    modalSheet: document.getElementById('modalSheet'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalGameImg: document.getElementById('modalGameImg'),
    modalGameTitle: document.getElementById('modalGameTitle'),
    modalGameSub: document.getElementById('modalGameSub'),
    packagesCountBadge: document.getElementById('packagesCountBadge'),
    packagesSkeleton: document.getElementById('packagesSkeleton'),
    packagesList: document.getElementById('packagesList'),

    // Player ID form
    playerFormSection: document.getElementById('playerFormSection'),
    playerIdLabel: document.getElementById('playerIdLabel'),
    playerIdInput: document.getElementById('playerIdInput'),
    serverIdGroup: document.getElementById('serverIdGroup'),
    serverIdInput: document.getElementById('serverIdInput'),
    idCheckSpinner: document.getElementById('idCheckSpinner'),
    idVerificationStatus: document.getElementById('idVerificationStatus'),
    summaryPkgName: document.getElementById('summaryPkgName'),
    summaryPkgPrice: document.getElementById('summaryPkgPrice'),
    modalPayBtn: document.getElementById('modalPayBtn'),

    // Success Modal
    successModal: document.getElementById('successModal'),
    receiptOrderId: document.getElementById('receiptOrderId'),
    receiptGameName: document.getElementById('receiptGameName'),
    receiptPkgName: document.getElementById('receiptPkgName'),
    receiptPlayerId: document.getElementById('receiptPlayerId'),
    successCloseBtn: document.getElementById('successCloseBtn')
  };

  // --- Formatting Helpers ---
  function formatUzs(amount) {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    return amount.toLocaleString('uz-UZ') + " so'm";
  }

  function triggerHaptic(type = 'light') {
    try {
      if (type === 'light' || type === 'medium' || type === 'heavy') {
        tg?.HapticFeedback?.impactOccurred(type);
      } else if (type === 'success' || type === 'error' || type === 'warning') {
        tg?.HapticFeedback?.notificationOccurred(type);
      }
    } catch (e) {
      // Haptics optional
    }
  }

  // --- API Proxy Requester ---
  async function apiFetch(path, options = {}) {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const url = isGet 
      ? `/api/proxy?path=${encodeURIComponent(path)}` 
      : '/api/proxy';

    const headers = {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': tg?.initData || '',
      ...(options.headers || {})
    };

    const fetchConfig = {
      method: options.method || 'GET',
      headers
    };

    if (!isGet && options.body) {
      fetchConfig.body = JSON.stringify({
        path: path,
        data: options.body
      });
    }

    const res = await fetch(url, fetchConfig);
    const data = await res.json();
    return data;
  }

  // --- Telegram WebApp Initialization ---
  function initTelegram() {
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation?.();

      // Configure Header & Background
      if (tg.themeParams?.secondary_bg_color) {
        tg.setHeaderColor?.(tg.themeParams.secondary_bg_color);
        tg.setBackgroundColor?.(tg.themeParams.secondary_bg_color);
      }

      // Populate User Header
      const user = tg.initDataUnsafe?.user;
      if (user) {
        const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Foydalanuvchi';
        elements.userName.textContent = displayName;
        if (user.first_name) {
          elements.userAvatar.textContent = user.first_name.charAt(0).toUpperCase();
        }
      }

      // Setup Native BackButton
      tg.BackButton.onClick(() => {
        closeModal();
      });

      // Setup Native MainButton
      tg.MainButton.setParams({
        text: 'XARID QILISH',
        color: tg.themeParams?.button_color || '#2481cc',
        text_color: tg.themeParams?.button_text_color || '#ffffff',
        is_active: false,
        is_visible: false
      });

      tg.MainButton.onClick(handlePurchase);
    } catch (err) {
      console.warn('Telegram WebApp setup warning:', err);
    }
  }

  // --- Load Games Dynamically ---
  async function loadGames() {
    state.isLoadingGames = true;
    showGamesSkeleton();

    try {
      const res = await apiFetch('/games');
      if (res && res.ok && Array.isArray(res.games)) {
        state.games = res.games;
        state.filteredGames = res.games;
        renderGamesGrid();
      } else {
        throw new Error(res?.error || "O'yinlar ro'yxatini yuklab bo'lmadi");
      }
    } catch (error) {
      console.error('Failed to load games:', error);
      showGamesError(error.message);
    } finally {
      state.isLoadingGames = false;
    }
  }

  function showGamesSkeleton() {
    elements.gamesSkeleton.style.display = 'grid';
    elements.gamesGrid.style.display = 'none';
    elements.emptyState.style.display = 'none';
    elements.errorState.style.display = 'none';
    elements.gamesCountBadge.textContent = '...';
  }

  function showGamesError(msg) {
    elements.gamesSkeleton.style.display = 'none';
    elements.gamesGrid.style.display = 'none';
    elements.emptyState.style.display = 'none';
    elements.errorState.style.display = 'block';
    elements.errorMessage.textContent = msg || 'Internet aloqasini tekshirib qayta urinib ko\'ring.';
  }

  function renderGamesGrid() {
    elements.gamesSkeleton.style.display = 'none';
    elements.errorState.style.display = 'none';

    if (!state.filteredGames.length) {
      elements.gamesGrid.style.display = 'none';
      elements.emptyState.style.display = 'block';
      elements.gamesCountBadge.textContent = '0 dona';
      return;
    }

    elements.emptyState.style.display = 'none';
    elements.gamesGrid.style.display = 'grid';
    elements.gamesCountBadge.textContent = `${state.filteredGames.length} dona`;

    elements.gamesGrid.innerHTML = state.filteredGames.map(game => {
      const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(game.name)}&background=2481cc&color=fff&size=128`;
      const pkgCountText = game.packages_count > 0 ? `${game.packages_count} ta paket` : 'Paketlar';
      return `
        <div class="game-card" data-game-id="${game.game_id}">
          <div class="game-card-img-wrap">
            <img 
              class="game-card-img" 
              src="${game.image || fallbackImg}" 
              alt="${escapeHtml(game.name)}" 
              loading="lazy"
              onerror="this.onerror=null;this.src='${fallbackImg}';"
            >
          </div>
          <div class="game-card-name">${escapeHtml(game.name)}</div>
          <div class="game-card-meta">
            <span>⚡️</span>
            <span>${pkgCountText}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to game cards
    elements.gamesGrid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = Number(card.getAttribute('data-game-id'));
        const game = state.games.find(g => g.game_id === gameId);
        if (game) {
          triggerHaptic('light');
          openGameModal(game);
        }
      });
    });
  }

  // --- Search & Filter ---
  function handleSearch(query) {
    const q = query.trim().toLowerCase();
    elements.clearSearchBtn.style.display = q ? 'flex' : 'none';

    if (!q) {
      state.filteredGames = state.games;
    } else {
      state.filteredGames = state.games.filter(g => 
        g.name.toLowerCase().includes(q)
      );
    }
    renderGamesGrid();
  }

  // --- Open Game Modal & Fetch Packages ---
  async function openGameModal(game) {
    state.selectedGame = game;
    state.packages = [];
    state.selectedPackage = null;
    state.playerId = '';
    state.serverId = '';
    state.verifiedPlayer = null;

    // Reset Inputs
    elements.playerIdInput.value = '';
    elements.serverIdInput.value = '';
    elements.idVerificationStatus.style.display = 'none';
    elements.playerFormSection.style.display = 'none';
    updateMainButtonState();

    // Setup Labels based on Game Attributes
    elements.modalGameTitle.textContent = game.name;
    elements.modalGameSub.textContent = game.packages_count ? `${game.packages_count} ta mavjud paket` : "Paketni tanlang";
    elements.modalGameImg.src = game.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(game.name)}&background=2481cc&color=fff`;

    elements.playerIdLabel.textContent = game.id_label || 'Player ID';
    elements.playerIdInput.placeholder = `${game.id_label || 'Player ID'} raqamingizni kiriting`;

    // Show/Hide Server ID input
    if (game.requires_server) {
      elements.serverIdGroup.style.display = 'block';
    } else {
      elements.serverIdGroup.style.display = 'none';
    }

    // Show Sheet & Telegram BackButton
    elements.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    tg?.BackButton?.show();

    // Load Packages
    await loadPackages(game.game_id);
  }

  async function loadPackages(gameId) {
    state.isLoadingPackages = true;
    elements.packagesSkeleton.style.display = 'grid';
    elements.packagesList.style.display = 'none';
    elements.packagesCountBadge.textContent = 'Yuklanmoqda...';

    try {
      const res = await apiFetch(`/games/${gameId}/packages`);
      if (res && res.ok && Array.isArray(res.packages)) {
        state.packages = res.packages;
        renderPackages();
      } else {
        throw new Error(res?.error || 'Paketlarni yuklab bo\'lmadi');
      }
    } catch (err) {
      console.error('Packages error:', err);
      elements.packagesSkeleton.style.display = 'none';
      elements.packagesList.style.display = 'block';
      elements.packagesList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--hint-color);">
          Paketlar mavjud emas yoki yuklashda xatolik yuz berdi.
        </div>
      `;
      elements.packagesCountBadge.textContent = '0 dona';
    } finally {
      state.isLoadingPackages = false;
    }
  }

  function renderPackages() {
    elements.packagesSkeleton.style.display = 'none';
    elements.packagesList.style.display = 'grid';
    elements.packagesCountBadge.textContent = `${state.packages.length} dona`;

    if (!state.packages.length) {
      elements.packagesList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--hint-color);">
          Ushbu o'yin uchun hozirda faol paketlar yo'q.
        </div>
      `;
      return;
    }

    elements.packagesList.innerHTML = state.packages.map(pkg => {
      const priceUzs = pkg.price?.amount || (pkg.price?.usd ? Math.round(pkg.price.usd * 12800) : 0);
      const usdText = pkg.price?.usd ? `$${pkg.price.usd}` : '';
      return `
        <div class="pkg-card" data-paket-id="${pkg.paket_id}">
          <div class="pkg-name">${escapeHtml(pkg.name)}</div>
          <div class="pkg-price">${formatUzs(priceUzs)}</div>
          ${usdText ? `<div class="pkg-usd">${usdText}</div>` : ''}
        </div>
      `;
    }).join('');

    // Attach click listeners to packages
    elements.packagesList.querySelectorAll('.pkg-card').forEach(card => {
      card.addEventListener('click', () => {
        const paketId = Number(card.getAttribute('data-paket-id'));
        const pkg = state.packages.find(p => p.paket_id === paketId);
        if (pkg) {
          selectPackage(pkg, card);
        }
      });
    });
  }

  function selectPackage(pkg, cardElement) {
    state.selectedPackage = pkg;
    triggerHaptic('light');

    // Highlight selected card
    elements.packagesList.querySelectorAll('.pkg-card').forEach(c => {
      c.classList.remove('selected');
      const chk = c.querySelector('.pkg-selected-check');
      if (chk) chk.remove();
    });

    cardElement.classList.add('selected');
    const checkBadge = document.createElement('div');
    checkBadge.className = 'pkg-selected-check';
    checkBadge.textContent = '✓';
    cardElement.appendChild(checkBadge);

    // Update Summary Section
    const priceUzs = pkg.price?.amount || (pkg.price?.usd ? Math.round(pkg.price.usd * 12800) : 0);
    elements.summaryPkgName.textContent = pkg.name;
    elements.summaryPkgPrice.textContent = formatUzs(priceUzs);

    // Show Player ID Form
    elements.playerFormSection.style.display = 'block';

    // Smooth scroll down to form
    elements.playerFormSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Focus input if empty
    if (!elements.playerIdInput.value.trim()) {
      elements.playerIdInput.focus();
    }

    updateMainButtonState();
  }

  // --- Player ID Validation & Nickname Verification ---
  function handlePlayerIdChange() {
    state.playerId = elements.playerIdInput.value.trim();
    updateMainButtonState();

    if (state.checkIdTimeout) clearTimeout(state.checkIdTimeout);

    // If ID is typed and game supports check_id, auto-verify with PlayPay
    if (state.playerId.length >= 4 && state.selectedGame) {
      elements.idCheckSpinner.style.display = 'block';
      state.checkIdTimeout = setTimeout(async () => {
        try {
          const body = {
            game_id: state.selectedGame.game_id,
            player_id: state.playerId
          };
          if (state.selectedGame.requires_server && elements.serverIdInput.value.trim()) {
            body.server_id = elements.serverIdInput.value.trim();
          }

          const res = await apiFetch('/check_id', {
            method: 'POST',
            body: body
          });

          elements.idCheckSpinner.style.display = 'none';

          if (res && res.ok && (res.charname || res.username || res.name)) {
            const charname = res.charname || res.username || res.name;
            state.verifiedPlayer = charname;
            elements.idVerificationStatus.className = 'verification-badge valid';
            elements.idVerificationStatus.innerHTML = `<span>✓</span> <span>O'yinchi: <strong>${escapeHtml(charname)}</strong></span>`;
            elements.idVerificationStatus.style.display = 'inline-flex';
            triggerHaptic('light');
          } else {
            elements.idVerificationStatus.style.display = 'none';
          }
        } catch (e) {
          elements.idCheckSpinner.style.display = 'none';
          elements.idVerificationStatus.style.display = 'none';
        }
      }, 600);
    } else {
      elements.idCheckSpinner.style.display = 'none';
      elements.idVerificationStatus.style.display = 'none';
    }
  }

  // --- MainButton / Fallback Button State Management ---
  function updateMainButtonState() {
    const isValid = Boolean(
      state.selectedGame && 
      state.selectedPackage && 
      elements.playerIdInput.value.trim().length >= 3 &&
      (!state.selectedGame.requires_server || elements.serverIdInput.value.trim().length >= 1)
    );

    const priceUzs = state.selectedPackage?.price?.amount || 
      (state.selectedPackage?.price?.usd ? Math.round(state.selectedPackage.price.usd * 12800) : 0);

    if (isValid) {
      const buttonText = `XARID QILISH • ${formatUzs(priceUzs)}`;

      // Update Telegram MainButton
      if (tg?.MainButton) {
        tg.MainButton.setText(buttonText);
        tg.MainButton.enable();
        tg.MainButton.show();
      }

      // Update Fallback button
      elements.modalPayBtn.disabled = false;
      elements.modalPayBtn.textContent = buttonText;
    } else {
      if (tg?.MainButton) {
        tg.MainButton.hide();
      }
      elements.modalPayBtn.disabled = true;
      elements.modalPayBtn.textContent = 'Xarid qilish';
    }
  }

  // --- Purchase Logic ---
  async function handlePurchase() {
    if (!state.selectedGame || !state.selectedPackage) return;

    const playerId = elements.playerIdInput.value.trim();
    const serverId = elements.serverIdInput.value.trim();

    if (!playerId) {
      alert("Iltimos, o'yinchi ID raqamini kiriting!");
      elements.playerIdInput.focus();
      return;
    }

    if (state.selectedGame.requires_server && !serverId) {
      alert("Iltimos, Server / Zone ID raqamini kiriting!");
      elements.serverIdInput.focus();
      return;
    }

    // Set Loading State
    triggerHaptic('medium');
    if (tg?.MainButton) {
      tg.MainButton.showProgress();
      tg.MainButton.disable();
    }
    elements.modalPayBtn.disabled = true;
    elements.modalPayBtn.textContent = 'Buyurtma berilmoqda...';

    try {
      const orderPayload = {
        game_id: state.selectedGame.game_id,
        paket_id: state.selectedPackage.paket_id,
        player_id: playerId
      };
      if (serverId) orderPayload.server_id = serverId;
      if (state.verifiedPlayer) orderPayload.charname = state.verifiedPlayer;

      const res = await apiFetch('/order', {
        method: 'POST',
        body: orderPayload
      });

      if (res && (res.ok || res.order_id)) {
        triggerHaptic('success');
        closeModal();

        // Populate Success Card
        elements.receiptOrderId.textContent = `#${res.order_id || Math.floor(100000 + Math.random() * 900000)}`;
        elements.receiptGameName.textContent = state.selectedGame.name;
        elements.receiptPkgName.textContent = state.selectedPackage.name;
        elements.receiptPlayerId.textContent = playerId + (serverId ? ` (${serverId})` : '');

        // Show Success Dialog
        elements.successModal.classList.add('active');
      } else {
        throw new Error(res?.error || "Buyurtma yaratib bo'lmadi");
      }
    } catch (err) {
      console.error('Purchase error:', err);
      triggerHaptic('error');
      const errorMsg = err.message || "Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.";
      if (tg?.showAlert) {
        tg.showAlert(`❌ Xatolik: ${errorMsg}`);
      } else {
        alert(`❌ Xatolik: ${errorMsg}`);
      }
    } finally {
      if (tg?.MainButton) {
        tg.MainButton.hideProgress();
        tg.MainButton.enable();
      }
      elements.modalPayBtn.disabled = false;
      updateMainButtonState();
    }
  }

  // --- Close Modal ---
  function closeModal() {
    elements.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    tg?.BackButton?.hide();
    tg?.MainButton?.hide();
    state.selectedGame = null;
    state.selectedPackage = null;
  }

  // --- Escape HTML string helper ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      handleSearch('');
      elements.searchInput.focus();
    });

    // Retry fetch
    elements.retryFetchBtn.addEventListener('click', () => {
      loadGames();
    });

    // Modal Close
    elements.modalCloseBtn.addEventListener('click', () => {
      closeModal();
    });

    elements.modalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.modalOverlay) {
        closeModal();
      }
    });

    // Form inputs
    elements.playerIdInput.addEventListener('input', handlePlayerIdChange);
    elements.serverIdInput.addEventListener('input', updateMainButtonState);

    // Fallback modal button
    elements.modalPayBtn.addEventListener('click', handlePurchase);

    // Success Close
    elements.successCloseBtn.addEventListener('click', () => {
      elements.successModal.classList.remove('active');
    });
  }

  // --- Bootstrap ---
  function init() {
    initTelegram();
    setupEventListeners();
    loadGames();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
