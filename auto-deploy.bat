@echo off
echo 🚀 Автоматический деплой Dino Runner с настройкой SSH ключей
echo.

REM Шаг 1: Настройка SSH ключей
echo 🔑 Шаг 1: Настраиваю SSH ключи...
call setup-ssh-keys.bat
if %errorlevel% neq 0 (
    echo ❌ Ошибка настройки SSH ключей
    pause
    exit /b 1
)

echo.
echo ✅ SSH ключи настроены успешно!
echo.

REM Шаг 2: Отключаем парольную аутентификацию
echo 🔒 Шаг 2: Отключаю парольную аутентификацию...
ssh root@109.172.89.107 "bash -s" < disable-password-auth.sh

echo.
echo ✅ Парольная аутентификация отключена!
echo.

REM Шаг 3: Копируем файлы на сервер
echo 📁 Шаг 3: Копирую файлы на сервер...
ssh root@109.172.89.107 "mkdir -p /tmp/dinorunner-deploy"
scp -r backend\ root@109.172.89.107:/tmp/dinorunner-deploy/
scp server-deploy-fixed.sh root@109.172.89.107:/tmp/dinorunner-deploy/

echo.
echo ✅ Файлы скопированы!
echo.

REM Шаг 4: Выполняем деплой
echo 🚀 Шаг 4: Выполняю деплой на сервере...
ssh root@109.172.89.107 "cd /tmp/dinorunner-deploy && chmod +x server-deploy-fixed.sh && ./server-deploy-fixed.sh"

echo.
echo ✅ Деплой завершен!
echo.

REM Шаг 5: Восстанавливаем парольную аутентификацию
echo 🔓 Шаг 5: Восстанавливаю парольную аутентификацию...
ssh root@109.172.89.107 "bash -s" < restore-password-auth.sh

echo.
echo 🎉 Все готово! Dino Runner развернут на сервере!
echo 🌐 Проверьте работу: http://109.172.89.107
echo.
pause