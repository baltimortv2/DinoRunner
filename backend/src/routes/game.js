const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

// Удаляем старую конфигурацию PostgreSQL - теперь используем SQLite через userService

// Эры системы
const ERAS = [
  { id: 1, name: 'Каменный век', minPoints: 0, maxPoints: 999999, exchangeRate: 1.0 },
  { id: 2, name: 'Бронзовый век', minPoints: 1000000, maxPoints: 4999999, exchangeRate: 1.5 },
  { id: 3, name: 'Железный век', minPoints: 5000000, maxPoints: 19999999, exchangeRate: 2.0 },
  { id: 4, name: 'Средневековье', minPoints: 20000000, maxPoints: 49999999, exchangeRate: 3.0 },
  { id: 5, name: 'Ренессанс', minPoints: 50000000, maxPoints: 99999999, exchangeRate: 5.0 },
  { id: 6, name: 'Промышленная революция', minPoints: 100000000, maxPoints: 199999999, exchangeRate: 8.0 },
  { id: 7, name: 'Информационная эра', minPoints: 200000000, maxPoints: 399999999, exchangeRate: 12.0 },
  { id: 8, name: 'Космическая эра', minPoints: 400000000, maxPoints: 699999999, exchangeRate: 20.0 },
  { id: 9, name: 'Квантовая эра', minPoints: 700000000, maxPoints: 849999999, exchangeRate: 50.0 },
  { id: 10, name: 'Бесконечность', minPoints: 850000000, maxPoints: Infinity, exchangeRate: 100.0 }
];

// Middleware для извлечения Telegram user ID
function extractTelegramUserId(req) {
  const telegramId = req.headers['x-telegram-id'] || req.body.telegramId;

  if (!telegramId) {
    // Пытаемся получить из JWT токена или других источников
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Здесь можно добавить логику для извлечения user ID из JWT
      // Пока возвращаем тестовый ID
      return 12345;
    }

    throw new Error('Telegram User ID required');
  }

  return parseInt(telegramId);
}

// Определение эры по количеству очков
function getEraByPoints(totalPoints) {
  for (let i = ERAS.length - 1; i >= 0; i--) {
    if (totalPoints >= ERAS[i].minPoints) {
      return ERAS[i];
    }
  }
  return ERAS[0];
}

// GET /api/game/user-stats
router.get('/user-stats', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);

    const userStats = await userService.getUserStats(telegramId);

    if (!userStats) {
      // Создаем пользователя по умолчанию, если не найден
      const defaultUser = {
        id: telegramId,
        username: `user_${telegramId}`,
        first_name: 'Unknown',
        last_name: '',
        language_code: 'ru',
        is_premium: false
      };

      const newUser = await userService.createOrUpdateFromTelegram(defaultUser);
      const defaultStats = await userService.getUserStats(telegramId);

      console.log(`📊 Default user stats created for Telegram user ${telegramId}`);
      return res.json({ success: true, stats: defaultStats });
    }

    const currentEra = getEraByPoints(userStats.stats.totalCoins || 0);
  
  res.json({
    success: true,
      stats: {
        totalPoints: userStats.stats.totalCoins || 0,
        totalCoins: userStats.coins || 0,
        currentEra: currentEra.id,
        eraName: currentEra.name,
        exchangeRate: currentEra.exchangeRate,
        gamesPlayed: userStats.gamesPlayed || 0,
        bestScore: userStats.highScore || 0,
        lastPlayed: userStats.lastActive
      }
    });

    console.log(`📊 User stats retrieved for Telegram user ${telegramId}`);
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// POST /api/game/session-start
router.post('/session-start', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);

    // Проверяем, есть ли пользователь
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sessionId = `session_${telegramId}_${Date.now()}`;

    // Обновляем время последней активности пользователя
    user.lastActive = new Date();
    await userService.update(user);

    res.json({
      success: true,
      sessionId,
      message: 'Game session started'
    });
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to start game session' });
  }
});

// POST /api/game/heartbeat
router.post('/heartbeat', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const telegramId = extractTelegramUserId(req);

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Проверяем пользователя и обновляем время активности
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Обновляем время последней активности
    user.lastActive = new Date();
    await userService.update(user);

    res.json({
      success: true,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

// POST /api/game/session-end
router.post('/session-end', async (req, res) => {
  try {
    const { sessionId, score, duration } = req.body;
    const telegramId = extractTelegramUserId(req);

    if (!sessionId || score === undefined) {
      return res.status(400).json({ error: 'Session ID and score required' });
    }

    // Обновляем статистику пользователя
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Обновляем счет пользователя
    await userService.updateScore(telegramId, score);

    res.json({
      success: true,
      message: 'Session ended and stats updated'
    });
  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({ error: 'Failed to end game session' });
  }
});

// GET /api/game/session-history
router.get('/session-history', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);
    const { limit = 20, offset = 0 } = req.query;

    // Пока возвращаем пустой массив - сессии не сохраняются в SQLite
    const sessions = [];

    res.json({
      success: true,
      sessions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: sessions.length
      }
    });
  } catch (error) {
    console.error('Session history error:', error);
    res.status(500).json({ error: 'Failed to get session history' });
  }
});

// GET /api/game/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const topPlayers = await userService.getTopPlayers(parseInt(limit));

    const leaderboard = topPlayers.map((user, index) => ({
      rank: index + 1,
      userId: user.telegramId,
      displayName: user.getDisplayName(),
      points: user.stats.totalCoins || 0,
      coins: user.coins || 0,
      era: user.era || 1,
      bestScore: user.highScore || 0
    }));

    res.json({
      success: true,
      leaderboard,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// GET /api/game/session-history
router.get('/session-history', async (req, res) => {
  try {
  const userId = extractUserId(req);
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await pool.query(
      'SELECT session_id, start_time, end_time, final_score, duration FROM game_sessions WHERE user_id = $1 AND is_active = false ORDER BY start_time DESC LIMIT $2 OFFSET $3',
      [userId, parseInt(limit), parseInt(offset)]
    );
    
    const sessions = result.rows.map(row => ({
      sessionId: row.session_id,
      startTime: row.start_time,
      endTime: row.end_time,
      score: row.final_score,
      duration: row.duration
    }));
  
  res.json({
    success: true,
      sessions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: sessions.length
      }
    });
  } catch (error) {
    console.error('Session history error:', error);
    res.status(500).json({ error: 'Failed to get session history' });
  }
});

// POST /api/game/update-nickname
router.post('/update-nickname', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);
    const { nickname } = req.body;

    if (!nickname || typeof nickname !== 'string') {
      return res.status(400).json({ error: 'Nickname is required and must be a string' });
    }

    const user = await userService.updateNickname(telegramId, nickname);

    console.log(`👤 Nickname updated for Telegram user ${telegramId}: ${nickname}`);
    res.json({
      success: true,
      message: 'Nickname updated successfully',
      user: {
        id: user.id,
        displayName: user.getDisplayName(),
        nickname: user.nickname
      }
    });
  } catch (error) {
    console.error('❌ Error updating nickname:', error);

    if (error.message.includes('Nickname')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update nickname' });
  }
});

// POST /api/game/update-settings
router.post('/update-settings', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const user = await userService.updateUserSettings(telegramId, settings);

    console.log(`⚙️ Settings updated for Telegram user ${telegramId}`);
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/game/sync-user
router.post('/sync-user', async (req, res) => {
  try {
    const { telegramUser } = req.body;

    if (!telegramUser || !telegramUser.id) {
      return res.status(400).json({ error: 'Telegram user data is required' });
    }

    const user = await userService.createOrUpdateFromTelegram(telegramUser);

    console.log(`🔄 User synced: ${user.getDisplayName()}`);
    res.json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: user.id,
        displayName: user.getDisplayName(),
        telegramId: user.telegramId,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('❌ Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

module.exports = router;
