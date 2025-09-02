export class AssetPack {
  constructor(packName = 'standart') {
    // Источники ассетов по группам: можно смешивать паки
    this.sources = {
      character: packName,
      ground: packName,
      enemiesGround: packName,
      enemiesAir: packName,
      clouds: packName,
    };
    this.assets = {};
    this.loaded = false;
  }

  // Публичное API для чтения/смены источников
  getCurrentSources() {
    return { ...this.sources };
  }

  async setSource(type, packName) {
    if (!['character', 'ground', 'enemiesGround', 'enemiesAir', 'clouds'].includes(type)) return;
    this.sources[type] = packName;
    this.loaded = false;
    await this.load();
  }

  async setSources(sources) {
    this.sources = { ...this.sources, ...sources };
    this.loaded = false;
    await this.load();
  }

  // Карта путей для превью конкретного типа/пака (абсолютные пути относительно корня)
  getPreviewImagePath(type, packName) {
    const p = (pack, rel) => `/Sprites/${pack}/${rel}`;
    switch (type) {
      case 'character':
        if (packName === 'standart') {
          return p(packName, 'StandartDinoIdle.png');
        } else {
          const prefix = packName.charAt(0).toUpperCase() + packName.slice(1);
          return p(packName, prefix + 'DinoIdle.png');
        }
      case 'enemiesGround':
        return p(packName, 'BigEnemy.png');
      case 'enemiesAir':
        return p(packName, 'AirEnemy1.png');
      case 'ground':
        if (packName === 'standart') {
          return p(packName, 'StandartDirt.png');
        } else {
          const prefix = packName.charAt(0).toUpperCase() + packName.slice(1);
          return p(packName, prefix + 'Dirt.png');
        }
      case 'clouds':
        return p(packName, 'Cloud.png');
      default:
        return '';
    }
  }

  // Сборка списка ассетов с учетом источников
  getAssetListForSources(sources) {
    const list = [];
    const push = (name, file) => list.push({ name, file });
    
    // Функция для создания пути к ассету
    const getAssetPath = (packName, fileName) => {
      return `/Sprites/${packName}/${fileName}`;
    };

    // Character - загружаем анимированные спрайты
    const charPack = sources.character || 'standart';
    if (charPack === 'standart') {
      push('dinoIdle', getAssetPath(charPack, 'StandartDinoIdle.png'));
      push('dinoRun1', getAssetPath(charPack, 'StandartDinoRun1.png'));
      push('dinoRun2', getAssetPath(charPack, 'StandartDinoRun2.png'));
      push('dinoRun3', getAssetPath(charPack, 'StandartDinoRun1.png')); // Анимация бега
      push('dinoCrouch1', getAssetPath(charPack, 'StandartDinoCrouch1.png'));
      push('dinoCrouch2', getAssetPath(charPack, 'StandartDinoCrouch2.png')); // Анимация приседания
      push('dinoDeath', getAssetPath(charPack, 'StandartDinoDeath.png'));
    } else {
      // Для других паков используем их названия
      const prefix = charPack.charAt(0).toUpperCase() + charPack.slice(1);
      push('dinoIdle', getAssetPath(charPack, prefix + 'DinoIdle.png'));
      push('dinoRun1', getAssetPath(charPack, prefix + 'DinoRun1.png'));
      push('dinoRun2', getAssetPath(charPack, prefix + 'DinoRun2.png'));
      push('dinoRun3', getAssetPath(charPack, prefix + 'DinoRun1.png')); // Анимация бега
      push('dinoCrouch1', getAssetPath(charPack, prefix + 'DinoCrouch1.png'));
      push('dinoCrouch2', getAssetPath(charPack, prefix + 'DinoCrouch2.png')); // Анимация приседания
      push('dinoDeath', getAssetPath(charPack, prefix + 'DinoDeath.png'));
    }

    // Enemies (ground) - загружаем все типы врагов
    const groundEnemiesPack = sources.enemiesGround || 'standart';
    push('smallEnemy', getAssetPath(groundEnemiesPack, 'SmallEnemy.png'));
    push('middleEnemy', getAssetPath(groundEnemiesPack, 'MiddleEnemy.png'));
    push('bigEnemy', getAssetPath(groundEnemiesPack, 'BigEnemy.png'));
    push('tallSmallEnemy', getAssetPath(groundEnemiesPack, 'TallSmallEnemy.png'));
    push('tallMiddleEnemy', getAssetPath(groundEnemiesPack, 'TallMiddleEnemy.png'));
    push('tallBigEnemy', getAssetPath(groundEnemiesPack, 'TallBigEnemy.png'));

    // Enemies (air) - загружаем анимированные воздушные враги
    const airEnemiesPack = sources.enemiesAir || 'standart';
    push('AirEnemy1', getAssetPath(airEnemiesPack, 'AirEnemy1.png'));
    push('AirEnemy2', getAssetPath(airEnemiesPack, 'AirEnemy2.png')); // Второй кадр анимации

    // Clouds
    const cloudsPack = sources.clouds || 'standart';
    push('cloud', getAssetPath(cloudsPack, 'Cloud.png'));

    // Ground (dirt)
    const groundPack = sources.ground || 'standart';
    if (groundPack === 'standart') {
      push('dirt', getAssetPath(groundPack, 'StandartDirt.png'));
    } else {
      const prefix = groundPack.charAt(0).toUpperCase() + groundPack.slice(1);
      push('dirt', getAssetPath(groundPack, prefix + 'Dirt.png'));
    }

    return list;
  }

  async load() {
    const assetList = this.getAssetListForSources(this.sources);
    const promises = assetList.map(({ name, file }) => this.loadAsset(name, file));
    await Promise.all(promises);
    this.loaded = true;
    console.log('Assets loaded for sources:', this.sources);
  }

  async loadAsset(name, fileUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { 
        this.assets[name] = img; 
        console.log(`✅ Asset loaded: ${name} from ${fileUrl}`);
        resolve(img); 
      };
      img.onerror = () => { 
        console.error(`❌ Failed to load asset: ${name} from ${fileUrl}`);
        resolve(null); 
      };
      img.src = fileUrl;
    });
  }

  getAsset(name) {
    if (!this.loaded) return null;
    return this.assets[name] || null;
  }

  isLoaded() { return this.loaded; }
}
