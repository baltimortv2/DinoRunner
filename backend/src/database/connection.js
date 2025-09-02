const { Pool } = require('pg');

// Пул соединений PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkDbConnection() {
  let client;
  try {
    console.log('️️Attempting to connect to the database...');
    client = await pool.connect();
    console.log('✅ Database client connected. Pinging the database...');
    await client.query('SELECT NOW()'); // Простой запрос для проверки
    console.log('✅ Database ping successful! Connection is active.');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(error.stack);
    return false;
  } finally {
    if (client) {
      client.release(); // Важно освободить клиент обратно в пул
    }
  }
}

module.exports = { pool, checkDbConnection };
