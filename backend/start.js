#!/usr/bin/env node

/**
 * Backend Server Startup Script
 * Handles environment setup and server initialization
 */

const { app, server } = require('./src/app.js');

// Environment variables with defaults
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 API available at http://0.0.0.0:${PORT}/api`);
  console.log(`💚 Health check at http://0.0.0.0:${PORT}/health`);
  
  if (NODE_ENV === 'development') {
    console.log(`\n📋 Development endpoints:`);
    console.log(`   POST /api/auth/telegram - Telegram authentication`);
    console.log(`   GET  /api/game/user-stats - User statistics`);
    console.log(`   POST /api/game/session-start - Start game session`);
    console.log(`   POST /api/game/session-end - End game session`);
    console.log(`   GET  /api/economy/exchange-rates - Exchange rates`);
    console.log(`   POST /api/economy/exchange-points - Exchange points for coins`);
    console.log(`   POST /api/economy/withdraw - Withdraw coins`);
  }
}).on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else if (error.code === 'EACCES') {
    console.error(`❌ Permission denied to bind to port ${PORT}`);
  }
  process.exit(1);
});

