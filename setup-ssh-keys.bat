@echo off
echo 🔑 Настройка SSH ключей для беспарольного подключения...
echo.

REM Проверяем наличие SSH ключа
if not exist "C:\Users\balti\.ssh\id_rsa.pub" (
    echo ❌ SSH ключ не найден! Создайте ключ командой:
    echo ssh-keygen -t rsa -b 4096 -f C:\Users\balti\.ssh\id_rsa -N ""
    pause
    exit /b 1
)

echo ✅ SSH ключ найден
echo.

REM Создаем временную папку на сервере
echo 📁 Создаю временную папку на сервере...
ssh -o StrictHostKeyChecking=no root@109.172.89.107 "mkdir -p ~/.ssh && chmod 700 ~/.ssh"

REM Копируем публичный ключ
echo 🔑 Копирую публичный ключ на сервер...
scp -o StrictHostKeyChecking=no C:\Users\balti\.ssh\id_rsa.pub root@109.172.89.107:/tmp/id_rsa.pub

REM Настраиваем ключ на сервере
echo ⚙️ Настраиваю ключ на сервере...
ssh -o StrictHostKeyChecking=no root@109.172.89.107 "cat /tmp/id_rsa.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && rm /tmp/id_rsa.pub"

echo.
echo ✅ SSH ключи настроены!
echo.
echo 🧪 Тестирую подключение...
ssh -o StrictHostKeyChecking=no root@109.172.89.107 "echo 'SSH подключение без пароля работает!' && echo 'Текущая директория:' && pwd && echo 'Содержимое:' && ls -la"

echo.
echo 🎉 Настройка завершена! Теперь можно подключаться без пароля.
echo.
pause