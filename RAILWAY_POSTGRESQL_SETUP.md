# 🗄️ Настройка PostgreSQL в Railway

## Шаг 1: Добавление PostgreSQL сервиса

1. **Перейдите в ваш проект на Railway**
   - Откройте [Railway Dashboard](https://railway.app/dashboard)
   - Выберите ваш проект `DinoRunner`

2. **Добавьте новый сервис**
   - Нажмите кнопку **"New Service"**
   - Выберите **"Database"** → **"PostgreSQL"**
   - Railway автоматически создаст PostgreSQL базу данных

3. **Настройте переменные окружения**
   - В вашем основном сервисе (backend) перейдите в **"Variables"**
   - Добавьте следующие переменные:

```bash
# База данных
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
USE_MEMORY_DB=false

# Другие переменные
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_APP_URL=https://your-app-url.railway.app
```

## Шаг 2: Настройка подключения к базе данных

Railway автоматически предоставит переменную `DATABASE_URL` в формате:
```
postgresql://username:password@host:port/database
```

## Шаг 3: Обновление кода для работы с PostgreSQL

### 1. Установите зависимости для PostgreSQL:

```bash
cd backend
npm install pg
```

### 2. Создайте файл подключения к базе данных:

```javascript
// backend/src/database/connection.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

### 3. Создайте миграции для таблиц:

```sql
-- backend/src/database/migrations/001_initial_schema.sql

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    total_points BIGINT DEFAULT 0,
    total_coins INTEGER DEFAULT 0,
    current_era INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Игровые сессии
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id),
    points_earned INTEGER NOT NULL,
    session_duration INTEGER NOT NULL,
    era INTEGER NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Обмены очков на монеты
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id),
    points_spent BIGINT NOT NULL,
    coins_received INTEGER NOT NULL,
    era INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Скины пользователей
CREATE TABLE IF NOT EXISTS user_skins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id),
    skin_type VARCHAR(50) NOT NULL,
    skin_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP DEFAULT NOW()
);

-- Рефералы
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id BIGINT REFERENCES users(id),
    referred_id BIGINT REFERENCES users(id),
    total_points_earned BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skins_user_id ON user_skins(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
```

## Шаг 4: Обновление переменных окружения

В Railway Dashboard добавьте все необходимые переменные:

```bash
# Основные настройки
NODE_ENV=production
PORT=3000

# База данных
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
USE_MEMORY_DB=false

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_APP_URL=https://your-app-url.railway.app

# Безопасность
RATE_LIMIT_MAX=100
DAILY_COIN_LIMIT=100
MAX_POINTS_PER_RUN=30000

# TON (опционально)
TON_SPACE_API_KEY=your_ton_key
```

## Шаг 5: Проверка подключения

После деплоя проверьте:

1. **Health check endpoint:**
   ```
   https://your-app-url.railway.app/api/health
   ```

2. **Логи в Railway:**
   - Перейдите в **"Deployments"**
   - Нажмите на последний деплой
   - Проверьте логи на ошибки подключения к БД

## Шаг 6: Инициализация базы данных

Создайте скрипт для инициализации:

```javascript
// backend/src/database/init.js
const pool = require('./connection');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = { initDatabase };
```

## Шаг 7: Обновление package.json

Добавьте скрипт для инициализации:

```json
{
  "scripts": {
    "start": "node start.js",
    "dev": "nodemon start.js",
    "test": "jest --passWithNoTests",
    "db:init": "node -e \"require('./src/database/init').initDatabase()\""
  }
}
```

## 🚀 Готово!

После выполнения всех шагов:

1. **Перезапустите деплой** в Railway
2. **Проверьте логи** на наличие ошибок
3. **Протестируйте API endpoints**
4. **Настройте Telegram бота** с новым URL

## 🔧 Устранение неполадок

### Ошибка подключения к БД:
- Проверьте переменную `DATABASE_URL`
- Убедитесь, что PostgreSQL сервис запущен
- Проверьте SSL настройки

### Ошибка миграций:
- Проверьте права доступа к БД
- Убедитесь, что SQL синтаксис корректен
- Проверьте логи в Railway

### Проблемы с производительностью:
- Добавьте индексы для часто используемых полей
- Настройте connection pooling
- Мониторьте использование ресурсов в Railway
