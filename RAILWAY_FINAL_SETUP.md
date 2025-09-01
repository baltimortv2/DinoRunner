# 🚀 Финальная настройка Railway для Dino Runner

## ✅ Что уже сделано:
- ✅ Backend запускается без ошибок
- ✅ API endpoints работают
- ✅ Telegram бот подключен
- ✅ Домен: https://dinorunner-production.up.railway.app/

## 🔧 Что нужно настроить:

### 1. Переменные окружения в Railway

В Railway Dashboard → ваш проект → Variables добавьте:

```bash
# Основные настройки
NODE_ENV=production
PORT=3000

# База данных (если добавили PostgreSQL)
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
USE_MEMORY_DB=false

# JWT
JWT_SECRET=ikeb2w9a8OYYBSUk1hHOlBGdjCmidTBz

# Telegram
TELEGRAM_BOT_TOKEN=8463432041:AAEjPn2472cqetZQbLwKlKP_BsBf9mVdfNI
TELEGRAM_APP_URL=https://dinorunner-production.up.railway.app

# Frontend URL
FRONTEND_URL=https://dinorunner-production.up.railway.app

# Безопасность
RATE_LIMIT_MAX=100
DAILY_COIN_LIMIT=100
MAX_POINTS_PER_RUN=30000
```

### 2. Настройка Telegram бота

В @BotFather обновите Web App URL:
```
https://dinorunner-production.up.railway.app
```

### 3. Проверка работы

После деплоя проверьте:

1. **Health check:**
   ```
   https://dinorunner-production.up.railway.app/api/health
   ```

2. **Frontend:**
   ```
   https://dinorunner-production.up.railway.app
   ```

3. **Telegram бот:**
   - Отправьте команду `/start`
   - Нажмите на кнопку "Play Game"

## 🎯 Ожидаемый результат:

- ✅ Игра открывается в Telegram
- ✅ Backend API работает
- ✅ Frontend загружается корректно
- ✅ Нет ошибки "Cannot GET /"

## 🔧 Если все еще есть проблемы:

### Проблема: "Cannot GET /"
**Решение:** Убедитесь, что:
1. Переменные окружения настроены
2. Деплой прошел успешно
3. Логи не содержат ошибок

### Проблема: Frontend не загружается
**Решение:** 
1. Проверьте, что статические файлы копируются в backend
2. Убедитесь, что путь к frontend корректный

### Проблема: API не отвечает
**Решение:**
1. Проверьте переменную `PORT=3000`
2. Убедитесь, что backend запускается
3. Проверьте логи в Railway

## 📱 Тестирование в Telegram:

1. **Откройте бота** в Telegram
2. **Нажмите "Play Game"**
3. **Проверьте:**
   - Игра загружается
   - Кнопки работают
   - Нет ошибок в консоли

## 🎮 Готово!

После выполнения всех шагов ваша игра должна работать в Telegram WebApp!
