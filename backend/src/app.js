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

// Map to store userId -> ws connection
const wsConnections = new Map();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
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
app.use('/api/game', require('./routes/game'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/economy', require('./routes/economy'));
app.use('/api/referrals', require('./routes/referrals'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Health check for Railway
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from frontend directory (after API routes)
app.use(express.static(path.join(__dirname, '../../frontend')));

// Serve index.html for all routes (SPA) - but exclude API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Serve frontend for all other routes
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  // Simple way to associate ws with userId for push notifications
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
