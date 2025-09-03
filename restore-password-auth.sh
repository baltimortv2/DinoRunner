#!/bin/bash

# 🔓 Восстановление парольной аутентификации SSH

echo "🔓 Восстанавливаю парольную аутентификацию SSH..."

# Проверяем наличие резервной копии
BACKUP_FILE=$(ls -t /etc/ssh/sshd_config.backup.* 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Резервная копия не найдена!"
    echo "📝 Восстанавливаю вручную..."
    
    # Восстанавливаем стандартные настройки
    sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/^#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
    
    # Убеждаемся что PubkeyAuthentication включена
    sed -i 's/^PubkeyAuthentication no/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/^#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    
    echo "✅ Настройки восстановлены вручную"
else
    echo "📋 Восстанавливаю из резервной копии: $BACKUP_FILE"
    cp "$BACKUP_FILE" /etc/ssh/sshd_config
    echo "✅ Конфигурация восстановлена из резервной копии"
fi

# Перезапускаем SSH сервис
systemctl restart ssh

echo "✅ Парольная аутентификация восстановлена"
echo "🔑 Теперь можно подключаться и по паролю, и по SSH ключам"
echo ""
echo "🔍 Проверяю статус SSH..."
systemctl status ssh --no-pager -l

# Показываем текущие настройки
echo ""
echo "📋 Текущие настройки SSH:"
grep -E "^(PasswordAuthentication|PubkeyAuthentication)" /etc/ssh/sshd_config || echo "Настройки не найдены"