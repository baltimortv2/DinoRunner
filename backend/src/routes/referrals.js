const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Middleware для извлечения user_id
function extractUserId(req) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    throw new Error('User ID required');
  }
  return userId;
}

// GET /api/referrals/link
router.get('/link', async (req, res) => {
  try {
    const userId = extractUserId(req);
    
    // Проверяем, есть ли пользователь
    const userResult = await pool.query(
      'SELECT id FROM users WHERE telegram_id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Генерируем реферальную ссылку
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}?ref=${userId}`;
    
    res.json({
      success: true,
      referralLink,
      userId,
      message: 'Referral link generated'
    });
  } catch (error) {
    console.error('Generate referral link error:', error);
    res.status(500).json({ error: 'Failed to generate referral link' });
  }
});

// GET /api/referrals/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = extractUserId(req);
    
    // Получаем статистику рефералов
    const referralsResult = await pool.query(
      'SELECT COUNT(*) as total_referrals FROM referrals WHERE referrer_id = $1',
      [userId]
    );
    
    const totalReferrals = parseInt(referralsResult.rows[0].total_referrals) || 0;
    
    // Получаем активных рефералов (за последние 30 дней)
    const activeReferralsResult = await pool.query(
      'SELECT COUNT(*) as active_referrals FROM referrals r JOIN users u ON r.referee_id = u.telegram_id WHERE r.referrer_id = $1 AND u.last_played > NOW() - INTERVAL \'30 days\'',
      [userId]
    );
    
    const activeReferrals = parseInt(activeReferralsResult.rows[0].active_referrals) || 0;
    
    // Получаем общий заработок от рефералов
    const earningsResult = await pool.query(
      'SELECT COALESCE(SUM(earnings), 0) as total_earnings FROM referral_earnings WHERE referrer_id = $1',
      [userId]
    );
    
    const totalEarnings = parseInt(earningsResult.rows[0].total_earnings) || 0;
    
    // Ограничиваем максимум 10 рефералов
    const maxReferrals = 10;
    const canInviteMore = totalReferrals < maxReferrals;
    
    res.json({
      success: true,
      stats: {
        totalReferrals,
        activeReferrals,
        totalEarnings,
        maxReferrals,
        canInviteMore,
        remainingSlots: Math.max(0, maxReferrals - totalReferrals)
      }
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

// POST /api/referrals/register
router.post('/register', async (req, res) => {
  try {
    const { referrerId } = req.body;
    const userId = extractUserId(req);
    
    if (!referrerId) {
      return res.status(400).json({ error: 'Referrer ID required' });
    }
    
    if (userId === referrerId) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }
    
    // Начинаем транзакцию
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Проверяем, есть ли оба пользователя
      const [userResult, referrerResult] = await Promise.all([
        client.query('SELECT id FROM users WHERE telegram_id = $1', [userId]),
        client.query('SELECT id FROM users WHERE telegram_id = $1', [userId])
      ]);
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (referrerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Referrer not found' });
      }
      
      // Проверяем, не зарегистрирован ли уже пользователь с рефералом
      const existingReferralResult = await client.query(
        'SELECT id FROM referrals WHERE referee_id = $1',
        [userId]
      );
      
      if (existingReferralResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'User already has a referrer' });
      }
      
      // Проверяем лимит рефералов для реферера
      const referrerCountResult = await client.query(
        'SELECT COUNT(*) as referral_count FROM referrals WHERE referrer_id = $1',
        [referrerId]
      );
      
      const referralCount = parseInt(referrerCountResult.rows[0].referral_count) || 0;
      
      if (referralCount >= 10) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Referrer has reached maximum referrals limit' });
      }
      
      // Регистрируем реферала
      await client.query(
        'INSERT INTO referrals (referrer_id, referee_id, join_date, created_at) VALUES ($1, $2, NOW(), NOW())',
        [referrerId, userId]
      );
      
      // Даем бонус рефереру (например, 100 монет)
      await client.query(
        'UPDATE users SET coins = coins + 100 WHERE telegram_id = $1',
        [referrerId]
      );
      
      // Записываем заработок реферера
      await client.query(
        'INSERT INTO referral_earnings (referrer_id, referee_id, earnings, created_at) VALUES ($1, $2, $3, NOW())',
        [referrerId, userId, 100]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Referral registered successfully',
        referrerId,
        refereeId: userId,
        bonus: 100
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Register referral error:', error);
    res.status(500).json({ error: 'Failed to register referral' });
  }
});

// GET /api/referrals/list
router.get('/list', async (req, res) => {
  try {
    const userId = extractUserId(req);
    const { limit = 20, offset = 0 } = req.query;
    
    // Получаем список рефералов
    const referralsResult = await pool.query(
      `SELECT r.referee_id, r.join_date, u.username, u.first_name, u.last_name, 
              u.points, u.coins, u.last_played,
              CASE WHEN u.last_played > NOW() - INTERVAL '30 days' THEN true ELSE false END as is_active
       FROM referrals r 
       JOIN users u ON r.referee_id = u.telegram_id 
       WHERE r.referrer_id = $1 
       ORDER BY r.join_date DESC 
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );
    
    const referrals = referralsResult.rows.map(row => ({
      refereeId: row.referee_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      points: row.points || 0,
      coins: row.coins || 0,
      joinDate: row.join_date,
      lastPlayed: row.last_played,
      isActive: row.is_active
    }));
    
    res.json({
      success: true,
      referrals,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: referrals.length
      }
    });
  } catch (error) {
    console.error('Get referrals list error:', error);
    res.status(500).json({ error: 'Failed to get referrals list' });
  }
});

// GET /api/referrals/earnings
router.get('/earnings', async (req, res) => {
  try {
    const userId = extractUserId(req);
    const { limit = 20, offset = 0 } = req.query;
    
    // Получаем историю заработка от рефералов
    const earningsResult = await pool.query(
      `SELECT re.referee_id, re.earnings, re.created_at, 
              u.username, u.first_name, u.last_name
       FROM referral_earnings re 
       JOIN users u ON re.referee_id = u.telegram_id 
       WHERE re.referrer_id = $1 
       ORDER BY re.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );
    
    const earnings = earningsResult.rows.map(row => ({
      refereeId: row.referee_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      earnings: row.earnings,
      createdAt: row.created_at
    }));
    
    res.json({
      success: true,
      earnings,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: earnings.length
      }
    });
  } catch (error) {
    console.error('Get referral earnings error:', error);
    res.status(500).json({ error: 'Failed to get referral earnings' });
  }
});

module.exports = router;

