#!/bin/bash

# 🚀 Скрипт ручного деплоя Dino Runner
# Использование: ./manual-deploy.sh user@server

if [ $# -eq 0 ]; then
    echo "❌ Укажите сервер: ./manual-deploy.sh user@server"
    echo "Пример: ./manual-deploy.sh root@your-server.com"
    exit 1
fi

SERVER=$1
echo "🚀 Начинаю деплой на сервер: $SERVER"

# 1. Копируем файлы на сервер
echo "📁 Копирую файлы на сервер..."
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='.env' ./ $SERVER:/var/www/dinorunner/

# 2. Подключаемся к серверу и выполняем деплой
echo "🔧 Выполняю деплой на сервере..."
ssh $SERVER << 'EOF'
    cd /var/www/dinorunner
    
    # Проверяем статус git
    echo "📋 Статус git:"
    git status
    
    # Устанавливаем зависимости
    echo "📦 Устанавливаю зависимости..."
    cd backend
    npm install
    
    # Инициализируем базу данных
    echo "🗄️ Инициализирую базу данных..."
    npm run db:init
    
    # Перезапускаем приложение
    echo "🔄 Перезапускаю приложение..."
    if pm2 list | grep -q "dino-runner"; then
        pm2 restart dino-runner
    else
        pm2 start start.js --name dino-runner
    fi
    
    # Показываем статус
    echo "📊 Статус PM2:"
    pm2 status
    
    echo "✅ Деплой завершен!"
EOF

echo "🎉 Деплой завершен! Проверьте статус на сервере."
