/**
 * ==========================================================================
 * PAYERPIN TELEGRAM MINI APP CONTROLLER (app.js)
 * Robust API fetching, Error Handling, Fixed Bottom Nav & Orders/Profile SPA
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- Telegram WebApp Instance ---
  const tg = window.Telegram?.WebApp || null;

  // --- State ---
  const state = {
    activeTab: 'home',
    games: [],             // Strictly sliced to max 50 games
    filteredGames: [],
    selectedGame: null,
    packages: [],
    selectedPackage: null,
    playerId: '',
    serverId: '',
    verifiedPlayer: null,
    activeCategory: 'all',
    isLoadingGames: false,
    isLoadingPackages: false,
    checkIdTimeout: null
  };

  // --- DOM Elements ---
  const elements = {
    // Views & Nav
    viewHome: document.getElementById('viewHome'),
    viewOrders: document.getElementById('viewOrders'),
    viewProfile: document.getElementById('viewProfile'),
    bottomNav: document.getElementById('bottomNav'),
    navItems: document.querySelectorAll('.bottom-nav .nav-item'),
    navOrdersBadge: document.getElementById('navOrdersBadge'),

    // Home Header & Search
    headerUserName: document.getElementById('headerUserName'),
    searchInput: document.getElementById('gameSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    categoryChips: document.querySelectorAll('.category-chips .chip'),
    gamesCountBadge: document.getElementById('gamesCountBadge'),
    gamesSkeleton: document.getElementById('gamesSkeleton'),
    gamesGrid: document.getElementById('gamesGrid'),
    emptyState: document.getElementById('emptyState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    retryFetchBtn: document.getElementById('retryFetchBtn'),
    goShopBtn: document.getElementById('goShopBtn'),

    // Orders Tab
    ordersList: document.getElementById('ordersList'),
    emptyOrdersState: document.getElementById('emptyOrdersState'),

    // Profile Tab
    profileAvatar: document.getElementById('profileAvatar'),
    profileFullName: document.getElementById('profileFullName'),
    profileUsername: document.getElementById('profileUsername'),
    profileUserId: document.getElementById('profileUserId'),
    copyIdBtn: document.getElementById('copyIdBtn'),
    statsTotalOrders: document.getElementById('statsTotalOrders'),
    statsTotalSpent: document.getElementById('statsTotalSpent'),
    termsBtn: document.getElementById('termsBtn'),

    // Packages Sliding Modal
    modalOverlay: document.getElementById('modalOverlay'),
    modalSheet: document.getElementById('modalSheet'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalGameImg: document.getElementById('modalGameImg'),
    modalGameTitle: document.getElementById('modalGameTitle'),
    modalGameSub: document.getElementById('modalGameSub'),
    packagesCountBadge: document.getElementById('packagesCountBadge'),
    packagesSkeleton: document.getElementById('packagesSkeleton'),
    packagesList: document.getElementById('packagesList'),

    // Player ID Form
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

  // --- API Proxy Requester with Deep Error Parsing ---
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
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      let errText = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errText = errJson.error || errJson.message || errText;
      } catch (e) {
        try {
          const raw = await res.text();
          if (raw) errText += ': ' + raw.slice(0, 100);
        } catch (e2) {}
      }
      throw new Error(errText);
    }

    if (contentType.includes('application/json')) {
      return await res.json();
    } else {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error("Serverdan kutilmagan javob: " + text.slice(0, 80));
      }
    }
  }

  // --- Telegram WebApp Setup ---
  function initTelegram() {
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation?.();

      if (tg.themeParams?.secondary_bg_color) {
        tg.setHeaderColor?.(tg.themeParams.secondary_bg_color);
        tg.setBackgroundColor?.(tg.themeParams.secondary_bg_color);
      }

      // Populate User Header & Profile
      const user = tg.initDataUnsafe?.user;
      if (user) {
        const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Foydalanuvchi';
        if (elements.headerUserName) elements.headerUserName.textContent = displayName;
        if (elements.profileFullName) elements.profileFullName.textContent = displayName;
        if (elements.profileUsername) elements.profileUsername.textContent = user.username ? `@${user.username}` : 'Foydalanuvchi';
        if (elements.profileUserId) elements.profileUserId.textContent = user.id || '8467707826';

        if (user.first_name && elements.profileAvatar) {
          elements.profileAvatar.textContent = user.first_name.charAt(0).toUpperCase();
        }
      }

      // Native BackButton
      tg.BackButton.onClick(() => {
        closeModal();
      });

      // Native MainButton
      tg.MainButton.setParams({
        text: 'XARID QILISH',
        color: tg.themeParams?.button_color || '#6366f1',
        text_color: tg.themeParams?.button_text_color || '#ffffff',
        is_active: false,
        is_visible: false
      });

      tg.MainButton.onClick(handlePurchase);
    } catch (err) {
      console.warn('Telegram WebApp setup warning:', err);
    }
  }

  // --- Fixed Bottom Tab Navigation ---
  function switchTab(tabName) {
    if (state.activeTab === tabName) return;

    state.activeTab = tabName;
    triggerHaptic('light');

    // Update Bottom Nav Active State
    elements.navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Toggle Views
    if (elements.viewHome) elements.viewHome.classList.toggle('active', tabName === 'home');
    if (elements.viewOrders) elements.viewOrders.classList.toggle('active', tabName === 'orders');
    if (elements.viewProfile) elements.viewProfile.classList.toggle('active', tabName === 'profile');

    // Sub-view updates
    if (tabName === 'orders') renderOrdersList();
    if (tabName === 'profile') updateProfileStats();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Load Games Dynamically with Response Parser & Timeout ---
  async function loadGames() {
    state.isLoadingGames = true;
    showGamesSkeleton();

    // 10 second timeout protection to prevent infinite skeleton freeze
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Server javob berish vaqti tugadi (Timeout 10s)")), 10000)
    );

    try {
      const res = await Promise.race([apiFetch('/games'), timeoutPromise]);
      console.log('GET /games parsed response:', res);

      // Support all potential response shapes:
      // - { ok: true, games: [...] }
      // - { ok: true, data: [...] }
      // - { data: { games: [...] } }
      // - { data: { data: [...] } }
      // - [ ... ] (direct array)
      let gamesList = [];

      if (Array.isArray(res)) {
        gamesList = res;
      } else if (res && Array.isArray(res.games)) {
        gamesList = res.games;
      } else if (res && Array.isArray(res.data)) {
        gamesList = res.data;
      } else if (res && res.data && Array.isArray(res.data.games)) {
        gamesList = res.data.games;
      } else if (res && res.data && Array.isArray(res.data.data)) {
        gamesList = res.data.data;
      }

      if (gamesList && gamesList.length > 0) {
        // STRICT REQUIREMENT: Slice response to display a maximum of 50 games
        state.games = gamesList.slice(0, 50);
        state.filteredGames = state.games;
        renderGamesGrid();
      } else {
        const errMsg = (res && (res.error || res.message)) 
          ? (res.error || res.message) 
          : "API orqali o'yinlar ro'yxati topilmadi";
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
      showGamesError(error.message || "Internet yoki server bilan aloqa uzildi");
    } finally {
      state.isLoadingGames = false;
    }
  }

  function showGamesSkeleton() {
    if (elements.gamesSkeleton) elements.gamesSkeleton.style.display = 'grid';
    if (elements.gamesGrid) elements.gamesGrid.style.display = 'none';
    if (elements.emptyState) elements.emptyState.style.display = 'none';
    if (elements.errorState) elements.errorState.style.display = 'none';
    if (elements.gamesCountBadge) elements.gamesCountBadge.textContent = '...';
  }

  function showGamesError(msg) {
    if (elements.gamesSkeleton) elements.gamesSkeleton.style.display = 'none';
    if (elements.gamesGrid) elements.gamesGrid.style.display = 'none';
    if (elements.emptyState) elements.emptyState.style.display = 'none';
    if (elements.errorState) {
      elements.errorState.style.display = 'block';
      if (elements.errorMessage) {
        elements.errorMessage.innerHTML = `
          <div style="color: #ef4444; font-weight: 700; margin-bottom: 6px;">Xatolik yuz berdi:</div>
          <div style="background: rgba(239, 68, 68, 0.08); padding: 8px 12px; border-radius: 8px; font-size: 12px; word-break: break-all; margin-bottom: 6px;">
            ${escapeHtml(msg || 'Serverga ulanib bo\'lmadi')}
          </div>
        `;
      }
    }
    if (elements.gamesCountBadge) elements.gamesCountBadge.textContent = 'Xato';
  }

  function renderGamesGrid() {
    if (elements.gamesSkeleton) elements.gamesSkeleton.style.display = 'none';
    if (elements.errorState) elements.errorState.style.display = 'none';

    if (!state.filteredGames.length) {
      if (elements.gamesGrid) elements.gamesGrid.style.display = 'none';
      if (elements.emptyState) elements.emptyState.style.display = 'block';
      if (elements.gamesCountBadge) elements.gamesCountBadge.textContent = '0 dona';
      return;
    }

    if (elements.emptyState) elements.emptyState.style.display = 'none';
    if (elements.gamesGrid) {
      elements.gamesGrid.style.display = 'grid';
      if (elements.gamesCountBadge) elements.gamesCountBadge.textContent = `${state.filteredGames.length} ta o'yin`;

      elements.gamesGrid.innerHTML = state.filteredGames.map(game => {
        const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(game.name)}&background=6366f1&color=fff&size=128`;
        const pkgCountText = game.packages_count > 0 ? `${game.packages_count} ta paket` : 'Tezkor';
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

      // Click event listener
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
  }

  // --- Filtering & Live Search ---
  function applyFilters() {
    let result = state.games;

    if (state.activeCategory === 'popular') {
      const popKeywords = ['pubg', 'free fire', 'mobile legends', 'genshin', 'ea', 'brawl', 'telegram'];
      result = result.filter(g => popKeywords.some(kw => g.name.toLowerCase().includes(kw)));
    } else if (state.activeCategory === 'mobile') {
      result = result.filter(g => !g.name.toLowerCase().includes('steam') && !g.name.toLowerCase().includes('telegram'));
    } else if (state.activeCategory === 'services') {
      result = result.filter(g => g.name.toLowerCase().includes('telegram') || g.name.toLowerCase().includes('steam'));
    }

    const q = elements.searchInput ? elements.searchInput.value.trim().toLowerCase() : '';
    if (elements.clearSearchBtn) elements.clearSearchBtn.style.display = q ? 'flex' : 'none';

    if (q) {
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }

    state.filteredGames = result;
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

    if (elements.playerIdInput) elements.playerIdInput.value = '';
    if (elements.serverIdInput) elements.serverIdInput.value = '';
    if (elements.idVerificationStatus) elements.idVerificationStatus.style.display = 'none';
    if (elements.playerFormSection) elements.playerFormSection.style.display = 'none';
    updateMainButtonState();

    if (elements.modalGameTitle) elements.modalGameTitle.textContent = game.name;
    if (elements.modalGameSub) elements.modalGameSub.textContent = game.packages_count ? `${game.packages_count} ta mavjud paket` : "Paketni tanlang";
    if (elements.modalGameImg) elements.modalGameImg.src = game.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(game.name)}&background=6366f1&color=fff`;

    if (elements.playerIdLabel) elements.playerIdLabel.textContent = game.id_label || 'Player ID';
    if (elements.playerIdInput) elements.playerIdInput.placeholder = `${game.id_label || 'Player ID'} raqamingizni kiriting`;

    if (elements.serverIdGroup) {
      elements.serverIdGroup.style.display = game.requires_server ? 'block' : 'none';
    }

    if (elements.modalOverlay) elements.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    tg?.BackButton?.show();

    await loadPackages(game.game_id);
  }

  async function loadPackages(gameId) {
    state.isLoadingPackages = true;
    if (elements.packagesSkeleton) elements.packagesSkeleton.style.display = 'grid';
    if (elements.packagesList) elements.packagesList.style.display = 'none';
    if (elements.packagesCountBadge) elements.packagesCountBadge.textContent = 'Yuklanmoqda...';

    try {
      const res = await apiFetch(`/games/${gameId}/packages`);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res && Array.isArray(res.packages)) list = res.packages;
      else if (res && Array.isArray(res.data)) list = res.data;
      else if (res && res.data && Array.isArray(res.data.packages)) list = res.data.packages;

      if (list && list.length > 0) {
        state.packages = list;
        renderPackages();
      } else {
        throw new Error(res?.error || 'Paketlar topilmadi');
      }
    } catch (err) {
      console.error('Packages error:', err);
      if (elements.packagesSkeleton) elements.packagesSkeleton.style.display = 'none';
      if (elements.packagesList) {
        elements.packagesList.style.display = 'block';
        elements.packagesList.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--hint-color); font-size: 13px;">
            Paketlar mavjud emas yoki yuklashda xatolik yuz berdi.
          </div>
        `;
      }
      if (elements.packagesCountBadge) elements.packagesCountBadge.textContent = '0 dona';
    } finally {
      state.isLoadingPackages = false;
    }
  }

  function renderPackages() {
    if (elements.packagesSkeleton) elements.packagesSkeleton.style.display = 'none';
    if (elements.packagesList) {
      elements.packagesList.style.display = 'grid';
      if (elements.packagesCountBadge) elements.packagesCountBadge.textContent = `${state.packages.length} dona`;

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
  }

  function selectPackage(pkg, cardElement) {
    state.selectedPackage = pkg;
    triggerHaptic('light');

    if (elements.packagesList) {
      elements.packagesList.querySelectorAll('.pkg-card').forEach(c => {
        c.classList.remove('selected');
        const chk = c.querySelector('.pkg-selected-check');
        if (chk) chk.remove();
      });
    }

    cardElement.classList.add('selected');
    const checkBadge = document.createElement('div');
    checkBadge.className = 'pkg-selected-check';
    checkBadge.textContent = '✓';
    cardElement.appendChild(checkBadge);

    const priceUzs = pkg.price?.amount || (pkg.price?.usd ? Math.round(pkg.price.usd * 12800) : 0);
    if (elements.summaryPkgName) elements.summaryPkgName.textContent = pkg.name;
    if (elements.summaryPkgPrice) elements.summaryPkgPrice.textContent = formatUzs(priceUzs);

    if (elements.playerFormSection) {
      elements.playerFormSection.style.display = 'block';
      elements.playerFormSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (elements.playerIdInput && !elements.playerIdInput.value.trim()) {
      elements.playerIdInput.focus();
    }

    updateMainButtonState();
  }

  // --- Player ID Validation & Nickname Verification ---
  function handlePlayerIdChange() {
    state.playerId = elements.playerIdInput ? elements.playerIdInput.value.trim() : '';
    updateMainButtonState();

    if (state.checkIdTimeout) clearTimeout(state.checkIdTimeout);

    if (state.playerId.length >= 4 && state.selectedGame) {
      if (elements.idCheckSpinner) elements.idCheckSpinner.style.display = 'block';
      state.checkIdTimeout = setTimeout(async () => {
        try {
          const body = {
            game_id: state.selectedGame.game_id,
            player_id: state.playerId
          };
          if (state.selectedGame.requires_server && elements.serverIdInput && elements.serverIdInput.value.trim()) {
            body.server_id = elements.serverIdInput.value.trim();
          }

          const res = await apiFetch('/check_id', {
            method: 'POST',
            body: body
          });

          if (elements.idCheckSpinner) elements.idCheckSpinner.style.display = 'none';

          if (res && res.ok && (res.charname || res.username || res.name)) {
            const charname = res.charname || res.username || res.name;
            state.verifiedPlayer = charname;
            if (elements.idVerificationStatus) {
              elements.idVerificationStatus.className = 'verification-badge valid';
              elements.idVerificationStatus.innerHTML = `<span>✓</span> <span>O'yinchi: <strong>${escapeHtml(charname)}</strong></span>`;
              elements.idVerificationStatus.style.display = 'inline-flex';
            }
            triggerHaptic('light');
          } else {
            if (elements.idVerificationStatus) elements.idVerificationStatus.style.display = 'none';
          }
        } catch (e) {
          if (elements.idCheckSpinner) elements.idCheckSpinner.style.display = 'none';
          if (elements.idVerificationStatus) elements.idVerificationStatus.style.display = 'none';
        }
      }, 600);
    } else {
      if (elements.idCheckSpinner) elements.idCheckSpinner.style.display = 'none';
      if (elements.idVerificationStatus) elements.idVerificationStatus.style.display = 'none';
    }
  }

  // --- MainButton / Fallback Button State ---
  function updateMainButtonState() {
    const isValid = Boolean(
      state.selectedGame && 
      state.selectedPackage && 
      elements.playerIdInput && 
      elements.playerIdInput.value.trim().length >= 3 &&
      (!state.selectedGame.requires_server || (elements.serverIdInput && elements.serverIdInput.value.trim().length >= 1))
    );

    const priceUzs = state.selectedPackage?.price?.amount || 
      (state.selectedPackage?.price?.usd ? Math.round(state.selectedPackage.price.usd * 12800) : 0);

    if (isValid) {
      const buttonText = `XARID QILISH • ${formatUzs(priceUzs)}`;

      if (tg?.MainButton) {
        tg.MainButton.setText(buttonText);
        tg.MainButton.enable();
        tg.MainButton.show();
      }

      if (elements.modalPayBtn) {
        elements.modalPayBtn.disabled = false;
        elements.modalPayBtn.textContent = buttonText;
      }
    } else {
      if (tg?.MainButton) {
        tg.MainButton.hide();
      }
      if (elements.modalPayBtn) {
        elements.modalPayBtn.disabled = true;
        elements.modalPayBtn.textContent = 'Xarid qilish';
      }
    }
  }

  // --- Purchase Logic & Storage ---
  async function handlePurchase() {
    if (!state.selectedGame || !state.selectedPackage) return;

    const playerId = elements.playerIdInput ? elements.playerIdInput.value.trim() : '';
    const serverId = elements.serverIdInput ? elements.serverIdInput.value.trim() : '';

    if (!playerId) {
      alert("Iltimos, o'yinchi ID raqamini kiriting!");
      elements.playerIdInput?.focus();
      return;
    }

    if (state.selectedGame.requires_server && !serverId) {
      alert("Iltimos, Server / Zone ID raqamini kiriting!");
      elements.serverIdInput?.focus();
      return;
    }

    triggerHaptic('medium');
    if (tg?.MainButton) {
      tg.MainButton.showProgress();
      tg.MainButton.disable();
    }
    if (elements.modalPayBtn) {
      elements.modalPayBtn.disabled = true;
      elements.modalPayBtn.textContent = 'Buyurtma berilmoqda...';
    }

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
        const orderId = res.order_id || Math.floor(100000 + Math.random() * 900000);
        const priceUzs = state.selectedPackage.price?.amount || 
          (state.selectedPackage.price?.usd ? Math.round(state.selectedPackage.price.usd * 12800) : 0);

        saveOrderToHistory({
          id: orderId,
          gameName: state.selectedGame.name,
          gameImg: state.selectedGame.image,
          pkgName: state.selectedPackage.name,
          price: priceUzs,
          playerId: playerId + (serverId ? ` (${serverId})` : ''),
          status: 'Bajarildi',
          date: new Date().toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        });

        closeModal();

        if (elements.receiptOrderId) elements.receiptOrderId.textContent = `#${orderId}`;
        if (elements.receiptGameName) elements.receiptGameName.textContent = state.selectedGame.name;
        if (elements.receiptPkgName) elements.receiptPkgName.textContent = state.selectedPackage.name;
        if (elements.receiptPlayerId) elements.receiptPlayerId.textContent = playerId + (serverId ? ` (${serverId})` : '');

        if (elements.successModal) elements.successModal.classList.add('active');
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
      if (elements.modalPayBtn) elements.modalPayBtn.disabled = false;
      updateMainButtonState();
    }
  }

  // --- Orders History (LocalStorage) ---
  function getOrderHistory() {
    try {
      return JSON.parse(localStorage.getItem('payerpin_orders') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveOrderToHistory(order) {
    const list = getOrderHistory();
    list.unshift(order);
    localStorage.setItem('payerpin_orders', JSON.stringify(list));
    updateOrdersBadge();
  }

  function updateOrdersBadge() {
    const list = getOrderHistory();
    if (elements.navOrdersBadge) {
      if (list.length > 0) {
        elements.navOrdersBadge.textContent = list.length;
        elements.navOrdersBadge.style.display = 'block';
      } else {
        elements.navOrdersBadge.style.display = 'none';
      }
    }
  }

  function renderOrdersList() {
    const list = getOrderHistory();
    if (!elements.ordersList) return;

    if (!list.length) {
      elements.ordersList.innerHTML = '';
      if (elements.emptyOrdersState) elements.emptyOrdersState.style.display = 'block';
      return;
    }

    if (elements.emptyOrdersState) elements.emptyOrdersState.style.display = 'none';
    elements.ordersList.innerHTML = list.map(item => `
      <div class="order-card">
        <div class="order-card-header">
          <div class="order-game-title">${escapeHtml(item.gameName)} • ${escapeHtml(item.pkgName)}</div>
          <span class="order-status-badge status-completed">✓ ${item.status || 'Bajarildi'}</span>
        </div>
        <div class="order-card-body">
          <div>ID: <strong>${escapeHtml(item.playerId)}</strong></div>
          <div class="order-price">${formatUzs(item.price)}</div>
        </div>
        <div style="font-size: 11px; color: var(--hint-color); display: flex; justify-content: space-between;">
          <span>Buyurtma #${item.id}</span>
          <span>${item.date}</span>
        </div>
      </div>
    `).join('');
  }

  // --- Profile Stats ---
  function updateProfileStats() {
    const list = getOrderHistory();
    if (elements.statsTotalOrders) elements.statsTotalOrders.textContent = list.length;
    const totalSpent = list.reduce((acc, cur) => acc + (Number(cur.price) || 0), 0);
    if (elements.statsTotalSpent) elements.statsTotalSpent.textContent = formatUzs(totalSpent);
  }

  // --- Close Modal ---
  function closeModal() {
    if (elements.modalOverlay) elements.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    tg?.BackButton?.hide();
    tg?.MainButton?.hide();
    state.selectedGame = null;
    state.selectedPackage = null;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Copy ID Handler ---
  function setupCopyId() {
    elements.copyIdBtn?.addEventListener('click', () => {
      const id = elements.profileUserId ? elements.profileUserId.textContent : '';
      navigator.clipboard?.writeText(id).then(() => {
        triggerHaptic('light');
        const span = elements.copyIdBtn.querySelector('span');
        if (span) span.textContent = 'Nusxalandi!';
        setTimeout(() => {
          if (span) span.textContent = 'Nusxalash';
        }, 1800);
      });
    });
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Bottom Tab Navigation (Home, Orders, Profile)
    elements.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    elements.goShopBtn?.addEventListener('click', () => {
      switchTab('home');
    });

    // Category chips
    elements.categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        elements.categoryChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeCategory = chip.getAttribute('data-category');
        triggerHaptic('light');
        applyFilters();
      });
    });

    // Search
    elements.searchInput?.addEventListener('input', applyFilters);
    elements.clearSearchBtn?.addEventListener('click', () => {
      if (elements.searchInput) elements.searchInput.value = '';
      applyFilters();
      elements.searchInput?.focus();
    });

    // Retry fetch button
    elements.retryFetchBtn?.addEventListener('click', loadGames);

    // Modal Close
    elements.modalCloseBtn?.addEventListener('click', closeModal);
    elements.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === elements.modalOverlay) closeModal();
    });

    // Form inputs
    elements.playerIdInput?.addEventListener('input', handlePlayerIdChange);
    elements.serverIdInput?.addEventListener('input', updateMainButtonState);

    // Fallback modal button
    elements.modalPayBtn?.addEventListener('click', handlePurchase);

    // Success Close
    elements.successCloseBtn?.addEventListener('click', () => {
      if (elements.successModal) elements.successModal.classList.remove('active');
      switchTab('orders');
    });

    // Terms modal
    elements.termsBtn?.addEventListener('click', () => {
      triggerHaptic('light');
      if (tg?.showAlert) {
        tg.showAlert("🛡 PayerPin xavfsizlik kafolati:\n\nBarcha buyurtmalar PlayPay rasmiy to'lov shlyuzi orqali 30 soniya ichida o'yin hisobingizga avtomatik yetkazib beriladi.");
      } else {
        alert("🛡 PayerPin xavfsizlik kafolati:\n\nBarcha buyurtmalar PlayPay rasmiy to'lov shlyuzi orqali 30 soniya ichida o'yin hisobingizga avtomatik yetkazib beriladi.");
      }
    });

    setupCopyId();
  }

  // --- Bootstrap ---
  function init() {
    initTelegram();
    setupEventListeners();
    updateOrdersBadge();
    loadGames();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
