#!/bin/bash

echo "🚀 Деплой исправления порта..."

# SSH параметры
SSH_USER="ubuntu"
SSH_HOST="193.111.11.98"
SSH_PORT="3022"

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'ENDSSH'

echo "1. Обновление кода из GitHub..."
cd /var/www/vazifa
git pull origin main

echo ""
echo "2. Остановка PM2 процессов..."
pm2 stop all
pm2 delete all

echo ""
echo "3. Убийство всех node процессов..."
killall -9 node 2>/dev/null || true

sleep 3

echo ""
echo "4. Запуск серверов..."
pm2 start /var/www/vazifa/backend/index.js --name vazifa-backend
pm2 start /var/www/vazifa/frontend/server.js --name vazifa-frontend --interpreter node
pm2 save

echo ""
echo "5. Ожидание 5 секунд..."
sleep 5

echo ""
echo "6. Проверка статуса:"
pm2 list

echo ""
echo "7. Проверка логов frontend:"
pm2 logs vazifa-frontend --lines 5 --nostream

ENDSSH

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "Теперь обновите NGINX конфигурацию вручную:"
echo "1. scp -P 3022 nginx-vazifa-final ubuntu@193.111.11.98:/tmp/"
echo "2. ssh -p 3022 ubuntu@193.111.11.98"
echo "3. sudo mv /tmp/nginx-vazifa-final /etc/nginx/sites-available/vazifa"
echo "4. sudo nginx -t"
echo "5. sudo systemctl reload nginx"
echo ""
echo "После этого откройте: http://protocol.oci.tj"
