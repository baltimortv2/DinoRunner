const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ==================================================================
// RATE LIMITING
// ==================================================================

// Rate limiter for health check endpoint
const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs for health endpoint
  message: 'Too many health check requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================================================================
// MIDDLEWARE
// ==================================================================

// Trust proxy for rate limiting and correct IP detection
app.set('trust proxy', 1);

// Request Logger - minimal logging for production
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // Only log non-health check requests
    if (req.originalUrl !== '/api/health') {
      console.log(`➡️  ${req.method} ${req.originalUrl}`);
    }
    next();
  });
}

// Map to store userId -> ws connection
const wsConnections = new Map();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "connect-src": ["'self'", "wss:", "https:", "blob:"],
      "img-src": ["'self'", "data:", "blob:"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://telegram.org", "blob:"],
      "script-src-elem": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://telegram.org", "blob:"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "worker-src": ["'self'", "blob:"],
      "frame-src": ["'self'", "https://t.me", "https://web.telegram.org"],
      "frame-ancestors": ["'self'", "https://web.telegram.org", "https://t.me"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
    }
  },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// Дублируем CSP заголовок для nginx кешей и статических ответов
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self' https://web.telegram.org https://t.me; img-src 'self' data: blob:; object-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org blob:; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org blob:; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' https: wss: blob:");
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы от Telegram WebApp
    const allowedOrigins = [
      'https://web.telegram.org',
      'https://t.me',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ];
    
    // Разрешаем запросы без origin (например, из мобильного приложения)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // В продакшене разрешаем все для Telegram
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-User-Id', 'X-Telegram-Init-Data']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Pass wss to routes
app.use((req, res, next) => {
  req.wss = wss;
  req.wsConnections = wsConnections;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Apply stricter rate limiting to health check
app.get('/api/health', healthLimiter, (req, res) => {
  res.status(200).send('OK');
});

// API routes
app.use('/api/game', require('./routes/game'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/economy', require('./routes/economy'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/withdrawals', require('./routes/withdrawals'));

// Test endpoint for development
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']
  });
});

// Test user stats endpoint for development
app.get('/api/game/user-stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalPoints: 0,
      totalCoins: 100,
      currentEra: 1,
      gamesPlayed: 0,
      bestScore: 0
    }
  });
});

// Test game session endpoints for development
app.post('/api/game/session-start', (req, res) => {
  const sessionId = 'dev-session-' + Date.now();
  res.json({
    success: true,
    sessionId: sessionId,
    message: 'Game session started (dev mode)'
  });
});

app.post('/api/game/session-end', (req, res) => {
  const { sessionId, score, duration } = req.body;
  res.json({
    success: true,
    sessionId: sessionId,
    score: score,
    duration: duration,
    message: 'Game session ended (dev mode)'
  });
});

app.post('/api/game/heartbeat', (req, res) => {
  const { sessionId } = req.body;
  res.json({
    success: true,
    sessionId: sessionId,
    timestamp: Date.now(),
    message: 'Heartbeat received (dev mode)'
  });
});

// Test economy endpoints for development
app.get('/api/economy/exchange-rates', (req, res) => {
  res.json({
    success: true,
    rates: {
      pointsToCoins: 1000,
      coinsToPoints: 1
    }
  });
});

app.post('/api/economy/exchange-points', (req, res) => {
  const { coinsWanted } = req.body;
  res.json({
    success: true,
    coinsWanted: coinsWanted,
    newStats: {
      totalPoints: 0,
      totalCoins: 100 + coinsWanted
    },
    message: 'Points exchanged for coins (dev mode)'
  });
});

app.post('/api/economy/withdraw', (req, res) => {
  const { amount, tonAddress } = req.body;
  res.json({
    success: true,
    amount: amount,
    tonAddress: tonAddress,
    newStats: {
      totalCoins: 100 - amount
    },
    message: 'Coins withdrawn (dev mode)'
  });
});

// Test shop endpoints for development
app.get('/api/shop/skins', (req, res) => {
  res.json({
    success: true,
    skins: [
      // Characters - анимированные спрайты (Run1, Run2, Crouch1, Crouch2)
      { id: 'char-standart', name: 'Персонаж: Стандартный', price: 0, type: 'character', packName: 'standart', owned: true },
      { id: 'char-sonic', name: 'Персонаж: Sonic', price: 500, type: 'character', packName: 'sonic', owned: false },
      { id: 'char-premium', name: 'Персонаж: Premium', price: 1000, type: 'character', packName: 'premium', owned: false },
      
      // Ground - текстуры земли
      { id: 'ground-standart', name: 'Земля: Стандарт', price: 0, type: 'ground', packName: 'standart', owned: true },
      { id: 'ground-sonic', name: 'Земля: Sonic', price: 200, type: 'ground', packName: 'sonic', owned: false },
      { id: 'ground-premium', name: 'Земля: Premium', price: 300, type: 'ground', packName: 'premium', owned: false },
      
      // Enemies: ground - наземные враги разных размеров
      { id: 'enemies-ground-standart', name: 'Наземные враги: Стандарт', price: 0, type: 'enemiesGround', packName: 'standart', owned: true },
      { id: 'enemies-ground-sonic', name: 'Наземные враги: Sonic', price: 250, type: 'enemiesGround', packName: 'sonic', owned: false },
      { id: 'enemies-ground-premium', name: 'Наземные враги: Premium', price: 400, type: 'enemiesGround', packName: 'premium', owned: false },
      
      // Enemies: air - воздушные враги с анимацией (AirEnemy1, AirEnemy2)
      { id: 'enemies-air-standart', name: 'Воздушные враги: Стандарт', price: 0, type: 'enemiesAir', packName: 'standart', owned: true },
      { id: 'enemies-air-sonic', name: 'Воздушные враги: Sonic', price: 200, type: 'enemiesAir', packName: 'sonic', owned: false },
      { id: 'enemies-air-premium', name: 'Воздушные враги: Premium', price: 350, type: 'enemiesAir', packName: 'premium', owned: false },
      
      // Clouds - декоративные элементы
      { id: 'clouds-standart', name: 'Облака: Стандарт', price: 0, type: 'clouds', packName: 'standart', owned: true },
      { id: 'clouds-sonic', name: 'Облака: Sonic', price: 150, type: 'clouds', packName: 'sonic', owned: false },
      { id: 'clouds-premium', name: 'Облака: Premium', price: 250, type: 'clouds', packName: 'premium', owned: false }
    ],
    activeSkins: {
      character: 'standart',
      ground: 'standart',
      enemiesGround: 'standart',
      enemiesAir: 'standart',
      clouds: 'standart'
    }
  });
});

app.post('/api/shop/purchase', (req, res) => {
  const { skinId } = req.body;
  res.json({
    success: true,
    skinId: skinId,
    newBalance: 1000, // Мок баланс
    message: `Skin ${skinId} purchased (dev mode)`
  });
});

app.post('/api/shop/activate', (req, res) => {
  const { skinId } = req.body;
  
  // Определяем тип скина и устанавливаем его как активный
  let activeSkins = {
    character: 'standart',
    ground: 'standart',
    enemiesGround: 'standart',
    enemiesAir: 'standart',
    clouds: 'standart'
  };
  
  if (skinId.startsWith('char-')) {
    activeSkins.character = skinId.replace('char-', '');
  } else if (skinId.startsWith('ground-')) {
    activeSkins.ground = skinId.replace('ground-', '');
  } else if (skinId.startsWith('enemies-ground-')) {
    activeSkins.enemiesGround = skinId.replace('enemies-ground-', '');
  } else if (skinId.startsWith('enemies-air-')) {
    activeSkins.enemiesAir = skinId.replace('enemies-air-', '');
  } else if (skinId.startsWith('clouds-')) {
    activeSkins.clouds = skinId.replace('clouds-', '');
  }
  
  res.json({
    success: true,
    skinId: skinId,
    activeSkins: activeSkins,
    message: `Skin ${skinId} activated (dev mode)`
  });
});

// Telegram Authentication endpoints
app.post('/api/auth/telegram/validate', (req, res) => {
  const { initData, userData } = req.body;
  
  if (!initData || !userData) {
    return res.status(400).json({
      success: false,
      error: 'Missing initData or userData'
    });
  }

  try {
    // TODO: В продакшене здесь должна быть реальная валидация initData
    // с использованием секретного ключа бота и HMAC-SHA256
    console.log('🔐 Validating Telegram initData for user:', userData.id);
    
    // Для разработки просто принимаем данные
    const token = `telegram_${userData.id}_${Date.now()}`;
    
    res.json({
      success: true,
      token: token,
      user: userData,
      message: 'Telegram authentication successful (dev mode)'
    });
  } catch (error) {
    console.error('❌ Telegram validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    });
  }
});

// User profile endpoints
app.get('/api/user/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  const token = authHeader.substring(7);
  console.log('👤 Fetching profile for token:', token);
  
  // TODO: В продакшене здесь должна быть проверка JWT токена
  // Для разработки возвращаем mock данные
  res.json({
    success: true,
    profile: {
      telegramId: 12345,
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      stats: {
        totalScore: 0,
        totalCoins: 0,
        gamesPlayed: 0,
        bestScore: 0,
        currentEra: 1
      },
      skins: {
        owned: ['char-standart', 'ground-standart', 'enemies-ground-standart', 'enemies-air-standart', 'clouds-standart'],
        active: {
          character: 'standart',
          ground: 'standart',
          enemiesGround: 'standart',
          enemiesAir: 'standart',
          clouds: 'standart'
        }
      }
    }
  });
});

app.put('/api/user/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  const token = authHeader.substring(7);
  const profileData = req.body;
  
  console.log('👤 Updating profile for token:', token, profileData);
  
  // TODO: В продакшене здесь должно быть сохранение в базу данных
  res.json({
    success: true,
    message: 'Profile updated successfully (dev mode)'
  });
});

// Test referral endpoints for development
app.get('/api/referrals/link', (req, res) => {
  res.json({
    success: true,
    referralLink: 'https://t.me/your_bot?start=dev123',
    message: 'Referral link generated (dev mode)'
  });
});

app.get('/api/referrals/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalReferrals: 0,
      totalEarnings: 0,
      referralCode: 'DEV123'
    }
  });
});

app.post('/api/referrals/register', (req, res) => {
  const { referralCode } = req.body;
  res.json({
    success: true,
    referralCode: referralCode,
    message: 'Referral registered (dev mode)'
  });
});

// Test leaderboard endpoint for development
app.get('/api/game/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({
    success: true,
    leaderboard: [
      { rank: 1, username: 'Player1', points: 10000, era: 3 },
      { rank: 2, username: 'Player2', points: 8000, era: 2 },
      { rank: 3, username: 'Player3', points: 6000, era: 2 }
    ].slice(0, limit)
  });
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html for all non-API routes (SPA)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Serve frontend for all other routes
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  // Extract userId from headers or query params
  const userId = req.headers['x-user-id'] || new URLSearchParams(req.url.split('?')[1]).get('userId');
  if (userId) {
    wsConnections.set(userId, ws);
    console.log(`WebSocket associated with userId: ${userId}`);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    if (userId) {
      wsConnections.delete(userId);
    }
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleWebSocketMessage(ws, data) {
  const { type, payload } = data;

  switch (type) {
    case 'game:session-start':
      // Handle game session start
      ws.send(JSON.stringify({
        type: 'game:session-started',
        payload: { sessionId: payload.sessionId }
      }));
      break;

    case 'game:heartbeat':
      // Handle heartbeat for activity validation
      ws.send(JSON.stringify({
        type: 'game:heartbeat-ack',
        payload: { timestamp: Date.now() }
      }));
      break;

    case 'game:session-end':
      // Handle game session end with score validation
      ws.send(JSON.stringify({
        type: 'game:session-validated',
        payload: { valid: true, points: payload.points }
      }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

module.exports = { app, server, wss };
