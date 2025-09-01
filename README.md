# 🦕 Telegram Dino Runner

Улучшенная версия классической игры Chrome Dino для Telegram WebApp с системой скинов, внутриигровой экономикой и реферальной системой.

## 🚀 Быстрый старт

### Локальная разработка

1. **Клонируйте репозиторий**
   ```bash
   git clone <your-repo-url>
   cd DinoRunner
   ```

2. **Запустите backend**
   ```bash
   cd telegram-dino-runner/backend
   npm install
   cp env.example .env
   # Отредактируйте .env с вашими настройками
   npm run dev
   ```

3. **Запустите frontend**
   ```bash
   cd telegram-dino-runner/frontend
   # Откройте index.html в браузере или используйте live server
   # Рекомендуется Live Server extension в VS Code
   ```

4. **Для тестирования в Telegram**
   ```bash
   # Установите ngrok
   ngrok http 3000
   # Используйте ngrok URL в настройках бота
   ```

## 🎮 Особенности игры

### ✨ Игровые возможности
- 🦕 **Классический геймплей** - прыжки и уклонение от препятствий
- 🎨 **Система скинов** - персонажи, земля, враги, облака (45+ скинов)
- 🏆 **14 исторических эр** - от Каменного века до Эры сингулярности
- 💰 **Внутриигровая экономика** - очки → монеты с прогрессивным курсом
- 👥 **Реферальная система** - приглашайте друзей, получайте 10% бонус
- 📱 **Telegram интеграция** - haptic feedback, темы, уведомления

### 🎯 Доступные скины
- **Персонажи**: Стандартный, Mario, Sonic, Batman, Joker, Pac-Man, Premium, SuperSonic
- **Окружение**: Различные темы для земли, врагов и облаков
- **Система эр**: Автосмена скинов окружения при прогрессе

### 🔒 Безопасность
- **Anti-cheat система** - серверная валидация всех действий
- **Rate limiting** - защита от злоупотреблений
- **WebSocket heartbeat** - контроль активности игрока
- **Telegram аутентификация** - проверка подлинности пользователей

## 🌐 Режимы работы

### Online режим (полная функциональность):
- ✅ Все функции доступны
- ✅ Сохранение прогресса на сервере
- ✅ Покупка и активация любых скинов
- ✅ Таблица лидеров в реальном времени
- ✅ Обмен очков на монеты
- ✅ Реферальная система

### Offline режим (ограниченный):
- 🎮 Базовая игра для развлечения
- 🔴 Красный баннер "OFFLINE" сверху
- 🚫 Только стандартные скины
- 🚫 Магазин заблокирован
- 🚫 Экономические функции недоступны
- 🚫 "OFFLINE" вместо таблицы лидеров

## 📱 Telegram интеграция

### WebApp функции:
- 🎨 **Автоматическая тематизация** под Telegram
- 📳 **Haptic feedback** для всех действий
- 🔄 **MainButton/BackButton** навигация
- 📤 **Sharing API** для рефералов
- 🔊 **Audio management** с учетом Telegram политик

## 🛠️ Технические детали

### Frontend:
- **HTML5 Canvas** для игровой графики
- **Vanilla JavaScript** (ES6 модули)
- **CSS3** с адаптивным дизайном
- **Telegram WebApp SDK**

### Backend:
- **Node.js + Express**
- **WebSocket** для реального времени
- **PostgreSQL** (продакшн) / **in-memory** (dev)
- **JWT** аутентификация

### API Architecture:
```
Frontend ←→ REST API ←→ Backend
    ↓           ↓         ↓
WebSocket ←→ Events ←→ Database
```

## 📋 Документация

- 📖 **[ARCHITECTURE.md](telegram-dino-runner/ARCHITECTURE.md)** - Подробная архитектура
- 🤖 **[TELEGRAM_SETUP.md](telegram-dino-runner/TELEGRAM_SETUP.md)** - Настройка Telegram бота
- 🚀 **[RAILWAY_DEPLOY.md](telegram-dino-runner/RAILWAY_DEPLOY.md)** - Деплой на Railway
- 📚 **[Backend README](telegram-dino-runner/backend/README.md)** - Backend документация

## 🔧 Разработка

### Структура проекта:
```
📁 Sprites/                    # Все спрайты скинов
📁 telegram-dino-runner/       # Основной проект
  📁 backend/                  # Node.js сервер
    📁 src/
      📁 routes/               # API endpoints
      📁 config/               # Конфигурация (эры, лимиты)
      📁 middleware/           # Аутентификация, валидация
  📁 frontend/                 # Игровой клиент
    📁 js/
      📁 game/                 # Игровой движок
      📁 ui/                   # Интерфейс
      📁 services/             # API интеграция
```

### Scripts:
```bash
# Backend
npm run dev     # Development сервер с nodemon
npm start       # Production сервер
npm test        # Запуск тестов

# Development helpers
npm run lint    # ESLint проверка
npm run build   # Сборка для продакшна (если нужно)
```

## 🎯 Roadmap

### ✅ Реализовано:
- Базовый игровой движок
- Система скинов с backend интеграцией
- Online/Offline режимы
- Telegram WebApp SDK
- Экономическая система
- Anti-cheat защита

### 🔄 В разработке:
- PostgreSQL миграции
- Advanced anti-cheat
- TON Space интеграция
- Расширенная реферальная система
- Achievement система
- Leaderboard с фильтрами

### 🎮 Планируется:
- Дополнительные игровые режимы
- Сезонные события
- NFT скины
- Турниры и соревнования
- Социальные функции

## 🤝 Contributing

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## 📄 License

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для подробностей.

## 🙏 Благодарности

- **Google Chrome Dino** - за вдохновение для классического геймплея
- **Telegram** - за отличную платформу Mini Apps
- **Railway** - за простой и надежный хостинг
- **Сообщество разработчиков** - за feedback и тестирование

## 📞 Поддержка

- 📧 Email: support@dinorunner.app
- 💬 Telegram: [@DinoRunnerSupport](https://t.me/DinoRunnerSupport)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Сделано с ❤️ для Telegram сообщества**

