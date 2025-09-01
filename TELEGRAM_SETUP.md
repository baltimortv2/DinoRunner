# 🤖 Настройка Telegram бота для Dino Runner

## Пошаговая инструкция по созданию и настройке Telegram бота

### Шаг 1: Создание бота через BotFather

1. **Найдите BotFather в Telegram**
   - Откройте Telegram
   - Найдите @BotFather (официальный бот для создания ботов)
   - Запустите чат с ним

2. **Создайте нового бота**
   ```
   /newbot
   ```
   - Введите название вашего бота (например: "Dino Runner Game")
   - Введите username бота (должен заканчиваться на "bot", например: "DinoRunnerGameBot")

3. **Сохраните токен**
   - BotFather выдаст вам токен вида: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
   - **ВАЖНО:** Сохраните этот токен - он нужен для настройки backend

### Шаг 2: Настройка WebApp

1. **Включите WebApp функции**
   ```
   /mybots
   ```
   - Выберите вашего бота
   - Выберите "Bot Settings" → "Menu Button"
   - Выберите "Configure Menu Button"

2. **Настройте кнопку меню**
   - **Button Text**: "🎮 Играть"
   - **Web App URL**: `https://your-domain.com` (замените на ваш домен)

3. **Настройте описание и команды**
   ```
   /setdescription
   ```
   Введите описание:
   ```
   🦕 Dino Runner - захватывающая игра в стиле классического Chrome Dino!
   
   🎮 Прыгайте, избегайте препятствий и зарабатывайте очки
   🛍️ Покупайте уникальные скины для персонажа
   💰 Обменивайте очки на монеты
   👥 Приглашайте друзей и получайте бонусы
   
   Нажмите "🎮 Играть" чтобы начать!
   ```

4. **Добавьте команды**
   ```
   /setcommands
   ```
   Введите список команд:
   ```
   start - 🚀 Запустить игру
   help - ❓ Помощь
   stats - 📊 Моя статистика
   referral - 👥 Реферальная ссылка
   ```

### Шаг 3: Настройка домена для WebApp

1. **Установите домен для WebApp**
   ```
   /setdomain
   ```
   - Выберите вашего бота
   - Введите ваш домен (например: `your-app.railway.app`)

2. **Проверьте настройки**
   ```
   /mybots
   ```
   - Выберите вашего бота
   - Проверьте, что WebApp URL настроен правильно

### Шаг 4: Конфигурация в проекте

1. **Обновите .env файл**
   ```bash
   # Telegram Bot API
   TELEGRAM_BOT_TOKEN=ВАШ_ТОКЕН_ОТ_BOTFATHER
   TELEGRAM_APP_URL=https://ваш-домен.com
   
   # Другие настройки...
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=ваш_секретный_ключ_jwt
   ```

2. **Обновите frontend конфигурацию**
   В файле `frontend/js/telegram.js` убедитесь, что:
   ```javascript
   // Инициализация Telegram WebApp
   if (window.Telegram?.WebApp) {
     window.Telegram.WebApp.ready();
     window.Telegram.WebApp.expand();
   }
   ```

### Шаг 5: Тестирование

1. **Локальное тестирование**
   - Запустите backend: `npm run dev`
   - Запустите frontend на локальном сервере
   - Используйте ngrok для создания публичного URL:
     ```bash
     ngrok http 3000
     ```

2. **Обновите WebApp URL в боте**
   - Используйте ngrok URL для тестирования
   - Пример: `https://abc123.ngrok.io`

3. **Проверьте функциональность**
   - Откройте бота в Telegram
   - Нажмите "🎮 Играть"
   - Убедитесь, что игра загружается
   - Проверьте все функции (меню, магазин, рефералы)

### Шаг 6: Настройка production

1. **Деплой на Railway** (см. RAILWAY_DEPLOY.md)

2. **Обновите WebApp URL в боте на production URL**
   ```
   /setdomain
   ```
   Введите ваш Railway домен: `your-app.railway.app`

3. **Проверьте HTTPS**
   - Telegram WebApp требует HTTPS в production
   - Railway автоматически предоставляет HTTPS

### Дополнительные настройки

#### Inline кнопки для команд бота
```javascript
// В backend добавьте обработчик команд
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Играть', web_app: { url: process.env.TELEGRAM_APP_URL } }],
        [{ text: '📊 Статистика', callback_data: 'stats' }],
        [{ text: '👥 Рефералы', callback_data: 'referrals' }]
      ]
    }
  };
  bot.sendMessage(chatId, '🦕 Добро пожаловать в Dino Runner!', opts);
});
```

#### Реферальная система
```javascript
// Обработка реферальных ссылок
bot.onText(/\/start ref_(.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const referrerId = match[1];
  
  // Логика регистрации реферала
  // Отправка на backend API
});
```

### Полезные команды BotFather

- `/mybots` - Управление вашими ботами
- `/setname` - Изменить название бота
- `/setdescription` - Изменить описание
- `/setabouttext` - Установить текст "О боте"
- `/setuserpic` - Установить аватар бота
- `/setcommands` - Настроить команды бота
- `/deletebot` - Удалить бота

### Troubleshooting

**Проблема**: WebApp не загружается
- Проверьте HTTPS (обязательно для production)
- Убедитесь, что домен доступен публично
- Проверьте CORS настройки в backend

**Проблема**: Аутентификация не работает
- Проверьте токен бота в .env файле
- Убедитесь, что validation initData работает корректно
- Проверьте, что Telegram WebApp SDK загружен

**Проблема**: WebSocket не подключается
- Проверьте, что WebSocket сервер запущен
- Убедитесь, что порты открыты
- Для Railway - используйте переменную PORT из окружения

