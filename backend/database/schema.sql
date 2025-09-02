-- ==================================================================
-- DINO RUNNER DATABASE SCHEMA
-- ==================================================================

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    points BIGINT DEFAULT 0,
    coins INTEGER DEFAULT 0,
    era INTEGER DEFAULT 1,
    games_played INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    last_played TIMESTAMP,
    active_character VARCHAR(50) DEFAULT 'standart',
    active_ground VARCHAR(50) DEFAULT 'standart',
    active_enemies_ground VARCHAR(50) DEFAULT 'standart',
    active_enemies_air VARCHAR(50) DEFAULT 'standart',
    active_clouds VARCHAR(50) DEFAULT 'standart',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Создание таблицы игровых сессий
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    final_score INTEGER,
    duration BIGINT, -- в миллисекундах
    is_active BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создание таблицы скинов пользователей
CREATE TABLE IF NOT EXISTS user_skins (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    skin_id VARCHAR(100) NOT NULL,
    owned BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, skin_id)
);

-- Создание таблицы транзакций обмена
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- количество монет
    points_spent BIGINT NOT NULL, -- потраченные очки
    exchange_rate BIGINT NOT NULL, -- курс обмена
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создание таблицы выводов монет
CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    ton_address VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Создание таблицы рефералов
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    referee_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    join_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(referee_id) -- у пользователя может быть только один реферер
);

-- Создание таблицы заработка от рефералов
CREATE TABLE IF NOT EXISTS referral_earnings (
    id SERIAL PRIMARY KEY,
    referrer_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    referee_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    earnings INTEGER NOT NULL, -- количество монет
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_skins_user_id ON user_skins(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);

-- Создание представления для статистики пользователей
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.telegram_id,
    u.username,
    u.first_name,
    u.last_name,
    u.points,
    u.coins,
    u.era,
    u.games_played,
    u.best_score,
    u.last_played,
    u.active_character,
    u.active_ground,
    u.active_enemies_ground,
    u.active_enemies_air,
    u.active_clouds,
    COUNT(r.id) as total_referrals,
    COALESCE(SUM(re.earnings), 0) as referral_earnings,
    u.created_at
FROM users u
LEFT JOIN referrals r ON u.telegram_id = r.referrer_id
LEFT JOIN referral_earnings re ON u.telegram_id = re.referrer_id
GROUP BY u.id, u.telegram_id, u.username, u.first_name, u.last_name, 
         u.points, u.coins, u.era, u.games_played, u.best_score, 
         u.last_played, u.active_character, u.active_ground, 
         u.active_enemies_ground, u.active_enemies_air, u.active_clouds, u.created_at;

-- Создание представления для лидерборда
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY u.points DESC) as rank,
    u.telegram_id,
    u.username,
    u.first_name,
    u.last_name,
    u.points,
    u.coins,
    u.era,
    u.games_played,
    u.best_score,
    u.last_played
FROM users u
WHERE u.points > 0
ORDER BY u.points DESC;

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Основная таблица пользователей';
COMMENT ON TABLE game_sessions IS 'Игровые сессии пользователей';
COMMENT ON TABLE user_skins IS 'Скины пользователей';
COMMENT ON TABLE claims IS 'Транзакции обмена очков на монеты';
COMMENT ON TABLE withdrawals IS 'Выводы монет';
COMMENT ON TABLE referrals IS 'Реферальная система';
COMMENT ON TABLE referral_earnings IS 'Заработок от рефералов';

-- ==================================================================
-- ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА
-- ==================================================================

