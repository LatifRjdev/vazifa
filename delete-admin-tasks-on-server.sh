#!/bin/bash

# Скрипт для удаления задач пользователя admin@vazifa2.com на сервере
# Usage: ./delete-admin-tasks-on-server.sh

SERVER="ubuntu@193.111.11.98"
PORT="3022"
REMOTE_DIR="/var/www/vazifa"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🗑️  Удаление задач admin@vazifa2.com на сервере       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Копируем скрипт на сервер
echo "📤 Копирование скрипта на сервер..."
scp -P $PORT backend/delete-admin-tasks.js $SERVER:$REMOTE_DIR/backend/

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при копировании файла"
    exit 1
fi

echo "✅ Скрипт скопирован"
echo ""

# 2. Запускаем скрипт на сервере
echo "🚀 Запуск скрипта на сервере..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -p $PORT $SERVER << 'ENDSSH'
cd /var/www/vazifa/backend
node delete-admin-tasks.js
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Скрипт выполнен успешно!"
else
    echo ""
    echo "❌ Ошибка при выполнении скрипта"
    exit 1
fi
