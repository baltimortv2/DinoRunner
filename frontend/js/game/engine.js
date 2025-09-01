import { Physics } from './physics.js';
import { Player } from './player.js';
import { Environment } from './environment.js';
import { Obstacles } from './obstacles.js';
import { AssetPack } from './assetPack.js';

// Карта сопоставления эр и скинов (временная, пока нет ассетов для эр)
const ERA_SKIN_MAP = {
  1: { character: 'standart', ground: 'standart', enemiesGround: 'standart', enemiesAir: 'standart', clouds: 'standart' },
  2: { character: 'mario', ground: 'mario', enemiesGround: 'mario', enemiesAir: 'mario', clouds: 'mario' },
  3: { character: 'sonic', ground: 'sonic', enemiesGround: 'sonic', enemiesAir: 'sonic', clouds: 'standart' }, // У соника нет облаков
  4: { character: 'pacman', ground: 'pacman', enemiesGround: 'pacman', enemiesAir: 'pacman', clouds: 'standart' }, // Placeholder
  5: { character: 'batman', ground: 'batman', enemiesGround: 'batman', enemiesAir: 'batman', clouds: 'batman' },
  6: { character: 'joker', ground: 'joker', enemiesGround: 'joker', enemiesAir: 'joker', clouds: 'joker' },
  7: { character: 'supersonic', ground: 'supersonic', enemiesGround: 'supersonic', enemiesAir: 'supersonic', clouds: 'standart' }, // Placeholder
  8: { character: 'premium', ground: 'premium', enemiesGround: 'premium', enemiesAir: 'premium', clouds: 'premium' },
  // ... Остальные эры будут использовать премиум скин как заглушку
};


export class Game {
  constructor(canvas, assetsConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assetsConfig = assetsConfig;
    
    // Создаем пакет ассетов
    this.assetPack = new AssetPack(assetsConfig?.packName || 'standart');
    
    // Инициализируем игровые объекты с пакетом ассетов
    this.player = new Player(this.assetPack);
    this.environment = new Environment(this.assetPack);
    this.obstacles = new Obstacles(this.assetPack);

    this.score = 0;
    this._scoreAccum = 0;
    this.coins = 0;
    this.era = 1;
    this.gameSpeed = Physics.baseSpeed;
    this.running = false;
    this.paused = false;
    this.soundEnabled = true;
    this.gameOver = false;
    this.audioContext = null;

    this._lastTs = 0;
    this._countdown = 0;
    this._countdownBeepLast = 0;
    this._countdownStarted = false;
    this._countdownFinished = false;

    // Звуковая система
    this.sounds = {
      jump: this.createSound(400, 0.1, 'square'),
      collision: this.createSound(150, 0.3, 'sawtooth'),
      era: this.createSound(800, 0.2, 'sine')
    };

    this.bindInput();
    // start idle loop immediately to animate background
    this._lastTs = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  initAudio() {
    if (this.audioContext) return;
    try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
        console.error("Web Audio API is not supported in this browser");
    }
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && this.running && !this.paused && this._countdown <= 0) {
        e.preventDefault();
        this.player.jump();
        this.playSound('jump');
      }
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.running && !this.paused && this._countdown <= 0) {
        e.preventDefault();
        this.player.jump();
        this.playSound('jump');
      }
    });
  }

  async initialize() {
    // Загружаем ассеты если еще не загружены
    if (!this.assetPack.isLoaded()) {
      try {
        await this.assetPack.load();
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    }

    // Обновляем размеры окружения/препятствий
    if (this.environment && typeof this.environment.updateCanvasSize === 'function') {
      this.environment.updateCanvasSize(this.canvas);
    }
    this.obstacles.updateCanvasWidth(this.canvas.width);

    // Центрируем динозавра по горизонтали
    if (this.player) {
      this.player.x = Math.max(0, Math.round((this.canvas.width - this.player.width) / 2));
    }

    // НЕ запускаем игру автоматически - только инициализируем
    this.running = false;
    this.gameOver = false;
    // НЕ сбрасываем очки - они накопительные
    // this.score = 0;
    // this._scoreAccum = 0;
    this.gameSpeed = 0; // игра стоит
    this.obstacles.reset();
    if (this.player && typeof this.player.reset === 'function') {
      this.player.reset();
      // Сохраняем центрирование после сброса
      this.player.x = Math.max(0, Math.round((this.canvas.width - this.player.width) / 2));
    }

    if (this.coins === 0) {
      // Coins start at 0; no auto-give
    }
    this._lastTs = performance.now();
  }

  async start() {
    if (this.running) return;
    
    // Запускаем игру
    this.running = true;
    this.gameSpeed = 7; // стартовая скорость
    this._lastTs = performance.now();
  }

  resetGame() {
    this.running = false;
    this.gameOver = false;
    // НЕ сбрасываем очки - они накопительные
    // this.score = 0;
    // this._scoreAccum = 0;
    this.gameSpeed = Physics.baseSpeed;
    this.obstacles.reset();
    if (this.player && typeof this.player.reset === 'function') {
      this.player.reset();
      // На всякий случай центрируем и тут
      this.player.x = Math.max(0, Math.round((this.canvas.width - this.player.width) / 2));
    }
  }

  pause() {
    this.paused = true;
  }

  resumeWithCountdown() {
    this._countdown = 3000; // 3 sec
    this._countdownStarted = false;
    this._countdownFinished = false;
    this.paused = false;

    // Показываем кнопку паузы при возобновлении игры
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn && this.running && !this.gameOver) {
      pauseBtn.classList.remove('hidden');
      pauseBtn.disabled = false;
      pauseBtn.removeAttribute('aria-disabled');
    }
  }

  loop(ts) {
    const dtRaw = ts - this._lastTs;
    const dt = Math.max(0, Math.min(50, dtRaw));
    this._lastTs = ts;

    // Idle animation when game not started: stars/clouds/ground
    if (!this.running) {
      // Анимируем окружение для создания живого фона
      this.environment.update(0, dt, false);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.environment.draw(this.ctx, this.canvas, 0);
      requestAnimationFrame(this.loop.bind(this));
      return;
    }

    // Countdown overlay - ждем нажатия кнопки "начать"
    if (this._countdown > 0) {
      this.draw();
      this._countdown -= dt;
      const left = Math.ceil(this._countdown / 1000);
      // Бип на каждом целом значении обратного отсчета
      if (this._countdownBeepLast !== left && left > 0) {
        this._countdownBeepLast = left;
        // Низкий тон → высокий к концу
        const freq = 400 + (3 - left) * 120;
        this.playCustomBeep(freq, 0.08, 'square');
      }
      this.drawCountdown(left);
      requestAnimationFrame(this.loop.bind(this));
      return;
    }

    // Проверяем, была ли нажата кнопка "начать" после countdown
    if (this._countdownStarted && !this._countdownFinished) {
      if (this._countdown <= 0) {
        this._countdownFinished = true;
        // Стартовый бип
        this.playCustomBeep(900, 0.12, 'sine');
        // Кнопка "начать" теперь удаляется в main.js через overlay.remove()
      }
      this.drawCountdown(0);
      requestAnimationFrame(this.loop.bind(this));
      return;
    }

    if (!this.paused) {
      this.update(dt);
    }
    this.draw();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    // Плавное ускорение: базовая скорость + интеграция ускорения
    this.gameSpeed = Math.min(
      Physics.maxSpeed,
      this.gameSpeed + Physics.accelerationPerMs * dt
    );

    this.player.update(dt);
    this.environment.update(this.gameSpeed, dt, this.paused);
    this.obstacles.update(this.gameSpeed, dt, this.score);

    if (this.obstacles.collides(this.player)) {
      this.onGameOver();
      return;
    }

    // Начисление очков: в 10 раз медленнее чем было
    if (this._scoreAccum < Physics.maxPointsPerRun) {
      // В будущем здесь можно добавить модификатор из dev tools
      const devMultiplier = window.DEV_TOOLS?.scoreMultiplier || 1;
      const gain = 0.002 * this.gameSpeed * dt * devMultiplier; // В 10 раз медленнее
      this._scoreAccum += gain;
      this.score = Math.max(0, Math.min(Physics.maxPointsPerRun, Math.floor(this._scoreAccum)));
    }
    // Очки теперь сохраняются только через backend API
    // В offline режиме счетчик работает только для текущей сессии
    document.getElementById('score').textContent = String(this.score);
    document.getElementById('coins').textContent = String(this.coins);
    document.getElementById('era').textContent = String(this.era);
  }

  onGameOver() {
    this.running = false;
    this.gameOver = true;
    this.player.isDead = true; // Устанавливаем состояние смерти
    this.playSound('collision');
    this.draw();
    document.getElementById('final-score').textContent = String(this.score);
    document.getElementById('gameover').classList.remove('hidden');

    // Скрываем кнопку паузы при game over
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.classList.add('hidden');
      pauseBtn.disabled = true;
      pauseBtn.setAttribute('aria-disabled', 'true');
    }
  }

  draw() {
    const ctx = this.ctx;
    this.environment.draw(ctx, this.canvas, this.gameSpeed);

    // Рисуем препятствия только когда игра запущена
    if (this.running || this._countdown > 0) {
      this.obstacles.draw(ctx);
    }

    // Рисуем персонажа только когда игра запущена
    if (this.running || this._countdown > 0) {
      this.player.draw(ctx);
    }
  }

  drawCountdown(left) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this._countdownStarted && left > 0) {
      // Кнопка "начать" теперь создается в main.js через showResumeOverlay()
      // Добавляем заголовок в небе
      ctx.fillStyle = '#2a9df4';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎮 Готовы начать игру?', this.canvas.width / 2, this.canvas.height * 0.25);
      ctx.textAlign = 'start';
    } else if (this._countdownStarted && left > 0) {
      // Показываем countdown
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      ctx.fillStyle = theme === 'light' ? '#0b141a' : '#e6edf3';
      ctx.font = 'bold 64px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const y = Math.max(40, Math.round(this.canvas.height * 0.25));
      ctx.fillText(String(left), this.canvas.width / 2, y);
      ctx.textAlign = 'start';
    } else if (this._countdownFinished) {
      // Countdown завершен, начинаем игру
      // Ничего не рисуем, игра должна продолжиться
    }
  }

  async setSkin(packName) {
    // Совместимость: меняем только персонажа
    await this.assetPack.setSource('character', packName);
    this.player.assetPack = this.assetPack;
    this.environment.assetPack = this.assetPack;
    this.obstacles.assetPack = this.assetPack;
    console.log(`Character skin changed to '${packName}'`);
  }

  async setSkinSources(sources) {
    this.paused = true;
    console.log('🔄 Установка новых источников скинов...', sources);
    await this.assetPack.setSources(sources);
    this.player.assetPack = this.assetPack;
    this.environment.assetPack = this.assetPack;
    this.obstacles.assetPack = this.assetPack;
    // Экспорт текущих источников для будущей валидации
    const cur = this.assetPack.getCurrentSources();
    this.currentSkinPack = cur.character;
    this.currentGroundPack = cur.ground;
    this.currentEnemiesGroundPack = cur.enemiesGround;
    this.currentEnemiesAirPack = cur.enemiesAir;
    this.currentCloudsPack = cur.clouds;
    console.log('Skin sources updated:', cur);
    if (this.paused) this.draw();
    this.paused = false;
    this.resumeWithCountdown();
  }

  async setEra(eraId) {
    if (this.era === eraId && this.assetPack.loaded) return;

    console.log(`⏳ Смена эры на ${eraId}...`);
    this.era = eraId;
    const eraSkin = ERA_SKIN_MAP[eraId] || ERA_SKIN_MAP[8]; // Фоллбэк на премиум скин

    try {
      await this.setSkinSources(eraSkin);
      console.log(`✅ Эра ${eraId} успешно установлена!`);
      
      // Обновляем HUD
      const eraEl = document.getElementById('era');
      if (eraEl) eraEl.textContent = this.era;
      
      // Перерисовываем превью в главном меню, если оно открыто
      window.dispatchEvent(new CustomEvent('refresh-preview'));

    } catch (error) {
      console.error(`Ошибка при смене эры на ${eraId}:`, error);
    }
  }

  // Звуковая система - создаем звуки через Web Audio API
  createSound(frequency, duration, type = 'sine') {
    return () => {
      if (!this.soundEnabled || !this.audioContext) return;

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }

  playSound(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName]();
    }
  }

  playCustomBeep(frequency, duration, type = 'sine') {
    if (!this.soundEnabled) return;
    if (!this.audioContext) this.initAudio();
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    osc.type = type;
    gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }
}

