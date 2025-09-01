const express = require('express');
const router = express.Router();

// In-memory хранилище для экономики
const globalEconomy = {
  totalSupply: 850_000_000,
  issued: 0,
  dailyExchanges: new Map() // userId -> { date, amount }
};

const userEconomy = new Map(); // userId -> { points, coins, era }

// Экспортируем для использования в других модулях
if (!global.economyMaps) {
  global.economyMaps = { userEconomy };
}

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
  const userId = req.headers['x-user-id'] || 'demo-user';
  return userId;
}

// Получение текущего курса обмена
function getCurrentExchangeRate() {
  for (let i = 0; i < EXCHANGE_TIERS.length; i++) {
    if (globalEconomy.issued < EXCHANGE_TIERS[i].upTo) {
      return {
        tier: i + 1,
        rate: EXCHANGE_TIERS[i].rate,
        remainingInTier: EXCHANGE_TIERS[i].upTo - globalEconomy.issued
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
function checkDailyLimit(userId, coinsToExchange) {
  const today = new Date().toDateString();
  const userDaily = globalEconomy.dailyExchanges.get(userId) || {};
  
  if (userDaily.date !== today) {
    userDaily.date = today;
    userDaily.amount = 0;
  }
  
  const newTotal = userDaily.amount + coinsToExchange;
  if (newTotal > 100) { // Дневной лимит 100 монет
    return false;
  }
  
  userDaily.amount = newTotal;
  globalEconomy.dailyExchanges.set(userId, userDaily);
  return true;
}

// GET /api/economy/exchange-rates
router.get('/exchange-rates', (req, res) => {
  const currentRate = getCurrentExchangeRate();
  
  res.json({
    success: true,
    currentRate,
    globalStats: {
      totalSupply: globalEconomy.totalSupply,
      issued: globalEconomy.issued,
      remaining: globalEconomy.totalSupply - globalEconomy.issued
    },
    tiers: EXCHANGE_TIERS
  });
});

// POST /api/economy/exchange-points
router.post('/exchange-points', (req, res) => {
  const { coinsWanted } = req.body;
  const userId = extractUserId(req);
  
  if (!coinsWanted || coinsWanted <= 0) {
    return res.status(400).json({ error: 'Invalid coins amount' });
  }
  
  if (coinsWanted > 100) {
    return res.status(400).json({ error: 'Maximum 100 coins per exchange' });
  }
  
  // Проверяем дневной лимит
  if (!checkDailyLimit(userId, coinsWanted)) {
    return res.status(400).json({ error: 'Daily exchange limit exceeded' });
  }
  
  // Проверяем доступность монет в пуле
  if (globalEconomy.issued + coinsWanted > globalEconomy.totalSupply) {
    return res.status(400).json({ error: 'Insufficient coins in pool' });
  }
  
  const currentRate = getCurrentExchangeRate();
  const pointsRequired = coinsWanted * currentRate.rate;
  
  // Получаем данные пользователя
  const userData = userEconomy.get(userId) || { points: 0, coins: 0, era: 1 };
  
  if (userData.points < pointsRequired) {
    return res.status(400).json({ 
      error: 'Insufficient points',
      required: pointsRequired,
      available: userData.points
    });
  }
  
  // Выполняем обмен
  userData.points -= pointsRequired;
  userData.coins += coinsWanted;
  globalEconomy.issued += coinsWanted;
  
  userEconomy.set(userId, userData);
  
  res.json({
    success: true,
    exchange: {
      coinsReceived: coinsWanted,
      pointsSpent: pointsRequired,
      rate: currentRate.rate,
      tier: currentRate.tier
    },
    userStats: userData,
    globalStats: {
      issued: globalEconomy.issued,
      remaining: globalEconomy.totalSupply - globalEconomy.issued
    }
  });
});

// GET /api/economy/user-balance
router.get('/user-balance', (req, res) => {
  const userId = extractUserId(req);
  const userData = userEconomy.get(userId) || { points: 0, coins: 0, era: 1 };
  
  res.json({
    success: true,
    balance: userData
  });
});

// POST /api/economy/withdraw-coins
router.post('/withdraw-coins', (req, res) => {
  const { amount, tonAddress } = req.body;
  const userId = extractUserId(req);
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }
  
  if (!tonAddress || !tonAddress.startsWith('EQ')) {
    return res.status(400).json({ error: 'Invalid TON address' });
  }
  
  const userData = userEconomy.get(userId) || { points: 0, coins: 0, era: 1 };
  
  if (userData.coins < amount) {
    return res.status(400).json({ 
      error: 'Insufficient coins',
      available: userData.coins,
      requested: amount
    });
  }
  
  // В реальном приложении здесь будет интеграция с TON Space
  // Пока просто списываем монеты
  userData.coins -= amount;
  userEconomy.set(userId, userData);
  
  // Создаем запись о выводе
  const withdrawal = {
    id: `withdrawal_${userId}_${Date.now()}`,
    userId,
    amount,
    tonAddress,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    withdrawal,
    message: 'Withdrawal request created',
    newBalance: userData.coins
  });
});

// GET /api/economy/withdrawals
router.get('/withdrawals', (req, res) => {
  const userId = extractUserId(req);
  
  // В реальном приложении здесь будет запрос к БД
  // Пока возвращаем пустой список
  res.json({
    success: true,
    withdrawals: []
  });
});

// POST /api/economy/add-points (для тестирования)
router.post('/add-points', (req, res) => {
  const { points } = req.body;
  const userId = extractUserId(req);
  
  if (!points || points <= 0) {
    return res.status(400).json({ error: 'Invalid points amount' });
  }
  
  const userData = userEconomy.get(userId) || { points: 0, coins: 0, era: 1 };
  userData.points += points;
  userEconomy.set(userId, userData);
  
  res.json({
    success: true,
    message: 'Points added successfully',
    newBalance: userData
  });
});

// GET /api/economy/global-stats
router.get('/global-stats', (req, res) => {
  const currentRate = getCurrentExchangeRate();
  
  res.json({
    success: true,
    stats: {
      totalSupply: globalEconomy.totalSupply,
      issued: globalEconomy.issued,
      remaining: globalEconomy.totalSupply - globalEconomy.issued,
      currentRate: currentRate.rate,
      currentTier: currentRate.tier,
      totalUsers: userEconomy.size
    }
  });
});

module.exports = router;

