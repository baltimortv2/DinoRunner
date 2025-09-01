const express = require('express');
const crypto = require('crypto');
const router = express.Router();

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
router.post('/telegram', (req, res) => {
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
  
  try {
    // Парсим initData для получения user_id
    const urlParams = new URLSearchParams(initData);
    const userId = urlParams.get('user.id');
    const username = urlParams.get('user.username');
    const firstName = urlParams.get('user.first_name');
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in initData' });
    }
    
    // В реальном приложении здесь будет создание/обновление пользователя в БД
    const user = {
      id: userId,
      username: username || null,
      firstName: firstName || null,
      createdAt: new Date().toISOString()
    };
    
    // Создаем простой JWT токен (в продакшне использовать proper JWT)
    const token = crypto.createHash('sha256')
      .update(`${userId}:${Date.now()}:${process.env.JWT_SECRET || 'dev-secret'}`)
      .digest('hex');
    
    res.json({
      success: true,
      user,
      token,
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
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
});

module.exports = router;

