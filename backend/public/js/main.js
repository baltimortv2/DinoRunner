import { Game } from './game/engine.js';
import { initHUD } from './ui/hud.js';
import { initMenu } from './ui/menu.js';
import { SkinShop } from './ui/shop.js';
// подключаем через index.html обычными тегами, чтобы не было MIME ошибок

function fitCanvasToContainer(canvas) {
  const container = canvas.parentElement;

  // Получаем реальные размеры контейнера без учета скроллбаров
  const containerWidth = container.clientWidth || window.innerWidth;
  const containerHeight = container.clientHeight || window.innerHeight;

  // Для мобильных устройств используем размеры viewport
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)|Tablet|PlayBook|BB10|Silk/i.test(navigator.userAgent);

  let effectiveWidth = containerWidth;
  let effectiveHeight = containerHeight;

  if (isMobile && !isTablet) {
    // Для мобильных телефонов используем 100% ширины и высоты viewport
    effectiveWidth = window.innerWidth;
    effectiveHeight = window.innerHeight;

    // Учитываем safe areas на iPhone X и новее
    if (window.visualViewport) {
      effectiveWidth = window.visualViewport.width;
      effectiveHeight = window.visualViewport.height;
    }
  }

  // Увеличиваем игровую зону на ~15% за счёт изменения целевого соотношения
  const baseAspectRatio = 21 / 9;
  const aspectRatio = baseAspectRatio * (1 / 0.85);

  let targetWidth, targetHeight;

  // Letterbox-scaling с учетом ориентации экрана
  const containerRatio = effectiveWidth / effectiveHeight;
  const orientation = containerRatio > 1 ? 'landscape' : 'portrait';

  if (orientation === 'landscape') {
    // Горизонтальная ориентация
    if (containerRatio > aspectRatio) {
      // Контейнер шире, чем соотношение игры
      targetHeight = effectiveHeight;
      targetWidth = targetHeight * aspectRatio;
    } else {
      // Контейнер уже, чем соотношение игры
      targetWidth = effectiveWidth;
      targetHeight = targetWidth / aspectRatio;
    }
  } else {
    // Вертикальная ориентация
    if (containerRatio < 1/aspectRatio) {
      // Контейнер выше, чем соотношение игры
      targetWidth = effectiveWidth;
      targetHeight = targetWidth / aspectRatio;
    } else {
      // Контейнер ниже, чем соотношение игры
      targetHeight = effectiveHeight;
      targetWidth = targetHeight * aspectRatio;
    }
  }

  // Поддержка high-DPI (мобильные экраны)
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1)); // Увеличили до 3 для лучших экранов

  // Ограничиваем максимальные размеры для производительности
  const maxWidth = 4096;
  const maxHeight = 2160;

  const width = Math.min(Math.floor(targetWidth * dpr), maxWidth);
  const height = Math.min(Math.floor(targetHeight * dpr), maxHeight);

  // Обновляем canvas только если размеры изменились
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;

    // Обновляем стиль canvas для правильного отображения
    canvas.style.width = targetWidth + 'px';
    canvas.style.height = targetHeight + 'px';

    console.log(`📐 Canvas resized: ${width}x${height} (${Math.round(dpr*100)/100}x), Display: ${Math.round(targetWidth)}x${Math.round(targetHeight)}, Device: ${isMobile ? 'mobile' : 'desktop'}`);
  }

  // Масштабируем контекст для сохранения пропорций
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false; // Отключаем сглаживание для пиксельной графики

  // Центрируем канвас в контейнере
  canvas.style.width = targetWidth + 'px';
  canvas.style.height = targetHeight + 'px';
}

// Restore theme from localStorage before anything else
(function restoreTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

window.addEventListener('load', async () => {
  const canvas = document.getElementById('game-canvas');

  // Инициализация API сервиса и проверка подключения (safe)
  console.log('🔌 Initializing API service...');
  if (window.apiService) {
    console.log('✅ API service available');
  } else {
    console.warn('⚠️ API service not available');
  }

  // Инициализация мониторинга соединения
  window.connectionMonitor = new ConnectionMonitor();
  console.log('🔌 Connection Monitor инициализирован');
  
  // Принудительная проверка соединения через 2 секунды
  setTimeout(() => {
    if (window.connectionMonitor) {
      console.log('🔄 Forcing initial connection check...');
      window.connectionMonitor.forceCheck();
    }
  }, 2000);
  
  // Дополнительная проверка через 5 секунд
  setTimeout(() => {
    if (window.connectionMonitor) {
      console.log('🔄 Second connection check...');
      window.connectionMonitor.forceCheck();
    }
  }, 5000);

  // Инициализация Telegram аутентификации
  if (window.telegramAuthService && window.telegramAuthService.isUserAuthenticated()) {
    console.log('🔐 Telegram аутентификация активна');
    const userData = window.telegramAuthService.getUserData();
    console.log('👤 Пользователь Telegram:', userData);
    
    // Загружаем данные пользователя с backend
    // (будет вызвано после создания game)
  } else {
    console.log('🌐 Telegram аутентификация не активна - development mode');
    // В development mode загружаем тестовые данные
    loadUserDataFromBackend();
  }

  // Слушаем события аутентификации
  window.addEventListener('telegram-auth-success', (event) => {
    console.log('🎉 Telegram authentication success event received');
    const userData = event.detail?.userData;
    if (userData) {
      updateWelcomeMessage({
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username
      });
    }
  });

  // Принудительно обновляем приветственное сообщение через 1 секунду
  setTimeout(() => {
    if (window.telegramAuthService && window.telegramAuthService.isUserAuthenticated()) {
      const userData = window.telegramAuthService.getUserData();
      if (userData) {
        updateWelcomeMessage({
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username
        });
      }
    }
  }, 1000);

  // первичный ресайз под контейнер
  fitCanvasToContainer(canvas);
  
  const game = new Game(canvas, {
    packName: 'standart',
  });
  
  window.gameInstance = game;

  if (game && game.environment && typeof game.environment.updateCanvasSize === 'function') {
    game.environment.updateCanvasSize(canvas);
  }

  // Теперь загружаем данные пользователя
  loadUserDataFromBackend(game);

  // Настраиваем haptic feedback если есть game.player
  if (game && game.player) {
    setupHapticFeedback(game);
  }

  window.addEventListener('resize', () => {
    fitCanvasToContainer(canvas);
    if (game && game.obstacles) {
      game.obstacles.updateCanvasWidth(canvas.width);
    }
    if (game && game.environment && typeof game.environment.updateCanvasSize === 'function') {
      game.environment.updateCanvasSize(canvas);
    }
    if (game && game.player) {
      game.player.x = Math.max(0, Math.round((canvas.width - game.player.width) / 2));
      if (typeof game.player.reset === 'function') {
        const keepX = game.player.x;
        game.player.reset();
        game.player.x = keepX;
      }
    }
  });

  const skinShop = new SkinShop(game);

  const currentSkin = skinShop.getCurrentSkin();
  game.setSkin(currentSkin.packName).catch(console.error);

  initHUD();

  // Инициализация пользовательских данных будет происходить через Telegram аутентификацию
  // Все данные загружаются с backend сервера
  game.score = 0;
  game._scoreAccum = 0;
  game.coins = 0;
  game.era = 1;
  
  // Обновляем UI с дефолтными значениями
  const sEl = document.getElementById('score'); if (sEl) sEl.textContent = '0';
  const cEl = document.getElementById('coins'); if (cEl) cEl.textContent = '0';
  const sc = document.getElementById('shop-coins'); if (sc) sc.textContent = '0';
  const eEl = document.getElementById('era'); if (eEl) eEl.textContent = '1';

  // Загрузка данных пользователя с backend
  async function loadUserDataFromBackend(gameInstance) {
    try {
      if (window.telegramAuthService && window.telegramAuthService.isUserAuthenticated()) {
        console.log('🔄 Loading user data from backend...');

        const userData = await window.telegramAuthService.fetchUserData();
        if (userData && userData.success) {
          const profile = userData.profile;

          // Обновляем статистику игры
          if (gameInstance) {
            gameInstance.coins = profile.stats.totalCoins || 0;
            gameInstance.era = profile.stats.currentEra || 1;
          }

          // Обновляем UI
          const sEl = document.getElementById('score'); if (sEl) sEl.textContent = '0';
          const cEl = document.getElementById('coins'); if (cEl) cEl.textContent = String(gameInstance?.coins || 0);
          const sc = document.getElementById('shop-coins'); if (sc) sc.textContent = String(gameInstance?.coins || 0);
          const eEl = document.getElementById('era'); if (eEl) eEl.textContent = String(gameInstance?.era || 1);

          // Обновляем статистику в главном меню
          const mmsScore = document.getElementById('mms-score'); if (mmsScore) mmsScore.textContent = '0';
          const mmsCoins = document.getElementById('mms-coins'); if (mmsCoins) mmsCoins.textContent = String(gameInstance?.coins || 0);
          const mmsEra = document.getElementById('mms-era'); if (mmsEra) mmsEra.textContent = String(gameInstance?.era || 1);

          // Обновляем приветственный текст с именем пользователя
          updateWelcomeMessage(profile);

          console.log('✅ User data loaded from backend');
        }
      } else {
        // В браузере (вне Telegram) всегда показываем "Игрок"
        const welcomeSubtitle = document.getElementById('welcome-subtitle');
        if (welcomeSubtitle) welcomeSubtitle.textContent = 'Привет, игрок!';
      }

      // Всегда обновляем приветственное сообщение
      updateWelcomeMessageOnLoad();
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      // В случае ошибки все равно обновляем приветственное сообщение
      updateWelcomeMessageOnLoad();
    }
  }

  // Обновление приветственного сообщения с именем пользователя
  function updateWelcomeMessage(profile) {
    const welcomeSubtitle = document.getElementById('welcome-subtitle');
    if (welcomeSubtitle && profile) {
      let displayName = '';

      // Поддерживаем разные форматы данных (snake_case и camelCase)
      const firstName = profile.firstName || profile.first_name;
      const lastName = profile.lastName || profile.last_name;
      const username = profile.username;

      if (firstName && lastName) {
        displayName = `${firstName} ${lastName}`;
      } else if (firstName) {
        displayName = firstName;
      } else if (username) {
        displayName = `@${username}`;
      } else {
        displayName = 'Игрок';
      }

      welcomeSubtitle.textContent = `Привет, ${displayName}!`;
      console.log('👋 Welcome message updated for:', displayName);
    }
  }
  
  // Функция для обновления приветственного сообщения при загрузке
  function updateWelcomeMessageOnLoad() {
    console.log('🔄 Updating welcome message on load...');

    // Немедленная проверка для браузера
    if (!window.Telegram || !window.Telegram.WebApp) {
      console.log('🌐 Browser detected - showing "Привет, игрок!"');
      const welcomeSubtitle = document.getElementById('welcome-subtitle');
      if (welcomeSubtitle) {
        welcomeSubtitle.textContent = 'Привет, игрок!';
      }
      return;
    }

    // Проверяем Telegram WebApp
    if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      console.log('📱 Telegram user data:', user);
      updateWelcomeMessage({
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username
      });
    } else {
      console.log('⚠️ Telegram WebApp available but no user data');
      const welcomeSubtitle = document.getElementById('welcome-subtitle');
      if (welcomeSubtitle) {
        welcomeSubtitle.textContent = 'Привет, игрок!';
      }
    }
  }

  // Инициализация backend интеграции
  let backendIntegration = null;
  try {
    if (window.BackendIntegration) {
      backendIntegration = new BackendIntegration(game);
      window.backendIntegration = backendIntegration;
      console.log('🔗 Backend integration initialized');
      if (game && typeof game.on === 'function') {
        game.on('gameStart', () => { backendIntegration && backendIntegration.startGameSession(); });
        game.on('gameOver', (score) => { backendIntegration && backendIntegration.endGameSession(score); });
        game.on('scoreUpdate', (score) => { backendIntegration && backendIntegration.updateScore(score); });
      }
    }
  } catch (error) {
    console.warn('Backend integration failed:', error);
  }

  initMenu(game, skinShop);
  
  // Система сцен
  const SCENES = {
    WELCOME: 'welcome',     // Приветственное окно
    MAIN_MENU: 'main-menu', // Главное меню
    GAME: 'game',          // Игра
    MENU: 'menu',          // Меню настроек
    GAME_OVER: 'game-over' // Экран окончания игры
  };

  let currentScene = SCENES.WELCOME;
  let sceneElements = {};

  // Инициализация сцен
  function initScenes() {
    sceneElements = {
      [SCENES.WELCOME]: document.getElementById('tap-to-start'),
      [SCENES.MAIN_MENU]: document.getElementById('main-menu'),
      [SCENES.GAME]: null, // Основной canvas
      [SCENES.MENU]: document.getElementById('menu'),
      [SCENES.GAME_OVER]: document.getElementById('gameover')
    };
  }

  // Инициализируем сцены (после объявления SCENES)
  initScenes();

  // Переключение сцен
  function switchScene(sceneName) {
    console.log(`Switching to scene: ${sceneName}`);

    // Скрываем все сцены
    Object.values(sceneElements).forEach(element => {
      if (element) element.classList.add('hidden');
    });

    // Убираем оверлей
    document.getElementById('app')?.classList.remove('overlay-open');

    // Показываем нужную сцену
    if (sceneElements[sceneName]) {
      sceneElements[sceneName].classList.remove('hidden');
      if (sceneName !== SCENES.GAME) {
        document.getElementById('app')?.classList.add('overlay-open');
      }
    }



    currentScene = sceneName;

    // Специальная логика для каждой сцены
    switch (sceneName) {
      case SCENES.WELCOME:
        // Запускаем idle анимацию
        break;
      case SCENES.MAIN_MENU:
        drawGamePreview();
        // Главное меню открыто
        break;
      case SCENES.GAME:
        // Игра уже запущена
        break;
      case SCENES.MENU:
        // Меню открыто
        break;
      case SCENES.GAME_OVER:
        // Экран game over
        break;
    }
  }

  let previewAnimationId = null;
  let previewStars = [];
  let previewClouds = [];
  let previewGroundScroll = 0;
  let previewFrame = 0;
  let previewFrameTime = 0;
  let previewDinoFrame = 0;
  let previewDinoFrameTime = 0;

  function initPreviewElements() {
    // Получаем локальную ссылку на canvas
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;

    // Инициализируем звезды для preview
    previewStars = [];
    for (let i = 0; i < 15; i++) {
      previewStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.4) + 15,
        size: 0.8 + Math.random() * 1.2,
        opacity: 0.5 + Math.random() * 0.3,
        speed: 0.02 + Math.random() * 0.03
      });
    }

    // Инициализируем облака для preview
    previewClouds = [];
    for (let i = 0; i < 3; i++) {
      previewClouds.push({
        x: Math.random() * canvas.width,
        y: 20 + Math.random() * (canvas.height * 0.2),
        size: 0.8 + Math.random() * 0.4,
        speed: 0.01 + Math.random() * 0.02
      });
    }
  }

  function drawGamePreview() {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Градиентный фон
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0c141a');
    grad.addColorStop(1, '#1a2630');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const groundY = Math.floor(canvas.height * 0.6);

    // Рисуем анимированные звезды
    ctx.fillStyle = '#ffffff';
    previewStars.forEach(star => {
      ctx.globalAlpha = star.opacity;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      // Анимируем звезды
      star.x -= star.speed;
      if (star.x < -5) star.x = canvas.width + 5;
    });
    ctx.globalAlpha = 1;

    // Рисуем анимированные облака
    const cloud = game.assetPack?.getAsset('cloud');
    previewClouds.forEach(cloudObj => {
      if (cloud) {
        ctx.globalAlpha = 0.6;
        const cloudW = cloud.width * cloudObj.size;
        const cloudH = cloud.height * cloudObj.size;
        ctx.drawImage(cloud, cloudObj.x, cloudObj.y, cloudW, cloudH);
        ctx.globalAlpha = 1;
      }
      // Анимируем облака
      cloudObj.x -= cloudObj.speed;
      if (cloudObj.x < -100) cloudObj.x = canvas.width + 100;
    });

    // Анимированная земля - используем выбранный скин земли
    const dirt = game.assetPack?.getAsset('dirt');
    if (dirt) {
      const tileW = dirt.width;
      const tileH = Math.min(dirt.height, canvas.height - groundY);
      previewGroundScroll += 0.3;
      let x = -previewGroundScroll % tileW;
      while (x < canvas.width) {
        ctx.drawImage(dirt, x, groundY, tileW, tileH);
        x += tileW;
      }
    } else {
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();
    }

    // Анимация персонажа (бегущий динозавр) - используем выбранный скин
    previewDinoFrameTime += 16; // ~60fps
    if (previewDinoFrameTime > 150) {
      previewDinoFrame = (previewDinoFrame + 1) % 3; // 3 кадра бега
      previewDinoFrameTime = 0;
    }

    let dinoAssetName = 'dinoIdle';
    if (previewDinoFrame === 0) dinoAssetName = 'dinoRun1';
    else if (previewDinoFrame === 1) dinoAssetName = 'dinoRun2';
    else dinoAssetName = 'dinoRun3';

    const dino = game.assetPack?.getAsset(dinoAssetName);
    if (dino) {
      const scale = 0.9; const width = game.player.width * scale; const height = game.player.height * scale;
      const x = canvas.width * 0.18; const y = groundY - height; ctx.drawImage(dino, x, y, width, height);
    }

    // Анимация воздушного врага - используем выбранный скин
    previewFrameTime += 16;
    if (previewFrameTime > 300) {
      previewFrame = (previewFrame + 1) % 2; // 2 кадра анимации
      previewFrameTime = 0;
    }

    const airAssetName = previewFrame === 0 ? 'AirEnemy1' : 'AirEnemy2';
    const air1 = game.assetPack?.getAsset(airAssetName);
    if (air1) {
      const targetH = 27 * 1.4; const scale = targetH / (air1.height || targetH); const targetW = (air1.width || 46) * scale;
      const x = canvas.width * 0.55; const y = groundY - 110; ctx.drawImage(air1, x, y, targetW, targetH);
    }

    // Наземный враг - используем выбранный скин
    const big = game.assetPack?.getAsset('bigEnemy');
    if (big) {
      const targetH = 85 * 0.7; const scale = targetH / (big.height || targetH); const targetW = (big.width || 42) * scale;
      const x = canvas.width * 0.74; const y = groundY - targetH; ctx.drawImage(big, x, y, targetW, targetH);
    }

    // Обновляем статистику
    const sEl = document.getElementById('mms-score'); if (sEl) sEl.textContent = String(game.score);
    const cEl = document.getElementById('mms-coins'); if (cEl) cEl.textContent = String(game.coins);
    const eEl = document.getElementById('mms-era'); if (eEl) eEl.textContent = String(game.era);

    // Продолжаем анимацию если главное меню открыто
    if (!document.getElementById('main-menu')?.classList.contains('hidden')) {
      previewAnimationId = requestAnimationFrame(drawGamePreview);
    }
  }

  // Определяем previewCanvas перед инициализацией
  const previewCanvas = document.getElementById('preview-canvas');

  if (previewCanvas) {
    // Инициализируем элементы preview только если canvas найден
    initPreviewElements();
  } else {
    console.warn('⚠️ Preview canvas not found');
  }

  // Инициализируем систему сцен (перемещено ниже SCENES)
  // initScenes();

  // Кнопка "начать" теперь создается динамически в showResumeOverlay()

  window.addEventListener('refresh-preview', () => {
    if (!mainMenu.classList.contains('hidden')) { drawGamePreview(); }
  });

    function showMainMenu() {
    console.log('🎮 Starting game from welcome screen...');
    
    // Обновляем приветственное сообщение перед переключением сцены
    if (window.telegramAuthService && window.telegramAuthService.isUserAuthenticated()) {
      const userData = window.telegramAuthService.getUserData();
      if (userData) {
        updateWelcomeMessage({
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username
        });
      }
    }
    
    // Скрываем приветственное окно
    const welcomeScreen = document.getElementById('tap-to-start');
    if (welcomeScreen) {
      welcomeScreen.classList.add('hidden');
    }
    
    // Убираем оверлей
    document.getElementById('app')?.classList.remove('overlay-open');
    
    // Инициализируем игру
    try {
      console.log('🎮 Initializing game...');
      game.initAudio();
      game.initialize().then(() => {
        // Показываем overlay с кнопкой "Начать"
        showResumeOverlay();
        window.dispatchEvent(new Event('open-leaderboard-panel'));
        console.log('✅ Game initialized successfully');
      }).catch((error) => {
        console.error('❌ Error in game.initialize():', error);
        // В случае ошибки показываем главное меню
        showMainMenuOnly();
      });
    } catch (error) {
      console.error('❌ Error initializing game:', error);
      // В случае ошибки показываем главное меню
      showMainMenuOnly();
    }
  }
  
  // Функция для показа главного меню (используется в случае ошибок)
  function showMainMenuOnly() {
    console.log('🏠 Showing main menu only...');
    
    // Скрываем приветственное окно
    const welcomeScreen = document.getElementById('tap-to-start');
    if (welcomeScreen) {
      welcomeScreen.classList.add('hidden');
    }
    
    // Показываем главное меню
    switchScene(SCENES.MAIN_MENU);
  }
  
  // Функция для запуска игры из приветственного окна
  function startGameFromWelcome() {
    console.log('🎮 START GAME FUNCTION CALLED!');

    // Скрываем приветственное окно
    const welcomeScreen = document.getElementById('tap-to-start');
    if (welcomeScreen) {
      welcomeScreen.classList.add('hidden');
      console.log('✅ Welcome screen hidden');
    }

    // Убираем оверлей
    const app = document.getElementById('app');
    if (app) {
      app.classList.remove('overlay-open');
    }

    // После нажатия "Начать игру" показываем главное меню
    console.log('🏠 Switching to main menu...');
    switchScene(SCENES.MAIN_MENU);
    window.dispatchEvent(new Event('open-leaderboard-panel'));

    console.log('✅ Game start sequence completed - Main menu shown');
  }
  
  // Альтернативная функция для запуска игры (если основная не работает)
  function startGameAlternative() {
    console.log('🎮 Alternative game start method called...');
    
    // Скрываем приветственное окно
    const welcomeScreen = document.getElementById('tap-to-start');
    if (welcomeScreen) {
      welcomeScreen.classList.add('hidden');
    }
    
    // Убираем оверлей
    const app = document.getElementById('app');
    if (app) {
      app.classList.remove('overlay-open');
    }
    
    // Показываем overlay с кнопкой "Начать"
    showResumeOverlay();
    window.dispatchEvent(new Event('open-leaderboard-panel'));
    console.log('✅ Alternative method: Game overlay shown directly');
  }
  
  // Функция для показа главного меню (используется в случае ошибок)
  function showMainMenuOnly() {
    console.log('🏠 Showing main menu only...');
    
    // Скрываем приветственное окно
    const welcomeScreen = document.getElementById('tap-to-start');
    if (welcomeScreen) {
      welcomeScreen.classList.add('hidden');
    }
    
    // Показываем главное меню
    switchScene(SCENES.MAIN_MENU);
  }

  // Инициализация кнопки "Начать игру" с задержкой для гарантии загрузки DOM
  function initStartButton() {
    // Сначала проверяем кнопку в welcome overlay
    let btnStart = document.getElementById('btn-start');
    if (!btnStart) {
      // Если не найдена, ищем в главном меню
      btnStart = document.getElementById('btn-main-start');
    }

    if (btnStart) {
      console.log('🎮 Setting up start button event listeners');
      console.log('🔍 Button element:', btnStart);

      // Простой прямой обработчик без клонирования
      btnStart.onclick = function(e) {
        console.log('🎮 START BUTTON CLICKED - SIMPLE HANDLER!');
        e.preventDefault();
        e.stopPropagation();
        startGameFromWelcome();
        return false;
      };

      // Добавляем визуальную индикацию
      btnStart.style.cursor = 'pointer';
      btnStart.style.backgroundColor = '#10b981';
      btnStart.style.color = 'white';
      btnStart.style.border = 'none';
      btnStart.style.padding = '15px 30px';
      btnStart.style.borderRadius = '10px';
      btnStart.style.fontSize = '16px';
      btnStart.style.fontWeight = 'bold';

      // Добавляем hover эффект
      btnStart.onmouseover = function() {
        this.style.backgroundColor = '#059669';
      };
      btnStart.onmouseout = function() {
        this.style.backgroundColor = '#10b981';
      };

      console.log('✅ Start button handler configured with simple onclick');
    } else {
      console.warn('⚠️ Start button not found, retrying...');
      setTimeout(initStartButton, 200);
    }
  }
  
  // Инициализируем кнопку с задержкой
  setTimeout(initStartButton, 500);

  // Также инициализируем resume кнопку при создании
  function initResumeButton() {
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      console.log('🎮 Setting up resume button event listeners');
      resumeBtn.onclick = function(e) {
        console.log('🎮 RESUME BUTTON CLICKED!');
        e.preventDefault();
        e.stopPropagation();
        // Логика запуска игры из resume overlay
        const gameInstance = window.gameInstance;
        if (gameInstance && typeof gameInstance.start === 'function') {
          gameInstance.start();
          console.log('✅ Game started from resume button');
        }
        return false;
      };
      resumeBtn.style.cursor = 'pointer';
    }
  }

  // Тестируем через 2 секунды
  setTimeout(() => {
    const btnStart = document.getElementById('btn-start');
    console.log('🧪 Testing start button after 2 seconds:', btnStart);
    if (btnStart) {
      console.log('🔍 Button text:', btnStart.textContent);
      console.log('🔍 Button onclick:', btnStart.onclick);
      console.log('🔍 Button disabled:', btnStart.disabled);
    } else {
      console.error('❌ Start button not found after 2 seconds');
    }
  }, 2000);

  // Объявляем кнопки главного меню
  const mainMenu = document.getElementById('main-menu');
  const btnMainStart = document.getElementById('btn-main-start');
  const btnMainShop = document.getElementById('btn-main-shop');
  const btnMainMenu = document.getElementById('btn-main-menu');

  if (btnMainStart) {
    const startGameFromMain = async () => {
      try {
        console.log('[main-start] clicked');
        game.initAudio();
        if (mainMenu) mainMenu.classList.add('hidden');
        document.getElementById('app')?.classList.remove('overlay-open');
        await game.initialize();
        // НЕ показываем кнопку паузы автоматически - она появится после нажатия "Начать"
        showResumeOverlay();
        window.dispatchEvent(new Event('open-leaderboard-panel'));
        console.log('[main-start] game started in pause');
      } catch (error) {
        console.error('Error starting game:', error);
      }
    };
    btnMainStart.addEventListener('click', startGameFromMain);
    btnMainStart.addEventListener('touchend', (e) => { e.preventDefault(); startGameFromMain(); }, { passive: false });
  }

  if (btnMainShop) {
    const openShopFromMain = () => {
      mainMenu.classList.add('hidden');
      const coinsEl = document.getElementById('shop-coins'); if (coinsEl) coinsEl.textContent = String(game.coins);
      // Устанавливаем флаг что магазин открыт из главного меню
      skinShop._openedFromMainMenu = true;
      skinShop.openShop();
    };
    btnMainShop.addEventListener('click', openShopFromMain);
    btnMainShop.addEventListener('touchend', (e) => { e.preventDefault(); openShopFromMain(); }, { passive: false });
  }

  if (btnMainMenu) {
    const openMenuFromMain = () => { 
      mainMenu.classList.add('hidden'); 
      const menu = document.getElementById('menu'); 
      if (menu) menu.classList.remove('hidden'); 
    };
    btnMainMenu.addEventListener('click', openMenuFromMain);
    btnMainMenu.addEventListener('touchend', (e) => { e.preventDefault(); openMenuFromMain(); }, { passive: false });
  }

  // Обработчики кнопок меню
  const btnSound = document.getElementById('btn-sound');
  const btnReferrals = document.getElementById('btn-referrals');
  const btnExchange = document.getElementById('btn-exchange');
  const btnWithdraw = document.getElementById('btn-withdraw');
  const btnNickname = document.getElementById('btn-nickname');
  const btnTheme = document.getElementById('btn-theme');

  // Обработчик кнопки звука
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      console.log('🔊 Sound button clicked');
      // Здесь можно добавить логику переключения звука
      window.telegramApp?.showAlert('Функция звука скоро будет доступна!');
    });
  }

  // Обработчик кнопки рефералов
  if (btnReferrals) {
    btnReferrals.addEventListener('click', () => {
      console.log('👥 Referrals button clicked');
      window.telegramApp?.showAlert('Реферальная система скоро будет доступна!');
    });
  }

  // Обработчик кнопки обмена
  if (btnExchange) {
    btnExchange.addEventListener('click', () => {
      console.log('💱 Exchange button clicked');
      window.telegramApp?.showAlert('Обмен очков на монеты скоро будет доступен!');
    });
  }

  // Обработчик кнопки вывода
  if (btnWithdraw) {
    btnWithdraw.addEventListener('click', () => {
      console.log('💰 Withdraw button clicked');
      window.telegramApp?.showAlert('Вывод средств скоро будет доступен!');
    });
  }

  // Обработчик кнопки никнейма
  if (btnNickname) {
    btnNickname.addEventListener('click', () => {
      console.log('👤 Nickname button clicked');
      showNicknameDialog();
    });
  }

  // Обработчик кнопки темы
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      console.log('🌙 Theme button clicked');
      toggleTheme();
    });
  }

  // Функция для показа диалога изменения никнейма
  function showNicknameDialog() {
    const currentNickname = window.telegramAuthService?.getUserData()?.nickname ||
                           window.telegramApp?.getUserData()?.username ||
                           'Игрок';

    const newNickname = window.telegramApp ?
      window.telegramApp.showInput('Изменить никнейм', 'Введите новый никнейм:', currentNickname) :
      prompt('Введите новый никнейм:', currentNickname);

    if (newNickname && newNickname !== currentNickname && newNickname.trim()) {
      updateNickname(newNickname.trim());
    }
  }

  // Функция обновления никнейма
  async function updateNickname(nickname) {
    try {
      console.log('📝 Updating nickname to:', nickname);

      const response = await fetch('/api/game/update-nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-id': window.telegramAuthService?.getUserData()?.id || '12345'
        },
        body: JSON.stringify({ nickname })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Nickname updated successfully');
        // Обновляем отображаемое имя в интерфейсе
        updateWelcomeMessage({
          firstName: nickname,
          lastName: '',
          username: nickname
        });

        if (window.telegramApp) {
          window.telegramApp.showAlert('Никнейм успешно изменен!');
        } else {
          alert('Никнейм успешно изменен!');
        }
      } else {
        throw new Error(result.error || 'Failed to update nickname');
      }
    } catch (error) {
      console.error('❌ Error updating nickname:', error);
      const message = error.message || 'Ошибка при изменении никнейма';
      if (window.telegramApp) {
        window.telegramApp.showAlert(message);
      } else {
        alert(message);
      }
    }
  }

  // Функция переключения темы
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    console.log(`🎨 Theme switched to: ${newTheme}`);

    if (window.telegramApp) {
      window.telegramApp.showAlert(`Тема изменена на ${newTheme === 'dark' ? 'темную' : 'светлую'}`);
    } else {
      alert(`Тема изменена на ${newTheme === 'dark' ? 'темную' : 'светлую'}`);
    }
  }

  // Загружаем сохраненную тему при запуске
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const resumeOverlayId = 'resume-overlay';
  function showResumeOverlay() {
    // Удаляем существующий overlay если есть
    let existingOverlay = document.getElementById(resumeOverlayId);
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Создаем новый overlay
    const overlay = document.createElement('div');
    overlay.id = resumeOverlayId;
    overlay.style.position = 'absolute'; 
    overlay.style.left = '0'; 
    overlay.style.right = '0'; 
    overlay.style.top = '0'; 
    overlay.style.bottom = '0';
    overlay.style.display = 'flex'; 
    overlay.style.alignItems = 'center'; 
    overlay.style.justifyContent = 'center';
    overlay.style.pointerEvents = 'auto'; 
    overlay.style.zIndex = '250';
    overlay.style.backgroundColor = 'transparent'; // Прозрачный фон
    
    const button = document.createElement('button');
    button.id = 'resume-btn';
    button.className = 'btn btn-success btn-start';
    button.style.fontSize = '24px';
    button.style.padding = '20px 40px';
    button.style.minHeight = '72px';
    button.style.borderRadius = '20px';
    button.style.fontWeight = '600';
    button.style.position = 'absolute';
    button.style.top = '30%'; // Позиционируем в небе над HUD
    button.style.left = '50%';
    button.style.transform = 'translateX(-50%)';
    button.textContent = 'Начать';
    
    overlay.appendChild(button);
    document.querySelector('.game-container').appendChild(overlay);

    // Инициализируем обработчик для resume кнопки
    setTimeout(() => initResumeButton(), 100);
    
    button.onclick = async function(e) {
      console.log('🎮 RESUME BUTTON CLICKED - STARTING GAME!');
      e.preventDefault();
      overlay.remove();

      try {
        // Получаем текущий экземпляр игры
        const gameInstance = window.gameInstance;

        if (gameInstance && typeof gameInstance.start === 'function') {
          console.log('🚀 Starting game...');
          await gameInstance.start();
          console.log('✅ Game started successfully');

          // Запускаем countdown если есть метод
          if (gameInstance.resumeWithCountdown) {
            gameInstance.resumeWithCountdown();
          }
        } else {
          console.warn('⚠️ Game instance not available');
          showMainMenuOnly();
        }

        console.log('✅ Game start sequence completed');
      } catch (error) {
        console.error('❌ Error starting game:', error);
        showMainMenuOnly();
      }
    };
  }

  const go = document.getElementById('gameover');
  const btnRestart = document.getElementById('btn-restart');
  const btnMainMenuGo = document.getElementById('btn-mainmenu-go');
  btnRestart.addEventListener('click', async () => {
    go.classList.add('hidden');
    document.getElementById('app')?.classList.remove('overlay-open');
    await game.initialize();
    // НЕ показываем кнопку паузы автоматически - она появится после нажатия "Начать"
    showResumeOverlay();
  });
  btnRestart.addEventListener('touchend', async (e) => {
    e.preventDefault();
    go.classList.add('hidden');
    document.getElementById('app')?.classList.remove('overlay-open');
    await game.initialize();
    // НЕ показываем кнопку паузы автоматически - она появится после нажатия "Начать"
    showResumeOverlay();
  }, { passive: false });
  if (btnMainMenuGo) {
    const backMain = () => { go.classList.add('hidden'); document.getElementById('app')?.classList.add('overlay-open'); showMainMenu(); };
    btnMainMenuGo.addEventListener('click', backMain);
    btnMainMenuGo.addEventListener('touchend', (e) => { e.preventDefault(); backMain(); }, { passive: false });
  }
  
  // Обработчик кнопки выхода из меню
  const btnMenuClose = document.getElementById('btn-menu-close');
  if (btnMenuClose) {
    const closeMenu = () => {
      console.log('🚪 Closing menu...');
      switchScene(SCENES.MAIN_MENU);
    };
    btnMenuClose.addEventListener('click', closeMenu);
    btnMenuClose.addEventListener('touchend', (e) => { e.preventDefault(); closeMenu(); }, { passive: false });
  }

  // Обновляем приветственное сообщение при загрузке
  updateWelcomeMessageOnLoad();
  
  // Добавляем обработчик события успешной аутентификации Telegram
  window.addEventListener('telegram-auth-success', (event) => {
    console.log('🎉 Telegram auth success event received');
    if (event.detail && event.detail.userData) {
      const user = event.detail.userData;
      console.log('📱 Telegram user authenticated:', user);
      updateWelcomeMessage({
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        username: user.username
      });
    }
  });

  // Проверяем Telegram сразу после загрузки
  setTimeout(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      console.log('📱 Telegram WebApp ready');
      if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        console.log('👤 Telegram user found:', user);
        updateWelcomeMessage({
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username
        });
      }
    } else {
      console.log('🌐 Not in Telegram WebApp');
    }
  }, 1000);
});

function setupHapticFeedback(gameInstance) {
  if (!window.telegramApp || !window.telegramApp.isTelegram || !gameInstance || !gameInstance.player) return;

  const originalJump = gameInstance.player.jump;
  gameInstance.player.jump = function() {
    originalJump.call(this);
    if (window.telegramApp && window.telegramApp.hapticImpact) {
      window.telegramApp.hapticImpact('light');
    }
  };

  const originalGameOver = gameInstance.gameOver;
  if (originalGameOver) {
    gameInstance.gameOver = function() {
      originalGameOver.call(this);
      if (window.telegramApp && window.telegramApp.hapticNotification) {
        window.telegramApp.hapticNotification('error');
      }
    };
  }

  const originalAddEra = gameInstance.addEra;
  if (originalAddEra) {
    gameInstance.addEra = function() {
      originalAddEra.call(this);
      if (window.telegramApp && window.telegramApp.hapticNotification) {
        window.telegramApp.hapticNotification('success');
      }
    };
  }
}

