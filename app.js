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

  // ==========================================================================
  // TRANSLATION DICTIONARY (UZ / RU)
  // ==========================================================================
  const I18N = {
    uz: {
      nav_home: "Asosiy",
      nav_games: "O'yinlar",
      nav_topup: "To'ldirish",
      nav_orders: "Buyurtmalar",
      nav_profile: "Profil",
      welcome: "Xush kelibsiz!",
      online_24_7: "24/7 Avtomat",
      wallet_balance: "Hisob balansingiz",
      topup_btn: "Balansni to'ldirish",
      history_btn: "Tarix",
      promo_badge: "Rasmiy & Xavfsiz",
      promo_title: "O'yin hisobingizga soniyada donat",
      promo_desc: "ID raqamingiz orqali to'g'ridan-to'g'ri yetkaziladi",
      popular_games: "Ommabop o'yinlar",
      quick_buy: "Tezkor xaridlar",
      view_all: "Barchasi ›",
      catalog_title: "O'yinlar Katalogi",
      catalog_sub: "Barcha o'yinlar va xizmatlar",
      cat_all: "Barchasi",
      cat_popular: "Ommabop",
      cat_mobile: "Mobil",
      cat_services: "Servislar",
      search_placeholder: "O'yin yoki servisni qidiring...",
      topup_title: "Balansni to'ldirish",
      topup_sub: "Hisobingizni hamyonbop narxlarda to'ldiring",
      current_balance: "Joriy balansingiz:",
      topup_amount_label: "To'ldirish miqdori:",
      custom_amount_placeholder: "Boshqa summa kiriting",
      pay_method_label: "To'lov usuli:",
      admin_card_badge: "Admin Kartasi",
      copy_btn: "Nusxalash",
      copied_btn: "Nusxalandi!",
      card_holder_label: "Karta egasi:",
      penny_tag: "PENNY MATCHING • TO'LOV KODI",
      copy_exact_btn: "Summani nusxalash",
      penny_exact_label: "O'tkazishingiz kerak bo'lgan aniq summa:",
      penny_tip: "💡 Ushbu qo'shimcha bir necha tiyinlar to'lovingizni bank SMS orqali adashmasdan tezkor aniqlash uchun kerak.",
      receipt_upload_title: "To'lov chekini yuklash",
      mandatory_badge: "Majburiy",
      receipt_upload_sub: "Bank ilovasidan to'lov skrinshotini biriktiring",
      dropzone_prompt: "Chek skrinshotini tanlang",
      dropzone_hint: "JPG, PNG, WebP formatlarida rasm yuklang",
      ready_tag: "✓ Chek biriktirildi",
      receipt_error_msg: "⚠️ Iltimos, davom etishdan oldin to'lov cheki (skrinshot) rasmini yuklang!",
      orders_title: "Mening buyurtmalarim",
      orders_sub: "Barcha amalga oshirilgan xaridlar tarixi",
      empty_orders_title: "Hozircha buyurtmalar yo'q",
      empty_orders_desc: "Birinchi xaridingizni amalga oshiring va u shu yerda paydo bo'ladi.",
      go_catalog: "O'yinlar katalogiga o'tish",
      profile_title: "Mening Profilim",
      profile_sub: "Shaxsiy hisob va sozlamalar",
      stat_orders: "Buyurtmalar",
      stat_spent: "Jami xarajat",
      settings_section: "Ilova Sozlamalari",
      theme_title: "Tungi rejim",
      theme_desc: "Mavzuni moslashtirish",
      lang_title: "Tilni tanlash",
      lang_desc: "Ilova interfeysi tili",
      notif_title: "Xabarnomalar",
      notif_desc: "Buyurtma holati xabarlari",
      support_section: "Qo'llab-quvvatlash va Havolalar",
      support_title: "Yordam markazi",
      video_title: "Video qo'llanma",
      video_desc: "Ilovadan foydalanish bo'yicha",
      terms_title: "Kafolat va Xavfsizlik",
      terms_desc: "FAQ va foydalanish shartlari",
      channel_title: "Rasmiy Kanal",
      channel_desc: "Yangiliklar va chegirmalar",
      buy_now_btn: "XARID QILISH",
      packages_label: "Paketlar",
      player_credentials: "Hisob ma'lumotlari",
      sufficient_balance: "✓ Balans yetarli! Xariddan so'ng qoladi: ",
      insufficient_balance: "⚠️ Balansda mablag' yetarli emas! Yetishmayapti: ",
      purchase_success: "Xarid muvaffaqiyatli!",
      purchase_success_desc: "Mablag' balansingizdan yechildi va buyurtma rasmiylashtirildi.",
      understand_btn: "Tushundim"
    },
    ru: {
      nav_home: "Главная",
      nav_games: "Игры",
      nav_topup: "Пополнить",
      nav_orders: "Заказы",
      nav_profile: "Профиль",
      welcome: "Добро пожаловать!",
      online_24_7: "24/7 Автомат",
      wallet_balance: "Баланс счета",
      topup_btn: "Пополнить баланс",
      history_btn: "История",
      promo_badge: "Официально и Безопасно",
      promo_title: "Мгновенный донат на игровой аккаунт",
      promo_desc: "Доставка напрямую по вашему ID номеру",
      popular_games: "Популярные игры",
      quick_buy: "Быстрые покупки",
      view_all: "Все игры ›",
      catalog_title: "Каталог Игр",
      catalog_sub: "Все игры и цифровые сервисы",
      cat_all: "Все",
      cat_popular: "Популярные",
      cat_mobile: "Мобильные",
      cat_services: "Сервисы",
      search_placeholder: "Поиск игры или сервиса...",
      topup_title: "Пополнение баланса",
      topup_sub: "Пополните свой счет по выгодным тарифам",
      current_balance: "Текущий баланс:",
      topup_amount_label: "Сумма пополнения:",
      custom_amount_placeholder: "Введите другую сумму",
      pay_method_label: "Способ оплаты:",
      admin_card_badge: "Карта Админа",
      copy_btn: "Копировать",
      copied_btn: "Скопировано!",
      card_holder_label: "Владелец карты:",
      penny_tag: "PENNY MATCHING • КОД ОПЛАТЫ",
      copy_exact_btn: "Копировать сумму",
      penny_exact_label: "Точная сумма к переводу:",
      penny_tip: "💡 Эти дополнительные копейки нужны для моментального распознавания вашего перевода через банковские SMS.",
      receipt_upload_title: "Загрузка чека оплаты",
      mandatory_badge: "Обязательно",
      receipt_upload_sub: "Прикрепите скриншот чека из банковского приложения",
      dropzone_prompt: "Выберите скриншот чека",
      dropzone_hint: "Изображение в формате JPG, PNG или WebP",
      ready_tag: "✓ Чек прикреплен",
      receipt_error_msg: "⚠️ Пожалуйста, прикрепите скриншот чека об оплате перед отправкой!",
      orders_title: "Мои заказы",
      orders_sub: "История всех совершенных покупок",
      empty_orders_title: "Заказов пока нет",
      empty_orders_desc: "Совершите первую покупку, и она появится здесь.",
      go_catalog: "Перейти в каталог игр",
      profile_title: "Мой Профиль",
      profile_sub: "Личный кабинет и настройки",
      stat_orders: "Заказы",
      stat_spent: "Всего потрачено",
      settings_section: "Настройки Приложения",
      theme_title: "Темная тема",
      theme_desc: "Настройка ночного режима",
      lang_title: "Выбор языка",
      lang_desc: "Язык интерфейса приложения",
      notif_title: "Уведомления",
      notif_desc: "Сообщения о статусе заказов",
      support_section: "Поддержка и Ссылки",
      support_title: "Центр поддержки",
      video_title: "Видеоинструкция",
      video_desc: "Руководство по использованию",
      terms_title: "Гарантия и Безопасность",
      terms_desc: "FAQ и условия использования",
      channel_title: "Официальный Канал",
      channel_desc: "Новости и скидки",
      buy_now_btn: "КУПИТЬ",
      packages_label: "Пакеты",
      player_credentials: "Данные аккаунта",
      sufficient_balance: "✓ Баланс достаточен! После покупки останется: ",
      insufficient_balance: "⚠️ Недостаточно средств на балансе! Не хватает: ",
      purchase_success: "Покупка успешна!",
      purchase_success_desc: "Средства списаны с вашего баланса, заказ оформлен.",
      understand_btn: "Понятно"
    }
  };

  function t(key) {
    const lang = currentUser.settings?.lang || 'uz';
    return I18N[lang]?.[key] || I18N['uz']?.[key] || key;
  }

  // --- Dynamic Theme Controller (Dark / Light) ---
  function applyTheme(isDark) {
    currentUser.settings.darkMode = Boolean(isDark);
    saveStoredUserData(currentUser);
    localStorage.setItem('donat_store_theme', isDark ? 'dark' : 'light');

    document.body.classList.toggle('dark', Boolean(isDark));
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    if (elements.themeToggle) elements.themeToggle.checked = Boolean(isDark);
  }

  // --- Dynamic Language Controller (UZ / RU) ---
  function applyLanguage(lang = 'uz') {
    if (!I18N[lang]) lang = 'uz';
    currentUser.settings.lang = lang;
    saveStoredUserData(currentUser);
    localStorage.setItem('donat_store_lang', lang);

    const dict = I18N[lang];

    // Translate all [data-i18n] nodes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Translate input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    if (elements.langSelect) elements.langSelect.value = lang;

    updatePennyMatchingUI();
    updateTopUpRequisitesUI();
    updateProfileLinksUI();
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

  // --- Shared Storage Keys for Store Management ---
  const SETTINGS_KEYS = {
    PENDING_TOPUPS: 'donat_store_pending_topups',
    PAYMENT_SETTINGS: 'donat_store_payment_settings',
    MARGIN_SETTINGS: 'donat_store_margin_settings',
    LINKS_SETTINGS: 'donat_store_links_settings',
    USERS_REGISTRY: 'donat_store_users_registry',
    MASTER_ORDERS: 'donat_store_master_orders'
  };

  // 1. Payment Cards Settings Storage
  function getPaymentSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEYS.PAYMENT_SETTINGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    const defaults = {
      uzcardNumber: '8600 1234 5678 9012',
      uzcardHolder: 'ALIJON VALIYEV',
      humoNumber: '9860 1234 5678 9012',
      humoHolder: 'ALIJON VALIYEV',
      payNote: "To'lov izohida o'z Telegram ID raqamingizni yozib qoldiring."
    };
    savePaymentSettings(defaults);
    return defaults;
  }

  function savePaymentSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEYS.PAYMENT_SETTINGS, JSON.stringify(settings));
      updateTopUpRequisitesUI();
    } catch (e) {
      console.warn('Payment settings save error:', e);
    }
  }

  // 2. Pricing & Margins Settings Storage (CRITICAL)
  function getMarginSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEYS.MARGIN_SETTINGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    const defaults = {
      enabled: true,
      type: 'percent', // 'percent' | 'fixed'
      value: 15        // 15% or fixed amount in UZS
    };
    saveMarginSettings(defaults);
    return defaults;
  }

  function saveMarginSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEYS.MARGIN_SETTINGS, JSON.stringify(settings));
      if (state.packages && state.packages.length > 0) {
        renderPackages();
      }
    } catch (e) {
      console.warn('Margin settings save error:', e);
    }
  }

  /**
   * CRITICAL: Dynamic Price Calculation with Profit Margin
   * Calculates the final price shown to users with Admin's profit margin applied
   */
  function getPackagePrice(pkg) {
    if (!pkg) return 0;
    const basePrice = pkg.price?.amount || (pkg.price?.usd ? Math.round(pkg.price.usd * 12800) : 0);
    const marginSettings = getMarginSettings();

    if (!marginSettings || !marginSettings.enabled) {
      return basePrice;
    }

    const val = Number(marginSettings.value) || 0;
    if (val <= 0) return basePrice;

    if (marginSettings.type === 'percent') {
      const markup = Math.round(basePrice * (val / 100));
      return basePrice + markup;
    } else {
      return basePrice + val;
    }
  }

  // 3. Content & Links Settings Storage
  function getLinksSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEYS.LINKS_SETTINGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    const defaults = {
      supportUrl: 'https://t.me/admin',
      supportDesc: 'Administrator: @admin',
      videoUrl: 'https://t.me/admin',
      channelUrl: 'https://t.me/admin',
      storeTitle: 'Donat Store',
      faqContent: "🛡 Kafolat va Xavfsizlik:\n\n• Barcha o'yin to'lovlari hisobingizdagi ichki balansdan yechiladi.\n• Buyurtmalar 30 soniya ichida o'yin hisobingizga avtomatik yetkazib beriladi.\n• Savollar bo'yicha: @admin"
    };
    saveLinksSettings(defaults);
    return defaults;
  }

  function saveLinksSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEYS.LINKS_SETTINGS, JSON.stringify(settings));
      updateProfileLinksUI();
    } catch (e) {
      console.warn('Links settings save error:', e);
    }
  }

  // 4. Users Registry Storage (User Management)
  function getAllUsers() {
    let list = [];
    try {
      const raw = localStorage.getItem(SETTINGS_KEYS.USERS_REGISTRY);
      if (raw) list = JSON.parse(raw);
    } catch (e) {}

    // Ensure currentUser is present and up to date
    const currentIdx = list.findIndex(u => String(u.id) === String(currentUser.id));
    const currentEntry = {
      id: currentUser.id,
      name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Foydalanuvchi',
      username: currentUser.username ? `@${currentUser.username}` : '@user',
      balance: currentUser.balance || 0,
      ordersCount: (currentUser.orders || []).length,
      registeredDate: '27.10.2026'
    };

    if (currentIdx !== -1) {
      list[currentIdx].balance = currentUser.balance;
      list[currentIdx].ordersCount = (currentUser.orders || []).length;
    } else {
      list.unshift(currentEntry);
    }

    if (list.length < 3) {
      list.push(
        {
          id: '59384721',
          name: 'Azizbek Karimov',
          username: '@azizbek_01',
          balance: 145000,
          ordersCount: 4,
          registeredDate: '25.10.2026'
        },
        {
          id: '61928471',
          name: 'Dilshod Rustamov',
          username: '@dilshod_pro',
          balance: 75000,
          ordersCount: 2,
          registeredDate: '26.10.2026'
        },
        {
          id: '72819402',
          name: 'Jamshid Aliyev',
          username: '@jamik_pubg',
          balance: 320000,
          ordersCount: 7,
          registeredDate: '24.10.2026'
        }
      );
    }

    saveAllUsers(list);
    return list;
  }

  function saveAllUsers(list) {
    try {
      localStorage.setItem(SETTINGS_KEYS.USERS_REGISTRY, JSON.stringify(list));
    } catch (e) {
      console.warn('Users registry save error:', e);
    }
  }

  // 5. Master Orders Storage (All Store Orders)
  function getAllMasterOrders() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEYS.MASTER_ORDERS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    const defaults = [
      {
        id: '849201',
        type: 'game',
        userId: '59384721',
        userName: 'Azizbek Karimov',
        title: 'Free Fire • 100+10 Olmos',
        playerId: '59384721',
        price: 15000,
        date: new Date(Date.now() - 30 * 60000).toLocaleString('uz-UZ'),
        status: 'Bajarildi'
      },
      {
        id: 'TX892104',
        type: 'topup',
        userId: '59384721',
        userName: 'Azizbek Karimov',
        title: "Balans to'ldirish (UZCARD)",
        price: 50000,
        date: new Date(Date.now() - 15 * 60000).toLocaleString('uz-UZ'),
        status: 'Kutilmoqda'
      },
      {
        id: '849188',
        type: 'game',
        userId: '72819402',
        userName: 'Jamshid Aliyev',
        title: 'PUBG Mobile • 60 UC',
        playerId: '519284910',
        price: 13500,
        date: new Date(Date.now() - 90 * 60000).toLocaleString('uz-UZ'),
        status: 'Bajarildi'
      }
    ];
    saveAllMasterOrders(defaults);
    return defaults;
  }

  function saveAllMasterOrders(list) {
    try {
      localStorage.setItem(SETTINGS_KEYS.MASTER_ORDERS, JSON.stringify(list));
    } catch (e) {
      console.warn('Master orders save error:', e);
    }
  }

  function recordMasterOrder(order) {
    const list = getAllMasterOrders();
    list.unshift(order);
    saveAllMasterOrders(list);
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

  // --- Backend MongoDB Sync for Pending Top-ups ---
  async function syncPendingTopUpsWithBackend() {
    try {
      const res = await fetch('/api/topup');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.ok && Array.isArray(json.data) && json.data.length > 0) {
        const localList = getPendingTopUps();
        const localMap = new Map(localList.map(item => [String(item.id), item]));

        for (const serverTx of json.data) {
          const id = String(serverTx.id || serverTx._id);
          if (!localMap.has(id)) {
            localList.unshift(serverTx);
            localMap.set(id, serverTx);
          } else {
            const existing = localMap.get(id);
            if (serverTx.status && existing.status !== serverTx.status) {
              existing.status = serverTx.status === 'approved' ? 'Tasdiqlandi' : serverTx.status;
            }
          }
        }
        savePendingTopUps(localList);
        if (state.activeTab === 'orders' || state.activeTab === 'profile') {
          renderOrdersList();
          renderAdminPendingList();
        }
      }
    } catch (e) {
      // Offline / background sync
    }
  }

  // User State
  let currentUser = getStoredUserData();

  // --- App State ---
  const state = {
    activeTab: 'home',
    adminActiveTab: 'approvals',
    adminActiveFilter: 'pending',
    adminMasterOrdersFilter: 'all',
    adminMarginType: 'percent',
    pennyMatchingNumber: Math.floor(Math.random() * 999) + 1,
    selectedTopUpAmount: 50000,
    exactTopUpAmount: 50000 + 125, // Will be computed dynamically
    selectedPayMethod: 'uzcard',
    uploadedReceiptBase64: null,
    activeViewingReceiptTxId: null,
    games: [],             // Strictly max 50 games
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

    // Top-Up View & Dynamic Requisites
    topUpCurrentBalance: document.getElementById('topUpCurrentBalance'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    customAmountInput: document.getElementById('customAmountInput'),
    paymentMethodCards: document.querySelectorAll('.payment-method-card'),
    topUpBtnAmountText: document.getElementById('topUpBtnAmountText'),
    executeTopUpBtn: document.getElementById('executeTopUpBtn'),
    topupRequisitesBox: document.getElementById('topupRequisitesBox'),
    reqCardTypeTitle: document.getElementById('reqCardTypeTitle'),
    reqCardIcon: document.getElementById('reqCardIcon'),
    reqCardNumberDisplay: document.getElementById('reqCardNumberDisplay'),
    btnCopyCard: document.getElementById('btnCopyCard'),
    btnCopyCardText: document.getElementById('btnCopyCardText'),
    reqCardHolderDisplay: document.getElementById('reqCardHolderDisplay'),
    reqInstructionsDisplay: document.getElementById('reqInstructionsDisplay'),

    // Penny Matching Top-Up Elements
    pennyMatchingAlert: document.getElementById('pennyMatchingAlert'),
    pennyExactAmountDisplay: document.getElementById('pennyExactAmountDisplay'),
    pennyExactAmountHighlight: document.getElementById('pennyExactAmountHighlight'),
    pennyWarningMessage: document.getElementById('pennyWarningMessage'),
    btnCopyExactAmount: document.getElementById('btnCopyExactAmount'),
    btnCopyExactText: document.getElementById('btnCopyExactText'),

    // Mandatory Receipt Upload Elements
    receiptUploadBox: document.getElementById('receiptUploadBox'),
    receiptDropzone: document.getElementById('receiptDropzone'),
    receiptFileInput: document.getElementById('receiptFileInput'),
    dropzoneEmpty: document.getElementById('dropzoneEmpty'),
    dropzonePreview: document.getElementById('dropzonePreview'),
    receiptPreviewImg: document.getElementById('receiptPreviewImg'),
    receiptFileName: document.getElementById('receiptFileName'),
    receiptFileSize: document.getElementById('receiptFileSize'),
    btnRemoveReceipt: document.getElementById('btnRemoveReceipt'),
    receiptErrorNotice: document.getElementById('receiptErrorNotice'),

    // Orders View
    ordersList: document.getElementById('ordersList'),
    emptyOrdersState: document.getElementById('emptyOrdersState'),
    goCatalogBtn: document.getElementById('goCatalogBtn'),

    // Profile View & Configurable Links
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
    profileSupportLink: document.getElementById('profileSupportLink'),
    profileSupportDesc: document.getElementById('profileSupportDesc'),
    profileVideoLink: document.getElementById('profileVideoLink'),
    profileChannelLink: document.getElementById('profileChannelLink'),

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

    // Comprehensive Admin Dashboard (6-in-1)
    adminModal: document.getElementById('adminModal'),
    adminModalCloseBtn: document.getElementById('adminModalCloseBtn'),
    adminDashTabs: document.querySelectorAll('.admin-dash-tab'),
    adminDashViews: document.querySelectorAll('.admin-dash-view'),
    adminNavApprovalsBadge: document.getElementById('adminNavApprovalsBadge'),

    // Section 1: Approvals
    adminPendingCountVal: document.getElementById('adminPendingCountVal'),
    adminPendingSumVal: document.getElementById('adminPendingSumVal'),
    adminFilterPendingBtn: document.getElementById('adminFilterPendingBtn'),
    adminFilterAllBtn: document.getElementById('adminFilterAllBtn'),
    adminFilterBadge: document.getElementById('adminFilterBadge'),
    adminPendingList: document.getElementById('adminPendingList'),
    adminEmptyState: document.getElementById('adminEmptyState'),

    // Admin Receipt Viewer Modal (Chekni ko'rish)
    receiptModal: document.getElementById('receiptModal'),
    receiptModalCloseBtn: document.getElementById('receiptModalCloseBtn'),
    receiptModalTxId: document.getElementById('receiptModalTxId'),
    receiptModalUserName: document.getElementById('receiptModalUserName'),
    receiptModalExactAmount: document.getElementById('receiptModalExactAmount'),
    receiptModalPayMethod: document.getElementById('receiptModalPayMethod'),
    receiptModalImg: document.getElementById('receiptModalImg'),
    receiptModalApproveBtn: document.getElementById('receiptModalApproveBtn'),
    receiptModalRejectBtn: document.getElementById('receiptModalRejectBtn'),

    // Section 2: Cards Settings
    settingUzcardNumber: document.getElementById('settingUzcardNumber'),
    settingUzcardHolder: document.getElementById('settingUzcardHolder'),
    settingHumoNumber: document.getElementById('settingHumoNumber'),
    settingHumoHolder: document.getElementById('settingHumoHolder'),
    settingPayNote: document.getElementById('settingPayNote'),
    btnSaveCardSettings: document.getElementById('btnSaveCardSettings'),

    // Section 3: Margins Settings
    settingMarginEnabled: document.getElementById('settingMarginEnabled'),
    btnMarginTypePercent: document.getElementById('btnMarginTypePercent'),
    btnMarginTypeFixed: document.getElementById('btnMarginTypeFixed'),
    settingMarginValueLabel: document.getElementById('settingMarginValueLabel'),
    settingMarginValue: document.getElementById('settingMarginValue'),
    settingMarginSuffix: document.getElementById('settingMarginSuffix'),
    prevMarginAddition: document.getElementById('prevMarginAddition'),
    prevClientPrice: document.getElementById('prevClientPrice'),
    prevNetProfit: document.getElementById('prevNetProfit'),
    btnSaveMarginSettings: document.getElementById('btnSaveMarginSettings'),

    // Section 4: Links Settings
    settingSupportUrl: document.getElementById('settingSupportUrl'),
    settingSupportDesc: document.getElementById('settingSupportDesc'),
    settingVideoUrl: document.getElementById('settingVideoUrl'),
    settingChannelUrl: document.getElementById('settingChannelUrl'),
    settingStoreTitle: document.getElementById('settingStoreTitle'),
    settingFaqContent: document.getElementById('settingFaqContent'),
    btnSaveLinksSettings: document.getElementById('btnSaveLinksSettings'),

    // Section 5: Users Management
    adminUsersCountBadge: document.getElementById('adminUsersCountBadge'),
    adminUserSearchInput: document.getElementById('adminUserSearchInput'),
    adminUsersList: document.getElementById('adminUsersList'),
    adminBalanceModal: document.getElementById('adminBalanceModal'),
    adminBalanceCloseBtn: document.getElementById('adminBalanceCloseBtn'),
    adjustUserAvatar: document.getElementById('adjustUserAvatar'),
    adjustUserName: document.getElementById('adjustUserName'),
    adjustUserId: document.getElementById('adjustUserId'),
    adjustCurrentBalance: document.getElementById('adjustCurrentBalance'),
    btnTypeAdd: document.getElementById('btnTypeAdd'),
    btnTypeDeduct: document.getElementById('btnTypeDeduct'),
    adjustAmountInput: document.getElementById('adjustAmountInput'),
    adjustReasonInput: document.getElementById('adjustReasonInput'),
    btnConfirmBalanceAdjust: document.getElementById('btnConfirmBalanceAdjust'),

    // Section 6: Master Orders Log
    adminOrdersCountBadge: document.getElementById('adminOrdersCountBadge'),
    adminOrderSearchInput: document.getElementById('adminOrderSearchInput'),
    btnFilterOrdersAll: document.getElementById('btnFilterOrdersAll'),
    btnFilterOrdersGames: document.getElementById('btnFilterOrdersGames'),
    btnFilterOrdersTopups: document.getElementById('btnFilterOrdersTopups'),
    adminAllOrdersList: document.getElementById('adminAllOrdersList'),
    adminEmptyOrdersState: document.getElementById('adminEmptyOrdersState')
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
        if (elements.adminBalanceModal?.classList.contains('active')) {
          closeBalanceModal();
        } else if (elements.adminModal?.classList.contains('active')) {
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
    if (tabName === 'orders') {
      renderOrdersList();
      syncPendingTopUpsWithBackend();
    }
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
        const priceUzs = getPackagePrice(pkg);
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

    const priceUzs = getPackagePrice(pkg);
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
    const priceUzs = state.selectedPackage ? getPackagePrice(state.selectedPackage) : 0;

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

    const priceUzs = getPackagePrice(state.selectedPackage);

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
      const orderRecord = {
        id: orderId,
        gameName: state.selectedGame.name,
        gameImg: state.selectedGame.image,
        pkgName: state.selectedPackage.name,
        price: priceUzs,
        playerId: playerId + (serverId ? ` (${serverId})` : ''),
        status: 'Bajarildi',
        date: new Date().toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      currentUser.orders.unshift(orderRecord);

      // Record in Admin Master Log
      recordMasterOrder({
        id: orderId,
        type: 'game',
        userId: currentUserId,
        userName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Foydalanuvchi',
        title: `${state.selectedGame.name} • ${state.selectedPackage.name}`,
        playerId: playerId + (serverId ? ` (${serverId})` : ''),
        price: priceUzs,
        date: orderRecord.date,
        status: 'Bajarildi'
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

  // --- Penny Matching Logic ---
  function updatePennyMatchingUI() {
    const lang = currentUser.settings?.lang || 'uz';
    const exact = state.exactTopUpAmount || (state.selectedTopUpAmount + state.pennyMatchingNumber);

    if (elements.pennyExactAmountDisplay) {
      elements.pennyExactAmountDisplay.textContent = formatUzs(exact);
    }
    if (elements.pennyExactAmountHighlight) {
      elements.pennyExactAmountHighlight.textContent = `${exact.toLocaleString('uz-UZ')} UZS`;
    }
    if (elements.topUpBtnAmountText) {
      elements.topUpBtnAmountText.textContent = formatUzs(exact);
    }

    if (elements.pennyWarningMessage) {
      if (lang === 'ru') {
        elements.pennyWarningMessage.innerHTML = `<strong>ВНИМАНИЕ!</strong> Для подтверждения платежа вы <u>ОБЯЗАНЫ</u> перевести на карту ровно <span id="pennyExactAmountHighlight">${exact.toLocaleString('uz-UZ')} UZS</span>! Иначе деньги не поступят на баланс.`;
      } else {
        elements.pennyWarningMessage.innerHTML = `<strong>DIQQAT!</strong> To'lovingiz tasdiqlanishi uchun kartaga roppa-rosa <span id="pennyExactAmountHighlight">${exact.toLocaleString('uz-UZ')} UZS</span> o'tkazishingiz <u>SHART!</u> Aks holda pulingiz balansga tushmaydi.`;
      }
    }
  }

  function setTopUpBaseAmount(amount) {
    state.selectedTopUpAmount = amount;
    state.pennyMatchingNumber = Math.floor(Math.random() * 999) + 1;
    state.exactTopUpAmount = amount + state.pennyMatchingNumber;
    updatePennyMatchingUI();
  }

  // --- Receipt Image Processing (Compress to safe Base64) ---
  function handleReceiptFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert("Iltimos, faqat rasm faylini tanlang (JPG, PNG, WebP)!");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const rawDataUrl = e.target.result;
      
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Safe compressed JPEG (~80-120KB for localStorage compatibility)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        state.uploadedReceiptBase64 = compressedBase64;

        if (elements.receiptPreviewImg) elements.receiptPreviewImg.src = compressedBase64;
        if (elements.receiptFileName) elements.receiptFileName.textContent = file.name;
        if (elements.receiptFileSize) {
          const kb = Math.round((compressedBase64.length * 0.75) / 1024);
          elements.receiptFileSize.textContent = `${kb} KB`;
        }

        if (elements.dropzoneEmpty) elements.dropzoneEmpty.style.display = 'none';
        if (elements.dropzonePreview) elements.dropzonePreview.style.display = 'flex';
        if (elements.receiptErrorNotice) elements.receiptErrorNotice.style.display = 'none';

        triggerHaptic('success');
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  }

  function clearReceiptUpload() {
    state.uploadedReceiptBase64 = null;
    if (elements.receiptFileInput) elements.receiptFileInput.value = '';
    if (elements.receiptPreviewImg) elements.receiptPreviewImg.src = '';
    if (elements.dropzonePreview) elements.dropzonePreview.style.display = 'none';
    if (elements.dropzoneEmpty) elements.dropzoneEmpty.style.display = 'flex';
  }

  // --- Top-Up Handling (To'ldirish) ---
  function setupTopUpHandlers() {
    // Preset buttons
    elements.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const amount = Number(btn.getAttribute('data-amount')) || 50000;
        if (elements.customAmountInput) elements.customAmountInput.value = amount;
        setTopUpBaseAmount(amount);
        triggerHaptic('light');
      });
    });

    // Custom Amount Input
    elements.customAmountInput?.addEventListener('input', (e) => {
      const val = Number(e.target.value) || 0;
      elements.presetBtns.forEach(b => {
        if (Number(b.getAttribute('data-amount')) === val) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      setTopUpBaseAmount(val);
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
          updateTopUpRequisitesUI();
        }
        triggerHaptic('light');
      });
    });

    // Copy Card Number Button
    elements.btnCopyCard?.addEventListener('click', () => {
      const cardNumber = elements.reqCardNumberDisplay ? elements.reqCardNumberDisplay.textContent.replace(/\s+/g, '') : '';
      if (!cardNumber) return;

      navigator.clipboard?.writeText(cardNumber).then(() => {
        triggerHaptic('success');
        if (elements.btnCopyCardText) elements.btnCopyCardText.textContent = t('copied_btn') || 'Nusxalandi!';
        setTimeout(() => {
          if (elements.btnCopyCardText) elements.btnCopyCardText.textContent = t('copy_btn') || 'Nusxalash';
        }, 1800);
      });
    });

    // Copy Exact Amount Button (Penny Matching)
    elements.btnCopyExactAmount?.addEventListener('click', () => {
      const exact = state.exactTopUpAmount;
      if (!exact) return;

      navigator.clipboard?.writeText(String(exact)).then(() => {
        triggerHaptic('success');
        if (elements.btnCopyExactText) elements.btnCopyExactText.textContent = t('copied_btn') || 'Nusxalandi!';
        setTimeout(() => {
          if (elements.btnCopyExactText) elements.btnCopyExactText.textContent = t('copy_exact_btn') || 'Summani nusxalash';
        }, 1800);
      });
    });

    // Receipt File Upload Events
    elements.receiptFileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleReceiptFileSelect(e.target.files[0]);
      }
    });

    elements.btnRemoveReceipt?.addEventListener('click', (e) => {
      e.stopPropagation();
      clearReceiptUpload();
      triggerHaptic('light');
    });

    // Execute Top-up (Submits Request with Exact Penny Matching & Receipt)
    // Execute Top-up (Submits Request with Exact Penny Matching & Receipt to MongoDB /api/topup)
    elements.executeTopUpBtn?.addEventListener('click', async () => {
      const amount = state.selectedTopUpAmount;
      if (!amount || amount < 1000) {
        alert("Iltimos, to'ldirish miqdorini kamida 1 000 so'm qilib belgilang.");
        return;
      }

      // Mandatory Receipt Verification
      if (!state.uploadedReceiptBase64) {
        triggerHaptic('error');
        if (elements.receiptErrorNotice) elements.receiptErrorNotice.style.display = 'block';
        elements.receiptUploadBox?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        alert(t('receipt_error_msg'));
        return;
      }

      triggerHaptic('medium');
      elements.executeTopUpBtn.disabled = true;
      elements.executeTopUpBtn.textContent = "So'rov yuborilmoqda...";

      const exactAmount = parseInt(state.exactTopUpAmount, 10);
      const baseAmount = parseInt(amount, 10);
      const transactionId = 'TX' + Math.floor(100000 + Math.random() * 900000);

      const newTopUpRequest = {
        id: transactionId,
        userId: String(currentUserId),
        telegram_id: isNaN(Number(currentUserId)) ? String(currentUserId) : Number(currentUserId),
        userName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || `@${currentUser.username}` || 'Foydalanuvchi',
        userHandle: currentUser.username ? `@${currentUser.username}` : '',
        baseAmount: baseAmount,
        exactAmount: exactAmount, // Qat'iy butun son (integer Number)
        pennies: state.pennyMatchingNumber || (exactAmount - baseAmount),
        amount: baseAmount, // Credited amount upon admin approval
        method: state.selectedPayMethod.toUpperCase(),
        receiptImage: state.uploadedReceiptBase64,
        date: new Date().toLocaleString('uz-UZ'),
        status: 'pending'
      };

      try {
        // Haqiqiy Vercel Serverless /api/topup endpointiga POST so'rovi (MongoDB'ga yozish)
        const response = await fetch('/api/topup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newTopUpRequest)
        });

        const resData = await response.json();
        if (response.ok && resData.ok) {
          console.log('[Frontend] To\'lov so\'rovi MongoDB\'ga yozildi:', resData);
          if (resData.transactionId) {
            newTopUpRequest.id = resData.transactionId;
          }
        } else {
          console.warn('[Frontend] /api/topup server ogohlantirishi:', resData);
        }
      } catch (err) {
        console.error('[Frontend] /api/topup fetch xatosi:', err);
      }

      // 1. Add to shared pending requests list for Admin approval
      const pendingList = getPendingTopUps();
      pendingList.unshift(newTopUpRequest);
      savePendingTopUps(pendingList);

      // 2. Add to user's personal top-ups history
      if (!Array.isArray(currentUser.topups)) currentUser.topups = [];
      currentUser.topups.unshift(newTopUpRequest);
      saveStoredUserData(currentUser);

      // 3. Record in Admin Master Log
      recordMasterOrder({
        id: newTopUpRequest.id,
        type: 'topup',
        userId: currentUserId,
        userName: newTopUpRequest.userName,
        title: `Balans to'ldirish (${newTopUpRequest.method}) • Aniq: ${formatUzs(exactAmount)}`,
        price: exactAmount,
        date: newTopUpRequest.date,
        status: 'Kutilmoqda',
        receiptImage: state.uploadedReceiptBase64
      });

      triggerHaptic('success');
      elements.executeTopUpBtn.disabled = false;
      elements.executeTopUpBtn.innerHTML = `To'ldirish • <span id="topUpBtnAmountText">${formatUzs(exactAmount)}</span>`;

      // Clear uploaded receipt and re-roll penny matching for next request
      clearReceiptUpload();
      setTopUpBaseAmount(amount);

      const alertMsg = `✅ To'lov so'rovingiz qabul qilindi!\n\nSo'rov ID: #${newTopUpRequest.id}\nO'tkazilgan aniq summa: ${formatUzs(exactAmount)}\nTo'lov cheki: Muvaffaqiyatli biriktirildi ✓\nHolati: ⏳ Kutilmoqda\n\nAdministrator yoki Bank SMS orqali avtomatik tasdiqlangach, ${formatUzs(baseAmount)} balansingizga qo'shiladi.`;
      if (tg?.showAlert) {
        tg.showAlert(alertMsg);
      } else {
        alert(alertMsg);
      }

      updateAdminUI();
      switchTab('orders');
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
        applyTheme(e.target.checked);
        triggerHaptic('light');
      });
    }

    // Language selector
    if (elements.langSelect) {
      elements.langSelect.value = currentUser.settings?.lang || 'uz';
      elements.langSelect.addEventListener('change', (e) => {
        applyLanguage(e.target.value);
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
  // COMPREHENSIVE ADMIN DASHBOARD & STORE MANAGEMENT (6-IN-1)
  // ==========================================================================

  let selectedAdjustUserId = null;
  let balanceAdjustAction = 'add'; // 'add' | 'deduct'

  /**
   * Update Admin UI, Visibility and Badges
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

    // Sync public store configs to User UI
    updateTopUpRequisitesUI();
    updateProfileLinksUI();

    if (!isAdmin) return;

    // Calculate pending requests
    const allRequests = getPendingTopUps();
    const pendingRequests = allRequests.filter(r => r.status === 'Kutilmoqda');
    const pendingCount = pendingRequests.length;
    const pendingSum = pendingRequests.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

    // Update Profile badge
    if (elements.adminPendingBadge) {
      if (pendingCount > 0) {
        elements.adminPendingBadge.textContent = pendingCount;
        elements.adminPendingBadge.style.display = 'inline-block';
      } else {
        elements.adminPendingBadge.style.display = 'none';
      }
    }

    // Update Header mini badge
    if (elements.homeAdminBadgeCount) {
      if (pendingCount > 0) {
        elements.homeAdminBadgeCount.textContent = pendingCount;
        elements.homeAdminBadgeCount.style.display = 'inline-block';
      } else {
        elements.homeAdminBadgeCount.style.display = 'none';
      }
    }

    // Update Dashboard Nav Approvals Badge
    if (elements.adminNavApprovalsBadge) {
      if (pendingCount > 0) {
        elements.adminNavApprovalsBadge.textContent = pendingCount;
        elements.adminNavApprovalsBadge.style.display = 'inline-block';
      } else {
        elements.adminNavApprovalsBadge.style.display = 'none';
      }
    }

    // Update Modal Counters
    if (elements.adminPendingCountVal) elements.adminPendingCountVal.textContent = `${pendingCount} ta`;
    if (elements.adminPendingSumVal) elements.adminPendingSumVal.textContent = formatUzs(pendingSum);
    if (elements.adminFilterBadge) elements.adminFilterBadge.textContent = pendingCount;
  }

  /**
   * Switch between the 6 Admin Dashboard Tabs
   */
  function switchAdminTab(targetTab) {
    state.adminActiveTab = targetTab;

    elements.adminDashTabs.forEach(btn => {
      if (btn.getAttribute('data-dash-tab') === targetTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    elements.adminDashViews.forEach(view => {
      view.classList.remove('active');
    });

    const targetViewId = `adminView${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`;
    const targetView = document.getElementById(targetViewId);
    if (targetView) targetView.classList.add('active');

    triggerHaptic('light');

    // Tab-specific loaders
    if (targetTab === 'approvals') {
      renderAdminPendingList(state.adminActiveFilter);
    } else if (targetTab === 'cards') {
      loadCardSettingsIntoForm();
    } else if (targetTab === 'margins') {
      loadMarginSettingsIntoForm();
    } else if (targetTab === 'links') {
      loadLinksSettingsIntoForm();
    } else if (targetTab === 'users') {
      renderAdminUsers();
    } else if (targetTab === 'orders') {
      renderAdminAllOrders(state.adminMasterOrdersFilter);
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 1: PAYMENT APPROVALS (TO'LOVLARNI TASDIQLASH)
  // --------------------------------------------------------------------------

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
            <div class="admin-detail-item admin-detail-exact">
              <span class="detail-k">SMS Aniq Summa:</span>
              <span class="detail-v exact-amount-pill">🎯 ${formatUzs(item.exactAmount || item.amount)}</span>
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

          ${item.receiptImage ? `
            <div class="admin-receipt-action-row" style="margin-top: 10px; margin-bottom: 6px;">
              <button 
                class="admin-btn btn-view-receipt" 
                type="button" 
                onclick="viewReceiptModal('${escapeHtml(item.id)}')"
                style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 14px; background: rgba(99, 102, 241, 0.12); color: var(--accent-color); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 10px; font-weight: 600; cursor: pointer;"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>Chekni ko'rish (Skrinshot)</span>
              </button>
            </div>
          ` : `
            <div style="font-size: 11px; color: var(--hint-color); margin-top: 6px; font-style: italic;">
              To'lov cheki biriktirilmagan
            </div>
          `}

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

    // 1. Update request status in pending list
    tx.status = 'Tasdiqlandi';
    tx.resolvedAt = new Date().toLocaleString('uz-UZ');
    savePendingTopUps(list);

    // 2. Add amount to user storage
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

    // Update in users registry
    const allUsers = getAllUsers();
    const uReg = allUsers.find(u => String(u.id) === String(userId));
    if (uReg) uReg.balance = targetUserData.balance;
    saveAllUsers(allUsers);

    // Update in Master Orders Log
    const masterOrders = getAllMasterOrders();
    const mOrd = masterOrders.find(o => String(o.id) === String(transactionId));
    if (mOrd) mOrd.status = 'Tasdiqlandi';
    saveAllMasterOrders(masterOrders);

    // If currently logged in user is approved, sync session
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
  window.approveTopUp = approveTopUp;

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

    tx.status = 'Rad etildi';
    tx.resolvedAt = new Date().toLocaleString('uz-UZ');
    savePendingTopUps(list);

    // Update user record if exists
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

    // Update in Master Orders Log
    const masterOrders = getAllMasterOrders();
    const mOrd = masterOrders.find(o => String(o.id) === String(transactionId));
    if (mOrd) mOrd.status = 'Rad etildi';
    saveAllMasterOrders(masterOrders);

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
  window.rejectTopUp = rejectTopUp;

  // --------------------------------------------------------------------------
  // RECEIPT VIEWER MODAL CONTROLLER
  // --------------------------------------------------------------------------
  let activeReceiptTxId = null;

  function viewReceiptModal(transactionId) {
    const list = getPendingTopUps();
    const tx = list.find(t => String(t.id) === String(transactionId));
    if (!tx) {
      alert("Xatolik: So'rov topilmadi!");
      return;
    }

    activeReceiptTxId = tx.id;

    if (elements.receiptModalTxId) elements.receiptModalTxId.textContent = `#${tx.id}`;
    if (elements.receiptModalUserName) elements.receiptModalUserName.textContent = `${tx.userName || 'Foydalanuvchi'} (ID: ${tx.userId})`;
    if (elements.receiptModalExactAmount) elements.receiptModalExactAmount.textContent = formatUzs(tx.exactAmount || tx.amount);
    if (elements.receiptModalPayMethod) elements.receiptModalPayMethod.textContent = tx.method || 'UZCARD';

    if (elements.receiptModalImg) {
      if (tx.receiptImage) {
        elements.receiptModalImg.src = tx.receiptImage;
        elements.receiptModalImg.style.display = 'block';
      } else {
        elements.receiptModalImg.src = '';
        elements.receiptModalImg.style.display = 'none';
      }
    }

    const footer = document.getElementById('receiptViewerFooter');
    if (footer) {
      if (tx.status === 'Kutilmoqda') {
        footer.style.display = 'flex';
      } else {
        footer.style.display = 'none';
      }
    }

    if (elements.receiptModal) {
      elements.receiptModal.classList.add('active');
    }
    triggerHaptic('light');
  }
  window.viewReceiptModal = viewReceiptModal;

  function closeReceiptModal() {
    if (elements.receiptModal) {
      elements.receiptModal.classList.remove('active');
    }
    activeReceiptTxId = null;
  }
  window.closeReceiptModal = closeReceiptModal;

  // --------------------------------------------------------------------------
  // SECTION 2: PAYMENT CARDS SETTINGS (KARTA SOZLAMALARI)
  // --------------------------------------------------------------------------

  function loadCardSettingsIntoForm() {
    const settings = getPaymentSettings();
    if (elements.settingUzcardNumber) elements.settingUzcardNumber.value = settings.uzcardNumber || '';
    if (elements.settingUzcardHolder) elements.settingUzcardHolder.value = settings.uzcardHolder || '';
    if (elements.settingHumoNumber) elements.settingHumoNumber.value = settings.humoNumber || '';
    if (elements.settingHumoHolder) elements.settingHumoHolder.value = settings.humoHolder || '';
    if (elements.settingPayNote) elements.settingPayNote.value = settings.payNote || '';
  }

  function handleSaveCardSettings() {
    const newSettings = {
      uzcardNumber: elements.settingUzcardNumber ? elements.settingUzcardNumber.value.trim() : '8600 1234 5678 9012',
      uzcardHolder: elements.settingUzcardHolder ? elements.settingUzcardHolder.value.trim().toUpperCase() : 'ADMINISTRATOR',
      humoNumber: elements.settingHumoNumber ? elements.settingHumoNumber.value.trim() : '9860 1234 5678 9012',
      humoHolder: elements.settingHumoHolder ? elements.settingHumoHolder.value.trim().toUpperCase() : 'ADMINISTRATOR',
      payNote: elements.settingPayNote ? elements.settingPayNote.value.trim() : "To'lov izohida o'z Telegram ID raqamingizni yozib qoldiring."
    };

    savePaymentSettings(newSettings);
    triggerHaptic('success');

    const msg = "✅ Karta sozlamalari muvaffaqiyatli saqlandi!\n\nFoydalanuvchilar endi ushbu yangi karta raqamlarini ko'radilar.";
    if (tg?.showAlert) tg.showAlert(msg);
    else alert(msg);
  }

  function updateTopUpRequisitesUI() {
    const settings = getPaymentSettings();
    const method = state.selectedPayMethod || 'uzcard';

    if (!elements.topupRequisitesBox) return;

    if (method === 'uzcard') {
      if (elements.reqCardTypeTitle) elements.reqCardTypeTitle.textContent = "UZCARD orqali to'lov";
      if (elements.reqCardIcon) elements.reqCardIcon.textContent = '💳';
      if (elements.reqCardNumberDisplay) elements.reqCardNumberDisplay.textContent = settings.uzcardNumber || '8600 1234 5678 9012';
      if (elements.reqCardHolderDisplay) elements.reqCardHolderDisplay.textContent = settings.uzcardHolder || 'ADMINISTRATOR';
    } else if (method === 'humo') {
      if (elements.reqCardTypeTitle) elements.reqCardTypeTitle.textContent = "HUMO orqali to'lov";
      if (elements.reqCardIcon) elements.reqCardIcon.textContent = '💳';
      if (elements.reqCardNumberDisplay) elements.reqCardNumberDisplay.textContent = settings.humoNumber || '9860 1234 5678 9012';
      if (elements.reqCardHolderDisplay) elements.reqCardHolderDisplay.textContent = settings.humoHolder || 'ADMINISTRATOR';
    } else if (method === 'click') {
      if (elements.reqCardTypeTitle) elements.reqCardTypeTitle.textContent = "Click orqali to'lov";
      if (elements.reqCardIcon) elements.reqCardIcon.textContent = '📲';
      if (elements.reqCardNumberDisplay) elements.reqCardNumberDisplay.textContent = settings.uzcardNumber || settings.humoNumber;
      if (elements.reqCardHolderDisplay) elements.reqCardHolderDisplay.textContent = settings.uzcardHolder || 'ADMINISTRATOR';
    } else {
      if (elements.reqCardTypeTitle) elements.reqCardTypeTitle.textContent = "Payme orqali to'lov";
      if (elements.reqCardIcon) elements.reqCardIcon.textContent = '📱';
      if (elements.reqCardNumberDisplay) elements.reqCardNumberDisplay.textContent = settings.uzcardNumber || settings.humoNumber;
      if (elements.reqCardHolderDisplay) elements.reqCardHolderDisplay.textContent = settings.uzcardHolder || 'ADMINISTRATOR';
    }

    if (elements.reqInstructionsDisplay) {
      elements.reqInstructionsDisplay.textContent = settings.payNote || "Kartaga to'lovni o'tkazing va pastdagi 'To'ldirish' tugmasini bosing.";
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 3: PRICING & MARGINS (USTAMA SOZLAMALARI - CRITICAL)
  // --------------------------------------------------------------------------

  function loadMarginSettingsIntoForm() {
    const settings = getMarginSettings();
    state.adminMarginType = settings.type || 'percent';

    if (elements.settingMarginEnabled) {
      elements.settingMarginEnabled.checked = Boolean(settings.enabled);
    }

    if (elements.settingMarginValue) {
      elements.settingMarginValue.value = settings.value || 15;
    }

    syncMarginTypePillUI();
    updateMarginPreview();
  }

  function syncMarginTypePillUI() {
    const isPercent = state.adminMarginType === 'percent';
    if (elements.btnMarginTypePercent) elements.btnMarginTypePercent.classList.toggle('active', isPercent);
    if (elements.btnMarginTypeFixed) elements.btnMarginTypeFixed.classList.toggle('active', !isPercent);

    if (elements.settingMarginValueLabel) {
      elements.settingMarginValueLabel.textContent = isPercent ? "Ustama miqdori (Foiz: %)" : "Ustama miqdori (Qat'iy summa: so'm)";
    }
    if (elements.settingMarginSuffix) {
      elements.settingMarginSuffix.textContent = isPercent ? '%' : "so'm";
    }
  }

  function updateMarginPreview() {
    const enabled = elements.settingMarginEnabled ? elements.settingMarginEnabled.checked : true;
    const type = state.adminMarginType || 'percent';
    const val = Number(elements.settingMarginValue?.value) || 0;

    const sampleBase = 10000;
    let addition = 0;
    if (enabled && val > 0) {
      if (type === 'percent') {
        addition = Math.round(sampleBase * (val / 100));
      } else {
        addition = val;
      }
    }

    const finalClient = sampleBase + addition;

    if (elements.prevMarginAddition) {
      elements.prevMarginAddition.textContent = enabled 
        ? `+${formatUzs(addition)} (${type === 'percent' ? `+${val}%` : `qat'iy`})`
        : "0 so'm (o'chiq)";
    }
    if (elements.prevClientPrice) {
      elements.prevClientPrice.textContent = formatUzs(finalClient);
    }
    if (elements.prevNetProfit) {
      elements.prevNetProfit.textContent = `+${formatUzs(addition)}`;
    }
  }

  function handleSaveMarginSettings() {
    const enabled = elements.settingMarginEnabled ? elements.settingMarginEnabled.checked : true;
    const type = state.adminMarginType || 'percent';
    const val = Number(elements.settingMarginValue?.value) || 0;

    const newSettings = {
      enabled: enabled,
      type: type,
      value: val
    };

    saveMarginSettings(newSettings);
    triggerHaptic('success');

    const msg = `✅ Ustama narx sozlamalari saqlandi!\n\nHolati: ${enabled ? 'Faol' : 'O\'chiq'}\nUsul: ${type === 'percent' ? `+${val}%` : `+${formatUzs(val)}`}\n\nFoydalanuvchilar katalogdagi barcha o'yin paketlarini ushbu narxda ko'radilar.`;
    if (tg?.showAlert) tg.showAlert(msg);
    else alert(msg);
  }

  // --------------------------------------------------------------------------
  // SECTION 4: CONTENT & LINKS (HAVOLALAR & KONTENT)
  // --------------------------------------------------------------------------

  function loadLinksSettingsIntoForm() {
    const links = getLinksSettings();
    if (elements.settingSupportUrl) elements.settingSupportUrl.value = links.supportUrl || '';
    if (elements.settingSupportDesc) elements.settingSupportDesc.value = links.supportDesc || '';
    if (elements.settingVideoUrl) elements.settingVideoUrl.value = links.videoUrl || '';
    if (elements.settingChannelUrl) elements.settingChannelUrl.value = links.channelUrl || '';
    if (elements.settingStoreTitle) elements.settingStoreTitle.value = links.storeTitle || 'Donat Store';
    if (elements.settingFaqContent) elements.settingFaqContent.value = links.faqContent || '';
  }

  function handleSaveLinksSettings() {
    const newSettings = {
      supportUrl: elements.settingSupportUrl ? elements.settingSupportUrl.value.trim() : 'https://t.me/admin',
      supportDesc: elements.settingSupportDesc ? elements.settingSupportDesc.value.trim() : 'Administrator: @admin',
      videoUrl: elements.settingVideoUrl ? elements.settingVideoUrl.value.trim() : 'https://t.me/admin',
      channelUrl: elements.settingChannelUrl ? elements.settingChannelUrl.value.trim() : 'https://t.me/admin',
      storeTitle: elements.settingStoreTitle ? elements.settingStoreTitle.value.trim() : 'Donat Store',
      faqContent: elements.settingFaqContent ? elements.settingFaqContent.value.trim() : "Xavfsiz tranzaksiyalar."
    };

    saveLinksSettings(newSettings);
    triggerHaptic('success');

    const msg = "✅ Do'kon havolalari va ma'lumotlari saqlandi!\n\nProfil sahifasidagi havolalar darhol yangilandi.";
    if (tg?.showAlert) tg.showAlert(msg);
    else alert(msg);
  }

  function updateProfileLinksUI() {
    const links = getLinksSettings();
    if (elements.profileSupportLink) elements.profileSupportLink.href = links.supportUrl || 'https://t.me/admin';
    if (elements.profileSupportDesc) elements.profileSupportDesc.textContent = links.supportDesc || 'Administrator: @admin';
    if (elements.profileVideoLink) elements.profileVideoLink.href = links.videoUrl || 'https://t.me/admin';
    if (elements.profileChannelLink) elements.profileChannelLink.href = links.channelUrl || 'https://t.me/admin';
  }

  // --------------------------------------------------------------------------
  // SECTION 5: USER MANAGEMENT (MIJOZLARNI BOSHQARISH)
  // --------------------------------------------------------------------------

  function renderAdminUsers(filterText = '') {
    const list = getAllUsers();
    const q = filterText.toLowerCase().trim();
    const filtered = q
      ? list.filter(u => String(u.id).includes(q) || u.name.toLowerCase().includes(q) || (u.username && u.username.toLowerCase().includes(q)))
      : list;

    if (elements.adminUsersCountBadge) {
      elements.adminUsersCountBadge.textContent = `${filtered.length} ta mijoz`;
    }

    if (!elements.adminUsersList) return;

    if (!filtered.length) {
      elements.adminUsersList.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--hint-color); font-size: 13px;">
          Qidiruv bo'yicha mijoz topilmadi.
        </div>
      `;
      return;
    }

    elements.adminUsersList.innerHTML = filtered.map(user => {
      const firstChar = (user.name || 'U').charAt(0).toUpperCase();
      return `
        <div class="admin-user-card" data-user-id="${user.id}">
          <div class="user-card-top">
            <div class="user-card-info">
              <div class="admin-u-avatar">${firstChar}</div>
              <div>
                <div class="admin-u-name">${escapeHtml(user.name)}</div>
                <div class="admin-u-id-tag">${escapeHtml(user.username || '')} • Telegram ID: <code>${escapeHtml(String(user.id))}</code></div>
              </div>
            </div>
            <button class="btn-adjust-balance" onclick="openBalanceModal('${escapeHtml(String(user.id))}')" type="button">
              ⚙️ Balans
            </button>
          </div>
          <div class="user-card-balance-box">
            <span style="font-size: 11.5px; color: var(--hint-color);">Hisob balansi:</span>
            <span class="user-card-balance-val">${formatUzs(user.balance)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function openBalanceModal(userId) {
    selectedAdjustUserId = String(userId);
    balanceAdjustAction = 'add';
    const users = getAllUsers();
    const user = users.find(u => String(u.id) === String(userId));
    if (!user) return;

    if (elements.adjustUserName) elements.adjustUserName.textContent = user.name;
    if (elements.adjustUserId) elements.adjustUserId.textContent = user.id;
    if (elements.adjustCurrentBalance) elements.adjustCurrentBalance.textContent = formatUzs(user.balance);
    if (elements.adjustUserAvatar) elements.adjustUserAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
    if (elements.adjustAmountInput) elements.adjustAmountInput.value = '';
    if (elements.adjustReasonInput) elements.adjustReasonInput.value = '';

    if (elements.btnTypeAdd) elements.btnTypeAdd.classList.add('active');
    if (elements.btnTypeDeduct) elements.btnTypeDeduct.classList.remove('active');

    if (elements.adminBalanceModal) elements.adminBalanceModal.classList.add('active');
    triggerHaptic('light');
  }
  window.openBalanceModal = openBalanceModal;

  function closeBalanceModal() {
    if (elements.adminBalanceModal) elements.adminBalanceModal.classList.remove('active');
  }

  function handleConfirmBalanceAdjust() {
    if (!selectedAdjustUserId) return;

    const amount = Number(elements.adjustAmountInput?.value) || 0;
    if (amount <= 0) {
      alert("Iltimos, to'g'ri summa kiriting (kamida 1 000 so'm)!");
      return;
    }

    const reason = elements.adjustReasonInput?.value.trim() || (balanceAdjustAction === 'add' ? "Admin bonusi" : "Admin tomonidan yechildi");

    // Load User from Storage
    const targetKey = getUserStorageKey(selectedAdjustUserId);
    let targetUserData = null;
    try {
      const raw = localStorage.getItem(targetKey);
      if (raw) targetUserData = JSON.parse(raw);
    } catch (e) {}

    if (!targetUserData) {
      const users = getAllUsers();
      const u = users.find(x => String(x.id) === String(selectedAdjustUserId));
      targetUserData = {
        id: String(selectedAdjustUserId),
        firstName: u?.name || 'Foydalanuvchi',
        balance: u?.balance || 0,
        orders: [],
        topups: []
      };
    }

    if (balanceAdjustAction === 'add') {
      targetUserData.balance = (Number(targetUserData.balance) || 0) + amount;
    } else {
      targetUserData.balance = Math.max(0, (Number(targetUserData.balance) || 0) - amount);
    }

    // Add entry to user's topups / adjustments
    if (!Array.isArray(targetUserData.topups)) targetUserData.topups = [];
    targetUserData.topups.unshift({
      id: 'ADJ-' + Math.floor(100000 + Math.random() * 900000),
      amount: balanceAdjustAction === 'add' ? amount : -amount,
      method: 'ADMIN',
      date: new Date().toLocaleString('uz-UZ'),
      status: balanceAdjustAction === 'add' ? "Qo'shildi" : "Yechildi"
    });

    localStorage.setItem(targetKey, JSON.stringify(targetUserData));

    // Update Registry
    const allUsers = getAllUsers();
    const uReg = allUsers.find(u => String(u.id) === String(selectedAdjustUserId));
    if (uReg) uReg.balance = targetUserData.balance;
    saveAllUsers(allUsers);

    // If current session is this user, update screen
    if (String(currentUser.id) === String(selectedAdjustUserId)) {
      currentUser = targetUserData;
      updateBalanceUI();
      renderOrdersList();
    }

    // Record in Master Orders
    recordMasterOrder({
      id: 'ADJ' + Math.floor(100000 + Math.random() * 900000),
      type: 'topup',
      userId: selectedAdjustUserId,
      userName: targetUserData.firstName || 'Foydalanuvchi',
      title: `Admin tuzatishi: ${balanceAdjustAction === 'add' ? '+' : '-'}${formatUzs(amount)} (${reason})`,
      price: amount,
      date: new Date().toLocaleString('uz-UZ'),
      status: 'Tasdiqlandi'
    });

    triggerHaptic('success');
    closeBalanceModal();

    const msg = `✅ Foydalanuvchi (${selectedAdjustUserId}) balansi yangilandi!\n\nAmal: ${balanceAdjustAction === 'add' ? '+' : '-'}${formatUzs(amount)}\nYangi balans: ${formatUzs(targetUserData.balance)}`;
    if (tg?.showAlert) tg.showAlert(msg);
    else alert(msg);

    renderAdminUsers(elements.adminUserSearchInput?.value || '');
  }

  // --------------------------------------------------------------------------
  // SECTION 6: MASTER ORDER HISTORY (BARCHA BUYURTMALAR LOGI)
  // --------------------------------------------------------------------------

  function renderAdminAllOrders(filterType = state.adminMasterOrdersFilter || 'all', filterQuery = '') {
    const all = getAllMasterOrders();
    let filtered = all;

    if (filterType === 'games') {
      filtered = filtered.filter(o => o.type === 'game');
    } else if (filterType === 'topups') {
      filtered = filtered.filter(o => o.type === 'topup');
    }

    const q = filterQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(o => 
        String(o.id).toLowerCase().includes(q) ||
        String(o.userId).toLowerCase().includes(q) ||
        (o.userName && o.userName.toLowerCase().includes(q)) ||
        (o.title && o.title.toLowerCase().includes(q))
      );
    }

    if (elements.adminOrdersCountBadge) {
      elements.adminOrdersCountBadge.textContent = `${filtered.length} ta`;
    }

    if (!elements.adminAllOrdersList) return;

    if (!filtered.length) {
      elements.adminAllOrdersList.innerHTML = '';
      if (elements.adminEmptyOrdersState) elements.adminEmptyOrdersState.style.display = 'block';
      return;
    }

    if (elements.adminEmptyOrdersState) elements.adminEmptyOrdersState.style.display = 'none';

    elements.adminAllOrdersList.innerHTML = filtered.map(item => {
      let statusClass = 'kutilmoqda';
      let statusIcon = '⏳';
      if (item.status === 'Bajarildi' || item.status === 'Tasdiqlandi') {
        statusClass = 'tasdiqlandi';
        statusIcon = '✓';
      } else if (item.status === 'Rad etildi') {
        statusClass = 'rad-etildi';
        statusIcon = '✕';
      }

      const typeIcon = item.type === 'game' ? '🎮' : '💳';

      return `
        <div class="admin-request-card">
          <div class="admin-card-head">
            <div class="admin-user-info-row">
              <span style="font-size: 20px;">${typeIcon}</span>
              <div class="admin-u-meta">
                <span class="admin-u-name">${escapeHtml(item.title)}</span>
                <span class="admin-u-id-tag">Buyurtmachi: ${escapeHtml(item.userName || 'Mijoz')} (ID: <code>${escapeHtml(String(item.userId))}</code>)</span>
              </div>
            </div>
            <span class="status-pill status-${statusClass}">${statusIcon} ${escapeHtml(item.status)}</span>
          </div>

          <div class="admin-details-grid">
            <div class="admin-detail-item">
              <span class="detail-k">Buyurtma ID</span>
              <span class="detail-v">#${escapeHtml(item.id)}</span>
            </div>
            <div class="admin-detail-item">
              <span class="detail-k">Summa</span>
              <span class="detail-v amount-highlight">${formatUzs(item.price)}</span>
            </div>
            <div class="admin-detail-item">
              <span class="detail-k">Vaqt</span>
              <span class="detail-v">📅 ${escapeHtml(item.date)}</span>
            </div>
            ${item.playerId ? `
              <div class="admin-detail-item">
                <span class="detail-k">Hisob / ID</span>
                <span class="detail-v">🎯 ${escapeHtml(item.playerId)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Open Admin Panel Dashboard
   */
  function openAdminModal() {
    if (!checkIsAdmin()) {
      alert("Ruxsat berilmagan: Siz administrator emassiz.");
      return;
    }

    triggerHaptic('light');
    updateAdminUI();
    switchAdminTab('approvals');

    if (elements.adminModal) elements.adminModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    tg?.BackButton?.show();
  }

  /**
   * Close Admin Panel Dashboard
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

    // ==========================================
    // ADMIN DASHBOARD EVENT HANDLERS
    // ==========================================
    elements.adminPanelTrigger?.addEventListener('click', openAdminModal);
    elements.homeAdminBtn?.addEventListener('click', openAdminModal);
    elements.adminModalCloseBtn?.addEventListener('click', closeAdminModal);
    elements.adminModal?.addEventListener('click', (e) => {
      if (e.target === elements.adminModal) closeAdminModal();
    });

    // 6-Tab Navigation Bar in Admin Dashboard
    elements.adminDashTabs.forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const targetTab = tabBtn.getAttribute('data-dash-tab');
        if (targetTab) switchAdminTab(targetTab);
      });
    });

    // Section 1: Approvals Filters
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

    // Section 2: Cards Settings Save
    elements.btnSaveCardSettings?.addEventListener('click', handleSaveCardSettings);

    // Section 3: Margins Settings Controls
    elements.btnMarginTypePercent?.addEventListener('click', () => {
      state.adminMarginType = 'percent';
      syncMarginTypePillUI();
      updateMarginPreview();
      triggerHaptic('light');
    });

    elements.btnMarginTypeFixed?.addEventListener('click', () => {
      state.adminMarginType = 'fixed';
      syncMarginTypePillUI();
      updateMarginPreview();
      triggerHaptic('light');
    });

    elements.settingMarginEnabled?.addEventListener('change', () => {
      updateMarginPreview();
      triggerHaptic('light');
    });

    elements.settingMarginValue?.addEventListener('input', updateMarginPreview);
    elements.btnSaveMarginSettings?.addEventListener('click', handleSaveMarginSettings);

    // Section 4: Links Settings Save
    elements.btnSaveLinksSettings?.addEventListener('click', handleSaveLinksSettings);

    // Section 5: Users Management Controls
    elements.adminUserSearchInput?.addEventListener('input', (e) => {
      renderAdminUsers(e.target.value);
    });

    elements.adminBalanceCloseBtn?.addEventListener('click', closeBalanceModal);
    elements.adminBalanceModal?.addEventListener('click', (e) => {
      if (e.target === elements.adminBalanceModal) closeBalanceModal();
    });

    elements.btnTypeAdd?.addEventListener('click', () => {
      balanceAdjustAction = 'add';
      elements.btnTypeAdd.classList.add('active');
      elements.btnTypeDeduct?.classList.remove('active');
      triggerHaptic('light');
    });

    elements.btnTypeDeduct?.addEventListener('click', () => {
      balanceAdjustAction = 'deduct';
      elements.btnTypeDeduct.classList.add('active');
      elements.btnTypeAdd?.classList.remove('active');
      triggerHaptic('light');
    });

    elements.btnConfirmBalanceAdjust?.addEventListener('click', handleConfirmBalanceAdjust);

    // Section 6: Master Orders Filters
    elements.btnFilterOrdersAll?.addEventListener('click', () => {
      state.adminMasterOrdersFilter = 'all';
      elements.btnFilterOrdersAll.classList.add('active');
      elements.btnFilterOrdersGames?.classList.remove('active');
      elements.btnFilterOrdersTopups?.classList.remove('active');
      renderAdminAllOrders('all', elements.adminOrderSearchInput?.value || '');
      triggerHaptic('light');
    });

    elements.btnFilterOrdersGames?.addEventListener('click', () => {
      state.adminMasterOrdersFilter = 'games';
      elements.btnFilterOrdersGames.classList.add('active');
      elements.btnFilterOrdersAll?.classList.remove('active');
      elements.btnFilterOrdersTopups?.classList.remove('active');
      renderAdminAllOrders('games', elements.adminOrderSearchInput?.value || '');
      triggerHaptic('light');
    });

    elements.btnFilterOrdersTopups?.addEventListener('click', () => {
      state.adminMasterOrdersFilter = 'topups';
      elements.btnFilterOrdersTopups.classList.add('active');
      elements.btnFilterOrdersAll?.classList.remove('active');
      elements.btnFilterOrdersGames?.classList.remove('active');
      renderAdminAllOrders('topups', elements.adminOrderSearchInput?.value || '');
      triggerHaptic('light');
    });

    elements.adminOrderSearchInput?.addEventListener('input', (e) => {
      renderAdminAllOrders(state.adminMasterOrdersFilter, e.target.value);
    });

    // Receipt Modal Viewer Events
    elements.receiptModalCloseBtn?.addEventListener('click', closeReceiptModal);
    elements.receiptModal?.addEventListener('click', (e) => {
      if (e.target === elements.receiptModal) closeReceiptModal();
    });

    elements.receiptModalApproveBtn?.addEventListener('click', () => {
      if (!activeReceiptTxId) return;
      const list = getPendingTopUps();
      const tx = list.find(t => String(t.id) === String(activeReceiptTxId));
      if (tx) {
        approveTopUp(tx.id, tx.userId, tx.amount);
        closeReceiptModal();
      }
    });

    elements.receiptModalRejectBtn?.addEventListener('click', () => {
      if (!activeReceiptTxId) return;
      rejectTopUp(activeReceiptTxId);
      closeReceiptModal();
    });

    setupTopUpHandlers();
    setupProfileSettings();
  }

  // --- Bootstrap ---
  function init() {
    initTelegram();

    // 1. Dynamic Theme initialization
    const savedTheme = localStorage.getItem('donat_store_theme') || (currentUser.settings?.darkMode ? 'dark' : 'light');
    applyTheme(savedTheme === 'dark');

    // 2. Dynamic Language initialization
    const savedLang = localStorage.getItem('donat_store_lang') || currentUser.settings?.lang || 'uz';
    applyLanguage(savedLang);

    // 3. Initial Penny Matching roll & TopUp UI
    setTopUpBaseAmount(50000);
    updateTopUpRequisitesUI();

    // 4. Populate Admin form fields from stored settings
    loadCardSettingsIntoForm();
    loadMarginSettingsIntoForm();
    loadLinksSettingsIntoForm();

    updateBalanceUI();
    setupEventListeners();
    updateOrdersBadge();
    updateAdminUI();
    loadGames();
    syncPendingTopUpsWithBackend();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
