#!/bin/bash

# 🚀 Быстрое исправление для текущего деплоя
# Выполните этот скрипт на сервере в папке /tmp/dinorunner-deploy

echo "🔧 Быстрое исправление деплоя Dino Runner..."

# Переходим в правильную папку
cd /var/www/dinorunner/backend

# Проверяем .env файл
if [ ! -f ".env" ]; then
    echo "📝 Создаю .env файл..."
    cat > .env << EOF
TELEGRAM_BOT_TOKEN=8463432041:AAEjPn2472cqetZQbLwKlKP_BsBf9mVdfNI
TELEGRAM_BOT_NAME=your_bot_username
JWT_SECRET=your_very_secure_random_string_here_12345
DATABASE_URL=./database/dinorunner.db
PORT=3000
NODE_ENV=production
EOF
    echo "⚠️  Обязательно измените TELEGRAM_BOT_NAME и JWT_SECRET!"
else
    echo "✅ .env файл уже существует"
fi

# Создаем папку для базы данных
echo "🗄️ Создаю папку для базы данных..."
mkdir -p database

# Останавливаем существующий процесс если он запущен
if pm2 list | grep -q "dino-runner"; then
    echo "🛑 Останавливаю существующий процесс..."
    pm2 stop dino-runner
    pm2 delete dino-runner
fi

# Запускаем приложение
echo "🚀 Запускаю приложение..."
pm2 start start.js --name dino-runner

# Ждем инициализации
echo "⏳ Жду инициализации базы данных..."
sleep 5

# Проверяем статус
echo "📊 Статус PM2:"
pm2 status

echo "🔍 Проверка работы приложения:"
curl -s http://localhost:3000/api/health || echo "Приложение еще не готово, подождите..."

echo "✅ Быстрое исправление завершено!"
echo "📝 Для полной настройки выполните: ./server-deploy-fixed.sh"