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
   * Получает топ пользователей по количеству монет
   */
  async getTopPlayers(limit = 10) {
    try {
      const rows = await query(`
        SELECT * FROM users
        ORDER BY coins DESC, highScore DESC
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
   * Завершает игровую сессию, обновляет счет и начисляет реферальный бонус
   */
  async endGameSession(telegramId, score) {
    try {
      const user = await this.findByTelegramId(telegramId);
      if (!user) {
        throw new Error('User not found');
      }

      // 1. Обновляем счет самого игрока
      user.updateScore(score);
      await this.update(user);

      // 2. Проверяем, есть ли у игрока реферер
      if (user.referrer_id) {
        const referrer = await this.findById(user.referrer_id);
        if (referrer) {
          // 3. Начисляем 10% от очков в качестве бонуса
          const bonus = Math.floor(score * 0.10);
          if (bonus > 0) {
            await this.addPoints(referrer.telegramId, bonus);
            
            // 4. Записываем транзакцию в referral_earnings
            await run(
              'INSERT INTO referral_earnings (referrer_id, referee_id, points_earned) VALUES (?, ?, ?)',
              [referrer.id, user.id, bonus]
            );
            console.log(`Referral bonus of ${bonus} points awarded to ${referrer.telegramId} from ${telegramId}`);
          }
        }
      }

      return user;
    } catch (error) {
      console.error('❌ Error ending game session:', error);
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
   * Добавляет очки пользователю
   */
  async addPoints(telegramId, amount) {
    try {
      const user = await this.findByTelegramId(telegramId);
      if (!user) {
        throw new Error('User not found');
      }
      user.addPoints(amount);
      await this.update(user);
      return user;
    } catch (error) {
      console.error('❌ Error adding points:', error);
      throw error;
    }
  }

  /**
   * Списывает очки у пользователя
   */
  async spendPoints(telegramId, amount) {
    try {
      const user = await this.findByTelegramId(telegramId);

      if (!user) {
        throw new Error('User not found');
      }

      user.spendPoints(amount);
      await this.update(user);

      return user;
    } catch (error) {
      console.error('❌ Error spending points:', error);
      throw error;
    }
  }

  /**
   * Обновляет эру пользователя на основе общего количества монет
   */
  async updateEra(telegramId) {
    try {
      const user = await this.findByTelegramId(telegramId);
      if (!user) {
        throw new Error('User not found');
      }

      // Получаем общее количество выданных монет
      const { query } = require('../database/sqlite-connection');
      const result = await query('SELECT COALESCE(SUM(amount), 0) as total_issued FROM claims WHERE status = ?', ['completed']);
      const totalIssued = parseInt(result[0]?.total_issued) || 0;

      // Определяем эру на основе количества выданных монет
      let newEra = 1;
      if (totalIssued >= 835_000_000) newEra = 14;
      else if (totalIssued >= 815_000_000) newEra = 13;
      else if (totalIssued >= 775_000_000) newEra = 12;
      else if (totalIssued >= 725_000_000) newEra = 11;
      else if (totalIssued >= 675_000_000) newEra = 10;
      else if (totalIssued >= 600_000_000) newEra = 9;
      else if (totalIssued >= 500_000_000) newEra = 8;
      else if (totalIssued >= 400_000_000) newEra = 7;
      else if (totalIssued >= 300_000_000) newEra = 6;
      else if (totalIssued >= 200_000_000) newEra = 5;
      else if (totalIssued >= 100_000_000) newEra = 4;
      else if (totalIssued >= 50_000_000) newEra = 3;
      else if (totalIssued >= 10_000_000) newEra = 2;

      if (newEra !== user.era) {
        user.era = newEra;
        await this.update(user);
        console.log(`🔄 User ${telegramId} era updated to ${newEra}`);
      }

      return user;
    } catch (error) {
      console.error('❌ Error updating era:', error);
      throw error;
    }
  }

  /**
   * Получает статистику экономики
   */
  async getEconomyStats() {
    try {
      const { query, get } = require('../database/sqlite-connection');
      
      // Общее количество выданных монет
      const issuedResult = await get('SELECT COALESCE(SUM(amount), 0) as issued FROM claims WHERE status = ?', ['completed']);
      const issued = parseInt(issuedResult.issued) || 0;
      
      // Общее количество пользователей
      const usersResult = await get('SELECT COUNT(*) as total_users FROM users');
      const totalUsers = parseInt(usersResult.total_users) || 0;
      
      // Общее количество очков у всех пользователей
      const pointsResult = await get('SELECT COALESCE(SUM(score), 0) as total_points FROM users');
      const totalPoints = parseInt(pointsResult.total_points) || 0;
      
      // Общее количество монет у всех пользователей
      const coinsResult = await get('SELECT COALESCE(SUM(coins), 0) as total_coins FROM users');
      const totalCoins = parseInt(coinsResult.total_coins) || 0;

      return {
        totalSupply: 850_000_000,
        issued: issued,
        remaining: 850_000_000 - issued,
        totalUsers: totalUsers,
        totalPoints: totalPoints,
        totalCoins: totalCoins
      };
    } catch (error) {
      console.error('❌ Error getting economy stats:', error);
      return {
        totalSupply: 850_000_000,
        issued: 0,
        remaining: 850_000_000,
        totalUsers: 0,
        totalPoints: 0,
        totalCoins: 0
      };
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

  /**
   * Получение истории выводов пользователя
   */
  async getUserWithdrawals(telegramId) {
    try {
      const user = await this.findByTelegramId(telegramId);
      if (!user) {
        throw new Error('User not found');
      }

      const { query } = require('../database/sqlite-connection');
      const withdrawals = await query(
        `SELECT id, amount, ton_address, status, created_at, processed_at, tx_hash
         FROM withdrawals 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [user.id]
      );

      return withdrawals || [];
    } catch (error) {
      console.error('❌ Error getting user withdrawals:', error);
      throw error;
    }
  }

  /**
   * Получение статистики выводов (для админов)
   */
  async getWithdrawalStats() {
    try {
      const { query, get } = require('../database/sqlite-connection');

      // Общее количество выводов
      const totalResult = await get('SELECT COUNT(*) as count FROM withdrawals');
      const total = parseInt(totalResult.count) || 0;

      // Общая сумма выведенных монет
      const completedResult = await get(
        'SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = ?',
        ['completed']
      );
      const completed = parseInt(completedResult.total) || 0;

      // Сумма ожидающих обработки
      const pendingResult = await get(
        'SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = ?',
        ['pending']
      );
      const pending = parseInt(pendingResult.total) || 0;

      // Сумма отклоненных
      const rejectedResult = await get(
        'SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = ?',
        ['rejected']
      );
      const rejected = parseInt(rejectedResult.total) || 0;

      // Последние 10 выводов
      const recent = await query(
        `SELECT w.amount, w.ton_address, w.status, w.created_at, u.username, u.first_name
         FROM withdrawals w
         JOIN users u ON w.user_id = u.id
         ORDER BY w.created_at DESC
         LIMIT 10`
      );

      return {
        total,
        completed,
        pending,
        rejected,
        recent: recent || []
      };
    } catch (error) {
      console.error('❌ Error getting withdrawal stats:', error);
      throw error;
    }
  }

  /**
   * Обработка вывода (для админов)
   */
  async processWithdrawal(withdrawalId, action, adminTelegramId, txHash = null) {
    try {
      const { get, run } = require('../database/sqlite-connection');

      // Получаем запрос на вывод
      const withdrawal = await get('SELECT * FROM withdrawals WHERE id = ?', [withdrawalId]);
      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }

      if (withdrawal.status !== 'pending') {
        throw new Error('Withdrawal already processed');
      }

      // Получаем админа
      const admin = await this.findByTelegramId(adminTelegramId);
      if (!admin || admin.role !== 'admin') {
        throw new Error('Admin access required');
      }

      let newStatus, message;

      if (action === 'approve') {
        newStatus = 'completed';
        message = 'Withdrawal approved';
        
        // Здесь должна быть интеграция с TON кошельком для отправки монет
        // Пока что просто помечаем как завершенный
        
      } else if (action === 'reject') {
        newStatus = 'rejected';
        message = 'Withdrawal rejected';
        
        // Возвращаем монеты пользователю
        await this.addCoins(withdrawal.telegram_id, withdrawal.amount);
        
      } else {
        throw new Error('Invalid action');
      }

      // Обновляем статус
      await run(
        `UPDATE withdrawals 
         SET status = ?, processed_at = CURRENT_TIMESTAMP, tx_hash = ?, admin_id = ?
         WHERE id = ?`,
        [newStatus, txHash, admin.id, withdrawalId]
      );

      console.log(`✅ Withdrawal ${action}ed: ID ${withdrawalId} by admin ${adminTelegramId}`);

      return { success: true, message, newStatus };
    } catch (error) {
      console.error('❌ Error processing withdrawal:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
