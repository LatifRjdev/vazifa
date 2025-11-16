#!/bin/bash
echo "🚀 Финальный деплой исправления..."

ssh -p 3022 ubuntu@193.111.11.98 << 'ENDSSH'

echo "1. Обновление кода..."
cd /var/www/vazifa/frontend
git pull origin main

echo ""
echo "2. Установка зависимостей..."
npm install

echo ""
echo "3. Перезапуск PM2..."
pm2 restart vazifa-frontend

echo ""
echo "4. Ожидание 5 секунд..."
sleep 5

echo ""
echo "5. Проверка статуса:"
pm2 list

echo ""
echo "6. Логи frontend:"
pm2 logs vazifa-frontend --lines 5 --nostream

ENDSSH

echo ""
echo "✅ Деплой завершен! Откройте http://protocol.oci.tj"
