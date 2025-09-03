const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { get, run } = require('../database/sqlite-connection');

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

// POST /api/auth/telegram/validate
router.post('/telegram/validate', async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ success: false, error: 'initData is required' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('FATAL: TELEGRAM_BOT_TOKEN is not configured!');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    if (!validateInitData(initData, botToken)) {
      console.warn('Invalid initData signature received');
      return res.status(401).json({ success: false, error: 'Invalid initData signature' });
    }

    // Парсим данные пользователя из initData
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    const startParam = urlParams.get('start_param'); // Получаем реферальный код

    if (!userJson) {
      return res.status(400).json({ success: false, error: 'User data not found in initData' });
    }

    const userData = JSON.parse(userJson);
    const { id: telegram_id, first_name, last_name, username } = userData;
    
    // Ищем или создаем пользователя
    let user = await get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id]);
    
    if (!user) {
      // Проверяем, есть ли реферер
      let referrerId = null;
      if (startParam) {
        const referrer = await get('SELECT id FROM users WHERE telegram_id = ?', [startParam]);
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      // Создаем нового пользователя
      const result = await run(
        `INSERT INTO users (telegram_id, username, first_name, last_name, coins, era, referrer_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [telegram_id, username, first_name, last_name, 0, 1, referrerId]
      );
      user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      console.log(`New user created: ${username} (ID: ${telegram_id})`);

      // Если есть реферер, записываем связь в таблицу referrals
      if (referrerId) {
        // Проверяем лимит рефералов (10)
        const refCount = await get('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?', [referrerId]);
        if (refCount.count < 10) {
          await run('INSERT INTO referrals (referrer_id, referee_id) VALUES (?, ?)', [referrerId, user.id]);
          console.log(`Referral link processed: ${user.id} -> ${referrerId}`);
        } else {
          console.warn(`Referrer ${referrerId} has reached the referral limit.`);
        }
      }
    } else {
      // Обновляем данные существующего пользователя, если они изменились
      if (user.username !== username || user.first_name !== first_name || user.last_name !== last_name) {
        await run(
          'UPDATE users SET username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [username, first_name, last_name, user.id]
        );
      }
    }
    
    // Создаем JWT токен
    const token = jwt.sign({ id: user.id, telegram_id: user.telegram_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        stats: {
            totalScore: user.points || 0,
            totalCoins: user.coins || 0,
            gamesPlayed: user.games_played || 0,
            bestScore: user.best_score || 0,
            currentEra: user.era || 1
        }
      },
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
});

// Все старые эндпоинты ниже можно удалить или заархивировать,
// так как они дублируют логику или используют небезопасные методы
router.post('/telegram', async (req, res) => {
    res.status(404).json({error: "This endpoint is deprecated. Use /telegram/validate instead."})
});

router.get('/verify', async (req, res) => {
    res.status(404).json({error: "This endpoint is deprecated."})
});

router.get('/profile', async (req, res) => {
    res.status(404).json({error: "This endpoint is deprecated. Use /api/user/profile instead."})
});


module.exports = router;

