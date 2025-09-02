const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Создаем подключение к SQLite базе данных
const dbPath = path.join(__dirname, '../../dinorunner.db');
const db = new sqlite3.Database(dbPath);

// Функция для проверки подключения
function checkDbConnection() {
  return new Promise((resolve, reject) => {
    db.get('SELECT 1', (err, row) => {
      if (err) {
        console.log('❌ SQLite connection failed:', err.message);
        resolve(false);
      } else {
        console.log('✅ SQLite connection successful!');
        resolve(true);
      }
    });
  });
}

// Функция для инициализации базы данных
function initDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🗄️ Initializing SQLite database...');
    
    // Создаем таблицы
    db.serialize(() => {
      // Таблица пользователей
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        points INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 0,
        era INTEGER DEFAULT 1,
        games_played INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        last_played TEXT,
        active_character TEXT DEFAULT 'standart',
        active_ground TEXT DEFAULT 'standart',
        active_enemies_ground TEXT DEFAULT 'standart',
        active_enemies_air TEXT DEFAULT 'standart',
        active_clouds TEXT DEFAULT 'standart',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);

      // Таблица игровых сессий
      db.run(`CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        start_time TEXT DEFAULT CURRENT_TIMESTAMP,
        end_time TEXT,
        final_score INTEGER,
        duration INTEGER,
        is_active INTEGER DEFAULT 1,
        last_heartbeat TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(telegram_id)
      )`);

      // Таблица скинов пользователей
      db.run(`CREATE TABLE IF NOT EXISTS user_skins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skin_id TEXT NOT NULL,
        owned INTEGER DEFAULT 0,
        active INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(telegram_id),
        UNIQUE(user_id, skin_id)
      )`);

      // Таблица транзакций обмена
      db.run(`CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        points_spent INTEGER NOT NULL,
        exchange_rate INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(telegram_id)
      )`);

      // Таблица выводов монет
      db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        ton_address TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(telegram_id)
      )`);

      // Таблица рефералов
      db.run(`CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_id INTEGER NOT NULL,
        referee_id INTEGER NOT NULL,
        join_date TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referrer_id) REFERENCES users(telegram_id),
        FOREIGN KEY (referee_id) REFERENCES users(telegram_id),
        UNIQUE(referee_id)
      )`);

      // Таблица заработка от рефералов
      db.run(`CREATE TABLE IF NOT EXISTS referral_earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_id INTEGER NOT NULL,
        referee_id INTEGER NOT NULL,
        earnings INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referrer_id) REFERENCES users(telegram_id),
        FOREIGN KEY (referee_id) REFERENCES users(telegram_id)
      )`);

      console.log('✅ Database tables created successfully!');
      resolve();
    });
  });
}

// Функция для выполнения запросов
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Функция для выполнения одного запроса
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Функция для выполнения запросов без возврата данных
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Функция для транзакций
function transaction(callback) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      callback(db)
        .then(() => {
          db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve();
          });
        })
        .catch((err) => {
          db.run('ROLLBACK', () => {
            reject(err);
          });
        });
    });
  });
}

module.exports = {
  db,
  checkDbConnection,
  initDatabase,
  query,
  get,
  run,
  transaction
};
