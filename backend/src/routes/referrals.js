const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { get, query } = require('../database/sqlite-connection');

// Middleware для проверки JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Добавляем данные пользователя в запрос
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
  }
};

// GET /api/referrals/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await get('SELECT telegram_id FROM users WHERE id = ?', [userId]);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const referralLink = `https://t.me/${process.env.TELEGRAM_BOT_NAME}?start=${user.telegram_id}`;

    // Получаем список рефералов
    const referrals = await query(`
        SELECT u.username, u.first_name, SUM(re.points_earned) as total_earned
        FROM referrals r
        JOIN users u ON r.referee_id = u.id
        LEFT JOIN referral_earnings re ON r.referee_id = re.referee_id
        WHERE r.referrer_id = ?
        GROUP BY u.id
        ORDER BY total_earned DESC
        LIMIT 10
    `, [userId]);

    res.json({
        success: true,
        referralLink,
        referrals
    });

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch referral stats' });
  }
});

module.exports = router;

