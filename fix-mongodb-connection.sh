#!/bin/bash
echo "=========================================="
echo "🔍 Диагностика и исправление MongoDB"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'
echo "�� Проверка MongoDB статуса:"
sudo systemctl status mongod --no-pager | head -20

echo ""
echo "🔍 Проверка порта 27017:"
sudo ss -tlnp | grep 27017 || echo "Порт 27017 не слушает!"

echo ""
echo "🔄 Запуск MongoDB:"
sudo systemctl start mongod
sleep 3

echo ""
echo "📊 Новый статус MongoDB:"
sudo systemctl status mongod --no-pager | head -10

echo ""
echo "✅ Включение автозапуска:"
sudo systemctl enable mongod

echo ""
echo "🔌 Тест подключения:"
mongosh --host localhost --port 27017 --eval "db.version()" 2>&1 | head -5 || echo "MongoDB не отвечает"

echo ""
echo "🔄 Перезапуск backend после восстановления MongoDB:"
cd /var/www/vazifa/backend
pm2 restart vazifa-backend

echo ""
echo "📊 Финальный статус PM2:"
pm2 status

ENDSSH

echo "=========================================="
echo "✅ Исправление завершено"
echo "=========================================="
