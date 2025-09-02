const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Тир-система обмена
const EXCHANGE_TIERS = [
  { upTo: 10_000_000, rate: 1_000 },
  { upTo: 50_000_000, rate: 2_000 },
  { upTo: 100_000_000, rate: 4_000 },
  { upTo: 200_000_000, rate: 8_000 },
  { upTo: 300_000_000, rate: 16_000 },
  { upTo: 400_000_000, rate: 32_000 },
  { upTo: 500_000_000, rate: 64_000 },
  { upTo: 600_000_000, rate: 128_000 },
  { upTo: 675_000_000, rate: 256_000 },
  { upTo: 725_000_000, rate: 512_000 },
  { upTo: 775_000_000, rate: 1_024_000 },
  { upTo: 815_000_000, rate: 2_048_000 },
  { upTo: 835_000_000, rate: 4_096_000 },
  { upTo: 850_000_000, rate: 8_192_000 }
];

// Middleware для извлечения user_id
function extractUserId(req) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    throw new Error('User ID required');
  }
  return userId;
}

// Получение текущего курса обмена
async function getCurrentExchangeRate() {
  const result = await pool.query('SELECT COALESCE(SUM(amount), 0) as issued FROM claims WHERE status = $1', ['completed']);
  const issued = parseInt(result.rows[0].issued) || 0;
  
  for (let i = 0; i < EXCHANGE_TIERS.length; i++) {
    if (issued < EXCHANGE_TIERS[i].upTo) {
      return {
        tier: i + 1,
        rate: EXCHANGE_TIERS[i].rate,
        remainingInTier: EXCHANGE_TIERS[i].upTo - issued
      };
    }
  }
  return {
    tier: EXCHANGE_TIERS.length,
    rate: EXCHANGE_TIERS[EXCHANGE_TIERS.length - 1].rate,
    remainingInTier: 0
  };
}

// Проверка дневного лимита
async function checkDailyLimit(userId, coinsToExchange) {
  const today = new Date().toDateString();
  
  const result = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as daily_total FROM claims WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = $2',
    [userId, 'completed']
  );
  
  const dailyTotal = parseInt(result.rows[0].daily_total) || 0;
  const newTotal = dailyTotal + coinsToExchange;
  
  if (newTotal > 100) { // Дневной лимит 100 монет
    return false;
  }
  
  return true;
}

// GET /api/economy/exchange-rates
router.get('/exchange-rates', async (req, res) => {
  try {
    const currentRate = await getCurrentExchangeRate();
    
    const result = await pool.query('SELECT COALESCE(SUM(amount), 0) as issued FROM claims WHERE status = $1', ['completed']);
    const issued = parseInt(result.rows[0].issued) || 0;
    
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
  } catch (error) {
    console.error('Exchange rates error:', error);
    res.status(500).json({ error: 'Failed to get exchange rates' });
  }
});

// POST /api/economy/exchange-points
router.post('/exchange-points', async (req, res) => {
  try {
    const { coinsWanted } = req.body;
    const userId = extractUserId(req);
    
    if (!coinsWanted || coinsWanted <= 0) {
      return res.status(400).json({ error: 'Invalid coins amount' });
    }
    
    if (coinsWanted > 100) {
      return res.status(400).json({ error: 'Maximum 100 coins per exchange' });
    }
    
    // Проверяем дневной лимит
    if (!(await checkDailyLimit(userId, coinsWanted))) {
      return res.status(400).json({ error: 'Daily exchange limit exceeded' });
    }
    
    const currentRate = await getCurrentExchangeRate();
    const pointsRequired = coinsWanted * currentRate.rate;
    
    // Получаем данные пользователя
    const userResult = await pool.query(
      'SELECT points, coins, era FROM users WHERE telegram_id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userResult.rows[0];
    
    if (userData.points < pointsRequired) {
      return res.status(400).json({ 
        error: 'Insufficient points',
        required: pointsRequired,
        available: userData.points
      });
    }
    
    // Начинаем транзакцию
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Обновляем баланс пользователя
      await client.query(
        'UPDATE users SET points = points - $1, coins = coins + $2 WHERE telegram_id = $3',
        [pointsRequired, coinsWanted, userId]
      );
      
      // Создаем запись о транзакции
      await client.query(
        'INSERT INTO claims (user_id, amount, points_spent, exchange_rate, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [userId, coinsWanted, pointsRequired, currentRate.rate, 'completed']
      );
      
      await client.query('COMMIT');
      
      // Получаем обновленные данные
      const updatedResult = await pool.query(
        'SELECT points, coins, era FROM users WHERE telegram_id = $1',
        [userId]
      );
      
      res.json({
        success: true,
        exchange: {
          coinsReceived: coinsWanted,
          pointsSpent: pointsRequired,
          rate: currentRate.rate,
          tier: currentRate.tier
        },
        userStats: updatedResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Exchange points error:', error);
    res.status(500).json({ error: 'Failed to exchange points' });
  }
});

// GET /api/economy/user-balance
router.get('/user-balance', async (req, res) => {
  try {
    const userId = extractUserId(req);
    
    const result = await pool.query(
      'SELECT points, coins, era FROM users WHERE telegram_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      balance: result.rows[0]
    });
  } catch (error) {
    console.error('User balance error:', error);
    res.status(500).json({ error: 'Failed to get user balance' });
  }
});

// POST /api/economy/withdraw-coins
router.post('/withdraw-coins', async (req, res) => {
  try {
    const { amount, tonAddress } = req.body;
    const userId = extractUserId(req);
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }
    
    if (!tonAddress || !tonAddress.startsWith('EQ')) {
      return res.status(400).json({ error: 'Invalid TON address' });
    }
    
    // Получаем баланс пользователя
    const userResult = await pool.query(
      'SELECT coins FROM users WHERE telegram_id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userResult.rows[0];
    
    if (userData.coins < amount) {
      return res.status(400).json({ 
        error: 'Insufficient coins',
        available: userData.coins,
        requested: amount
      });
    }
    
    // Начинаем транзакцию
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Списываем монеты
      await client.query(
        'UPDATE users SET coins = coins - $1 WHERE telegram_id = $2',
        [amount, userId]
      );
      
      // Создаем запись о выводе
      await client.query(
        'INSERT INTO withdrawals (user_id, amount, ton_address, status, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [userId, amount, tonAddress, 'pending']
      );
      
      await client.query('COMMIT');
      
      // Получаем новый баланс
      const balanceResult = await pool.query(
        'SELECT coins FROM users WHERE telegram_id = $1',
        [userId]
      );
      
      res.json({
        success: true,
        message: 'Withdrawal request created',
        newBalance: balanceResult.rows[0].coins
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Withdraw coins error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

// GET /api/economy/withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const userId = extractUserId(req);
    
    const result = await pool.query(
      'SELECT id, amount, ton_address, status, created_at FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      success: true,
      withdrawals: result.rows
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

// GET /api/economy/global-stats
router.get('/global-stats', async (req, res) => {
  try {
    const currentRate = await getCurrentExchangeRate();
    
    const issuedResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as issued FROM claims WHERE status = $1', ['completed']);
    const issued = parseInt(issuedResult.rows[0].issued) || 0;
    
    const usersResult = await pool.query('SELECT COUNT(*) as total_users FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total_users) || 0;
    
    res.json({
      success: true,
      stats: {
        totalSupply: 850_000_000,
        issued: issued,
        remaining: 850_000_000 - issued,
        currentRate: currentRate.rate,
        currentTier: currentRate.tier,
        totalUsers: totalUsers
      }
    });
  } catch (error) {
    console.error('Global stats error:', error);
    res.status(500).json({ error: 'Failed to get global stats' });
  }
});

module.exports = router;

