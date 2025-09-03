#!/bin/bash

# 🚀 Исправленный скрипт деплоя Dino Runner на сервер
# Использование: ./server-deploy-fixed.sh

set -e  # Останавливаем выполнение при ошибке

echo "🚀 Начинаю автоматический деплой Dino Runner (исправленная версия)..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверяем, что мы root
if [ "$EUID" -ne 0 ]; then
    error "Этот скрипт должен выполняться от имени root"
    exit 1
fi

# Обновляем систему
log "Обновляю систему..."
apt update && apt upgrade -y

# Устанавливаем необходимые пакеты
log "Устанавливаю необходимые пакеты..."
apt install -y git curl wget unzip nginx ufw

# Устанавливаем Node.js 18+
log "Устанавливаю Node.js 18+..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    log "Node.js уже установлен: $(node --version)"
fi

# Устанавливаем PM2
log "Устанавливаю PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    log "PM2 уже установлен: $(pm2 --version)"
fi

# Создаем папку для проекта
log "Создаю папку для проекта..."
mkdir -p /var/www
cd /var/www

# Клонируем или обновляем репозиторий
if [ -d "dinorunner" ]; then
    log "Обновляю существующий репозиторий..."
    cd dinorunner
    git pull origin main
else
    log "Клонирую репозиторий..."
    git clone https://github.com/baltimortv2/DinoRunner.git dinorunner
    cd dinorunner
fi

# Переходим в backend
cd backend

# Создаем .env файл если его нет
if [ ! -f ".env" ]; then
    log "Создаю .env файл..."
    cat > .env << EOF
TELEGRAM_BOT_TOKEN=8463432041:AAEjPn2472cqetZQbLwKlKP_BsBf9mVdfNI
TELEGRAM_BOT_NAME=your_bot_username
JWT_SECRET=your_very_secure_random_string_here_12345
DATABASE_URL=./database/dinorunner.db
PORT=3000
NODE_ENV=production
EOF
    warning "⚠️  Обязательно измените TELEGRAM_BOT_NAME и JWT_SECRET в .env файле!"
else
    log ".env файл уже существует"
fi

# Устанавливаем зависимости
log "Устанавливаю зависимости..."
npm install

# Создаем папку для базы данных если её нет
log "Создаю папку для базы данных..."
mkdir -p database

# Останавливаем существующий процесс если он запущен
if pm2 list | grep -q "dino-runner"; then
    log "Останавливаю существующий процесс..."
    pm2 stop dino-runner
    pm2 delete dino-runner
fi

# Запускаем приложение (база данных инициализируется автоматически)
log "Запускаю приложение..."
pm2 start start.js --name dino-runner

# Ждем немного для инициализации базы данных
log "Жду инициализации базы данных..."
sleep 5

# Настраиваем автозапуск
log "Настраиваю автозапуск..."
pm2 startup
pm2 save

# Настраиваем Nginx
log "Настраиваю Nginx..."
cat > /etc/nginx/sites-available/dinorunner << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Активируем сайт
ln -sf /etc/nginx/sites-available/dinorunner /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию Nginx
if nginx -t; then
    log "Перезапускаю Nginx..."
    systemctl restart nginx
    systemctl enable nginx
else
    error "Ошибка в конфигурации Nginx!"
    exit 1
fi

# Настраиваем файрвол
log "Настраиваю файрвол..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Проверяем статус
log "Проверяю статус..."
echo ""
echo "📊 Статус PM2:"
pm2 status

echo ""
echo "🌐 Статус Nginx:"
systemctl status nginx --no-pager -l

echo ""
echo "🔥 Статус файрвола:"
ufw status

echo ""
echo "✅ Деплой завершен успешно!"
echo ""
echo "🎯 Следующие шаги:"
echo "1. Настройте TELEGRAM_BOT_NAME в .env файле"
echo "2. Настройте WebApp URL в @BotFather: http://$(curl -s ifconfig.me)"
echo "3. Проверьте работу: http://$(curl -s ifconfig.me)"
echo ""
echo "📁 Файлы проекта: /var/www/dinorunner"
echo "📝 Логи приложения: pm2 logs dino-runner"
echo "🌐 Логи Nginx: tail -f /var/log/nginx/access.log"
echo ""
echo "🔍 Проверка работы приложения:"
echo "curl http://localhost:3000/api/health"