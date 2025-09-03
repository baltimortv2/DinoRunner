# 🦕 Dino Runner

Современная браузерная игра в стиле Chrome Dino с интеграцией Telegram и экономикой TON.

## 🚀 Возможности

### 🎮 Игровые функции
- **Классический геймплей**: прыжки, приседания, избегание препятствий
- **Анимированные спрайты**: плавная анимация персонажей и врагов
- **Система скинов**: различные наборы спрайтов для персонажа, земли, врагов, облаков
- **Адаптивный дизайн**: работает на всех устройствах

### 🔐 Аутентификация и интеграция
- **Telegram WebApp**: бесшовная интеграция с Telegram
- **Автоматическая авторизация**: использует данные пользователя Telegram
- **Оффлайн режим**: игра работает без подключения к интернету

### 💰 Экономическая система
- **Очки и монеты**: двойная валютная система
- **Динамический обмен**: курс меняется в зависимости от общего количества выданных монет
- **14 эр развития**: экономика развивается по мере роста сообщества
- **TON интеграция**: вывод монет через TON кошелек

### 👥 Социальные функции
- **Реферальная система**: приглашайте друзей и получайте 10% от их очков (до 10 рефералов)
- **Лидерборд**: рейтинг игроков по количеству монет
- **Глобальная статистика**: отслеживание общих показателей игры

### 🛍️ Магазин
- **Система скинов**: покупка и активация различных наборов спрайтов
- **Глобальное применение**: скины действуют везде в игре
- **Персональные настройки**: сохранение выбранных скинов

## 📋 Технические требования

### Backend
- Node.js 16+
- SQLite 3
- npm или yarn

### Telegram Bot
- Зарегистрированный бот через @BotFather
- Настроенный WebApp URL

## 🛠️ Установка

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd DinoRunner
```

### 2. Установка зависимостей
```bash
cd backend
npm install
```

### 3. Настройка окружения
Создайте файл `.env` в директории `backend`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_NAME=your_bot_username

# JWT Secret for authentication
JWT_SECRET=your_very_secure_random_string_here

# Database
DATABASE_URL=./database/dinorunner.db

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Custom URLs (по умолчанию используется localhost)
# BACKEND_URL=https://your-domain.com
# BACKEND_WS_URL=wss://your-domain.com
```

### 4. Инициализация базы данных
```bash
npm run db:init
```

### 5. Запуск сервера
```bash
# Development
npm run dev

# Production
npm start
```

## 🎮 Настройка Telegram Bot

### 1. Создание бота
1. Откройте @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните токен бота

### 2. Настройка WebApp
1. Отправьте `/setmenubutton` боту @BotFather
2. Выберите вашего бота
3. Установите URL: `https://your-domain.com`
4. Установите текст кнопки: "🎮 Играть"

### 3. Настройка команд (опционально)
```
start - Начать игру
help - Помощь
stats - Статистика
```

## 🔧 Конфигурация

### Экономические параметры
Настройки находятся в `backend/src/routes/economy.js`:

```javascript
// Тир-система обмена (14 эр)
const EXCHANGE_TIERS = [
  { upTo: 10_000_000, rate: 1_000, era: 1 },
  { upTo: 50_000_000, rate: 2_000, era: 2 },
  // ... до 14 эры
];
```

### Настройки магазина
Список доступных скинов в `backend/src/routes/shop.js`:

```javascript
const AVAILABLE_SKINS = [
  { id: 'char-standart', name: 'Персонаж: Стандартный', price: 0, type: 'character', packName: 'standart', defaultOwned: true },
  { id: 'char-sonic', name: 'Персонаж: Sonic', price: 500, type: 'character', packName: 'sonic', defaultOwned: false },
  // ...
];
```

## 🎨 Добавление скинов

### 1. Подготовка спрайтов
Создайте папку в `backend/public/Sprites/` с названием пака (например, `mario`):

```
Sprites/
  mario/
    MarioDinoIdle.png
    MarioDinoRun1.png
    MarioDinoRun2.png
    MarioDinoCrouch1.png
    MarioDinoCrouch2.png
    MarioDinoDeath.png
```

### 2. Обновление assetPack.js
Убедитесь, что новые спрайты загружаются в `backend/public/js/game/assetPack.js`.

### 3. Добавление в магазин
Добавьте новый скин в массив `AVAILABLE_SKINS` в `backend/src/routes/shop.js`.

## 👨‍💼 Админ панель

Доступна по адресу: `https://your-domain.com/admin.html`

### Функции:
- Просмотр заявок на вывод монет
- Одобрение/отклонение выводов
- Статистика по выводам
- Управление экономикой

### Права админа:
Добавьте пользователю роль админа в базе данных:
```sql
UPDATE users SET role = 'admin' WHERE telegram_id = YOUR_TELEGRAM_ID;
```

## 📱 Деплой

### Vercel
1. Установите Vercel CLI: `npm i -g vercel`
2. В корне проекта: `vercel`
3. Следуйте инструкциям

### Heroku
1. Создайте приложение: `heroku create your-app-name`
2. Установите переменные окружения: `heroku config:set TELEGRAM_BOT_TOKEN=...`
3. Деплой: `git push heroku main`

### VPS/Dedicated server
1. Установите PM2: `npm install -g pm2`
2. Запустите: `pm2 start backend/start.js --name dino-runner`
3. Настройте nginx как reverse proxy

## 🔒 Безопасность

### Telegram аутентификация
- Проверка подписи `initData` с использованием bot token
- JWT токены для сессий
- Валидация всех входящих данных

### Rate limiting
- Ограничение запросов по IP
- Защита от спама в API

### Database
- Parameterized queries для защиты от SQL injection
- Индексы для оптимизации производительности

## 🐛 Отладка

### Логи сервера
```bash
# PM2 logs
pm2 logs dino-runner

# Direct logs
NODE_ENV=development npm run dev
```

### Dev Tools
В игре включите Dev Tools (кнопка в меню) для отладки:
- Изменение количества монет/очков
- Тестирование различных состояний
- Проверка API запросов

### Telegram WebApp
Используйте Telegram Desktop для отладки WebApp с возможностью открыть DevTools.

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch: `git checkout -b feature/new-feature`
3. Commit изменения: `git commit -am 'Add new feature'`
4. Push в branch: `git push origin feature/new-feature`
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл LICENSE

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи сервера
2. Убедитесь, что все переменные окружения настроены
3. Проверьте подключение к базе данных
4. Убедитесь, что Telegram bot настроен правильно

### Частые проблемы:

**Игра не загружается в Telegram:**
- Проверьте, что WebApp URL корректный
- Убедитесь, что сервер доступен по HTTPS
- Проверьте настройки CSP

**Ошибки аутентификации:**
- Проверьте TELEGRAM_BOT_TOKEN
- Убедитесь, что JWT_SECRET установлен
- Проверьте валидность initData

**Проблемы с базой данных:**
- Убедитесь, что база данных инициализирована
- Проверьте права доступа к файлу БД
- Запустите `npm run db:init` заново

---

Создано с ❤️ для Telegram WebApp сообщества
