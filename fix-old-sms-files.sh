#!/bin/bash

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"

echo "=========================================="
echo "🔧 Удаление старых SMS файлов"
echo "=========================================="
echo ""

ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'
set -e

cd /var/www/vazifa/backend/libs

echo "📂 Текущие SMS файлы:"
ls -la send-sms* sms-queue* 2>/dev/null || echo "Нет SMS файлов"

echo ""
echo "🗑️ Удаление старых файлов..."
rm -f sms-queue.js
rm -f send-sms.js

echo ""
echo "✅ Оставляем только BullMQ версии:"
ls -la send-sms-bullmq.js sms-queue-bullmq.js

echo ""
echo "🔄 Перезапуск backend..."
cd /var/www/vazifa/backend
pm2 restart vazifa-backend

echo ""
echo "⏳ Ждем 5 секунд..."
sleep 5

echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📝 Backend logs:"
pm2 logs vazifa-backend --lines 20 --nostream

echo ""
echo "🔍 Проверка API:"
curl -s http://localhost:4000/api-v1/auth/health | head -20 || echo "❌ API не отвечает"

ENDSSH

echo ""
echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
