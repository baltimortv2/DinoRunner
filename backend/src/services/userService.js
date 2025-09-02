/**
 * User Service
 * Сервис для работы с пользователями
 */

const User = require('../models/User');
const { query, get, run } = require('../database/sqlite-connection');

class UserService {
  constructor() {
    this.initializeDatabase();
  }

  /**
   * Инициализация базы данных
   */
  async initializeDatabase() {
    try {
      // Проверяем, существует ли таблица и имеет ли она нужную структуру
      const tableExists = await get(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='users'
      `);

      if (tableExists) {
        console.log('📋 Users table exists, checking structure...');

        // Проверяем наличие столбца telegramId
        const columns = await query("PRAGMA table_info(users)");
        const hasTelegramId = columns.some(col => col.name === 'telegramId');

        if (!hasTelegramId) {
          console.log('🔄 Adding telegramId column to existing table...');
          await run('ALTER TABLE users ADD COLUMN telegramId INTEGER UNIQUE');

          // Переносим данные из старых столбцов если они существуют
          const hasUserId = columns.some(col => col.name === 'user_id');
          if (hasUserId) {
            await run('UPDATE users SET telegramId = user_id WHERE telegramId IS NULL');
          }
        }
      } else {
        console.log('🆕 Creating new users table...');
        await run(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegramId INTEGER UNIQUE NOT NULL,
            username TEXT,
            firstName TEXT,
            lastName TEXT,
            nickname TEXT,
            languageCode TEXT DEFAULT 'ru',
            isPremium BOOLEAN DEFAULT 0,
            coins INTEGER DEFAULT 0,
            era INTEGER DEFAULT 1,
            score INTEGER DEFAULT 0,
            highScore INTEGER DEFAULT 0,
            gamesPlayed INTEGER DEFAULT 0,
            totalPlayTime INTEGER DEFAULT 0,
            lastActive DATETIME DEFAULT CURRENT_TIMESTAMP,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            stats TEXT DEFAULT '{}',
            skins TEXT DEFAULT '{}',
            settings TEXT DEFAULT '{}'
          )
        `);
      }

      // Создаем индексы для производительности
      await run('CREATE INDEX IF NOT EXISTS idx_users_telegramId ON users(telegramId)');
      await run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');

      console.log('✅ User database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing user database:', error);
      // Пытаемся пересоздать таблицу в случае серьезной ошибки
      try {
        console.log('🔄 Attempting to recreate users table...');
        await run('DROP TABLE IF EXISTS users');
        await run(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegramId INTEGER UNIQUE NOT NULL,
            username TEXT,
            firstName TEXT,
            lastName TEXT,
            nickname TEXT,
            languageCode TEXT DEFAULT 'ru',
            isPremium BOOLEAN DEFAULT 0,
            coins INTEGER DEFAULT 0,
            era INTEGER DEFAULT 1,
            score INTEGER DEFAULT 0,
            highScore INTEGER DEFAULT 0,
            gamesPlayed INTEGER DEFAULT 0,
            totalPlayTime INTEGER DEFAULT 0,
            lastActive DATETIME DEFAULT CURRENT_TIMESTAMP,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            stats TEXT DEFAULT '{}',
            skins TEXT DEFAULT '{}',
            settings TEXT DEFAULT '{}'
          )
        `);
        console.log('✅ User database recreated successfully');
      } catch (recreateError) {
        console.error('❌ Failed to recreate user database:', recreateError);
      }
    }
  }

  /**
   * Создает или обновляет пользователя из данных Telegram
   */
  async createOrUpdateFromTelegram(telegramUser) {
    try {
      if (!telegramUser || !telegramUser.id) {
        throw new Error('Invalid Telegram user data');
      }

      // Проверяем, существует ли пользователь
      const existingUser = await this.findByTelegramId(telegramUser.id);

      if (existingUser) {
        // Обновляем существующего пользователя
        existingUser.updateFromTelegram(telegramUser);
        await this.update(existingUser);
        console.log(`🔄 Updated user: ${existingUser.getDisplayName()}`);
        return existingUser;
      } else {
        // Создаем нового пользователя
        const newUser = User.fromTelegramUser(telegramUser);
        const savedUser = await this.create(newUser);
        console.log(`🆕 Created new user: ${savedUser.getDisplayName()}`);
        return savedUser;
      }
    } catch (error) {
      console.error('❌ Error creating/updating user from Telegram:', error);
      throw error;
    }
  }

  /**
   * Создает нового пользователя
   */
  async create(user) {
    try {
      const userData = user.toJSON();

      const result = await run(`
        INSERT INTO users (
          telegramId, username, firstName, lastName, nickname,
          languageCode, isPremium, coins, era, score, highScore,
          gamesPlayed, totalPlayTime, lastActive, createdAt, updatedAt,
          stats, skins, settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.telegramId,
        userData.username,
        userData.firstName,
        userData.lastName,
        userData.nickname,
        userData.languageCode,
        userData.isPremium ? 1 : 0,
        userData.coins,
        userData.era,
        userData.score,
        userData.highScore,
        userData.gamesPlayed,
        userData.totalPlayTime,
        userData.lastActive,
        userData.createdAt,
        userData.updatedAt,
        userData.stats,
        userData.skins,
        userData.settings
      ]);

      user.id = result.lastID;
      return user;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  /**
   * Обновляет пользователя
   */
  async update(user) {
    try {
      const userData = user.toJSON();

      await run(`
        UPDATE users SET
          username = ?, firstName = ?, lastName = ?, nickname = ?,
          languageCode = ?, isPremium = ?, coins = ?, era = ?, score = ?,
          highScore = ?, gamesPlayed = ?, totalPlayTime = ?, lastActive = ?,
          updatedAt = ?, stats = ?, skins = ?, settings = ?
        WHERE id = ?
      `, [
        userData.username,
        userData.firstName,
        userData.lastName,
        userData.nickname,
        userData.languageCode,
        userData.isPremium ? 1 : 0,
        userData.coins,
        userData.era,
        userData.score,
        userData.highScore,
        userData.gamesPlayed,
        userData.totalPlayTime,
        userData.lastActive,
        userData.updatedAt,
        userData.stats,
        userData.skins,
        userData.settings,
        userData.id
      ]);

      return user;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  /**
   * Находит пользователя по ID Telegram
   */
  async findByTelegramId(telegramId) {
    try {
      const row = await get('SELECT * FROM users WHERE telegramId = ?', [telegramId]);

      if (!row) {
        return null;
      }

      return User.fromDB(row);
    } catch (error) {
      console.error('❌ Error finding user by Telegram ID:', error);
      throw error;
    }
  }

  /**
   * Находит пользователя по ID
   */
  async findById(id) {
    try {
      const row = await get('SELECT * FROM users WHERE id = ?', [id]);

      if (!row) {
        return null;
      }

      return User.fromDB(row);
    } catch (error) {
      console.error('❌ Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Получает всех пользователей
   */
  async findAll(limit = 100, offset = 0) {
    try {
      const rows = await query('SELECT * FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?', [limit, offset]);

      return rows.map(row => User.fromDB(row));
    } catch (error) {
      console.error('❌ Error finding all users:', error);
      throw error;
    }
  }

  /**
   * Получает топ пользователей по high score
   */
  async getTopPlayers(limit = 10) {
    try {
      const rows = await query(`
        SELECT * FROM users
        WHERE highScore > 0
        ORDER BY highScore DESC, gamesPlayed DESC
        LIMIT ?
      `, [limit]);

      return rows.map(row => User.fromDB(row));
    } catch (error) {
      console.error('❌ Error getting top players:', error);
      throw error;
    }
  }

  /**
   * Обновляет никнейм пользователя
   */
  async updateNickname(telegramId, nickname) {
    try {
      const user = await this.findByTelegramId(telegramId);

      if (!user) {
        throw new Error('User not found');
      }

      user.setNickname(nickname);
      await this.update(user);

      return user;
    } catch (error) {
      console.error('❌ Error updating nickname:', error);
      throw error;
    }
  }

  /**
   * Обновляет статистику пользователя
   */
  async updateUserStats(telegramId, stats) {
    try {
      const user = await this.findByTelegramId(telegramId);

      if (!user) {
        throw new Error('User not found');
      }

      user.updateStats(stats);
      await this.update(user);

      return user;
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
      throw error;
    }
  }

  /**
   * Обновляет настройки пользователя
   */
  async updateUserSettings(telegramId, settings) {
    try {
      const user = await this.findByTelegramId(telegramId);

      if (!user) {
        throw new Error('User not found');
      }

      user.updateSettings(settings);
      await this.update(user);

      return user;
    } catch (error) {
      console.error('❌ Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * Обновляет скины пользователя
   */
  async updateUserSkins(telegramId, skins) {
    try {
      const user = await this.findByTelegramId(telegramId);

      if (!user) {
        throw new Error('User not found');
      }

      user.updateSkins(skins);
      await this.update(user);

      return user;
    } catch (error) {
      console.error('❌ Error updating user skins:', error);
      throw error;
    }
  }

  /**
   * Добавляет монеты пользователю
   */
  async addCoins(telegramId, amount) {
    try {
      const user = await this.findByTelegramId(telegramId);

      if (!user) {
        throw new Error('User not found');
      }

      user.addCoins(amount);
      await this.update(user);

      return user;
    } catch (error) {
      console.error('❌ Error adding coins:', error);
      throw error;
    }
  }

  /**
   * Списывает монеты у пользователя
   */
  async spendCoins(telegramId, amount) {
    try {
      const user = await this.findByTelegramId(telegramId);

      if (!user) {
        throw new Error('User not found');
      }

      user.spendCoins(amount);
      await this.update(user);

      return user;
    } catch (error) {
      console.error('❌ Error spending coins:', error);
      throw error;
    }
  }

  /**
   * Обновляет счет пользователя
   */
  async updateScore(telegramId, score) {
    try {
      const user = await this.findByTelegramId(telegramId);

      if (!user) {
        throw new Error('User not found');
      }

      user.updateScore(score);
      await this.update(user);

      return user;
    } catch (error) {
      console.error('❌ Error updating score:', error);
      throw error;
    }
  }

  /**
   * Получает статистику пользователя
   */
  async getUserStats(telegramId) {
    try {
      const user = await this.findByTelegramId(telegramId);

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        telegramId: user.telegramId,
        displayName: user.getDisplayName(),
        username: user.username,
        nickname: user.nickname,
        firstName: user.firstName,
        lastName: user.lastName,
        languageCode: user.languageCode,
        isPremium: user.isPremium,
        coins: user.coins,
        era: user.era,
        score: user.score,
        highScore: user.highScore,
        gamesPlayed: user.gamesPlayed,
        totalPlayTime: user.totalPlayTime,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
        isActive: user.isActive(),
        stats: user.stats,
        skins: user.skins,
        settings: user.settings
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Удаляет пользователя (для админских функций)
   */
  async delete(telegramId) {
    try {
      const result = await run('DELETE FROM users WHERE telegramId = ?', [telegramId]);
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Получает количество пользователей
   */
  async getUserCount() {
    try {
      const result = await get('SELECT COUNT(*) as count FROM users');
      return result.count;
    } catch (error) {
      console.error('❌ Error getting user count:', error);
      return 0;
    }
  }
}

module.exports = new UserService();
