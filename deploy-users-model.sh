#!/bin/bash

# Скрипт для деплоя users.js на сервер
# Usage: ./deploy-users-model.sh

SERVER="ubuntu@193.111.11.98"
PORT="3022"
REMOTE_DIR="/var/www/vazifa"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           🚀 Деплой users.js на сервер                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Копируем файл на сервер
echo "📤 Копирование users.js на сервер..."
scp -P $PORT backend/models/users.js $SERVER:$REMOTE_DIR/backend/models/

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при копировании файла"
    exit 1
fi

echo "✅ Файл скопирован"
echo ""

# 2. Перезапускаем backend
echo "🔄 Перезапуск backend на сервере..."
ssh -p $PORT $SERVER << 'ENDSSH'
pm2 restart vazifa-backend
echo ""
echo "⏳ Ожидание 3 секунды..."
sleep 3
echo ""
echo "📊 Статус PM2:"
pm2 status
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Деплой завершен успешно!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "❌ Ошибка при перезапуске сервера"
    exit 1
fi
