# 🦖 Dino Runner - Telegram WebApp Game

Полнофункциональная игра Dino Runner для Telegram с внутриигровой экономикой, системой скинов и реферальной программой.

## 🚀 Быстрый старт

### Локальная разработка

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/baltimortv2/DinoRunner.git
cd DinoRunner
```

2. **Настройте backend:**
```bash
cd backend
npm install
cp env.example .env
# Отредактируйте .env файл
npm run dev
```

3. **Откройте frontend:**
```bash
cd ../frontend
# Откройте index.html в браузере
```

### Деплой на Railway

1. **Следуйте инструкции:** [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)
2. **Настройте Telegram бота:** [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)

## 🎮 Особенности игры

- **14 эр развития** с прогрессивной экономикой
- **Система скинов** для персонажа, врагов, фона
- **Внутриигровая экономика** с обменом очков на монеты
- **Реферальная система** с бонусами
- **Telegram WebApp** интеграция
- **Offline режим** для игры без интернета
- **Адаптивный дизайн** для мобильных устройств

## 🏗️ Архитектура

- **Frontend:** HTML5 Canvas + Vanilla JavaScript
- **Backend:** Node.js + Express + WebSocket
- **База данных:** PostgreSQL (продакшн) / In-memory (разработка)
- **Деплой:** Railway
- **Интеграция:** Telegram WebApp SDK

## 📁 Структура проекта

```
DinoRunner/
├── backend/          # Node.js сервер
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   └── config/   # Конфигурация
│   └── test/         # Тесты
├── frontend/         # Игра на Canvas
│   ├── js/
│   │   ├── game/     # Игровой движок
│   │   ├── ui/       # Интерфейс
│   │   └── api/      # API клиент
│   └── css/          # Стили
├── Sprites/          # Игровые ассеты
└── docs/             # Документация
```

## 🔧 API Endpoints

- `POST /api/auth/telegram` - Аутентификация через Telegram
- `GET /api/game/user-stats` - Статистика пользователя
- `POST /api/game/session-start` - Начало игровой сессии
- `POST /api/game/session-end` - Завершение сессии
- `GET /api/shop/skins` - Список скинов
- `POST /api/economy/exchange-points` - Обмен очков на монеты
- `GET /api/referrals/link` - Реферальная ссылка

## 🛡️ Безопасность

- Валидация Telegram `initData`
- Rate limiting для API
- Anti-cheat защита
- Ограничения на максимальные очки за забег
- Дневные лимиты обмена

## 📱 Telegram WebApp

Игра оптимизирована для работы в Telegram как Mini App:
- Нативная интеграция с Telegram
- Поддержка тем (светлая/темная)
- Haptic feedback
- Реферальные ссылки через Deep Links

## 🎯 Экономическая модель

- **850 миллионов монет** общий пул
- **14 эр** с увеличивающимися коэффициентами
- **Дневной лимит:** 100 монет на пользователя
- **Максимум очков за забег:** 30,000

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License

## 📞 Поддержка

- GitHub Issues: [Создать issue](https://github.com/baltimortv2/DinoRunner/issues)
- Telegram: [@your_bot_username](https://t.me/your_bot_username)

---

**Сделано с ❤️ для Telegram сообщества**

