const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { query, get, run } = require('../database/sqlite-connection');

// Тир-система обмена (14 эр)
const EXCHANGE_TIERS = [
  { upTo: 10_000_000, rate: 1_000, era: 1 },
  { upTo: 50_000_000, rate: 2_000, era: 2 },
  { upTo: 100_000_000, rate: 4_000, era: 3 },
  { upTo: 200_000_000, rate: 8_000, era: 4 },
  { upTo: 300_000_000, rate: 16_000, era: 5 },
  { upTo: 400_000_000, rate: 32_000, era: 6 },
  { upTo: 500_000_000, rate: 64_000, era: 7 },
  { upTo: 600_000_000, rate: 128_000, era: 8 },
  { upTo: 675_000_000, rate: 256_000, era: 9 },
  { upTo: 725_000_000, rate: 512_000, era: 10 },
  { upTo: 775_000_000, rate: 1_024_000, era: 11 },
  { upTo: 815_000_000, rate: 2_048_000, era: 12 },
  { upTo: 835_000_000, rate: 4_096_000, era: 13 },
  { upTo: 850_000_000, rate: 8_192_000, era: 14 }
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

// Получение текущего курса обмена
async function getCurrentExchangeRate() {
  try {
    const result = await get('SELECT COALESCE(SUM(amount), 0) as issued FROM claims WHERE status = ?', ['completed']);
    const issued = parseInt(result.issued) || 0;
    
    for (let i = 0; i < EXCHANGE_TIERS.length; i++) {
      if (issued < EXCHANGE_TIERS[i].upTo) {
        return {
          tier: i + 1,
          era: EXCHANGE_TIERS[i].era,
          rate: EXCHANGE_TIERS[i].rate,
          remainingInTier: EXCHANGE_TIERS[i].upTo - issued
        };
      }
    }
    return {
      tier: EXCHANGE_TIERS.length,
      era: EXCHANGE_TIERS[EXCHANGE_TIERS.length - 1].era,
      rate: EXCHANGE_TIERS[EXCHANGE_TIERS.length - 1].rate,
      remainingInTier: 0
    };
  } catch (error) {
    console.error('❌ Error getting exchange rate:', error);
    // Возвращаем базовый курс в случае ошибки
    return {
      tier: 1,
      era: 1,
      rate: 1000,
      remainingInTier: 10_000_000
    };
  }
}

// Проверка дневного лимита (100 монет в день)
async function checkDailyLimit(telegramId, coinsToExchange) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await get(
      'SELECT COALESCE(SUM(amount), 0) as daily_total FROM claims WHERE user_id = (SELECT id FROM users WHERE telegramId = ?) AND DATE(created_at) = ? AND status = ?',
      [telegramId, today, 'completed']
    );
    
    const dailyTotal = parseInt(result.daily_total) || 0;
    const newTotal = dailyTotal + coinsToExchange;
    
    if (newTotal > 100) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking daily limit:', error);
    return false;
  }
}

// GET /api/economy/exchange-rates
router.get('/exchange-rates', async (req, res) => {
  try {
    const currentRate = await getCurrentExchangeRate();
    
    const result = await get('SELECT COALESCE(SUM(amount), 0) as issued FROM claims WHERE status = ?', ['completed']);
    const issued = parseInt(result.issued) || 0;
    
    res.json({
      success: true,
      currentRate,
      globalStats: {
        totalSupply: 850_000_000,
        issued: issued,
        remaining: 850_000_000 - issued
      },
      tiers: EXCHANGE_TIERS
    });

    console.log(`💱 Exchange rates retrieved. Current rate: ${currentRate.rate}, Era: ${currentRate.era}`);
  } catch (error) {
    console.error('❌ Exchange rates error:', error);
    res.status(500).json({ error: 'Failed to get exchange rates' });
  }
});

// POST /api/economy/exchange-points
router.post('/exchange-points', async (req, res) => {
  try {
    const { coinsWanted } = req.body;
    const telegramId = extractTelegramUserId(req);
    
    if (!coinsWanted || coinsWanted <= 0) {
      return res.status(400).json({ error: 'Invalid coins amount' });
    }
    
    if (coinsWanted > 100) {
      return res.status(400).json({ error: 'Maximum 100 coins per exchange' });
    }
    
    // Проверяем дневной лимит
    if (!(await checkDailyLimit(telegramId, coinsWanted))) {
      return res.status(400).json({ error: 'Daily exchange limit exceeded (100 coins per day)' });
    }
    
    const currentRate = await getCurrentExchangeRate();
    const pointsRequired = coinsWanted * currentRate.rate;
    
    // Получаем данные пользователя
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.score < pointsRequired) {
      return res.status(400).json({ 
        error: 'Insufficient points',
        required: pointsRequired,
        available: user.score
      });
    }
    
    // Начинаем транзакцию
    try {
      // Обновляем баланс пользователя
      await userService.spendPoints(telegramId, pointsRequired);
      await userService.addCoins(telegramId, coinsWanted);
      
      // Создаем запись о транзакции
      await run(
        'INSERT INTO claims (user_id, amount, points_spent, exchange_rate, era, status, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [user.id, coinsWanted, pointsRequired, currentRate.rate, currentRate.era, 'completed']
      );
      
      // Получаем обновленные данные
      const updatedUser = await userService.findByTelegramId(telegramId);
      
      res.json({
        success: true,
        exchange: {
          coinsReceived: coinsWanted,
          pointsSpent: pointsRequired,
          rate: currentRate.rate,
          tier: currentRate.tier,
          era: currentRate.era
        },
        userStats: {
          points: updatedUser.score,
          coins: updatedUser.coins,
          era: updatedUser.era
        }
      });

      console.log(`💰 Points exchanged: ${pointsRequired} points → ${coinsWanted} coins for user ${telegramId}`);
    } catch (error) {
      console.error('❌ Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('❌ Exchange points error:', error);
    res.status(500).json({ error: 'Failed to exchange points' });
  }
});

// GET /api/economy/user-balance
router.get('/user-balance', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);
    
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      balance: {
        points: user.score,
        coins: user.coins,
        era: user.era
      }
    });

    console.log(`💰 Balance retrieved for user ${telegramId}: ${user.score} points, ${user.coins} coins`);
  } catch (error) {
    console.error('❌ User balance error:', error);
    res.status(500).json({ error: 'Failed to get user balance' });
  }
});

// POST /api/economy/withdraw-coins
router.post('/withdraw-coins', async (req, res) => {
  try {
    const { amount, tonAddress } = req.body;
    const telegramId = extractTelegramUserId(req);
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }
    
    if (!tonAddress || !tonAddress.startsWith('EQ')) {
      return res.status(400).json({ error: 'Invalid TON address' });
    }
    
    // Получаем баланс пользователя
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.coins < amount) {
      return res.status(400).json({ 
        error: 'Insufficient coins',
        available: user.coins,
        requested: amount
      });
    }
    
    // Списываем монеты
    await userService.spendCoins(telegramId, amount);
    
    // Создаем запись о выводе
    await run(
      'INSERT INTO withdrawals (user_id, amount, ton_address, status, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [user.id, amount, tonAddress, 'pending']
    );
    
    // Получаем новый баланс
    const updatedUser = await userService.findByTelegramId(telegramId);
    
    res.json({
      success: true,
      message: 'Withdrawal request created successfully',
      newBalance: updatedUser.coins
    });

    console.log(`💸 Withdrawal request: ${amount} coins to ${tonAddress} for user ${telegramId}`);
  } catch (error) {
    console.error('❌ Withdraw coins error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

// GET /api/economy/withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const telegramId = extractTelegramUserId(req);
    
    const user = await userService.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const withdrawals = await query(
      'SELECT id, amount, ton_address, status, created_at FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );
    
    res.json({
      success: true,
      withdrawals: withdrawals
    });

    console.log(`📋 Withdrawals retrieved for user ${telegramId}: ${withdrawals.length} records`);
  } catch (error) {
    console.error('❌ Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

// GET /api/economy/global-stats
router.get('/global-stats', async (req, res) => {
  try {
    const currentRate = await getCurrentExchangeRate();
    
    const issuedResult = await get('SELECT COALESCE(SUM(amount), 0) as issued FROM claims WHERE status = ?', ['completed']);
    const issued = parseInt(issuedResult.issued) || 0;
    
    const usersResult = await get('SELECT COUNT(*) as total_users FROM users');
    const totalUsers = parseInt(usersResult.total_users) || 0;
    
    res.json({
      success: true,
      stats: {
        totalSupply: 850_000_000,
        issued: issued,
        remaining: 850_000_000 - issued,
        currentRate: currentRate.rate,
        currentTier: currentRate.tier,
        currentEra: currentRate.era,
        totalUsers: totalUsers
      }
    });

    console.log(`📊 Global stats retrieved. Total users: ${totalUsers}, Issued: ${issued}, Current rate: ${currentRate.rate}`);
  } catch (error) {
    console.error('❌ Global stats error:', error);
    res.status(500).json({ error: 'Failed to get global stats' });
  }
});

module.exports = router;

