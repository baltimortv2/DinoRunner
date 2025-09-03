# 🚀 Пошаговая настройка сервера Dino Runner

## 🔑 Шаг 1: Подключение к серверу

```bash
ssh root@109.172.89.107
# Пароль: y=31s62uDV8e1NjEMUh1
```

## 🔐 Шаг 2: Настройка SSH ключей (опционально)

Если хотите настроить беспарольное подключение:

```bash
# На сервере
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Скопируйте ваш публичный ключ с локального компьютера:
# scp C:\Users\balti\.ssh\id_rsa.pub root@109.172.89.107:~/.ssh/

# Или создайте новый ключ на сервере:
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N '""'

# Добавьте ключ в authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 📁 Шаг 3: Подготовка сервера

```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем необходимые пакеты
apt install -y git curl wget unzip

# Устанавливаем Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Устанавливаем PM2
npm install -g pm2

# Проверяем версии
node --version
npm --version
pm2 --version
```

## 🦕 Шаг 4: Клонирование проекта

```bash
# Создаем папку для проекта
mkdir -p /var/www
cd /var/www

# Клонируем репозиторий
git clone https://github.com/baltimortv2/DinoRunner.git dinorunner
cd dinorunner

# Проверяем, что файлы склонировались
ls -la
```

## ⚙️ Шаг 5: Настройка окружения

```bash
cd backend

# Создаем .env файл
nano .env
```

**Содержимое .env файла:**
```env
TELEGRAM_BOT_TOKEN=8463432041:AAEjPn2472cqetZQbLwKlKP_BsBf9mVdfNI
TELEGRAM_BOT_NAME=your_bot_username
JWT_SECRET=your_very_secure_random_string_here_12345
DATABASE_URL=./database/dinorunner.db
PORT=3000
NODE_ENV=production
```

## 📦 Шаг 6: Установка зависимостей

```bash
# Устанавливаем зависимости
npm install

# Инициализируем базу данных
npm run db:init

# Проверяем, что база создалась
ls -la database/
```

## 🚀 Шаг 7: Запуск приложения

```bash
# Запускаем через PM2
pm2 start start.js --name dino-runner

# Проверяем статус
pm2 status
pm2 logs dino-runner

# Настраиваем автозапуск
pm2 startup
pm2 save
```

## 🌐 Шаг 8: Настройка веб-сервера (Nginx)

```bash
# Устанавливаем Nginx
apt install -y nginx

# Создаем конфигурацию
nano /etc/nginx/sites-available/dinorunner
```

**Содержимое конфигурации Nginx:**
```nginx
server {
    listen 80;
    server_name 109.172.89.107;

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
```

```bash
# Активируем сайт
ln -s /etc/nginx/sites-available/dinorunner /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
nginx -t

# Перезапускаем Nginx
systemctl restart nginx
systemctl enable nginx
```

## 🔒 Шаг 9: Настройка файрвола

```bash
# Открываем необходимые порты
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Включаем файрвол
ufw enable
ufw status
```

## 🤖 Шаг 10: Настройка Telegram бота

1. Откройте @BotFather в Telegram
2. Отправьте `/setmenubutton`
3. Выберите вашего бота
4. Установите URL: `http://109.172.89.107`
5. Установите текст: "🎮 Играть"

## ✅ Шаг 11: Проверка работы

```bash
# Проверяем статус приложения
pm2 status
pm2 logs dino-runner

# Проверяем веб-сервер
curl http://localhost:3000
curl http://109.172.89.107

# Проверяем логи Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🚨 Возможные проблемы

### Приложение не запускается
```bash
# Проверяем логи
pm2 logs dino-runner

# Проверяем порт
netstat -tlnp | grep :3000

# Перезапускаем
pm2 restart dino-runner
```

### Nginx не работает
```bash
# Проверяем статус
systemctl status nginx

# Проверяем конфигурацию
nginx -t

# Перезапускаем
systemctl restart nginx
```

### База данных не создается
```bash
# Проверяем права доступа
ls -la database/

# Пересоздаем базу
rm database/dinorunner.db
npm run db:init
```

## 📞 Поддержка

Если что-то не работает:
1. Проверьте логи: `pm2 logs dino-runner`
2. Проверьте статус: `pm2 status`
3. Проверьте порты: `netstat -tlnp`
4. Проверьте Nginx: `systemctl status nginx`

## 🎯 Результат

После выполнения всех шагов у вас должно быть:
- ✅ Приложение Dino Runner запущено на порту 3000
- ✅ Nginx проксирует запросы на приложение
- ✅ Telegram WebApp доступен по адресу http://109.172.89.107
- ✅ База данных инициализирована
- ✅ PM2 управляет процессом