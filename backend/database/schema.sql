-- ==================================================================
-- DINO RUNNER DATABASE SCHEMA (SQLite)
-- ==================================================================

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
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
    referrer_id INTEGER, -- ID пользователя, который пригласил этого
    role TEXT DEFAULT 'user', -- user, admin
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Создание таблицы игровых сессий
CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    start_time TEXT DEFAULT CURRENT_TIMESTAMP,
    end_time TEXT,
    final_score INTEGER,
    duration INTEGER, -- в миллисекундах
    is_active BOOLEAN DEFAULT 1,
    last_heartbeat TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание таблицы скинов пользователей
CREATE TABLE IF NOT EXISTS user_skins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skin_id TEXT NOT NULL,
    owned BOOLEAN DEFAULT 0,
    active BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skin_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание таблицы транзакций обмена
CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL, -- количество монет
    points_spent INTEGER NOT NULL, -- потраченные очки
    exchange_rate INTEGER NOT NULL, -- курс обмена
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание таблицы выводов монет
CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    ton_address TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, completed, failed, rejected
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    processed_at TEXT,
    tx_hash TEXT,
    admin_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Создание таблицы рефералов
CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL, -- Кто пригласил
    referee_id INTEGER NOT NULL UNIQUE, -- Кого пригласили (может быть только один реферер)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание таблицы заработка от рефералов
CREATE TABLE IF NOT EXISTS referral_earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL,
    referee_id INTEGER NOT NULL,
    points_earned INTEGER NOT NULL, -- количество очков
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_coins ON users(coins DESC);
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skins_user_id ON user_skins(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);

-- ==================================================================
-- ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА
-- ==================================================================

