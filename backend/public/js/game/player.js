import { Physics } from './physics.js';

export class Player {
     constructor(assetPack) {
     this.x = 200; // Перемещаем динозавра ближе к центру экрана
     this.y = Physics.groundY + this.height * 0.2;
    this.vy = 0;
    this.isOnGround = true;
    this.frame = 0;
    this.frameTime = 0;
    this.assetPack = assetPack;
    this.skin = 'default';
    this.isDead = false;
    this.isFalling = false; // Флаг для анимации падения
    
         // Размеры как в оригинальной игре
     this.width = 44; // оригинальный размер динозаврика
     this.height = 47; // оригинальный размер динозаврика
     this.y = Physics.groundY + this.height * 0.2; // Опускаем на 20% ниже уровня земли
  }

     reset() {
     // Начинаем падение из-за пределов экрана (сверху)
     this.y = -100; // Начинаем значительно выше экрана для драматичного падения
     this.vy = 0;
     this.isOnGround = false;
     this.isFalling = true;
     this.frame = 0;
     this.frameTime = 0;
     this.isDead = false;
   }

  jump() {
    if (this.isOnGround) {
      this.vy = Physics.jumpVelocity;
      this.isOnGround = false;
    }
  }

  update(dt) {
    // Gravity
    this.vy += Physics.gravity;
    this.y += this.vy;

         if (this.y >= Physics.groundY + this.height * 0.2) {
       this.y = Physics.groundY + this.height * 0.2;
       this.vy = 0;
       this.isOnGround = true;
       this.isFalling = false; // Завершаем падение
     }

    // Animation timing
    this.frameTime += dt;
    if (this.isOnGround) {
      // Бег: 3 кадра
      if (this.frameTime > 100) {
        this.frame = (this.frame + 1) % 3;
        this.frameTime = 0;
      }
    } else {
      // Прыжок или падение: 2 кадра приседания
      if (this.frameTime > 140) {
        this.frame = (this.frame + 1) % 2;
        this.frameTime = 0;
      }
    }
  }

  draw(ctx) {
    if (!this.assetPack || !this.assetPack.isLoaded()) {
      // Fallback если ассеты не загружены
      ctx.fillStyle = this.isDead ? '#ff6b6b' : '#9ae6b4';
      ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
      return;
    }

    let assetName = 'dinoIdle';

    if (this.isDead) {
      // Анимация смерти
      assetName = 'dinoDeath';
    } else if (this.isOnGround) {
      // Анимация бега: 3 кадра
      if (this.frame === 0) {
        assetName = 'dinoRun1';
      } else if (this.frame === 1) {
        assetName = 'dinoRun2';
      } else {
        assetName = 'dinoRun3';
      }
    } else {
      // В прыжке: 2 кадра приседания
      assetName = this.frame === 0 ? 'dinoCrouch1' : 'dinoCrouch2';
    }
    
    const asset = this.assetPack.getAsset(assetName);
    if (asset) {
      ctx.drawImage(asset, this.x, this.y - this.height, this.width, this.height);
    } else {
      // Fallback
      ctx.fillStyle = this.isDead ? '#ff6b6b' : '#9ae6b4';
      ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
    }
  }

  getCollider() {
    // Размеры коллайдера как в оригинальной игре
    return { x: this.x + 5, y: this.y - this.height + 5, width: this.width - 10, height: this.height - 10 };
  }
}

