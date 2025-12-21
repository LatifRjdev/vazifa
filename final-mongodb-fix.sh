#!/bin/bash
echo "=========================================="
echo "🔧 Финальное исправление MongoDB"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ Остановка текущих процессов:"
sudo systemctl stop mongod
sleep 2

echo ""
echo "2️⃣ Убиваем зависшие процессы MongoDB:"
sudo pkill -9 mongod || true
sleep 2

echo ""
echo "3️⃣ Запуск MongoDB:"
sudo systemctl start mongod
sleep 5

echo ""
echo "4️⃣ Проверка статуса:"
sudo systemctl status mongod --no-pager | head -15

echo ""
echo "5️⃣ Проверка порта 27017:"
sudo ss -tlnp | grep 27017

echo ""
echo "6️⃣ Тест подключения:"
mongosh --host localhost --port 27017 --eval "db.version()" 2>&1 | head -3

echo ""
echo "7️⃣ Включение автозапуска:"
sudo systemctl enable mongod

echo ""
echo "8️⃣ Перезапуск backend:"
cd /var/www/vazifa/backend
pm2 restart vazifa-backend
sleep 3

echo ""
echo "9️⃣ Финальная проверка PM2:"
pm2 list

echo ""
echo "🔟 Тест API:"
sleep 2
curl -s http://localhost:5001/api-v1/health || echo "Backend еще запускается..."

ENDSSH

echo "=========================================="
echo "✅ Готово"
echo "=========================================="
