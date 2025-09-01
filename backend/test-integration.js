#!/usr/bin/env node

/**
 * Backend Integration Test Script
 * Tests the main API endpoints to ensure they're working
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-123';

// Test data
const mockInitData = 'user=%7B%22id%22%3A123456%2C%22first_name%22%3A%22Test%22%2C%22username%22%3A%22testuser%22%7D&auth_date=1234567890&hash=test_hash';

async function testEndpoint(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`🔍 Testing: ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': TEST_USER_ID,
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Error: ${response.status}`);
      console.log(`   Error:`, data);
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`💥 Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Starting Backend Integration Tests\n');
  
  // Test 1: Health check
  console.log('1️⃣ Health Check');
  await testEndpoint('/health');
  console.log('');
  
  // Test 2: Exchange rates
  console.log('2️⃣ Exchange Rates');
  await testEndpoint('/api/economy/exchange-rates');
  console.log('');
  
  // Test 3: User stats (should fail without auth)
  console.log('3️⃣ User Stats (no auth)');
  await testEndpoint('/api/game/user-stats');
  console.log('');
  
  // Test 4: Start game session (should fail without auth)
  console.log('4️⃣ Start Game Session (no auth)');
  await testEndpoint('/api/game/session-start', {
    method: 'POST'
  });
  console.log('');
  
  // Test 5: Exchange points (should fail without auth)
  console.log('5️⃣ Exchange Points (no auth)');
  await testEndpoint('/api/economy/exchange-points', {
    method: 'POST',
    body: JSON.stringify({ coinsWanted: 10 })
  });
  console.log('');
  
  // Test 6: Withdraw coins (should fail without auth)
  console.log('6️⃣ Withdraw Coins (no auth)');
  await testEndpoint('/api/economy/withdraw', {
    method: 'POST',
    body: JSON.stringify({ 
      amount: 10, 
      tonAddress: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t' 
    })
  });
  console.log('');
  
  console.log('🎯 Test Summary:');
  console.log('   - Health check should work');
  console.log('   - Exchange rates should work');
  console.log('   - Protected endpoints should return 401/400');
  console.log('   - This is expected behavior without proper authentication');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Set up proper Telegram bot token in .env');
  console.log('   2. Test with real Telegram initData');
  console.log('   3. Verify WebSocket connections');
  console.log('   4. Test game session flow');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Backend server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend server is not running');
    console.log('   Please start the server with: npm run dev');
    return false;
  }
}

// Run tests if server is available
checkServer().then(isRunning => {
  if (isRunning) {
    runTests();
  } else {
    process.exit(1);
  }
});

