#!/bin/bash

echo "🔧 Исправление PM2 конфигурации..."

# SSH параметры
SSH_USER="ubuntu"
SSH_HOST="193.111.11.98"
SSH_PORT="3022"

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'ENDSSH'

echo "Остановка и удаление всех PM2 процессов..."
pm2 stop all
pm2 delete all

echo "Убийство всех node процессов..."
killall -9 node 2>/dev/null || true

sleep 3

echo "Запуск backend..."
cd /var/www/vazifa/backend
pm2 start index.js --name vazifa-backend

echo "Запуск frontend с node interpreter..."
cd /var/www/vazifa/frontend
pm2 start server.js --name vazifa-frontend --interpreter node

echo "Сохранение PM2 конфигурации..."
pm2 save

echo ""
echo "✅ PM2 конфигурация обновлена!"
echo ""

sleep 5

echo "Статус:"
pm2 list

ENDSSH

echo ""
echo "✅ Готово! Проверьте сайт: http://protocol.oci.tj"
