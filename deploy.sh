#!/bin/bash

# DinoRunner Server Deployment Script
# This script automates the deployment process on Ubuntu server

echo "🚀 Starting DinoRunner deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server info
SERVER_IP="109.172.89.107"
DB_NAME="dinorunner"
DB_USER="dinorunner"
DB_PASS="DinoRunner2024!"
BOT_TOKEN="8463432041:AAEjPn2472cqetZQbLwKlKP_BsBf9mVdfNI"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git nginx postgresql postgresql-contrib ufw

# Install Node.js
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Check Node.js version
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js version: $node_version"
print_status "npm version: $npm_version"

# Setup PostgreSQL
print_status "Setting up PostgreSQL..."
sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

# Create project directory
print_status "Creating project directory..."
mkdir -p /var/www/dinorunner
cd /var/www/dinorunner

# Clone repository
print_status "Cloning repository..."
if [ -d ".git" ]; then
    git pull
else
    git clone https://github.com/baltimortv2/DinoRunner.git .
fi

# Setup backend
print_status "Setting up backend..."
cd backend

# Create .env file
cat > .env <<EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost/$DB_NAME
TELEGRAM_BOT_TOKEN=$BOT_TOKEN
JWT_SECRET=dino_runner_jwt_secret_2024_secure_key
SESSION_SECRET=dino_runner_session_secret_2024
EOF

# Install dependencies
print_status "Installing dependencies..."
npm install

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2

# Create database tables
print_status "Creating database tables..."
PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME <<EOF
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    nickname VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'ru',
    is_premium BOOLEAN DEFAULT false,
    coins INTEGER DEFAULT 0,
    era INTEGER DEFAULT 1,
    score INTEGER DEFAULT 0,
    high_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stats JSONB DEFAULT '{}',
    skins JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
EOF

# Setup Nginx
print_status "Setting up Nginx..."
cat > /etc/nginx/sites-available/dinorunner <<EOF
server {
    listen 80;
    server_name $SERVER_IP;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/dinorunner /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t && systemctl restart nginx

# Setup firewall
print_status "Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# Create Telegram bot file
print_status "Creating Telegram bot..."
cat > /var/www/dinorunner/backend/bot.js <<'EOF'
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

const serverUrl = 'http://109.172.89.107';

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'Игрок';
  
  const gameUrl = `${serverUrl}?tgWebAppStartParam=${userId}`;
  
  bot.sendMessage(chatId, `🎮 Привет, ${firstName}! Добро пожаловать в DinoRunner!`, {
    reply_markup: {
      inline_keyboard: [[
        { 
          text: '🎮 Играть', 
          web_app: { 
            url: gameUrl 
          } 
        }
      ]]
    }
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    '🎮 DinoRunner - игра про динозавра!\n\n' +
    'Команды:\n' +
    '/start - Начать игру\n' +
    '/help - Помощь\n' +
    '/stats - Статистика (скоро)\n\n' +
    'Управление в игре:\n' +
    '⬆️ Прыжок - пробел или тап\n' +
    '⬇️ Присесть - стрелка вниз\n\n' +
    'Удачи! 🦕'
  );
});

console.log('Bot is running...');
EOF

# Install bot dependencies
cd /var/www/dinorunner/backend
npm install node-telegram-bot-api

# Start services with PM2
print_status "Starting services with PM2..."
pm2 stop all
pm2 delete all
pm2 start start.js --name "dinorunner-backend"
pm2 start bot.js --name "dinorunner-bot"
pm2 startup systemd -u root --hp /root
pm2 save

# Setup PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Create backup directory
mkdir -p /backup

# Create backup script
cat > /usr/local/bin/backup_dinorunner.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U dinorunner dinorunner > $BACKUP_DIR/dinorunner_db_$DATE.sql
tar -czf $BACKUP_DIR/dinorunner_files_$DATE.tar.gz /var/www/dinorunner/
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup_dinorunner.sh

# Add cron job for daily backup
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup_dinorunner.sh") | crontab -

# Show status
print_status "Deployment completed!"
echo ""
echo "📊 Service Status:"
pm2 status
echo ""
echo "🔗 Access URLs:"
echo "   Web: http://$SERVER_IP"
echo "   API: http://$SERVER_IP/api"
echo ""
echo "📱 Telegram Bot: @your_bot_name"
echo ""
echo "📝 Useful commands:"
echo "   pm2 status - Check service status"
echo "   pm2 logs - View logs"
echo "   pm2 restart all - Restart services"
echo ""
print_status "Deployment successful! 🎉"

