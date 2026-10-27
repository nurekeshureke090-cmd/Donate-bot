/**
 * ==========================================================================
 * DONAT STORE - 5-TAB CONTROLLER, WALLET SYSTEM & ADMIN PANEL (app.js)
 * Wallet balance deduction, Top-up payment approval, Telegram user sync
 * ==========================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. ADMIN CONFIGURATION (ADMIN SOZLAMALARI)
  // O'zingizning Telegram ID raqamingizni quyidagi o'zgaruvchiga kiriting:
  // ==========================================================================
  const ADMIN_TELEGRAM_ID = '8467707826'; // <-- O'zgartirishingiz mumkin

  // --- Telegram WebApp Instance ---
  const tg = window.Telegram?.WebApp || null;

  // --- Identify Telegram User for Multi-Device Sync ---
  const tgUser = tg?.initDataUnsafe?.user || null;
  const currentUserId = tgUser?.id ? String(tgUser.id) : 'guest_user_8467707826';

  // Check if current user is Admin
  function checkIsAdmin() {
    const realTgId = tgUser?.id ? String(tgUser.id) : '';
    return (
      (realTgId && realTgId === String(ADMIN_TELEGRAM_ID)) ||
      String(currentUserId) === String(ADMIN_TELEGRAM_ID) ||
      String(currentUserId).includes(String(ADMIN_TELEGRAM_ID))
    );
  }

  // --- Local User Store Architecture (Ready for Backend Sync) ---
  function getUserStorageKey(userId = currentUserId) {
    return `donat_store_user_${userId}`;
  }

  function getStoredUserData() {
    try {
      const raw = localStorage.getItem(getUserStorageKey());
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    // Initial default state with 100,000 UZS demo wallet balance
    const initialData = {
      id: currentUserId,
      firstName: tgUser?.first_name || 'Foydalanuvchi',
      lastName: tgUser?.last_name || '',
      username: tgUser?.username || 'user',
      balance: 100000, // 100,000 UZS initial test balance
      orders: [],
      topups: [],
      settings: {
        darkMode: false,
        lang: 'uz',
        notifications: true
      }
    };
    saveStoredUserData(initialData);
    return initialData;
  }

  function saveStoredUserData(data) {
    try {
      localStorage.setItem(getUserStorageKey(data.id || currentUserId), JSON.stringify(data));
      syncUserDataWithBackend(data);
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  // Hook for future database/backend sync with Telegram ID
  async function syncUserDataWithBackend(userData) {
    try {
      // In the future, this posts to /api/proxy?path=/user/sync or your DB
    } catch (err) {
      console.warn('Sync failed:', err);
    }
  }

  // --- Shared Pending Top-ups Store for Admin Approval ---
  const PENDING_PAYMENTS_KEY = 'donat_store_pending_topups';

  function getPendingTopUps() {
    try {
      const raw = localStorage.getItem(PENDING_PAYMENTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    // Realistic demo requests so Admin Panel is immediately testable upon launch
    const initialDemoRequests = [
      {
        id: 'TX892104',
        userId: '59384721',
        userName: 'Azizbek Karimov',
        userHandle: '@azizbek_01',
        amount: 50000,
        method: 'UZCARD',
        date: new Date(Date.now() - 15 * 60000).toLocaleString('uz-UZ'),
        status: 'Kutilmoqda'
      },
      {
        id: 'TX619842',
        userId: '61928471',
        userName: 'Dilshod Rustamov',
        userHandle: '@dilshod_pro',
        amount: 100000,
        method: 'HUMO',
        date: new Date(Date.now() - 40 * 60000).toLocaleString('uz-UZ'),
        status: 'Kutilmoqda'
      }
    ];
    savePendingTopUps(initialDemoRequests);
    return initialDemoRequests;
  }

  function savePendingTopUps(list) {
    try {
      localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Pending top-ups save error:', e);
    }
  }

  // User State
  let currentUser = getStoredUserData();

  // --- App State ---
  const state = {
    activeTab: 'home',
    adminActiveFilter: 'pending', // 'pending' | 'all'
    games: [],             // Strictly max 50 games
    filteredGames: [],
    selectedGame: null,
    packages: [],
    selectedPackage: null,
    playerId: '',
    serverId: '',
    verifiedPlayer: null,
    activeCategory: 'all',
    selectedTopUpAmount: 50000,
    selectedPayMethod: 'uzcard',
    isLoadingGames: false,
    isLoadingPackages: false,
    checkIdTimeout: null
  };

  // --- DOM Elements ---
  const elements = {
    // Views
    viewHome: document.getElementById('viewHome'),
    viewGames: document.getElementById('viewGames'),
    viewTopUp: document.getElementById('viewTopUp'),
    viewOrders: document.getElementById('viewOrders'),
    viewProfile: document.getElementById('viewProfile'),
    bottomNav: document.getElementById('bottomNav'),
    navItems: document.querySelectorAll('.bottom-nav .nav-item'),
    navOrdersBadge: document.getElementById('navOrdersBadge'),

    // Home View
    homeUserAvatar: document.getElementById('homeUserAvatar'),
    homeUserName: document.getElementById('homeUserName'),
    homeBalanceDisplay: document.getElementById('homeBalanceDisplay'),
    homeTopUpBtn: document.getElementById('homeTopUpBtn'),
    homeHistoryBtn: document.getElementById('homeHistoryBtn'),
    homeViewAllGamesBtn: document.getElementById('homeViewAllGamesBtn'),
    homeFeaturedGrid: document.getElementById('homeFeaturedGrid'),
    homeAdminBtn: document.getElementById('homeAdminBtn'),
    homeAdminBadgeCount: document.getElementById('homeAdminBadgeCount'),

    // Games Catalog View
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

    // Top-Up View
    topUpCurrentBalance: document.getElementById('topUpCurrentBalance'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    customAmountInput: document.getElementById('customAmountInput'),
    paymentMethodCards: document.querySelectorAll('.payment-method-card'),
    topUpBtnAmountText: document.getElementById('topUpBtnAmountText'),
    executeTopUpBtn: document.getElementById('executeTopUpBtn'),

    // Orders View
    ordersList: document.getElementById('ordersList'),
    emptyOrdersState: document.getElementById('emptyOrdersState'),
    goCatalogBtn: document.getElementById('goCatalogBtn'),

    // Profile View
    profileAvatar: document.getElementById('profileAvatar'),
    profileFullName: document.getElementById('profileFullName'),
    profileUsername: document.getElementById('profileUsername'),
    profileUserId: document.getElementById('profileUserId'),
    copyIdBtn: document.getElementById('copyIdBtn'),
    statsTotalOrders: document.getElementById('statsTotalOrders'),
    statsTotalSpent: document.getElementById('statsTotalSpent'),
    adminPanelTrigger: document.getElementById('adminPanelTrigger'),
    adminPendingBadge: document.getElementById('adminPendingBadge'),
    themeToggle: document.getElementById('themeToggle'),
    langSelect: document.getElementById('langSelect'),
    notifToggle: document.getElementById('notifToggle'),
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

    // Modal Checkout Form
    playerFormSection: document.getElementById('playerFormSection'),
    playerIdLabel: document.getElementById('playerIdLabel'),
    playerIdInput: document.getElementById('playerIdInput'),
    serverIdGroup: document.getElementById('serverIdGroup'),
    serverIdInput: document.getElementById('serverIdInput'),
    idCheckSpinner: document.getElementById('idCheckSpinner'),
    idVerificationStatus: document.getElementById('idVerificationStatus'),
    summaryPkgName: document.getElementById('summaryPkgName'),
    summaryPkgPrice: document.getElementById('summaryPkgPrice'),
    summaryCurrentBalance: document.getElementById('summaryCurrentBalance'),
    walletStatusNotice: document.getElementById('walletStatusNotice'),
    modalPayBtn: document.getElementById('modalPayBtn'),

    // Success Modal
    successModal: document.getElementById('successModal'),
    receiptOrderId: document.getElementById('receiptOrderId'),
    receiptGameName: document.getElementById('receiptGameName'),
    receiptPkgName: document.getElementById('receiptPkgName'),
    receiptPlayerId: document.getElementById('receiptPlayerId'),
    receiptRemainingBalance: document.getElementById('receiptRemainingBalance'),
    successCloseBtn: document.getElementById('successCloseBtn'),

    // Admin Panel Modal
    adminModal: document.getElementById('adminModal'),
    adminModalCloseBtn: document.getElementById('adminModalCloseBtn'),
    adminPendingCountVal: document.getElementById('adminPendingCountVal'),
    adminPendingSumVal: document.getElementById('adminPendingSumVal'),
    adminFilterPendingBtn: document.getElementById('adminFilterPendingBtn'),
    adminFilterAllBtn: document.getElementById('adminFilterAllBtn'),
    adminFilterBadge: document.getElementById('adminFilterBadge'),
    adminPendingList: document.getElementById('adminPendingList'),
    adminEmptyState: document.getElementById('adminEmptyState')
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
    } catch (e) {}
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
        throw new Error("Kutilmagan server javobi: " + text.slice(0, 80));
      }
    }
  }

  // --- Refresh All Balance Displays Across Screens ---
  function updateBalanceUI() {
    const formatted = formatUzs(currentUser.balance);
    if (elements.homeBalanceDisplay) elements.homeBalanceDisplay.textContent = formatted;
    if (elements.topUpCurrentBalance) elements.topUpCurrentBalance.textContent = formatted;
    if (elements.summaryCurrentBalance) elements.summaryCurrentBalance.textContent = formatted;
  }

  // --- Telegram WebApp Initialization ---
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
      const displayName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.username || 'Foydalanuvchi';
      if (elements.homeUserName) elements.homeUserName.textContent = displayName;
      if (elements.profileFullName) elements.profileFullName.textContent = displayName;
      if (elements.profileUsername) elements.profileUsername.textContent = currentUser.username ? `@${currentUser.username}` : '@user';
      if (elements.profileUserId) elements.profileUserId.textContent = currentUser.id;

      const firstChar = (currentUser.firstName || 'U').charAt(0).toUpperCase();
      if (elements.homeUserAvatar) elements.homeUserAvatar.textContent = firstChar;
      if (elements.profileAvatar) elements.profileAvatar.textContent = firstChar;

      // Native BackButton
      tg.BackButton.onClick(() => {
        if (elements.adminModal?.classList.contains('active')) {
          closeAdminModal();
        } else {
          closeModal();
        }
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
      console.warn('Telegram setup warning:', err);
    }
  }

  // --- 5-Tab Navigation Switching ---
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

    // Toggle 5 Views
    if (elements.viewHome) elements.viewHome.classList.toggle('active', tabName === 'home');
    if (elements.viewGames) elements.viewGames.classList.toggle('active', tabName === 'games');
    if (elements.viewTopUp) elements.viewTopUp.classList.toggle('active', tabName === 'topup');
    if (elements.viewOrders) elements.viewOrders.classList.toggle('active', tabName === 'orders');
    if (elements.viewProfile) elements.viewProfile.classList.toggle('active', tabName === 'profile');

    // Page-specific updates
    updateBalanceUI();
    if (tabName === 'orders') renderOrdersList();
    if (tabName === 'profile') updateProfileStats();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Load Games (Max 50 Games strictly) ---
  async function loadGames() {
    state.isLoadingGames = true;
    showGamesSkeleton();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Server javob berish vaqti tugadi (Timeout 10s)")), 10000)
    );

    try {
      const res = await Promise.race([apiFetch('/games'), timeoutPromise]);
      let gamesList = [];

      if (Array.isArray(res)) gamesList = res;
      else if (res && Array.isArray(res.games)) gamesList = res.games;
      else if (res && Array.isArray(res.data)) gamesList = res.data;
      else if (res && res.data && Array.isArray(res.data.games)) gamesList = res.data.games;
      else if (res && res.data && Array.isArray(res.data.data)) gamesList = res.data.data;

      if (gamesList && gamesList.length > 0) {
        // Strictly max 50 games
        state.games = gamesList.slice(0, 50);
        state.filteredGames = state.games;
        renderGamesCatalog();
        renderHomeFeaturedGames();
      } else {
        throw new Error(res?.error || res?.message || "O'yinlar topilmadi");
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
          <div style="background: rgba(239, 68, 68, 0.08); padding: 8px 12px; border-radius: 8px; font-size: 12px; word-break: break-all;">
            ${escapeHtml(msg || 'Serverga ulanib bo\'lmadi')}
          </div>
        `;
      }
    }
    if (elements.gamesCountBadge) elements.gamesCountBadge.textContent = 'Xato';
  }

  // Render Home Featured Games (First 4 top titles)
  function renderHomeFeaturedGames() {
    if (!elements.homeFeaturedGrid) return;
    const featured = state.games.slice(0, 4);
    elements.homeFeaturedGrid.innerHTML = featured.map(game => createGameCardHtml(game)).join('');

    elements.homeFeaturedGrid.querySelectorAll('.game-card').forEach(card => {
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

  // Render Full Games Catalog (Max 50)
  function renderGamesCatalog() {
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

      elements.gamesGrid.innerHTML = state.filteredGames.map(game => createGameCardHtml(game)).join('');

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

  function createGameCardHtml(game) {
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
  }

  // --- Filtering & Search ---
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
    renderGamesCatalog();
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
    if (elements.summaryCurrentBalance) elements.summaryCurrentBalance.textContent = formatUzs(currentUser.balance);

    // Wallet Balance Verification (Crucial)
    checkWalletBalanceForPackage(priceUzs);

    if (elements.playerFormSection) {
      elements.playerFormSection.style.display = 'block';
      elements.playerFormSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (elements.playerIdInput && !elements.playerIdInput.value.trim()) {
      elements.playerIdInput.focus();
    }

    updateMainButtonState();
  }

  // --- Wallet Balance Check Notice ---
  function checkWalletBalanceForPackage(priceUzs) {
    if (!elements.walletStatusNotice) return;

    if (currentUser.balance >= priceUzs) {
      const remaining = currentUser.balance - priceUzs;
      elements.walletStatusNotice.className = 'wallet-status-notice sufficient';
      elements.walletStatusNotice.innerHTML = `
        <span>✓ Balans yetarli! Xariddan so'ng qoladi: <strong>${formatUzs(remaining)}</strong></span>
      `;
    } else {
      const missing = priceUzs - currentUser.balance;
      elements.walletStatusNotice.className = 'wallet-status-notice insufficient';
      elements.walletStatusNotice.innerHTML = `
        <div>⚠️ Balansda mablag' yetarli emas! Yetishmayapti: <strong>${formatUzs(missing)}</strong></div>
        <button class="btn-inline-topup" id="inlineTopUpBtn" type="button">+ Hisobni to'ldirish</button>
      `;

      document.getElementById('inlineTopUpBtn')?.addEventListener('click', () => {
        closeModal();
        switchTab('topup');
      });
    }
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
    const priceUzs = state.selectedPackage?.price?.amount || 
      (state.selectedPackage?.price?.usd ? Math.round(state.selectedPackage.price.usd * 12800) : 0);

    const hasEnoughBalance = currentUser.balance >= priceUzs;

    const isValid = Boolean(
      state.selectedGame && 
      state.selectedPackage && 
      hasEnoughBalance &&
      elements.playerIdInput && 
      elements.playerIdInput.value.trim().length >= 3 &&
      (!state.selectedGame.requires_server || (elements.serverIdInput && elements.serverIdInput.value.trim().length >= 1))
    );

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
        elements.modalPayBtn.textContent = hasEnoughBalance ? 'Xarid qilish' : 'Balans yetarli emas';
      }
    }
  }

  // --- Purchase Logic: DEDUCT FROM WALLET BALANCE ---
  async function handlePurchase() {
    if (!state.selectedGame || !state.selectedPackage) return;

    const priceUzs = state.selectedPackage.price?.amount || 
      (state.selectedPackage.price?.usd ? Math.round(state.selectedPackage.price.usd * 12800) : 0);

    // 1. Strict Balance Check
    if (currentUser.balance < priceUzs) {
      triggerHaptic('error');
      alert(`⚠️ Balansingizda yetarli mablag' mavjud emas!\n\nYetishmayotgan summa: ${formatUzs(priceUzs - currentUser.balance)}\nIltimos, hisobingizni to'ldiring.`);
      closeModal();
      switchTab('topup');
      return;
    }

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
      elements.modalPayBtn.textContent = 'Xarid amalga oshirilmoqda...';
    }

    try {
      const orderPayload = {
        game_id: state.selectedGame.game_id,
        paket_id: state.selectedPackage.paket_id,
        player_id: playerId
      };
      if (serverId) orderPayload.server_id = serverId;
      if (state.verifiedPlayer) orderPayload.charname = state.verifiedPlayer;

      // Send to proxy API
      const res = await apiFetch('/order', {
        method: 'POST',
        body: orderPayload
      });

      // 2. Deduct from User Balance
      currentUser.balance -= priceUzs;

      const orderId = res?.order_id || Math.floor(100000 + Math.random() * 900000);

      // 3. Save order to User Storage
      currentUser.orders.unshift({
        id: orderId,
        gameName: state.selectedGame.name,
        gameImg: state.selectedGame.image,
        pkgName: state.selectedPackage.name,
        price: priceUzs,
        playerId: playerId + (serverId ? ` (${serverId})` : ''),
        status: 'Bajarildi',
        date: new Date().toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      });

      saveStoredUserData(currentUser);
      updateBalanceUI();
      updateOrdersBadge();

      triggerHaptic('success');
      closeModal();

      // Show Receipt
      if (elements.receiptOrderId) elements.receiptOrderId.textContent = `#${orderId}`;
      if (elements.receiptGameName) elements.receiptGameName.textContent = state.selectedGame.name;
      if (elements.receiptPkgName) elements.receiptPkgName.textContent = state.selectedPackage.name;
      if (elements.receiptPlayerId) elements.receiptPlayerId.textContent = playerId + (serverId ? ` (${serverId})` : '');
      if (elements.receiptRemainingBalance) elements.receiptRemainingBalance.textContent = formatUzs(currentUser.balance);

      if (elements.successModal) elements.successModal.classList.add('active');
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

  // --- Top-Up Handling (To'ldirish) ---
  function setupTopUpHandlers() {
    // Preset buttons
    elements.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const amount = Number(btn.getAttribute('data-amount')) || 50000;
        state.selectedTopUpAmount = amount;
        if (elements.customAmountInput) elements.customAmountInput.value = amount;
        if (elements.topUpBtnAmountText) elements.topUpBtnAmountText.textContent = formatUzs(amount);
        triggerHaptic('light');
      });
    });

    // Custom Amount Input
    elements.customAmountInput?.addEventListener('input', (e) => {
      const val = Number(e.target.value) || 0;
      state.selectedTopUpAmount = val;
      elements.presetBtns.forEach(b => {
        if (Number(b.getAttribute('data-amount')) === val) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      if (elements.topUpBtnAmountText) elements.topUpBtnAmountText.textContent = formatUzs(val);
    });

    // Payment method selection
    elements.paymentMethodCards.forEach(card => {
      card.addEventListener('click', () => {
        elements.paymentMethodCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const input = card.querySelector('input');
        if (input) {
          input.checked = true;
          state.selectedPayMethod = input.value;
        }
        triggerHaptic('light');
      });
    });

    // Execute Top-up (Submits Request for Admin Approval)
    elements.executeTopUpBtn?.addEventListener('click', () => {
      const amount = state.selectedTopUpAmount;
      if (!amount || amount < 1000) {
        alert("Iltimos, to'ldirish miqdorini kamida 1 000 so'm qilib belgilang.");
        return;
      }

      triggerHaptic('medium');
      elements.executeTopUpBtn.disabled = true;
      elements.executeTopUpBtn.textContent = "So'rov yuborilmoqda...";

      setTimeout(() => {
        const transactionId = 'TX' + Math.floor(100000 + Math.random() * 900000);
        const newTopUpRequest = {
          id: transactionId,
          userId: currentUserId,
          userName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || `@${currentUser.username}` || 'Foydalanuvchi',
          userHandle: currentUser.username ? `@${currentUser.username}` : '',
          amount: amount,
          method: state.selectedPayMethod.toUpperCase(),
          date: new Date().toLocaleString('uz-UZ'),
          status: 'Kutilmoqda'
        };

        // 1. Add to shared pending requests list for Admin approval
        const pendingList = getPendingTopUps();
        pendingList.unshift(newTopUpRequest);
        savePendingTopUps(pendingList);

        // 2. Add to user's personal top-ups history
        if (!Array.isArray(currentUser.topups)) currentUser.topups = [];
        currentUser.topups.unshift(newTopUpRequest);
        saveStoredUserData(currentUser);

        triggerHaptic('success');
        elements.executeTopUpBtn.disabled = false;
        elements.executeTopUpBtn.innerHTML = `To'ldirish • <span id="topUpBtnAmountText">${formatUzs(amount)}</span>`;

        const alertMsg = `✅ To'lov so'rovingiz qabul qilindi!\n\nSo'rov ID: #${transactionId}\nMiqdor: ${formatUzs(amount)}\nTo'lov usuli: ${newTopUpRequest.method}\nHolati: ⏳ Kutilmoqda\n\nAdministrator to'lovni tekshirib tasdiqlaganidan so'ng mablag' balansingizga avtomatik qo'shiladi.`;
        if (tg?.showAlert) {
          tg.showAlert(alertMsg);
        } else {
          alert(alertMsg);
        }

        updateAdminUI();
        switchTab('orders');
      }, 600);
    });
  }

  // --- Orders List Rendering (Game Orders & Top-Up Requests) ---
  function renderOrdersList() {
    if (!elements.ordersList) return;

    const orders = currentUser.orders || [];
    const topups = currentUser.topups || [];

    if (!orders.length && !topups.length) {
      elements.ordersList.innerHTML = '';
      if (elements.emptyOrdersState) elements.emptyOrdersState.style.display = 'block';
      return;
    }

    if (elements.emptyOrdersState) elements.emptyOrdersState.style.display = 'none';

    let html = '';

    // Render Game Purchases
    if (orders.length > 0) {
      html += `<div class="section-subheading" style="margin-bottom: 8px;"><span>O'yin xaridlari</span></div>`;
      html += orders.map(item => `
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

    // Render Top-Up Transactions
    if (topups.length > 0) {
      html += `<div class="section-subheading" style="margin-top: 14px; margin-bottom: 8px;"><span>Balans to'ldirish so'rovlari</span></div>`;
      html += topups.map(item => {
        let statusBadge = `<span class="order-status-badge" style="background: rgba(245, 158, 11, 0.14); color: #d97706;">⏳ Kutilmoqda</span>`;
        if (item.status === 'Tasdiqlandi') {
          statusBadge = `<span class="order-status-badge status-completed">✓ Tasdiqlandi</span>`;
        } else if (item.status === 'Rad etildi') {
          statusBadge = `<span class="order-status-badge" style="background: rgba(239, 68, 68, 0.14); color: #dc2626;">✕ Rad etildi</span>`;
        }

        return `
          <div class="order-card">
            <div class="order-card-header">
              <div class="order-game-title">Balans to'ldirish • ${escapeHtml(item.method || 'UZCARD')}</div>
              ${statusBadge}
            </div>
            <div class="order-card-body">
              <div>So'rov: <strong>#${item.id}</strong></div>
              <div class="order-price" style="color: #16a34a;">+${formatUzs(item.amount)}</div>
            </div>
            <div style="font-size: 11px; color: var(--hint-color); display: flex; justify-content: space-between;">
              <span>To'lov usuli: ${item.method}</span>
              <span>${item.date}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    elements.ordersList.innerHTML = html;
  }

  function updateOrdersBadge() {
    const list = currentUser.orders || [];
    if (elements.navOrdersBadge) {
      if (list.length > 0) {
        elements.navOrdersBadge.textContent = list.length;
        elements.navOrdersBadge.style.display = 'block';
      } else {
        elements.navOrdersBadge.style.display = 'none';
      }
    }
  }

  // --- Profile Stats & Settings ---
  function updateProfileStats() {
    const list = currentUser.orders || [];
    if (elements.statsTotalOrders) elements.statsTotalOrders.textContent = list.length;
    const totalSpent = list.reduce((acc, cur) => acc + (Number(cur.price) || 0), 0);
    if (elements.statsTotalSpent) elements.statsTotalSpent.textContent = formatUzs(totalSpent);
  }

  function setupProfileSettings() {
    // Theme toggle
    if (elements.themeToggle) {
      elements.themeToggle.checked = currentUser.settings?.darkMode || false;
      elements.themeToggle.addEventListener('change', (e) => {
        currentUser.settings.darkMode = e.target.checked;
        saveStoredUserData(currentUser);
        document.body.classList.toggle('dark', e.target.checked);
        triggerHaptic('light');
      });
    }

    // Language selector
    if (elements.langSelect) {
      elements.langSelect.value = currentUser.settings?.lang || 'uz';
      elements.langSelect.addEventListener('change', (e) => {
        currentUser.settings.lang = e.target.value;
        saveStoredUserData(currentUser);
        triggerHaptic('light');
      });
    }

    // Notifications toggle
    if (elements.notifToggle) {
      elements.notifToggle.checked = currentUser.settings?.notifications !== false;
      elements.notifToggle.addEventListener('change', (e) => {
        currentUser.settings.notifications = e.target.checked;
        saveStoredUserData(currentUser);
        triggerHaptic('light');
      });
    }

    // Copy ID button
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

    // Terms modal
    elements.termsBtn?.addEventListener('click', () => {
      triggerHaptic('light');
      const termsMsg = "🛡 Kafolat va Xavfsizlik:\n\n• Barcha o'yin to'lovlari hisobingizdagi ichki balansdan yechiladi.\n• Buyurtmalar 30 soniya ichida o'yin hisobingizga avtomatik yetkazib beriladi.\n• Savollar bo'yicha: @admin";
      if (tg?.showAlert) tg.showAlert(termsMsg);
      else alert(termsMsg);
    });
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

  // ==========================================================================
  // ADMIN PANEL LOGIC & PAYMENT APPROVALS (TO'LOVLARNI TASDIQLASH)
  // ==========================================================================

  /**
   * Update Admin Panel visibility and pending payment counters
   */
  function updateAdminUI() {
    const isAdmin = checkIsAdmin();

    // Admin trigger button in Profile
    if (elements.adminPanelTrigger) {
      elements.adminPanelTrigger.style.display = isAdmin ? 'flex' : 'none';
    }

    // Admin quick badge in Header
    if (elements.homeAdminBtn) {
      elements.homeAdminBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    if (!isAdmin) return;

    // Calculate pending requests
    const allRequests = getPendingTopUps();
    const pendingRequests = allRequests.filter(r => r.status === 'Kutilmoqda');
    const pendingCount = pendingRequests.length;
    const pendingSum = pendingRequests.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

    // Update Badges
    if (elements.adminPendingBadge) {
      if (pendingCount > 0) {
        elements.adminPendingBadge.textContent = pendingCount;
        elements.adminPendingBadge.style.display = 'inline-block';
      } else {
        elements.adminPendingBadge.style.display = 'none';
      }
    }

    if (elements.homeAdminBadgeCount) {
      if (pendingCount > 0) {
        elements.homeAdminBadgeCount.textContent = pendingCount;
        elements.homeAdminBadgeCount.style.display = 'inline-block';
      } else {
        elements.homeAdminBadgeCount.style.display = 'none';
      }
    }

    // Update Modal Counters
    if (elements.adminPendingCountVal) {
      elements.adminPendingCountVal.textContent = `${pendingCount} ta`;
    }
    if (elements.adminPendingSumVal) {
      elements.adminPendingSumVal.textContent = formatUzs(pendingSum);
    }
    if (elements.adminFilterBadge) {
      elements.adminFilterBadge.textContent = pendingCount;
    }
  }

  /**
   * Render Dynamic List of Pending Top-Up Requests
   * Filter: 'pending' (faqat kutilayotgan) | 'all' (barcha tarix)
   */
  function renderAdminPendingList(filter = state.adminActiveFilter || 'pending') {
    if (!elements.adminPendingList) return;

    const allRequests = getPendingTopUps();
    const filtered = filter === 'pending'
      ? allRequests.filter(item => item.status === 'Kutilmoqda')
      : allRequests;

    if (!filtered.length) {
      elements.adminPendingList.innerHTML = '';
      if (elements.adminEmptyState) {
        elements.adminEmptyState.style.display = 'block';
        const titleEl = elements.adminEmptyState.querySelector('.state-title');
        const descEl = elements.adminEmptyState.querySelector('.state-desc');
        if (titleEl) {
          titleEl.textContent = filter === 'pending' ? "Kutilayotgan to'lovlar yo'q" : "Hozircha so'rovlar yo'q";
        }
        if (descEl) {
          descEl.textContent = filter === 'pending'
            ? "Barcha to'lov so'rovlari ko'rib chiqilgan."
            : "Hali hech qanday to'lov so'rovi amalga oshirilmagan.";
        }
      }
      return;
    }

    if (elements.adminEmptyState) elements.adminEmptyState.style.display = 'none';

    elements.adminPendingList.innerHTML = filtered.map(item => {
      const isPending = item.status === 'Kutilmoqda';
      let statusClass = 'kutilmoqda';
      let statusIcon = '⏳';
      if (item.status === 'Tasdiqlandi') {
        statusClass = 'tasdiqlandi';
        statusIcon = '✓';
      } else if (item.status === 'Rad etildi') {
        statusClass = 'rad-etildi';
        statusIcon = '✕';
      }

      return `
        <div class="admin-request-card" id="tx-card-${escapeHtml(item.id)}">
          <div class="admin-card-head">
            <div class="admin-user-info-row">
              <div class="admin-u-avatar">👤</div>
              <div class="admin-u-meta">
                <span class="admin-u-name">${escapeHtml(item.userName || 'Foydalanuvchi')}</span>
                <span class="admin-u-id-tag">Telegram ID: <code>${escapeHtml(String(item.userId))}</code></span>
              </div>
            </div>
            <span class="status-pill status-${statusClass}">
              ${statusIcon} ${escapeHtml(item.status)}
            </span>
          </div>

          <div class="admin-details-grid">
            <div class="admin-detail-item">
              <span class="detail-k">So'rov ID</span>
              <span class="detail-v">#${escapeHtml(item.id)}</span>
            </div>
            <div class="admin-detail-item">
              <span class="detail-k">To'lov miqdori</span>
              <span class="detail-v amount-highlight">+${formatUzs(item.amount)}</span>
            </div>
            <div class="admin-detail-item">
              <span class="detail-k">To'lov usuli</span>
              <span class="detail-v method-tag">💳 ${escapeHtml(item.method || 'UZCARD')}</span>
            </div>
            <div class="admin-detail-item">
              <span class="detail-k">Vaqt</span>
              <span class="detail-v">📅 ${escapeHtml(item.date)}</span>
            </div>
          </div>

          ${isPending ? `
            <div class="admin-action-row">
              <button 
                class="admin-btn btn-approve" 
                type="button" 
                onclick="approveTopUp('${escapeHtml(item.id)}', '${escapeHtml(String(item.userId))}', ${Number(item.amount)})"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Tasdiqlash</span>
              </button>
              <button 
                class="admin-btn btn-reject" 
                type="button" 
                onclick="rejectTopUp('${escapeHtml(item.id)}')"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Rad etish</span>
              </button>
            </div>
          ` : `
            <div class="admin-action-done">
              Holat: <strong>${escapeHtml(item.status)}</strong> (${item.resolvedAt || 'Ko\'rib chiqildi'})
            </div>
          `}
        </div>
      `;
    }).join('');
  }

  /**
   * APPROVAL LOGIC (Tasdiqlash)
   * Updates request status to 'Tasdiqlandi' and logically adds amount to user's balance.
   */
  function approveTopUp(transactionId, userId, amount) {
    amount = Number(amount) || 0;
    const list = getPendingTopUps();
    const tx = list.find(t => String(t.id) === String(transactionId));
    if (!tx) {
      alert("Xatolik: So'rov topilmadi!");
      return;
    }

    if (tx.status === 'Tasdiqlandi') {
      alert("Bu so'rov allaqachon tasdiqlangan!");
      return;
    }

    // 1. Update request status in admin store
    tx.status = 'Tasdiqlandi';
    tx.resolvedAt = new Date().toLocaleString('uz-UZ');
    savePendingTopUps(list);

    // 2. Logically add amount to that specific user's balance in storage
    const targetKey = getUserStorageKey(userId);
    let targetUserData = null;
    try {
      const raw = localStorage.getItem(targetKey);
      if (raw) targetUserData = JSON.parse(raw);
    } catch (e) {}

    if (!targetUserData) {
      targetUserData = {
        id: String(userId),
        firstName: tx.userName || 'Foydalanuvchi',
        balance: 0,
        orders: [],
        topups: []
      };
    }

    targetUserData.balance = (Number(targetUserData.balance) || 0) + amount;

    // Update in target user's top-up records
    if (!Array.isArray(targetUserData.topups)) targetUserData.topups = [];
    const userTx = targetUserData.topups.find(t => String(t.id) === String(transactionId));
    if (userTx) {
      userTx.status = 'Tasdiqlandi';
    } else {
      targetUserData.topups.unshift({
        id: transactionId,
        amount: amount,
        method: tx.method,
        date: tx.date,
        status: 'Tasdiqlandi'
      });
    }
    localStorage.setItem(targetKey, JSON.stringify(targetUserData));

    // 3. If currently logged in user is the approved user, sync active session
    if (String(currentUser.id) === String(userId)) {
      currentUser = targetUserData;
      updateBalanceUI();
      renderOrdersList();
    }

    triggerHaptic('success');
    const msg = `✅ To'lov muvaffaqiyatli tasdiqlandi!\n\nTranzaksiya: #${transactionId}\nFoydalanuvchi: ${userId} (${tx.userName})\nQo'shilgan summa: +${formatUzs(amount)}\nYangi balans: ${formatUzs(targetUserData.balance)}`;
    if (tg?.showAlert) {
      tg.showAlert(msg);
    } else {
      alert(msg);
    }

    updateAdminUI();
    renderAdminPendingList(state.adminActiveFilter);
  }
  // Expose globally for onclick handlers
  window.approveTopUp = approveTopUp;

  /**
   * REJECTION LOGIC (Rad etish)
   * Changes status to 'Rad etildi' without adding to the user's balance.
   */
  function rejectTopUp(transactionId) {
    const list = getPendingTopUps();
    const tx = list.find(t => String(t.id) === String(transactionId));
    if (!tx) {
      alert("Xatolik: So'rov topilmadi!");
      return;
    }

    if (tx.status === 'Rad etildi') {
      alert("Bu so'rov allaqachon rad etilgan!");
      return;
    }

    // 1. Update status to 'Rad etildi'
    tx.status = 'Rad etildi';
    tx.resolvedAt = new Date().toLocaleString('uz-UZ');
    savePendingTopUps(list);

    // 2. Update user record if exists (balance unchanged)
    const targetKey = getUserStorageKey(tx.userId);
    try {
      const raw = localStorage.getItem(targetKey);
      if (raw) {
        const targetUserData = JSON.parse(raw);
        if (Array.isArray(targetUserData.topups)) {
          const userTx = targetUserData.topups.find(t => String(t.id) === String(transactionId));
          if (userTx) userTx.status = 'Rad etildi';
          localStorage.setItem(targetKey, JSON.stringify(targetUserData));
        }
        if (String(currentUser.id) === String(tx.userId)) {
          currentUser = targetUserData;
          renderOrdersList();
        }
      }
    } catch (e) {}

    triggerHaptic('warning');
    const msg = `❌ To'lov so'rovi rad etildi!\n\nTranzaksiya: #${transactionId}\nFoydalanuvchi: ${tx.userId}\nHolati: Rad etildi (Balans o'zgartirilmadi).`;
    if (tg?.showAlert) {
      tg.showAlert(msg);
    } else {
      alert(msg);
    }

    updateAdminUI();
    renderAdminPendingList(state.adminActiveFilter);
  }
  // Expose globally for onclick handlers
  window.rejectTopUp = rejectTopUp;

  /**
   * Open Admin Panel Modal
   */
  function openAdminModal() {
    if (!checkIsAdmin()) {
      alert("Ruxsat berilmagan: Siz administrator emassiz.");
      return;
    }

    triggerHaptic('light');
    state.adminActiveFilter = 'pending';
    if (elements.adminFilterPendingBtn) elements.adminFilterPendingBtn.classList.add('active');
    if (elements.adminFilterAllBtn) elements.adminFilterAllBtn.classList.remove('active');

    updateAdminUI();
    renderAdminPendingList('pending');

    if (elements.adminModal) elements.adminModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    tg?.BackButton?.show();
  }

  /**
   * Close Admin Panel Modal
   */
  function closeAdminModal() {
    if (elements.adminModal) elements.adminModal.classList.remove('active');
    document.body.style.overflow = '';
    if (!elements.modalOverlay?.classList.contains('active')) {
      tg?.BackButton?.hide();
    }
  }

  // --- Setup Event Listeners ---
  function setupEventListeners() {
    // 5-Tab Navigation Items
    elements.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    // Home Quick Buttons
    elements.homeTopUpBtn?.addEventListener('click', () => switchTab('topup'));
    elements.homeHistoryBtn?.addEventListener('click', () => switchTab('orders'));
    elements.homeViewAllGamesBtn?.addEventListener('click', () => switchTab('games'));
    elements.goCatalogBtn?.addEventListener('click', () => switchTab('games'));

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

    // Retry button
    elements.retryFetchBtn?.addEventListener('click', loadGames);

    // Modal Close
    elements.modalCloseBtn?.addEventListener('click', closeModal);
    elements.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === elements.modalOverlay) closeModal();
    });

    // Inputs
    elements.playerIdInput?.addEventListener('input', handlePlayerIdChange);
    elements.serverIdInput?.addEventListener('input', updateMainButtonState);

    // Modal fallback button
    elements.modalPayBtn?.addEventListener('click', handlePurchase);

    // Success Close
    elements.successCloseBtn?.addEventListener('click', () => {
      if (elements.successModal) elements.successModal.classList.remove('active');
      switchTab('orders');
    });

    // Admin Panel Triggers & Modal Actions
    elements.adminPanelTrigger?.addEventListener('click', openAdminModal);
    elements.homeAdminBtn?.addEventListener('click', openAdminModal);
    elements.adminModalCloseBtn?.addEventListener('click', closeAdminModal);
    elements.adminModal?.addEventListener('click', (e) => {
      if (e.target === elements.adminModal) closeAdminModal();
    });

    // Admin Filter Segment Tabs
    elements.adminFilterPendingBtn?.addEventListener('click', () => {
      state.adminActiveFilter = 'pending';
      elements.adminFilterPendingBtn.classList.add('active');
      elements.adminFilterAllBtn?.classList.remove('active');
      renderAdminPendingList('pending');
      triggerHaptic('light');
    });

    elements.adminFilterAllBtn?.addEventListener('click', () => {
      state.adminActiveFilter = 'all';
      elements.adminFilterAllBtn.classList.add('active');
      elements.adminFilterPendingBtn?.classList.remove('active');
      renderAdminPendingList('all');
      triggerHaptic('light');
    });

    setupTopUpHandlers();
    setupProfileSettings();
  }

  // --- Bootstrap ---
  function init() {
    initTelegram();
    updateBalanceUI();
    setupEventListeners();
    updateOrdersBadge();
    updateAdminUI();
    loadGames();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
