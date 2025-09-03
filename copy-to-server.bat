@echo off
echo 🚀 Копирование файлов на сервер Dino Runner...
echo.

REM Проверяем наличие SSH
ssh -V >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ SSH не найден! Установите OpenSSH для Windows
    pause
    exit /b 1
)

echo 📁 Копирую файлы на сервер...
echo.

REM Создаем временную папку на сервере
echo Создаю временную папку...
ssh -o StrictHostKeyChecking=no root@109.172.89.107 "mkdir -p /tmp/dinorunner-deploy"

REM Копируем основные файлы
echo Копирую основные файлы...
scp -o StrictHostKeyChecking=no -r backend\ root@109.172.89.107:/tmp/dinorunner-deploy/
scp -o StrictHostKeyChecking=no -r .github\ root@109.172.89.107:/tmp/dinorunner-deploy/
scp -o StrictHostKeyChecking=no server-deploy.sh root@109.172.89.107:/tmp/dinorunner-deploy/

echo.
echo ✅ Файлы скопированы!
echo.
echo 🔧 Теперь подключитесь к серверу и выполните:
echo.
echo ssh root@109.172.89.107
echo cd /tmp/dinorunner-deploy
echo chmod +x server-deploy.sh
echo ./server-deploy.sh
echo.
echo 📝 Или выполните команды вручную по инструкции в SERVER_SETUP.md
echo.
pause