#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

// ==================================================================
// ADVANCED ERROR HANDLING - "BLACK BOX" RECORDER
// This must be at the very top to catch all errors.
// ==================================================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥🔥 CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  console.error('🔥🔥 CRITICAL: Uncaught Exception:', error);
  process.exit(1);
});
process.on('exit', (code) => {
  console.log(`INFO: Process is exiting with code: ${code}`);
});
// ==================================================================

/**
 * Backend Server Startup Script
 * Handles environment setup and server initialization
 */
const { checkDbConnection, initDatabase } = require('./src/database/sqlite-connection.js');
const { app, server } = require('./src/app.js');

// Environment variables with strict validation
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Strict environment validation
function validateEnvironment() {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'TELEGRAM_BOT_TOKEN'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ MISSING REQUIRED ENVIRONMENT VARIABLES:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n📋 Please set these variables in your .env file or environment');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
}

async function startServer() {
  console.log('🚀 Starting application...');
  
  // Validate environment first
  validateEnvironment();
  
  // Check database connection and initialize if needed
  const dbConnected = await checkDbConnection();
  if (!dbConnected) {
    console.error('🛑 Database connection failed. Server cannot start.');
    process.exit(1);
  }
  
  // Initialize database tables
  try {
    await initDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
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

  // Start server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔗 API available at http://0.0.0.0:${PORT}/api`);
    console.log(`💚 Health check at http://0.0.0.0:${PORT}/api/health`);
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

