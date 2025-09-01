# Telegram Dino Runner - Backend

Backend сервер для игры Telegram Dino Runner с поддержкой аутентификации через Telegram, валидацией игровых сессий и экономической системой.

## 🚀 Быстрый старт

### Установка зависимостей
```bash
npm install
```

### Настройка окружения
```bash
cp env.example .env
# Отредактируйте .env файл с вашими настройками
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Запуск в продакшне
```bash
npm start
```

## 📁 Структура проекта

```
backend/
├── src/
│   ├── app.js              # Основное Express приложение
│   ├── routes/
│   │   ├── auth.js         # Аутентификация через Telegram
│   │   ├── game.js         # Игровые сессии и статистика
│   │   ├── economy.js      # Экономическая система
│   │   ├── shop.js         # Магазин скинов
│   │   └── referrals.js    # Реферальная система
│   ├── middleware/
│   │   ├── auth.js         # JWT валидация
│   │   ├── rateLimit.js    # Ограничение запросов
│   │   └── validation.js   # Валидация данных
│   └── utils/
│       ├── telegram.js     # Telegram Bot API
│       └── crypto.js       # Криптографические функции
├── package.json
└── README.md
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|---------|
| `NODE_ENV` | Режим работы | `development` |
| `PORT` | Порт сервера | `3001` |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | `1234567890:ABC...` |
| `JWT_SECRET` | Секрет для JWT | `your-secret-key` |
| `FRONTEND_URL` | URL фронтенда | `http://localhost:3000` |

## 📡 API Endpoints

### Аутентификация

#### POST /api/auth/telegram
Аутентификация через Telegram initData

**Request:**
```json
{
  "initData": "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%3A123456789%2C%22first_name%22%3A%22John%22%7D&auth_date=1234567890&hash=abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "123456789",
    "username": "john_doe",
    "firstName": "John",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here",
  "message": "Authentication successful"
}
```

### Игровые сессии

#### POST /api/game/session-start
Начало игровой сессии

**Headers:**
```
Authorization: Bearer <token>
X-User-ID: <user_id>
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_123456789_1704067200000",
  "message": "Game session started"
}
```

#### POST /api/game/heartbeat
Подтверждение активности сессии

**Request:**
```json
{
  "sessionId": "session_123456789_1704067200000"
}
```

#### POST /api/game/session-end
Завершение игровой сессии с валидацией очков

**Request:**
```json
{
  "sessionId": "session_123456789_1704067200000",
  "score": 1500,
  "duration": 45
}
```

**Response:**
```json
{
  "success": true,
  "validatedScore": 1500,
  "newStats": {
    "totalPoints": 5000,
    "totalCoins": 0,
    "currentEra": 1,
    "gamesPlayed": 3,
    "bestScore": 1500,
    "lastPlayed": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/game/user-stats
Получение статистики пользователя

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPoints": 5000,
    "totalCoins": 0,
    "currentEra": 1,
    "gamesPlayed": 3,
    "bestScore": 1500,
    "lastPlayed": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/game/leaderboard
Топ игроков

**Query Parameters:**
- `limit` - количество игроков (по умолчанию 10)

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "userId": "123456789",
      "totalPoints": 50000,
      "bestScore": 5000,
      "gamesPlayed": 25,
      "currentEra": 2
    }
  ],
  "total": 100
}
```

### Экономика

#### GET /api/economy/exchange-rates
Текущие курсы обмена

**Response:**
```json
{
  "success": true,
  "currentRate": {
    "tier": 1,
    "rate": 1000,
    "remainingInTier": 10000000
  },
  "globalStats": {
    "totalSupply": 850000000,
    "issued": 0,
    "remaining": 850000000
  },
  "tiers": [...]
}
```

#### POST /api/economy/exchange-points
Обмен очков на монеты

**Request:**
```json
{
  "coinsWanted": 5
}
```

**Response:**
```json
{
  "success": true,
  "exchange": {
    "coinsReceived": 5,
    "pointsSpent": 5000,
    "rate": 1000,
    "tier": 1
  },
  "userStats": {
    "points": 45000,
    "coins": 5,
    "era": 1
  }
}
```

#### POST /api/economy/withdraw-coins
Вывод монет через TON Space

**Request:**
```json
{
  "amount": 10,
  "tonAddress": "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t"
}
```

## 🔒 Безопасность

### Валидация Telegram initData
- Проверка подписи всех параметров
- Валидация времени (auth_date)
- Проверка user_id

### Анти-чит система
- Валидация времени игровых сессий
- Ограничение максимальных очков за забег (30,000)
- Проверка физически возможных результатов
- Дневные лимиты обмена (100 монет)

### Rate Limiting
- Ограничение запросов по IP
- Защита от DDoS атак
- Ограничение WebSocket соединений

## 🧪 Тестирование

### Запуск тестов
```bash
npm test
```

### Тестирование API
```bash
# Тест аутентификации
curl -X POST http://localhost:3001/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData": "test_data"}'

# Тест игровой сессии
curl -X POST http://localhost:3001/api/game/session-start \
  -H "Authorization: Bearer test_token" \
  -H "X-User-ID: test_user"
```

## 📊 Мониторинг

### Health Check
```bash
curl http://localhost:3001/health
```

### Логирование
Логи сохраняются в файл `logs/app.log` с уровнями:
- `error` - ошибки
- `warn` - предупреждения
- `info` - информационные сообщения
- `debug` - отладочная информация

## 🚀 Деплой

### Docker
```bash
docker build -t dino-runner-backend .
docker run -p 3001:3001 dino-runner-backend
```

### PM2
```bash
npm install -g pm2
pm2 start src/app.js --name "dino-runner-backend"
pm2 save
pm2 startup
```

## 🔄 WebSocket Events

### Клиент → Сервер
- `game:session-start` - начало игровой сессии
- `game:heartbeat` - подтверждение активности
- `game:session-end` - завершение сессии с очками

### Сервер → Клиент
- `game:session-validated` - подтверждение сессии
- `game:era-changed` - смена эры
- `user:stats-updated` - обновление статистики

## 📝 TODO

- [ ] Интеграция с PostgreSQL
- [ ] TON Space интеграция
- [ ] Система уведомлений
- [ ] Кэширование Redis
- [ ] Метрики Prometheus
- [ ] CI/CD pipeline

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

