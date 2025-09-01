#!/usr/bin/env node

/**
 * Backend Server Startup Script
 * Handles environment setup and server initialization
 */
const { checkDbConnection } = require('./src/database/connection.js');
const { app, server } = require('./src/app.js');

// Environment variables with defaults
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  console.log('🚀 Starting application...');
  
  // Check if we're in the right directory
  console.log('📁 Current working directory:', process.cwd());

  const dbConnected = await checkDbConnection();
  if (!dbConnected && NODE_ENV === 'production') {
    console.error('🛑 Halting server start due to database connection failure.');
    process.exit(1);
  }

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
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔗 API available at http://0.0.0.0:${PORT}/api`);
    console.log(`💚 Health check at http://0.0.0.0:${PORT}/health`);
    console.log(`🎮 Frontend available at http://0.0.0.0:${PORT}/`);
    
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
    console.error(`❌ Error code: ${error.code}`);
    console.error(`❌ Error message: ${error.message}`);
    
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    } else if (error.code === 'EACCES') {
      console.error(`❌ Permission denied to bind to port ${PORT}`);
    } else if (error.code === 'EADDRNOTAVAIL') {
      console.error(`❌ Address not available`);
    }
    
    process.exit(1);
  });
}

startServer();

