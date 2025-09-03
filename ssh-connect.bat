@echo off
echo Подключаюсь к серверу 109.172.89.107...
echo Выполняю команду: echo 'SSH connection successful' && uptime

REM Создаем временный файл с командой
echo echo 'SSH connection successful' && uptime > ssh-temp-command.sh

REM Пытаемся подключиться
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@109.172.89.107 < ssh-temp-command.sh

REM Очищаем временный файл
del ssh-temp-command.sh

pause