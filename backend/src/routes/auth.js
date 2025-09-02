const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { query, get, run, transaction } = require('../database/sqlite-connection');

// Валидация Telegram initData
function validateInitData(initData, botToken) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Сортируем параметры по алфавиту
    const params = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Создаем секретный ключ
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Вычисляем хеш
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(params).digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating initData:', error);
    return false;
  }
}

// POST /api/auth/telegram
router.post('/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (!validateInitData(initData, botToken)) {
      return res.status(401).json({ error: 'Invalid initData signature' });
    }
    
    // Парсим initData для получения user_id
    const urlParams = new URLSearchParams(initData);
    const userId = urlParams.get('user.id');
    const username = urlParams.get('user.username');
    const firstName = urlParams.get('user.first_name');
    const lastName = urlParams.get('user.last_name');
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in initData' });
    }
    
    // Проверяем, есть ли уже пользователь
    let user = await get('SELECT id, telegram_id, username, first_name, last_name, points, coins, era, created_at FROM users WHERE telegram_id = ?', [userId]);
    
    if (!user) {
      // Создаем нового пользователя
      const result = await run(
        `INSERT INTO users (
          telegram_id, username, first_name, last_name, 
          points, coins, era, games_played, best_score, 
          active_character, active_ground, active_enemies_ground, 
          active_enemies_air, active_clouds
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, username || null, firstName || null, lastName || null,
          0, 0, 1, 0, 0,
          'standart', 'standart', 'standart', 'standart', 'standart'
        ]
      );
      
      // Получаем созданного пользователя
      user = await get('SELECT id, telegram_id, username, first_name, last_name, points, coins, era, created_at FROM users WHERE telegram_id = ?', [userId]);
      
      // Создаем стандартные скины для пользователя
      const defaultSkins = [
        'char-standart', 'ground-standart', 'enemies-ground-standart', 
        'enemies-air-standart', 'clouds-standart'
      ];
      
      for (const skinId of defaultSkins) {
        await run(
          'INSERT INTO user_skins (user_id, skin_id, owned, active) VALUES (?, ?, ?, ?)',
          [user.id, skinId, 1, 1]
        );
      }
      
      console.log(`New user created: ${userId} (${username || firstName})`);
    } else {
      // Обновляем существующего пользователя
      if (username !== user.username || firstName !== user.first_name || lastName !== user.last_name) {
        await run(
          'UPDATE users SET username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [username || null, firstName || null, lastName || null, user.id]
        );
        
        user.username = username || null;
        user.first_name = firstName || null;
        user.last_name = lastName || null;
      }
    }
    
    // Создаем JWT токен
    const token = crypto.createHash('sha256')
      .update(`${userId}:${Date.now()}:${process.env.JWT_SECRET}`)
      .digest('hex');
    
    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        points: user.points || 0,
        coins: user.coins || 0,
        era: user.era || 1,
        gamesPlayed: user.games_played || 0,
        bestScore: user.best_score || 0,
        createdAt: user.created_at
      },
      token,
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/verify
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }
    
    // В реальном приложении здесь будет валидация JWT токена
    // Пока просто возвращаем успех
    res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// GET /api/auth/profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const user = await get(
      'SELECT id, telegram_id, username, first_name, last_name, points, coins, era, games_played, best_score, created_at FROM users WHERE telegram_id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        points: user.points || 0,
        coins: user.coins || 0,
        era: user.era || 1,
        gamesPlayed: user.games_played || 0,
        bestScore: user.best_score || 0,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

module.exports = router;

