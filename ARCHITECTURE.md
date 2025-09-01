# 🏗️ Архитектура Telegram Dino Runner

## Обзор системы

Dino Runner - это Telegram WebApp игра с полным разделением фронтенда и бэкенда, поддержкой offline режима и интегрированной экономикой.

## 🎯 Ключевые принципы

### 1. Строгое разделение Frontend/Backend
- **Frontend**: Только игровая логика и UI
- **Backend**: Все данные, валидация, экономика
- **Offline режим**: Только стандартные скины, базовая игра

### 2. Telegram-First подход
- Приоритет мобильных устройств
- Интеграция с Telegram WebApp SDK
- Haptic feedback и тематизация

### 3. Безопасность и Anti-cheat
- Серверная валидация всех действий
- WebSocket heartbeat для контроля активности
- Rate limiting и лимиты на операции

## 📱 Frontend Architecture

### Система сцен
```
WELCOME → MAIN_MENU → GAME
    ↓         ↓         ↓
   EXIT    SHOP/MENU   GAME_OVER
```

### Компоненты

#### Игровой движок (`/js/game/`)
- `engine.js` - Основной класс Game
- `player.js` - Персонаж (динозавр)
- `obstacles.js` - Препятствия (кактусы, птеродактили)
- `environment.js` - Окружение (фон, земля, облака)
- `physics.js` - Физика и константы
- `assetPack.js` - Управление спрайтами

#### UI система (`/js/ui/`)
- `menu.js` - Основное меню и модальные окна
- `shop.js` - Магазин скинов
- `hud.js` - Игровой интерфейс

#### Сервисы (`/js/services/`)
- `api.js` - HTTP клиент для backend
- `backendIntegration.js` - Основная интеграция с backend

#### Утилиты (`/js/utils/`)
- `economy.js` - ❌ Удален (теперь только backend)
- `helpers.js` - Вспомогательные функции
- `storage.js` - Управление локальным хранилищем

### Система скинов

#### Категории скинов:
1. **character** - Персонаж (динозавр)
2. **ground** - Земля/поверхность
3. **enemiesGround** - Наземные враги
4. **enemiesAir** - Воздушные враги  
5. **clouds** - Облака

#### Доступные темы:
- `standart` - Базовая тема (бесплатно)
- `mario`, `sonic`, `batman`, `joker` - Основные темы
- `pacman`, `ninja` - Дополнительные персонажи
- `premium`, `supersonic` - Премиум темы

## 🖥️ Backend Architecture

### API Routes

#### Authentication (`/api/auth/`)
```javascript
POST /api/auth/telegram     // Аутентификация через initData
GET  /api/auth/verify       // Проверка токена
```

#### Game Management (`/api/game/`)
```javascript
GET  /api/game/user-stats      // Статистика пользователя
POST /api/game/session-start   // Начало игровой сессии
POST /api/game/session-end     // Завершение с валидацией
POST /api/game/heartbeat       // Подтверждение активности
GET  /api/game/leaderboard     // Таблица лидеров
```

#### Economy (`/api/economy/`)
```javascript
GET  /api/economy/exchange-rates    // Текущие курсы обмена
POST /api/economy/exchange-points   // Обмен очков на монеты
GET  /api/economy/user-balance     // Баланс пользователя
POST /api/economy/withdraw-coins   // Вывод монет
```

#### Shop (`/api/shop/`)
```javascript
GET  /api/shop/skins         // Список скинов
POST /api/shop/purchase      // Покупка скина
POST /api/shop/activate      // Активация скина
GET  /api/shop/user-skins    // Скины пользователя
```

#### Referrals (`/api/referrals/`)
```javascript
GET  /api/referrals/link     // Реферальная ссылка
GET  /api/referrals/stats    // Статистика рефералов
POST /api/referrals/register // Регистрация реферала
```

### Система защиты

#### Anti-cheat меры:
- Максимум 30,000 очков за забег
- Валидация времени игры (макс 50 очков/сек)
- WebSocket heartbeat каждые 30 сек
- Rate limiting: 100 запросов/15 мин

#### Экономические ограничения:
- Дневной лимит обмена: 100 монет
- Общий пул монет: 850 млн
- Прогрессивные курсы обмена по эрам

## 🌐 Offline/Online режимы

### Online режим (полная функциональность):
- ✅ Все скины доступны для покупки
- ✅ Сохранение прогресса на сервере
- ✅ Таблица лидеров
- ✅ Обмен очков на монеты
- ✅ Реферальная система
- ✅ Система эр с автосменой скинов

### Offline режим (ограниченная функциональность):
- ✅ Базовая игра работает
- ✅ Только стандартные скины
- ❌ Магазин заблокирован
- ❌ Обмен очков заблокирован
- ❌ Рефералы недоступны
- ❌ Лидерборд показывает "OFFLINE"
- 🔴 Красный баннер "OFFLINE" сверху

## 📊 Система эр

### 14 исторических эр:
1. **Каменный век** (0 очков) - rate: 1,000
2. **Бронзовый век** (10M очков) - rate: 2,000
3. **Железный век** (50M очков) - rate: 4,000
4. **Античность** (150M очков) - rate: 8,000
5. **Средневековье** (300M очков) - rate: 16,000
6. **Возрождение** (500M очков) - rate: 32,000
7. **Новое время** (750M очков) - rate: 64,000
8. **Промышленная революция** (1B очков) - rate: 128,000
9. **Век электричества** (1.5B очков) - rate: 256,000
10. **Атомный век** (2.5B очков) - rate: 512,000
11. **Космическая эра** (5B очков) - rate: 1,024,000
12. **Информационный век** (10B очков) - rate: 2,048,000
13. **Эра нанотехнологий** (20B очков) - rate: 4,096,000
14. **Эра сингулярности** (50B очков) - rate: 8,192,000

### Автосмена скинов по эрам:
- При достижении новой эры автоматически меняются скины окружения
- Персонаж остается выбранным пользователем
- WebSocket уведомление о смене эры

## 🎮 UI/UX особенности

### Адаптивный дизайн:
- **Mobile-first** подход
- Поддержка portrait/landscape ориентаций
- Touch-friendly кнопки (min 44px)
- Haptic feedback в Telegram

### Компоненты интерфейса:
- **HUD** - Сверху экрана (очки, монеты, эра)
- **Bottom controls** - Магазин, Главное меню, Настройки
- **Pause button** - Показывается только во время игры
- **Preview canvas** - Анимированный превью в главном меню

### Система уведомлений:
- Telegram native popups (online)
- Browser alerts (offline fallback)
- Haptic feedback для действий

## 🔄 Data Flow

### Инициализация:
```
1. Загрузка Telegram WebApp SDK
2. Аутентификация через initData
3. Инициализация backend integration
4. Загрузка пользовательских данных
5. Синхронизация скинов
6. Запуск игрового движка
```

### Игровая сессия:
```
1. POST /api/game/session-start
2. WebSocket heartbeat каждые 30 сек
3. Локальный подсчет очков
4. POST /api/game/session-end (валидация)
5. Обновление статистики пользователя
6. Проверка смены эры
```

### Покупка скина:
```
1. Проверка online статуса
2. POST /api/shop/purchase
3. Валидация баланса на backend
4. Списание монет
5. Добавление скина в owned
6. Обновление UI
```

## 🔐 Безопасность

### Telegram аутентификация:
```javascript
// Валидация initData на backend
function validateInitData(initData, botToken) {
  const hash = extractHash(initData);
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken);
  const calculatedHash = createHmac('sha256', secretKey).update(sortedParams);
  return calculatedHash === hash;
}
```

### WebSocket безопасность:
- User ID ассоциация при подключении
- Heartbeat для валидации активности
- Автоматическое отключение неактивных сессий

### Rate Limiting:
- 100 запросов на IP за 15 минут
- Дневные лимиты на экономические операции
- Защита от spam запросов

## 📈 Мониторинг и метрики

### Логируемые события:
- Аутентификация пользователей
- Игровые сессии и их валидация
- Экономические операции
- Ошибки подключения
- Performance metrics

### Health checks:
```javascript
GET /health
// Response: { status: 'OK', timestamp, uptime, memory }
```

## 🚀 Деплой конфигурация

### Railway Backend:
- **Node.js** + Express сервер
- **PostgreSQL** база данных (продакшн)
- **In-memory** storage (разработка)
- **WebSocket** поддержка
- **HTTPS** из коробки

### Environment Variables:
```bash
NODE_ENV=production
TELEGRAM_BOT_TOKEN=...
TELEGRAM_APP_URL=https://your-app.railway.app
DATABASE_URL=${POSTGRES_URL}
JWT_SECRET=...
```

### Frontend Hosting:
- Статические файлы на CDN/Vercel
- Или same-domain как backend
- CORS настройка для cross-origin

## 🔧 Development Setup

### Local Development:
```bash
# Backend
cd telegram-dino-runner/backend
npm install
npm run dev

# Frontend (live server)
cd telegram-dino-runner/frontend
# Serve on http://localhost:3000
```

### Testing:
```bash
# Telegram WebApp тестирование
ngrok http 3000
# Используйте ngrok URL в BotFather для тестирования
```

## 📋 Production Checklist

### Pre-deploy:
- [ ] All API endpoints tested
- [ ] Telegram bot configured
- [ ] WebApp domain set in BotFather
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] PostgreSQL connected
- [ ] CORS configured correctly

### Post-deploy:
- [ ] Health endpoint responding
- [ ] WebSocket connections working
- [ ] Authentication flow working
- [ ] All UI functions work online
- [ ] Offline mode properly restricts features
- [ ] Mobile responsive on all devices

## 🎯 Особенности реализации

### Mobile-first UI:
- Большие кликабельные кнопки (44px+)
- Адаптивная сетка для разных экранов
- Touch events с preventDefault
- Портретная/альбомная ориентация

### Performance оптимизации:
- Canvas rendering с requestAnimationFrame
- Asset preloading с fallbacks
- Lazy loading для неактивных компонентов
- Memory cleanup для WebSocket connections

### Telegram интеграция:
- Авто-применение Telegram темы
- Haptic feedback для всех действий
- MainButton/BackButton навигация
- Sharing через Telegram API

Эта архитектура обеспечивает масштабируемость, безопасность и отличный пользовательский опыт как в Telegram, так и в обычном браузере.

