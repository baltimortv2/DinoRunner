#!/bin/bash

# 🔒 Временное отключение парольной аутентификации SSH
# ВНИМАНИЕ: Выполняйте только после настройки SSH ключей!

echo "🔒 Временно отключаю парольную аутентификацию SSH..."

# Создаем резервную копию конфигурации
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)

echo "📋 Создана резервная копия: /etc/ssh/sshd_config.backup.*"

# Отключаем парольную аутентификацию
sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Отключаем аутентификацию по ключам по умолчанию (если включена)
sed -i 's/^PubkeyAuthentication no/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Перезапускаем SSH сервис
systemctl restart ssh

echo "✅ Парольная аутентификация отключена"
echo "🔑 Теперь можно подключаться только по SSH ключам"
echo ""
echo "⚠️  ВАЖНО: Не закрывайте это соединение!"
echo "📝 Для восстановления парольной аутентификации выполните:"
echo "   ./restore-password-auth.sh"
echo ""
echo "🔍 Проверяю статус SSH..."
systemctl status ssh --no-pager -l