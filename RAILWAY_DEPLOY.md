# 🚀 Деплой Dino Runner на Railway

## Пошаговая инструкция по развертыванию backend на Railway

### Подготовка к деплою

#### 1. Подготовка проекта

1. **Убедитесь, что все файлы готовы**
   ```bash
   cd telegram-dino-runner/backend
   npm install
   npm test  # Проверьте, что все тесты проходят
   ```

2. **Проверьте package.json**
   Убедитесь, что есть правильные scripts:
   ```json
   {
     "scripts": {
       "start": "node start.js",
       "dev": "nodemon start.js",
       "test": "jest"
     },
     "engines": {
       "node": ">=16.0.0"
     }
   }
   ```

#### 2. Создание Railway проекта

1. **Зарегистрируйтесь на Railway**
   - Перейдите на [railway.app](https://railway.app)
   - Войдите через GitHub аккаунт

2. **Создайте новый проект**
   - Нажмите "New Project"
   - Выберите "Deploy from GitHub repo"
   - Подключите ваш GitHub репозиторий

3. **Настройте корневую папку**
   - В настройках проекта найдите "Root Directory"
   - Установите: `telegram-dino-runner/backend`

### Настройка переменных окружения

#### В Railway Dashboard → Environment Variables:

```bash
# Основные настройки
NODE_ENV=production
PORT=3001

# База данных (Railway автоматически создаст PostgreSQL)
DATABASE_URL=${POSTGRES_URL}  # Railway автоматически заполнит
USE_MEMORY_DB=false  # В продакшне используем PostgreSQL

# Telegram
TELEGRAM_BOT_TOKEN=ваш_токен_от_botfather
TELEGRAM_APP_URL=https://ваш-проект.up.railway.app

# Безопасность
JWT_SECRET=ваш_очень_секретный_ключ_минимум_32_символа
RATE_LIMIT_MAX=1000
DAILY_COIN_LIMIT=100
MAX_POINTS_PER_RUN=30000

# CORS
FRONTEND_URL=https://ваш-проект.up.railway.app
ALLOWED_ORIGINS=https://ваш-проект.up.railway.app,https://web.telegram.org

# Логирование
LOG_LEVEL=info

# WebSocket
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=1000

# TON Space (опционально)
TON_SPACE_API_KEY=ваш_ключ_ton_space
```

### Добавление PostgreSQL базы данных

#### 1. Добавьте PostgreSQL сервис
- В Railway проекте нажмите "Add Service"
- Выберите "PostgreSQL"
- Railway автоматически создаст базу и переменную `POSTGRES_URL`

#### 2. Создайте миграции (если нужно)
```javascript
// В backend/src/database/migrations/001_initial.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id),
    points_earned INTEGER NOT NULL,
    session_duration INTEGER NOT NULL,
    era INTEGER NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_skins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id),
    skin_type VARCHAR(50) NOT NULL,
    skin_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id BIGINT REFERENCES users(id),
    referred_id BIGINT REFERENCES users(id),
    total_points_earned BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Настройка домена и SSL

#### 1. Получите Railway домен
- После деплоя Railway предоставит домен вида: `your-project.up.railway.app`
- Или настройте кастомный домен в разделе "Domains"

#### 2. Обновите Telegram WebApp URL
- Вернитесь к @BotFather
- Используйте `/setdomain` для установки production домена
- Введите ваш Railway домен

### Деплой и мониторинг

#### 1. Автоматический деплой
- Railway автоматически деплоит при push в GitHub
- Следите за логами в Railway Dashboard

#### 2. Проверка работоспособности
```bash
# Проверьте health endpoint
curl https://ваш-проект.up.railway.app/health

# Должен вернуть:
{"status":"OK","timestamp":"..."}
```

#### 3. Мониторинг логов
- В Railway Dashboard → "Deployments" → "View Logs"
- Следите за ошибками подключения и производительностью

### Настройка Frontend

#### 1. Обновите конфигурацию API
В `frontend/js/services/api.js`:
```javascript
class ApiService {
  constructor() {
    // Production backend URL
    this.baseUrl = 'https://ваш-проект.up.railway.app';
    this.wsUrl = 'wss://ваш-проект.up.railway.app';
    // ...
  }
}
```

#### 2. Разместите frontend
**Опция A: На том же Railway проекте**
- Создайте отдельный сервис для frontend
- Используйте статический хостинг (nginx)

**Опция B: На Vercel/Netlify**
- Настройте CORS в backend для вашего frontend домена
- Обновите `FRONTEND_URL` и `ALLOWED_ORIGINS` в Railway

### Production оптимизации

#### 1. Безопасность
```javascript
// В backend/src/app.js добавьте дополнительные middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://telegram.org"],
      connectSrc: ["'self'", "wss:", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

#### 2. Лимиты и производительность
```javascript
// Увеличьте rate limits для production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // Production limits
  message: 'Too many requests from this IP'
});
```

#### 3. Логирование
```javascript
// Добавьте логирование в файл
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Проверка готовности к production

#### Checklist перед релизом:
- [ ] Telegram бот создан и настроен
- [ ] WebApp URL установлен в боте
- [ ] Backend задеплоен на Railway
- [ ] Все переменные окружения настроены
- [ ] PostgreSQL подключена
- [ ] HTTPS работает
- [ ] CORS настроен правильно
- [ ] WebSocket подключение работает
- [ ] Все API endpoints отвечают
- [ ] Аутентификация через Telegram работает
- [ ] Система скинов сохраняется на сервере
- [ ] Offline режим корректно блокирует функции

### Troubleshooting

**Проблема**: Railway не может найти package.json
- **Решение**: Убедитесь, что Root Directory установлена: `telegram-dino-runner/backend`

**Проблема**: Database connection failed
- **Решение**: Проверьте, что PostgreSQL сервис добавлен и `DATABASE_URL` настроена

**Проблема**: CORS ошибки
- **Решение**: Добавьте ваш домен в `ALLOWED_ORIGINS`

**Проблема**: WebSocket не подключается
- **Решение**: Railway поддерживает WebSocket. Убедитесь, что используете WSS (не WS) в production

**Проблема**: Environment variables не загружаются
- **Решение**: Убедитесь, что все переменные добавлены в Railway Dashboard → Environment

### Useful Railway CLI команды

```bash
# Установка Railway CLI
npm install -g @railway/cli

# Логин
railway login

# Просмотр логов
railway logs

# Открыть проект в браузере
railway open

# Подключение к базе данных
railway connect postgres
```

### Масштабирование

При росте пользователей рассмотрите:
- **Redis** для кеширования сессий
- **Load balancer** для нескольких инстансов
- **CDN** для статических ассетов
- **Database indexing** для быстрых запросов
- **Monitoring** через Railway Metrics или внешние сервисы

### Мониторинг и алерты

1. **Railway Metrics**
   - CPU/Memory usage
   - Response times
   - Error rates

2. **Custom здоровье endpoint**
   ```javascript
   app.get('/health', (req, res) => {
     res.json({
       status: 'OK',
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       memory: process.memoryUsage(),
       version: require('./package.json').version
     });
   });
   ```

3. **Log aggregation**
   - Настройте централизованное логирование
   - Интегрируйте с Sentry для error tracking

