const express = require('express');
const router = express.Router();
const { ERAS } = require('../config/gameConfig');

// In-memory хранилище для разработки
const gameSessions = new Map();
const userStats = new Map();

// Middleware для извлечения user_id из токена (упрощенная версия)
function extractUserId(req) {
  // В реальном приложении здесь будет валидация JWT
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  // Простая демо-логика: токен содержит user_id
  const userId = req.headers['x-user-id'] || 'demo-user';
  return userId;
}

// GET /api/game/user-stats
router.get('/user-stats', (req, res) => {
  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const stats = userStats.get(userId) || {
    totalPoints: 0,
    totalCoins: 0,
    currentEra: 1,
    gamesPlayed: 0,
    bestScore: 0,
    lastPlayed: null
  };
  
  res.json({
    success: true,
    stats
  });
});

// POST /api/game/session-start
router.post('/session-start', (req, res) => {
  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const sessionId = `session_${userId}_${Date.now()}`;
  const session = {
    id: sessionId,
    userId,
    startTime: Date.now(),
    isActive: true,
    lastHeartbeat: Date.now()
  };
  
  gameSessions.set(sessionId, session);
  
  res.json({
    success: true,
    sessionId,
    message: 'Game session started'
  });
});

// POST /api/game/heartbeat
router.post('/heartbeat', (req, res) => {
  const { sessionId } = req.body;
  const userId = extractUserId(req);
  
  if (!sessionId || !userId) {
    return res.status(400).json({ error: 'Session ID and user ID required' });
  }
  
  const session = gameSessions.get(sessionId);
  if (!session || session.userId !== userId) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.lastHeartbeat = Date.now();
  
  res.json({
    success: true,
    timestamp: Date.now()
  });
});

// POST /api/game/session-end
router.post('/session-end', (req, res) => {
  const { sessionId, score, duration } = req.body;
  const userId = extractUserId(req);
  
  if (!sessionId || !userId) {
    return res.status(400).json({ error: 'Session ID and user ID required' });
  }
  
  const session = gameSessions.get(sessionId);
  if (!session || session.userId !== userId) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Валидация очков
  const sessionDuration = (Date.now() - session.startTime) / 1000; // секунды
  const maxPointsPerSecond = 50; // максимум очков в секунду
  const maxPossibleScore = Math.floor(sessionDuration * maxPointsPerSecond);
  
  if (score > maxPossibleScore) {
    console.warn(`Suspicious score: ${score} for session ${sessionId}`);
    return res.status(400).json({ 
      error: 'Invalid score',
      maxAllowed: maxPossibleScore
    });
  }
  
  if (score > 30000) {
    console.warn(`Score too high: ${score} for session ${sessionId}`);
    return res.status(400).json({ 
      error: 'Score exceeds maximum allowed',
      maxAllowed: 30000
    });
  }
  
  // Обновляем статистику пользователя
  const stats = userStats.get(userId) || {
    totalPoints: 0,
    totalCoins: 0,
    currentEra: 1,
    gamesPlayed: 0,
    bestScore: 0,
    lastPlayed: null
  };
  
  stats.totalPoints += score;
  stats.gamesPlayed += 1;
  stats.bestScore = Math.max(stats.bestScore, score);
  stats.lastPlayed = new Date().toISOString();
  
  // Определяем эру на основе общего количества очков
  const newEra = getEraByPoints(stats.totalPoints);
  if (newEra.id > stats.currentEra) {
    stats.currentEra = newEra.id;
    
    // Отправляем WebSocket уведомление о смене эры
    const userSocket = req.wsConnections.get(userId);
    if (userSocket && userSocket.readyState === WebSocket.OPEN) {
      userSocket.send(JSON.stringify({
        type: 'game:era-changed',
        payload: {
          newEraId: newEra.id,
          newEraName: newEra.name,
          totalPoints: stats.totalPoints
        }
      }));
    }
  }
  
  userStats.set(userId, stats);
  
  // Завершаем сессию
  session.isActive = false;
  session.endTime = Date.now();
  session.finalScore = score;
  
  res.json({
    success: true,
    validatedScore: score,
    newStats: stats,
    message: 'Session ended successfully'
  });
});

// GET /api/game/leaderboard
router.get('/leaderboard', (req, res) => {
  const { limit = 10 } = req.query;
  
  // Создаем топ игроков по общим очкам
  const leaderboard = Array.from(userStats.entries())
    .map(([userId, stats]) => ({
      userId,
      totalPoints: stats.totalPoints,
      bestScore: stats.bestScore,
      gamesPlayed: stats.gamesPlayed,
      currentEra: stats.currentEra
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, parseInt(limit));
  
  res.json({
    success: true,
    leaderboard,
    total: userStats.size
  });
});

// GET /api/game/sessions/:sessionId
router.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const userId = extractUserId(req);
  
  const session = gameSessions.get(sessionId);
  if (!session || session.userId !== userId) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    success: true,
    session: {
      id: session.id,
      startTime: session.startTime,
      isActive: session.isActive,
      lastHeartbeat: session.lastHeartbeat,
      endTime: session.endTime,
      finalScore: session.finalScore
    }
  });
});

// Определение эры по очкам
function getEraByPoints(totalPoints) {
  for (let i = ERAS.length - 1; i >= 0; i--) {
    if (totalPoints >= ERAS[i].pointsToUnlock) {
      return ERAS[i];
    }
  }
  return ERAS[0]; // Каменный век по умолчанию
}

// Очистка старых сессий (вызывается периодически)
function cleanupOldSessions() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 часа
  
  for (const [sessionId, session] of gameSessions.entries()) {
    if (now - session.lastHeartbeat > maxAge) {
      gameSessions.delete(sessionId);
    }
  }
}

// Запускаем очистку каждые 30 минут
setInterval(cleanupOldSessions, 30 * 60 * 1000);

module.exports = router;
