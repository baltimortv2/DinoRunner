const express = require('express');
const router = express.Router();

// In-memory хранилище для рефералов
const referrals = new Map(); // userId -> { referrerId, joinDate, totalEarnings }
const referrerStats = new Map(); // referrerId -> { referrals: [userId], totalEarnings }

// Middleware для извлечения user_id
function extractUserId(req) {
  const userId = req.headers['x-user-id'] || 'demo-user';
  return userId;
}

// GET /api/referrals/link
router.get('/link', (req, res) => {
  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Генерируем реферальную ссылку
  const baseUrl = process.env.TELEGRAM_APP_URL || 'https://t.me/your_bot_name/app';
  const referralLink = `${baseUrl}?startapp=ref_${userId}`;
  
  res.json({
    success: true,
    referralLink,
    userId,
    message: 'Referral link generated'
  });
});

// GET /api/referrals/stats
router.get('/stats', (req, res) => {
  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const stats = referrerStats.get(userId) || { 
    referrals: [], 
    totalEarnings: 0,
    activeReferrals: 0
  };
  
  // Ограничиваем максимум 10 рефералов
  const maxReferrals = 10;
  const canInviteMore = stats.referrals.length < maxReferrals;
  
  res.json({
    success: true,
    stats: {
      ...stats,
      maxReferrals,
      canInviteMore,
      remainingSlots: Math.max(0, maxReferrals - stats.referrals.length)
    }
  });
});

// POST /api/referrals/register
router.post('/register', (req, res) => {
  const { referrerId } = req.body;
  const userId = extractUserId(req);
  
  if (!userId || !referrerId) {
    return res.status(400).json({ error: 'User ID and referrer ID required' });
  }
  
  if (userId === referrerId) {
    return res.status(400).json({ error: 'Cannot refer yourself' });
  }
  
  // Проверяем, не зарегистрирован ли уже пользователь с рефералом
  if (referrals.has(userId)) {
    return res.status(400).json({ error: 'User already has a referrer' });
  }
  
  // Проверяем лимит рефералов для реферера
  const referrerData = referrerStats.get(referrerId) || { referrals: [], totalEarnings: 0 };
  if (referrerData.referrals.length >= 10) {
    return res.status(400).json({ error: 'Referrer has reached maximum referrals limit' });
  }
  
  // Регистрируем реферала
  referrals.set(userId, {
    referrerId,
    joinDate: new Date().toISOString(),
    totalEarnings: 0
  });
  
  // Обновляем статистику реферера
  referrerData.referrals.push(userId);
  referrerStats.set(referrerId, referrerData);
  
  res.json({
    success: true,
    message: 'Referral registered successfully',
    referrerId,
    refereeId: userId
  });
});

// POST /api/referrals/earn
router.post('/earn', (req, res) => {
  const { userId, coinsEarned } = req.body;
  const requestUserId = extractUserId(req);
  
  if (!userId || !coinsEarned) {
    return res.status(400).json({ error: 'User ID and coins earned required' });
  }
  
  const referralData = referrals.get(userId);
  if (!referralData) {
    return res.json({
      success: true,
      message: 'No referral bonus applicable',
      bonus: 0
    });
  }
  
  const referrerId = referralData.referrerId;
  const bonusCoins = Math.floor(coinsEarned * 0.1); // 10% бонус
  
  // Начисляем бонус рефереру
  if (userEconomy.has(referrerId)) {
    const referrerEcon = userEconomy.get(referrerId);
    referrerEcon.coins += bonusCoins;
    userEconomy.set(referrerId, referrerEcon);
    
    // Обновляем статистику
    const referrerData = referrerStats.get(referrerId) || { referrals: [], totalEarnings: 0 };
    referrerData.totalEarnings += bonusCoins;
    referrerStats.set(referrerId, referrerData);
    
    referralData.totalEarnings += bonusCoins;
    referrals.set(userId, referralData);
    
    // Уведомляем реферера через WebSocket
    const referrerSocket = req.wsConnections?.get(referrerId);
    if (referrerSocket && referrerSocket.readyState === WebSocket.OPEN) {
      referrerSocket.send(JSON.stringify({
        type: 'referral:bonus-earned',
        payload: {
          bonus: bonusCoins,
          fromUserId: userId,
          totalEarnings: referrerData.totalEarnings
        }
      }));
    }
  }
  
  res.json({
    success: true,
    message: 'Referral bonus processed',
    bonus: bonusCoins,
    referrerId
  });
});

// GET /api/referrals/list/:userId
router.get('/list/:userId', (req, res) => {
  const requestUserId = extractUserId(req);
  const targetUserId = req.params.userId;
  
  // Проверяем права доступа - можно смотреть только свои рефералы
  if (requestUserId !== targetUserId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const stats = referrerStats.get(targetUserId) || { referrals: [], totalEarnings: 0 };
  
  // Возвращаем список рефералов с анонимизированными данными
  const referralsList = stats.referrals.map(refId => {
    const refData = referrals.get(refId) || {};
    return {
      id: refId.substring(0, 8) + '...',
      joinDate: refData.joinDate,
      earnings: refData.totalEarnings || 0
    };
  });
  
  res.json({
    success: true,
    referrals: referralsList,
    totalEarnings: stats.totalEarnings,
    count: stats.referrals.length,
    maxReferrals: 10
  });
});

module.exports = router;

