import { Game } from './game/engine.js';
import { initHUD } from './ui/hud.js';
import { initMenu } from './ui/menu.js';
import { SkinShop } from './ui/shop.js';

function fitCanvasToContainer(canvas) {
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // Увеличиваем игровую зону на ~15% за счёт изменения целевого соотношения
  const aspectRatio = (21 / 9) * (1 / 0.85);

  let targetWidth, targetHeight;

  // Letterbox-scaling
  if (containerWidth / containerHeight > aspectRatio) {
    // container is wider than the game aspect ratio
    targetHeight = containerHeight;
    targetWidth = targetHeight * aspectRatio;
  } else {
    // container is taller
    targetWidth = containerWidth;
    targetHeight = targetWidth / aspectRatio;
  }

  // Поддержка high-DPI (мобильные экраны)
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.floor(targetWidth * dpr);
  const height = Math.floor(targetHeight * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
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

window.addEventListener('load', () => {
  const canvas = document.getElementById('game-canvas');

  // Инициализация Telegram WebApp SDK
  if (window.telegramApp && window.telegramApp.isTelegram) {
    console.log('📱 Telegram WebApp SDK активен');
    const userData = window.telegramApp.getUserData();
    console.log('👤 Пользователь Telegram:', userData);
    setupHapticFeedback();
  }

  // первичный ресайз под контейнер
  fitCanvasToContainer(canvas);
  
  const game = new Game(canvas, {
    packName: 'standart',
  });
  
  window.gameInstance = game;
  
  if (game && game.environment && typeof game.environment.updateCanvasSize === 'function') {
    game.environment.updateCanvasSize(canvas);
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

  // Инициализация пользовательских данных будет происходить через backend integration
  // В offline режиме используем значения по умолчанию
  game.score = 0;
  game._scoreAccum = 0;
  game.coins = 0;
  game.era = 1;
  
  // Обновляем UI с дефолтными значениями
  const sEl = document.getElementById('score'); if (sEl) sEl.textContent = '0';
  const cEl = document.getElementById('coins'); if (cEl) cEl.textContent = '0';
  const sc = document.getElementById('shop-coins'); if (sc) sc.textContent = '0';
  const eEl = document.getElementById('era'); if (eEl) eEl.textContent = '1';

  // Инициализация backend интеграции
  let backendIntegration = null;
  try {
    if (window.BackendIntegration) {
      backendIntegration = new BackendIntegration(game);
      window.backendIntegration = backendIntegration;
      console.log('🔗 Backend integration initialized');
      game.on('gameStart', () => { backendIntegration && backendIntegration.startGameSession(); });
      game.on('gameOver', (score) => { backendIntegration && backendIntegration.endGameSession(score); });
      game.on('scoreUpdate', (score) => { backendIntegration && backendIntegration.updateScore(score); });
    }
  } catch (error) {
    console.warn('Backend integration failed:', error);
  }

  initMenu(game, skinShop);

  const overlayStart = document.getElementById('tap-to-start');
  const mainMenu = document.getElementById('main-menu');
  const btnStart = document.getElementById('btn-start');
  const btnMainStart = document.getElementById('btn-main-start');
  // Reference pause button in bottom bar - initially hidden
  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) {
    pauseBtn.classList.add('hidden');
    pauseBtn.disabled = true;
    pauseBtn.setAttribute('aria-disabled','true');
  }
  const btnMainShop = document.getElementById('btn-main-shop');
  const btnMainMenu = document.getElementById('btn-main-menu');
  const previewCanvas = document.getElementById('preview-canvas');

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

    // Управление кнопкой паузы - показывать только во время игры
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      if (sceneName === SCENES.GAME && game && game.running && !game.gameOver) {
        pauseBtn.classList.remove('hidden');
        pauseBtn.disabled = false;
        pauseBtn.removeAttribute('aria-disabled');
      } else {
        pauseBtn.classList.add('hidden');
        pauseBtn.disabled = true;
        pauseBtn.setAttribute('aria-disabled', 'true');
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
        // Скрываем кнопку паузы при возврате в главное меню
        if (pauseBtn) {
          pauseBtn.classList.add('hidden');
          pauseBtn.disabled = true;
          pauseBtn.setAttribute('aria-disabled', 'true');
        }
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
    // Инициализируем звезды для preview
    previewStars = [];
    for (let i = 0; i < 15; i++) {
      previewStars.push({
        x: Math.random() * previewCanvas.width,
        y: Math.random() * (previewCanvas.height * 0.4) + 15,
        size: 0.8 + Math.random() * 1.2,
        opacity: 0.5 + Math.random() * 0.3,
        speed: 0.02 + Math.random() * 0.03
      });
    }

    // Инициализируем облака для preview
    previewClouds = [];
    for (let i = 0; i < 3; i++) {
      previewClouds.push({
        x: Math.random() * previewCanvas.width,
        y: 20 + Math.random() * (previewCanvas.height * 0.2),
        size: 0.8 + Math.random() * 0.4,
        speed: 0.01 + Math.random() * 0.02
      });
    }
  }

  function drawGamePreview() {
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    const canvas = previewCanvas;

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

  // Инициализируем элементы preview
  initPreviewElements();

  // Инициализируем систему сцен
  initScenes();

  // Кнопка "начать" теперь создается динамически в showResumeOverlay()

  window.addEventListener('refresh-preview', () => {
    if (!mainMenu.classList.contains('hidden')) { drawGamePreview(); }
  });

  function showMainMenu() {
    switchScene(SCENES.MAIN_MENU);
  }

  if (btnStart) {
    btnStart.addEventListener('click', showMainMenu);
    btnStart.addEventListener('touchend', (e) => { e.preventDefault(); showMainMenu(); }, { passive: false });
  }

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
    
    button.addEventListener('click', async () => { 
      overlay.remove(); 
      // Сначала запускаем игру
      await game.start();
      // Затем показываем countdown
      game.resumeWithCountdown();
      // Показываем кнопку паузы только после нажатия "Начать"
      if (pauseBtn) {
        pauseBtn.classList.remove('hidden');
        pauseBtn.disabled = false;
        pauseBtn.removeAttribute('aria-disabled');
      }
    });
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
});

function setupHapticFeedback() {
  if (!window.telegramApp || !window.telegramApp.isTelegram) return;
  const originalJump = game.player.jump;
  game.player.jump = function() {
    originalJump.call(this);
    window.telegramApp.hapticImpact('light');
  };
  const originalGameOver = game.gameOver;
  game.gameOver = function() {
    originalGameOver.call(this);
    window.telegramApp.hapticNotification('error');
  };
  const originalAddEra = game.addEra;
  game.addEra = function() {
    originalAddEra.call(this);
    window.telegramApp.hapticNotification('success');
  };
}

