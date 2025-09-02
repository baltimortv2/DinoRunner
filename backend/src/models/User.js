/**
 * User Model
 * Модель пользователя для работы с данными пользователей Telegram
 */

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.telegramId = data.telegramId || null;
    this.username = data.username || null;
    this.firstName = data.firstName || null;
    this.lastName = data.lastName || null;
    this.nickname = data.nickname || null; // Кастомный никнейм
    this.languageCode = data.languageCode || 'ru';
    this.isPremium = data.isPremium || false;
    this.coins = data.coins || 0;
    this.era = data.era || 1;
    this.score = data.score || 0;
    this.highScore = data.highScore || 0;
    this.gamesPlayed = data.gamesPlayed || 0;
    this.totalPlayTime = data.totalPlayTime || 0;
    this.lastActive = data.lastActive || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();

    // Статистика
    this.stats = data.stats || {
      totalCoins: 0,
      currentEra: 1,
      bestScore: 0,
      gamesPlayed: 0,
      totalPlayTime: 0,
      achievements: [],
      referralCode: null,
      referralsCount: 0
    };

    // Скины
    this.skins = data.skins || {
      character: 'standart',
      ground: 'standart',
      enemiesGround: 'standart',
      enemiesAir: 'standart',
      clouds: 'standart'
    };

    // Настройки
    this.settings = data.settings || {
      soundEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      theme: 'dark'
    };
  }

  /**
   * Создает пользователя из данных Telegram
   */
  static fromTelegramUser(telegramUser) {
    if (!telegramUser || !telegramUser.id) {
      throw new Error('Invalid Telegram user data');
    }

    const userData = {
      telegramId: telegramUser.id,
      username: telegramUser.username || `user_${telegramUser.id}`,
      firstName: telegramUser.first_name || 'Unknown',
      lastName: telegramUser.last_name || '',
      nickname: telegramUser.username || telegramUser.first_name || `user_${telegramUser.id}`,
      languageCode: telegramUser.language_code || 'ru',
      isPremium: telegramUser.is_premium || false,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new User(userData);
  }

  /**
   * Обновляет данные пользователя из Telegram
   */
  updateFromTelegram(telegramUser) {
    if (telegramUser.first_name) this.firstName = telegramUser.first_name;
    if (telegramUser.last_name) this.lastName = telegramUser.last_name;
    if (telegramUser.username) this.username = telegramUser.username;
    if (telegramUser.language_code) this.languageCode = telegramUser.language_code;
    if (telegramUser.is_premium !== undefined) this.isPremium = telegramUser.is_premium;

    this.lastActive = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Устанавливает кастомный никнейм
   */
  setNickname(nickname) {
    if (!nickname || nickname.trim().length === 0) {
      throw new Error('Nickname cannot be empty');
    }

    if (nickname.length > 50) {
      throw new Error('Nickname too long (max 50 characters)');
    }

    // Проверяем на запрещенные символы
    const forbiddenChars = /[<>@#$%^&*()+=[\]{}|\\:;"',./?~`]/;
    if (forbiddenChars.test(nickname)) {
      throw new Error('Nickname contains forbidden characters');
    }

    this.nickname = nickname.trim();
    this.updatedAt = new Date();
  }

  /**
   * Обновляет статистику
   */
  updateStats(newStats) {
    Object.assign(this.stats, newStats);
    this.updatedAt = new Date();
  }

  /**
   * Обновляет настройки
   */
  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings);
    this.updatedAt = new Date();
  }

  /**
   * Обновляет скины
   */
  updateSkins(newSkins) {
    Object.assign(this.skins, newSkins);
    this.updatedAt = new Date();
  }

  /**
   * Добавляет монеты
   */
  addCoins(amount) {
    if (amount < 0) {
      throw new Error('Cannot add negative coins');
    }

    this.coins += amount;
    this.stats.totalCoins += amount;
    this.updatedAt = new Date();
  }

  /**
   * Списывает монеты
   */
  spendCoins(amount) {
    if (amount < 0) {
      throw new Error('Cannot spend negative coins');
    }

    if (this.coins < amount) {
      throw new Error('Insufficient coins');
    }

    this.coins -= amount;
    this.updatedAt = new Date();
  }

  /**
   * Обновляет счет
   */
  updateScore(score) {
    this.score = score;

    if (score > this.highScore) {
      this.highScore = score;
      this.stats.bestScore = score;
    }

    this.gamesPlayed++;
    this.stats.gamesPlayed++;
    this.updatedAt = new Date();
  }

  /**
   * Преобразует объект в JSON для базы данных
   */
  toJSON() {
    return {
      id: this.id,
      telegramId: this.telegramId,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      nickname: this.nickname,
      languageCode: this.languageCode,
      isPremium: this.isPremium,
      coins: this.coins,
      era: this.era,
      score: this.score,
      highScore: this.highScore,
      gamesPlayed: this.gamesPlayed,
      totalPlayTime: this.totalPlayTime,
      lastActive: this.lastActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      stats: JSON.stringify(this.stats),
      skins: JSON.stringify(this.skins),
      settings: JSON.stringify(this.settings)
    };
  }

  /**
   * Создает объект из данных базы данных
   */
  static fromDB(data) {
    const userData = { ...data };

    // Парсим JSON поля
    try {
      userData.stats = JSON.parse(data.stats || '{}');
      userData.skins = JSON.parse(data.skins || '{}');
      userData.settings = JSON.parse(data.settings || '{}');
    } catch (error) {
      console.warn('Error parsing user data from DB:', error);
      userData.stats = {};
      userData.skins = {};
      userData.settings = {};
    }

    return new User(userData);
  }

  /**
   * Получает отображаемое имя пользователя
   */
  getDisplayName() {
    return this.nickname || this.firstName || this.username || `User ${this.telegramId}`;
  }

  /**
   * Проверяет, является ли пользователь активным
   */
  isActive() {
    const now = new Date();
    const lastActive = new Date(this.lastActive);
    const diffInHours = (now - lastActive) / (1000 * 60 * 60);

    return diffInHours < 24; // Активен, если был онлайн в последние 24 часа
  }
}

module.exports = User;

