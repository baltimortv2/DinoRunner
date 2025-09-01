import { Physics } from './physics.js'

export class Environment {
  constructor(assetPack) {
    this.assetPack = assetPack;
    this.canvasWidth = 1200;
    this.canvasHeight = 300;

    this.clouds = [];

    // Фоновые эффекты - только звезды
    this.stars = [];

    this.theme = 'dark';

    // Прокрутка земли
    this.groundScroll = 0;

    // Таймеры для анимации
    this.starTimer = 0;

    // Градиентный морф фон
    this._gradientT = 0; // 0..1
    this._gradientDir = 1;
  }

  updateCanvasSize(canvas) {
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;

    // Центрируем игровую зону по вертикали: земля по центру экрана
    Physics.groundY = Math.floor(this.canvasHeight / 2);

    // Количество звезд и облаков зависит от ширины
    const targetClouds = Math.max(6, Math.ceil(this.canvasWidth / 400));
    const targetStars = Math.max(40, Math.ceil(this.canvasWidth / 20));

    // Сгенерировать облака
    this.clouds = [];
    for (let i = 0; i < targetClouds; i++) {
      const size = 0.8 + Math.random() * 0.7; // 0.8..1.5
      const x = Math.random() * (this.canvasWidth + 600) - 300; // чуть за края
      // Ближе к земле больше облаков, выше — меньше
      const bias = Math.random() ** 2; // смещение к низу
      const maxY = Math.max(20, Physics.groundY - 80);
      const y = 20 + bias * (maxY - 20);
      this.clouds.push({ x, y, size });
    }

    // Сгенерировать звезды (для темной темы)
    this.stars = [];
    for (let i = 0; i < targetStars; i++) {
      const x = Math.random() * (this.canvasWidth + 200) - 100;
      // Плотность выше у земли: используем квадратичный байас
      const bias = Math.random() ** 2;
      const maxY = Math.max(20, Physics.groundY - 30);
      const y = 10 + bias * (maxY - 10);
      const size = 0.8 + Math.random() * 1.8;
      const speed = 0.03 + Math.random() * 0.07; // очень медленно
      this.stars.push({ x, y, size, opacity: 0.6, speed });
    }
  }

  generateStars(count) {
    // Устарело, оставляем для совместимости (будет перезаписано updateCanvasSize)
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({ x: Math.random() * this.canvasWidth, y: Math.random() * (Physics.groundY - 20) + 10, size: 1, opacity: 0.6, speed: 0.05 });
    }
    return stars;
  }

  update(gameSpeed, dt, isPaused = false) {
    if (!isPaused) {
      // Облака — медленнее дороги
      this.clouds.forEach((c) => {
        const cloudSpeed = (0.02 + 0.06 * (1 - c.size)) * dt; // медленный дрейф
        c.x -= cloudSpeed;
        if (c.x < -200) c.x = this.canvasWidth + 200 + Math.random() * 200;
      });

      // Плавный сдвиг звезд — бесконечный
      this.stars.forEach((star) => {
        star.x -= star.speed * dt;
        if (star.x < -10) {
          star.x = this.canvasWidth + 10;
          const bias = Math.random() ** 2;
          const maxY = Math.max(10, Physics.groundY - 30);
          star.y = 10 + bias * (maxY - 10);
        }
      });

      // Прокрутка земли — как у препятствий (без умножения на dt)
      this.groundScroll += Math.max(0, gameSpeed);

      // Анимация мягкого градиента
      const speed = 0.0002; // очень медленно
      this._gradientT += this._gradientDir * speed * dt;
      if (this._gradientT > 1) { this._gradientT = 1; this._gradientDir = -1; }
      if (this._gradientT < 0) { this._gradientT = 0; this._gradientDir = 1; }
    }
  }

  draw(ctx, canvas, gameSpeed) {
    // Морфирующий градиент за звездным небом
    const t = this._gradientT;
    const mix = (a, b, k) => Math.round(a + (b - a) * k);
    if (this.theme === 'dark') {
      const c1 = `rgb(${mix(12,20,t)}, ${mix(18,28,t)}, ${mix(28,40,t)})`;
      const c2 = `rgb(${mix(20,34,t)}, ${mix(28,44,t)}, ${mix(40,60,t)})`;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const c1 = `rgb(${mix(236,248,t)}, ${mix(240,252,t)}, ${mix(244,255,t)})`;
      const c2 = `rgb(${mix(220,236,t)}, ${mix(224,240,t)}, ${mix(228,246,t)})`;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Звезды (только темная тема)
    if (this.theme === 'dark') {
      ctx.fillStyle = '#ffffff';
      this.stars.forEach((star) => {
        ctx.globalAlpha = 0.4; // менее заметные
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // Облака
    const drawCloud = (c) => {
      const cloudAsset = this.assetPack && this.assetPack.isLoaded() ? this.assetPack.getAsset('cloud') : null;
      if (cloudAsset) {
        if (this.theme === 'light') {
          ctx.filter = 'grayscale(1) brightness(0.85)';
        }
        ctx.globalAlpha = 0.65; // не отвлекают
        const cloudWidth = cloudAsset.width * c.size;
        const cloudHeight = cloudAsset.height * c.size;
        ctx.drawImage(cloudAsset, c.x, c.y, cloudWidth, cloudHeight);
        ctx.globalAlpha = 1;
        if (this.theme === 'light') ctx.filter = 'none';
      } else {
        ctx.fillStyle = this.theme === 'dark' ? '#6b7280' : '#94a3b8';
        ctx.globalAlpha = 0.6;
        const radius = 12 * c.size;
        ctx.beginPath();
        ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };
    this.clouds.forEach(drawCloud);

    // Земля — бесшовный тайлинг по ширине
    const groundTopY = Physics.groundY;
    const dirtAsset = this.assetPack && this.assetPack.isLoaded() ? this.assetPack.getAsset('dirt') : null;

    if (dirtAsset) {
      const tileNaturalW = dirtAsset.width || 2400;
      const tileNaturalH = dirtAsset.height || 24;
      const targetH = tileNaturalH; // сохраняем исходную высоту
      const scale = targetH / tileNaturalH;
      const tileW = tileNaturalW * scale;

      const offset = Math.floor(this.groundScroll % tileW);
      let startX = -offset;
      while (startX < canvas.width) {
        ctx.drawImage(dirtAsset, startX, groundTopY, tileW, targetH);
        startX += tileW;
      }
    } else {
      // Fallback линия земли
      ctx.strokeStyle = this.theme === 'dark' ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundTopY);
      ctx.lineTo(canvas.width, groundTopY);
      ctx.stroke();
    }
  }
}

