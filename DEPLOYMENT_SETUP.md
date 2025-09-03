# 🚀 Инструкция по настройке деплоя и Telegram бота

## 🔑 Настройка GitHub Secrets

Для автоматического деплоя нужно настроить следующие секреты в репозитории:

1. Перейдите в `Settings` → `Secrets and variables` → `Actions`
2. Добавьте следующие секреты:

```
SSH_KEY - ваш приватный SSH ключ для сервера
SSH_HOST - IP адрес или домен вашего сервера
SSH_USER - имя пользователя на сервере
SSH_PORT - порт SSH (обычно 22)
```

## 🖥️ Настройка сервера

### 1. Создайте скрипт деплоя на сервере

Создайте файл `/var/www/dinorunner/deploy.sh`:

```bash
#!/bin/bash
cd /var/www/dinorunner
git pull origin main
cd backend
npm install
npm run db:init
pm2 restart dino-runner || pm2 start start.js --name dino-runner
```

### 2. Сделайте скрипт исполняемым

```bash
chmod +x /var/www/dinorunner/deploy.sh
```

### 3. Создайте файл .env на сервере

```bash
cd /var/www/dinorunner/backend
nano .env
```

Содержимое .env:
```env
TELEGRAM_BOT_TOKEN=8463432041:AAEjPn2472cqetZQbLwKlKP_BsBf9mVdfNI
TELEGRAM_BOT_NAME=your_bot_username
JWT_SECRET=your_very_secure_random_string_here
DATABASE_URL=./database/dinorunner.db
PORT=3000
NODE_ENV=production
```

## 🤖 Настройка Telegram бота

### 1. Настройка WebApp URL

1. Откройте @BotFather в Telegram
2. Отправьте `/setmenubutton`
3. Выберите вашего бота
4. Установите URL: `https://your-domain.com`
5. Установите текст кнопки: "🎮 Играть"

### 2. Проверка команд бота

Отправьте боту `/start` для проверки работы.

## 🔍 Проверка деплоя

### 1. Проверьте GitHub Actions

Перейдите в вкладку `Actions` в репозитории и убедитесь, что:
- Workflow запустился после push
- Все шаги выполнились успешно
- Нет ошибок в логах

### 2. Проверьте сервер

```bash
ssh user@your-server
cd /var/www/dinorunner
git log --oneline -5
pm2 status
```

### 3. Проверьте логи

```bash
pm2 logs dino-runner
```

## 🚨 Возможные проблемы

### GitHub Actions не запускаются
- Проверьте, что файл `.github/workflows/deploy.yml` существует
- Убедитесь, что push был в ветку `main`

### Ошибки SSH
- Проверьте правильность SSH ключей
- Убедитесь, что сервер доступен по указанному IP/порту

### Telegram WebApp не загружается
- Проверьте, что сервер доступен по HTTPS
- Убедитесь, что WebApp URL настроен правильно
- Проверьте логи сервера на ошибки

## 📞 Поддержка

Если проблемы остаются:
1. Проверьте логи GitHub Actions
2. Проверьте логи сервера
3. Убедитесь, что все переменные окружения настроены
4. Проверьте права доступа к файлам на сервере
