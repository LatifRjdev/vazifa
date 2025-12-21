#!/bin/bash

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"

echo "=========================================="
echo "🔧 Исправление ошибки Bull"
echo "=========================================="
echo ""

ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'
set -e

cd /var/www/vazifa/backend

echo "🗑️ Удаление старого sms-queue.js..."
rm -f libs/sms-queue.js

echo "✅ Файл удален"

echo ""
echo "🔄 Перезапуск backend..."
pm2 restart vazifa-backend

echo ""
echo "⏳ Ждем 3 секунды..."
sleep 3

echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📝 Последние логи:"
pm2 logs vazifa-backend --lines 15 --nostream

echo ""
echo "🔍 Проверка API:"
curl -s http://localhost:4000/api-v1/auth/health || echo "❌ API не отвечает"

ENDSSH

echo ""
echo "=========================================="
echo "✅ Исправление завершено!"
echo "=========================================="
