import { Physics, rectsIntersect } from './physics.js';

export class Obstacles {
  constructor(assetPack) {
    this.assetPack = assetPack;
    this.items = [];
    this.spawnTimer = 0;
    // Улучшенная система рандомного спавна
    this.minGap = 800; // Увеличиваем минимальное расстояние
    this.maxGap = 2000; // Увеличиваем максимальное расстояние
    this.lastObstacleType = null;
    this.canvasWidth = 800; // Ширина канваса для спавна за экраном
    
    // Анимация для воздушных препятствий
    this.airFrame = 0;
    this.airFrameTime = 0;
  }

  updateCanvasWidth(width) {
    this.canvasWidth = width;
  }

  reset() {
    this.items = [];
    this.spawnTimer = 0;
    this.lastObstacleType = null;
    this.airFrame = 0;
    this.airFrameTime = 0;
  }

  update(gameSpeed, dt, score) {
    // Спавним препятствия только при движении (gameSpeed > 0)
    if (gameSpeed > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn();

        // Полностью рандомный интервал для непредсказуемости
        const baseGap = this.minGap + Math.random() * (this.maxGap - this.minGap);
        // Немного уменьшаем интервал с ростом скорости, но не слишком сильно
        const speedFactor = Math.max(0.75, 1 - (gameSpeed - 4) * 0.03);
        const gap = Math.round(baseGap * speedFactor);

        this.spawnTimer = gap;
      }
    }

    // Обновляем все препятствия - ВСЕ движутся с одинаковой скоростью
    this.items.forEach((o) => {
      // Горизонтальное движение - единая скорость для всех препятствий
      o.x -= gameSpeed;
    });

    // Анимация воздушных препятствий
    this.airFrameTime += dt;
    if (this.airFrameTime > 200) { // Медленная анимация для воздушных врагов
      this.airFrame = (this.airFrame + 1) % 2; // Цикл из 2 кадров
      this.airFrameTime = 0;
    }

    // Удаляем препятствия, которые вышли за экран
    this.items = this.items.filter((o) => o.x + o.width > -100);
  }

  spawn() {
    // Спавним препятствия полностью за экраном
    const spawnX = this.canvasWidth + 200;
    
    // Рандомный выбор типа препятствия
    const rand = Math.random();
    let obstacleType;
    
    // Не спавним два летающих препятствия подряд
    if (this.lastObstacleType === 'flying') {
      obstacleType = 'ground';
    } else {
      // 30% шанс на летающее препятствие, 70% на наземное
      obstacleType = rand < 0.3 ? 'flying' : 'ground';
    }
    
    if (obstacleType === 'flying') {
      // Летающие препятствия - увеличены на 30%
      const baseWidth = 46;
      const baseHeight = 27;
      const width = Math.round(baseWidth * 1.3); // +30%
      const height = Math.round(baseHeight * 1.3); // +30%

      // Рандомная начальная высота: от 50 до 150 пикселей над землей (статичная высота)
      const minHeight = 50;
      const maxHeight = 150;
      const flyHeight = minHeight + Math.floor(Math.random() * (maxHeight - minHeight));
      const baseY = Physics.groundY - flyHeight;

      this.items.push({
        x: spawnX,
        y: baseY,
        width,
        height,
        type: 'flying',
        assetName: 'AirEnemy1', // Базовое имя для анимации (первый кадр)
        frame: 0 // Добавляем кадр для анимации
        // Убраны параметры движения по высоте - теперь статичная высота
      });
      this.lastObstacleType = 'flying';
    } else {
      // Наземные препятствия - размеры как в оригинальной игре с небольшим увеличением
      const obstacleTypes = [
        { name: 'smallEnemy', width: 22, height: 45 }, // small cactus - легко перепрыгнуть
        { name: 'middleEnemy', width: 32, height: 65 }, // medium cactus - средняя сложность
        { name: 'bigEnemy', width: 42, height: 85 }, // large cactus - сложно перепрыгнуть
        // Высокие препятствия - те же размеры ширины, но выше
        { name: 'tallSmallEnemy', width: 22, height: 65 }, // tall small - требует точного прыжка
        { name: 'tallMiddleEnemy', width: 32, height: 85 }, // tall medium - сложный
        { name: 'tallBigEnemy', width: 42, height: 105 } // tall large - очень сложный
      ];

      // Рандомно выбираем тип препятствия
      const selectedType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

      // Наземные препятствия должны быть ПРЯМО на земле
      // obstacleY - это позиция верхнего края препятствия
      const obstacleY = Physics.groundY - selectedType.height + selectedType.height * 0.2; // Опускаем на 20% ниже уровня земли

      this.items.push({
        x: spawnX,
        y: obstacleY,
        width: selectedType.width,
        height: selectedType.height,
        type: 'ground',
        assetName: selectedType.name
      });
      this.lastObstacleType = 'ground';
    }
  }

  // Возвращает фактический прямоугольник столкновения на основе отрисованных размеров
  _getRenderedRect(o) {
    // Если ассеты не загружены, используем логические размеры
    if (!this.assetPack || !this.assetPack.isLoaded()) {
      const yTopFallback = o.type === 'flying' ? o.y - o.height : o.y;
      return { x: o.x, y: yTopFallback, width: o.width, height: o.height };
    }

    // Берем спрайт для вычисления пропорций (для воздуха кадр не важен — размеры одинаковые)
    const assetName = o.type === 'flying' ? 'AirEnemy1' : o.assetName;
    const asset = this.assetPack.getAsset(assetName);

    if (!asset) {
      const yTopFallback = o.type === 'flying' ? o.y - o.height : o.y;
      return { x: o.x, y: yTopFallback, width: o.width, height: o.height };
    }

    // Рассчитываем масштаб по высоте, чтобы получить точную ширину отрисованного спрайта
    const scale = o.height / (asset.height || o.height);
    const renderedW = Math.round((asset.width || o.width) * scale);
    const renderedH = Math.round((asset.height || o.height) * scale);
    const yTop = o.type === 'flying' ? o.y - renderedH : o.y;

    return { x: o.x, y: yTop, width: renderedW, height: renderedH };
  }

  collides(player) {
    const a = player.getCollider();
    return this.items.some((o) => {
      // Используем фактические (визуальные) размеры препятствия
      const r = this._getRenderedRect(o);
      return rectsIntersect(a, r);
    });
  }

  draw(ctx) {
    if (!this.assetPack || !this.assetPack.isLoaded()) {
      ctx.fillStyle = '#94a3b8';
      this.items.forEach((o) => ctx.fillRect(o.x, (o.type === 'flying' ? o.y - o.height : o.y), o.width, o.height));
      return;
    }

    this.items.forEach((o) => {
      const asset = this.assetPack.getAsset(o.assetName);
      if (asset) {
        // Принудительное масштабирование к унифицированным высотам
        // Для наземных препятствий используем их заданную высоту
        // Для воздушных — тоже используем o.height
        const targetH = o.height;
        const scale = targetH / (asset.height || targetH);
        const targetW = Math.round((asset.width || o.width) * scale);

        // Для наземных препятствий o.y - это позиция верхнего края, нужно отрисовать от земли
        const drawY = o.type === 'flying' ? o.y - targetH : o.y;
        
        // Для воздушных препятствий используем анимацию
        if (o.type === 'flying') {
          // Обновляем кадр для каждого препятствия
          o.frame = this.airFrame;
          // Выбираем правильный ассет в зависимости от кадра
          const frameAsset = this.assetPack.getAsset(`AirEnemy${o.frame + 1}`);
          if (frameAsset) {
            ctx.drawImage(frameAsset, o.x, drawY, targetW, targetH);
          } else {
            ctx.drawImage(asset, o.x, drawY, targetW, targetH);
          }
        } else {
          ctx.drawImage(asset, o.x, drawY, targetW, targetH);
        }
      } else {
        const drawY = o.type === 'flying' ? o.y - o.height : o.y;
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(o.x, drawY, o.width, o.height);
      }
    });
  }
}
