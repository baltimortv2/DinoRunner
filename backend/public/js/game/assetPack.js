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
    const p = (pack, rel) => `/Sprites/${rel}`;
    switch (type) {
      case 'character':
        if (packName === 'sonic') return p('sonic', 'Sonic/SonicCharacter/SonicIdle.png');
        if (packName === 'mario') return p('mario', 'Mario/MarioCharacter/MarioIdle.png');
        if (packName === 'pacman') return p('pacman', 'PacMan/PacManCharacter/PacManIdle.png');
        if (packName === 'premium') return p('premium', 'Premium/PremiumCharacter/PremiumIdle.png');
        if (packName === 'batman') return p('batman', 'Batman/BatmanCharacter/BatmanIdle.png');
        if (packName === 'joker') return p('joker', 'Joker/JokerCharacter/JokerIdle.png');
        if (packName === 'supersonic') return p('supersonic', 'SuperSonic/SuperSonicCharacter/SuperSonicIdle.png');
        return p('standart', 'Standart/StandartDinoIdle.png');
      case 'enemiesGround':
        if (packName === 'sonic') return p('sonic', 'Sonic/SonicEnemy/SonicBigEnemy.png');
        if (packName === 'mario') return p('mario', 'Mario/MarioEnemy/MarioBigEnemy.png');
        if (packName === 'pacman') return p('pacman', 'Standart/BigEnemy.png');
        if (packName === 'premium') return p('premium', 'Premium/PremiumEnemy/PremiumBigEnemy.png');
        if (packName === 'batman') return p('batman', 'Batman/BatmanEnemy/BatmanBigEnemy.png');
        if (packName === 'joker') return p('joker', 'Joker/JokerEnemy/JokerBigEnemy.png');
        if (packName === 'supersonic') return p('supersonic', 'SuperSonic/SuperSonicEnemy/SuperSonicBigEnemy.png');
        return p('standart', 'Standart/BigEnemy.png');
      case 'enemiesAir':
        if (packName === 'sonic') return p('sonic', 'Sonic/SonicAirEnemy/SonicAirEnemy1.png');
        if (packName === 'mario') return p('mario', 'Mario/MarioAirEnemy/MarioAirEnemy1.png');
        if (packName === 'pacman') return p('pacman', 'Standart/AirEnemy1.png');
        if (packName === 'premium') return p('premium', 'Premium/PremiumAirEnemy/PremiumAirEnemy1.png');
        if (packName === 'batman') return p('batman', 'Batman/BatmanAirEnemy/BatmanAirEnemy1.png');
        if (packName === 'joker') return p('joker', 'Joker/JokerAirEnemy/JokerAirEnemy1.png');
        if (packName === 'supersonic') return p('supersonic', 'SuperSonic/SuperSonicAirEnemy/SuperSonicAirEnemy1.png');
        return p('standart', 'Standart/AirEnemy1.png');
      case 'ground':
        if (packName === 'sonic') return p('sonic', 'Sonic/SonicDirt/SonicDirt.png');
        if (packName === 'mario') return p('mario', 'Mario/MarioDirt.png');
        if (packName === 'pacman') return p('pacman', 'Standart/StandartDirt.png');
        if (packName === 'premium') return p('premium', 'Premium/PremiumDirt.png');
        if (packName === 'batman') return p('batman', 'Batman/BatmanDirt.png');
        if (packName === 'joker') return p('joker', 'Joker/JokerDirt.png');
        if (packName === 'supersonic') return p('supersonic', 'SuperSonic/SuperSonicDirt.png');
        return p('standart', 'Standart/StandartDirt.png');
      case 'clouds':
        if (packName === 'mario') return p('mario', 'Mario/MarioCloude.png');
        if (packName === 'premium') return p('premium', 'Premium/PremiumCloude.png');
        if (packName === 'batman') return p('batman', 'Batman/BatmanCloude.png');
        if (packName === 'joker') return p('joker', 'Joker/JokerCloude.png');
        if (packName === 'pacman') return p('pacman', 'Standart/Cloud.png');
        // В сборке SuperSonic может не быть облаков — даём безопасный фолбэк
        if (packName === 'supersonic') return p('standart', 'Standart/Cloud.png');
        // У Sonic нет облаков — используем стандартные
        return p('standart', 'Standart/Cloud.png');
      default:
        return '';
    }
  }

  // Сборка списка ассетов с учетом источников
  getAssetListForSources(sources) {
    const list = [];
    const push = (name, file) => list.push({ name, file });
    const path = (pathRel) => `/Sprites/${pathRel}`;

    // Character
    switch (sources.character) {
      case 'sonic':
        push('dinoIdle', path('Sonic/SonicCharacter/SonicIdle.png'));
        push('dinoRun1', path('Sonic/SonicCharacter/SonicRun1.png'));
        push('dinoRun2', path('Sonic/SonicCharacter/SonicRun2.png'));
        push('dinoRun3', path('Sonic/SonicCharacter/SonicRun1.png'));
        push('dinoCrouch1', path('Sonic/SonicCharacter/SonicRun1.png'));
        push('dinoCrouch2', path('Sonic/SonicCharacter/SonicRun2.png'));
        push('dinoDeath', path('Sonic/SonicCharacter/SonicDeaath.png'));
        break;
      case 'mario':
        push('dinoIdle', path('Mario/MarioCharacter/MarioIdle.png'));
        push('dinoRun1', path('Mario/MarioCharacter/MarioRun1.png'));
        push('dinoRun2', path('Mario/MarioCharacter/MarioRun2.png'));
        push('dinoRun3', path('Mario/MarioCharacter/MarioRun1.png'));
        push('dinoCrouch1', path('Mario/MarioCharacter/MarioCrouch.png'));
        push('dinoCrouch2', path('Mario/MarioCharacter/MarioCrouch.png'));
        push('dinoDeath', path('Mario/MarioCharacter/MarioIdle.png'));
        break;
      case 'premium':
        push('dinoIdle', path('Premium/PremiumCharacter/PremiumIdle.png'));
        push('dinoRun1', path('Premium/PremiumCharacter/PremiumRun1.png'));
        push('dinoRun2', path('Premium/PremiumCharacter/PremiumRun2.png'));
        push('dinoRun3', path('Premium/PremiumCharacter/PremiumRun1.png'));
        push('dinoCrouch1', path('Premium/PremiumCharacter/PremiumCrouch1.png'));
        push('dinoCrouch2', path('Premium/PremiumCharacter/PremiumCrouch2.png'));
        push('dinoDeath', path('Premium/PremiumCharacter/PremiumDeath.png'));
        break;
      case 'pacman':
        push('dinoIdle', path('PacMan/PacManCharacter/PacManIdle.png'));
        push('dinoRun1', path('PacMan/PacManCharacter/PacManRun1.png'));
        push('dinoRun2', path('PacMan/PacManCharacter/PacManRun2.png'));
        push('dinoRun3', path('PacMan/PacManCharacter/PacManRun1.png'));
        push('dinoCrouch1', path('PacMan/PacManCharacter/PacManIdle.png'));
        push('dinoCrouch2', path('PacMan/PacManCharacter/PacManIdle.png'));
        push('dinoDeath', path('PacMan/PacManCharacter/PacManDeath.png'));
        break;
      case 'supersonic':
        push('dinoIdle', path('SuperSonic/SuperSonicCharacter/SuperSonicIdle.png'));
        push('dinoRun1', path('SuperSonic/SuperSonicCharacter/SuperSonicRun1.png'));
        push('dinoRun2', path('SuperSonic/SuperSonicCharacter/SuperSonicRun2.png'));
        push('dinoRun3', path('SuperSonic/SuperSonicCharacter/SuperSonicRun1.png'));
        push('dinoCrouch1', path('SuperSonic/SuperSonicCharacter/SuperSonicCrouch.png'));
        push('dinoCrouch2', path('SuperSonic/SuperSonicCharacter/SuperSonicCrouch.png'));
        push('dinoDeath', path('SuperSonic/SuperSonicCharacter/SuperSonicDeath.png'));
        break;
      case 'batman':
        push('dinoIdle', path('Batman/BatmanCharacter/BatmanIdle.png'));
        push('dinoRun1', path('Batman/BatmanCharacter/BatmanRun1.png'));
        push('dinoRun2', path('Batman/BatmanCharacter/BatmanRun2.png'));
        push('dinoRun3', path('Batman/BatmanCharacter/BatmanRun1.png'));
        push('dinoCrouch1', path('Batman/BatmanCharacter/BatmanCrouch.png'));
        push('dinoCrouch2', path('Batman/BatmanCharacter/BatmanCrouch.png'));
        push('dinoDeath', path('Standart/StandartDinoDeath.png'));
        break;
      case 'joker':
        push('dinoIdle', path('Joker/JokerCharacter/JokerIdle.png'));
        push('dinoRun1', path('Joker/JokerCharacter/JokerRun1.png'));
        push('dinoRun2', path('Joker/JokerCharacter/JokerRun2.png'));
        push('dinoRun3', path('Joker/JokerCharacter/JokerRun1.png'));
        push('dinoCrouch1', path('Standart/StandartDinoCrouch1.png'));
        push('dinoCrouch2', path('Standart/StandartDinoCrouch2.png'));
        push('dinoDeath', path('Joker/JokerCharacter/JokerDeath.png'));
        break;
      default:
        push('dinoIdle', path('Standart/StandartDinoIdle.png'));
        push('dinoRun1', path('Standart/StandartDinoRun1.png'));
        push('dinoRun2', path('Standart/StandartDinoRun2.png'));
        push('dinoRun3', path('Standart/StandartDinoRun1.png'));
        push('dinoCrouch1', path('Standart/StandartDinoCrouch1.png'));
        push('dinoCrouch2', path('Standart/StandartDinoCrouch2.png'));
        push('dinoDeath', path('Standart/StandartDinoDeath.png'));
    }

    // Enemies (ground)
    switch (sources.enemiesGround) {
      case 'sonic':
        push('smallEnemy', path('Sonic/SonicEnemy/SonicSmallEnemy.png'));
        push('middleEnemy', path('Sonic/SonicEnemy/SonicMiddleEnemy.png'));
        push('bigEnemy', path('Sonic/SonicEnemy/SonicBigEnemy.png'));
        push('tallSmallEnemy', path('Sonic/SonicEnemy/SonicTallSmallEnemy.png'));
        push('tallMiddleEnemy', path('Sonic/SonicEnemy/SonicTallMiddleEnemy.png'));
        push('tallBigEnemy', path('Sonic/SonicEnemy/SonicTallBigEnemy.png'));
        break;
      case 'mario':
        push('smallEnemy', path('Mario/MarioEnemy/MarioSmallEnemy.png'));
        push('middleEnemy', path('Mario/MarioEnemy/MarioMiddleEnemy.png'));
        push('bigEnemy', path('Mario/MarioEnemy/MarioBigEnemy.png'));
        push('tallSmallEnemy', path('Mario/MarioEnemy/MarioTallSmallEnemy.png'));
        push('tallMiddleEnemy', path('Mario/MarioEnemy/MarioTallMiddleEnemy.png'));
        push('tallBigEnemy', path('Mario/MarioEnemy/MarioTallBigEnemy.png'));
        break;
      case 'premium':
        push('smallEnemy', path('Premium/PremiumEnemy/PremiumSmallEnemy.png'));
        push('middleEnemy', path('Premium/PremiumEnemy/PremiumMiddleEnemy.png'));
        push('bigEnemy', path('Premium/PremiumEnemy/PremiumBigEnemy.png'));
        push('tallSmallEnemy', path('Premium/PremiumEnemy/PremiumTallSmallEnemy.png'));
        // приближения при отсутствии явных ассетов
        push('tallMiddleEnemy', path('Premium/PremiumEnemy/PremiumMiddleEnemy.png'));
        push('tallBigEnemy', path('Premium/PremiumEnemy/PremiumMiddleBigEnemy.png'));
        break;
      case 'pacman':
        push('smallEnemy', path('Standart/SmallEnemy.png'));
        push('middleEnemy', path('Standart/MiddleEnemy.png'));
        push('bigEnemy', path('Standart/BigEnemy.png'));
        push('tallSmallEnemy', path('Standart/TallSmallEnemy.png'));
        push('tallMiddleEnemy', path('Standart/TallMiddleEnemy.png'));
        push('tallBigEnemy', path('Standart/TallBigEnemy.png'));
        break;
      case 'supersonic':
        push('smallEnemy', path('SuperSonic/SuperSonicEnemy/SuperSonicSmallEnemy.png'));
        push('middleEnemy', path('SuperSonic/SuperSonicEnemy/SuperSonicMiddleEnemy.png'));
        push('bigEnemy', path('SuperSonic/SuperSonicEnemy/SuperSonicBigEnemy.png'));
        push('tallSmallEnemy', path('SuperSonic/SuperSonicEnemy/SuperSonicTallSmallEnemy.png'));
        push('tallMiddleEnemy', path('SuperSonic/SuperSonicEnemy/SuperSonicTallMiddleEnemy.png'));
        push('tallBigEnemy', path('SuperSonic/SuperSonicEnemy/SuperSonicTallBigEnemy.png'));
        break;
      case 'batman':
        push('smallEnemy', path('Batman/BatmanEnemy/BatmanSmallEnemy.png'));
        push('middleEnemy', path('Batman/BatmanEnemy/BatmanMiddleEnemy.png'));
        push('bigEnemy', path('Batman/BatmanEnemy/BatmanBigEnemy.png'));
        push('tallSmallEnemy', path('Batman/BatmanEnemy/BatmanTallSmallEnemy.png'));
        push('tallMiddleEnemy', path('Batman/BatmanEnemy/BatmanTallMiddleEnemy.png'));
        push('tallBigEnemy', path('Batman/BatmanEnemy/BatmanTallBigEnemy.png'));
        break;
      case 'joker':
        push('smallEnemy', path('Joker/JokerEnemy/JokerSmallEnemy.png'));
        push('middleEnemy', path('Joker/JokerEnemy/JokerMiddleEnemy.png'));
        push('bigEnemy', path('Joker/JokerEnemy/JokerBigEnemy.png'));
        push('tallSmallEnemy', path('Joker/JokerEnemy/JokerTallSmallEnemy.png'));
        push('tallMiddleEnemy', path('Joker/JokerEnemy/JokerTallMiddleEnemy.png'));
        push('tallBigEnemy', path('Joker/JokerEnemy/JokerTallBigEnemy.png'));
        break;
      default:
        push('smallEnemy', path('Standart/SmallEnemy.png'));
        push('middleEnemy', path('Standart/MiddleEnemy.png'));
        push('bigEnemy', path('Standart/BigEnemy.png'));
        push('tallSmallEnemy', path('Standart/TallSmallEnemy.png'));
        push('tallMiddleEnemy', path('Standart/TallMiddleEnemy.png'));
        push('tallBigEnemy', path('Standart/TallBigEnemy.png'));
    }

    // Air enemies (2 кадра)
    switch (sources.enemiesAir) {
      case 'sonic':
        push('AirEnemy1', path('Sonic/SonicAirEnemy/SonicAirEnemy1.png'));
        push('AirEnemy2', path('Sonic/SonicAirEnemy/SonicAirEnemy2.png'));
        break;
      case 'mario':
        push('AirEnemy1', path('Mario/MarioAirEnemy/MarioAirEnemy1.png'));
        push('AirEnemy2', path('Mario/MarioAirEnemy/MarioAirEnemy2.png'));
        break;
      case 'premium':
        push('AirEnemy1', path('Premium/PremiumAirEnemy/PremiumAirEnemy1.png'));
        push('AirEnemy2', path('Premium/PremiumAirEnemy/PremiumAirEnemy2.png'));
        break;
      case 'pacman':
        push('AirEnemy1', path('Standart/AirEnemy1.png'));
        push('AirEnemy2', path('Standart/AirEnemy2.png'));
        break;
      case 'supersonic':
        push('AirEnemy1', path('SuperSonic/SuperSonicAirEnemy/SuperSonicAirEnemy1.png'));
        push('AirEnemy2', path('SuperSonic/SuperSonicAirEnemy/SuperSonicAirEnemy2.png'));
        break;
      case 'batman':
        push('AirEnemy1', path('Batman/BatmanAirEnemy/BatmanAirEnemy1.png'));
        push('AirEnemy2', path('Batman/BatmanAirEnemy/BatmanAirEnemy2.png'));
        break;
      case 'joker':
        push('AirEnemy1', path('Joker/JokerAirEnemy/JokerAirEnemy1.png'));
        push('AirEnemy2', path('Joker/JokerAirEnemy/JokerAirEnemy2.png'));
        break;
      default:
        push('AirEnemy1', path('Standart/AirEnemy1.png'));
        push('AirEnemy2', path('Standart/AirEnemy2.png'));
    }

    // Clouds
    switch (sources.clouds) {
      case 'mario':
        push('cloud', path('Mario/MarioCloude.png'));
        break;
      case 'premium':
        push('cloud', path('Premium/PremiumCloude.png'));
        break;
      case 'supersonic':
        // Фолбэк, чтобы не было 404 при отсутствии файла в паке
        push('cloud', path('Standart/Cloud.png'));
        break;
      case 'batman':
        push('cloud', path('Batman/BatmanCloude.png'));
        break;
      case 'joker':
        push('cloud', path('Joker/JokerCloude.png'));
        break;
      default:
        push('cloud', path('Standart/Cloud.png'));
    }

    // Ground (dirt)
    switch (sources.ground) {
      case 'sonic':
        push('dirt', path('Sonic/SonicDirt/SonicDirt.png'));
        break;
      case 'mario':
        push('dirt', path('Mario/MarioDirt.png'));
        break;
      case 'premium':
        push('dirt', path('Premium/PremiumDirt.png'));
        break;
      case 'supersonic':
        push('dirt', path('SuperSonic/SuperSonicDirt.png'));
        break;
      case 'batman':
        push('dirt', path('Batman/BatmanDirt.png'));
        break;
      case 'joker':
        push('dirt', path('Joker/JokerDirt.png'));
        break;
      default:
        push('dirt', path('Standart/StandartDirt.png'));
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
      img.onload = () => { this.assets[name] = img; resolve(img); };
      img.onerror = () => { console.warn(`Failed to load asset: ${fileUrl}`); resolve(null); };
      img.src = fileUrl;
    });
  }

  getAsset(name) {
    if (!this.loaded) return null;
    return this.assets[name] || null;
  }

  isLoaded() { return this.loaded; }
}
