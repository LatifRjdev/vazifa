#!/bin/bash
echo "=========================================="
echo "🔍 Проверка MongoDB"
echo "=========================================="

sshpass -p "root1234" ssh -o StrictHostKeyChecking=no ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'
echo "📊 MongoDB статус:"
sudo systemctl status mongod | head -15

echo ""
echo "🔍 Проверка порта 27017:"
sudo ss -tlnp | grep 27017

echo ""
echo "🔌 Попытка подключения:"
timeout 5 mongo --host localhost --port 27017 --eval "db.version()" 2>&1 || mongosh --host localhost --port 27017 --eval "db.version()" 2>&1 || echo "Не удалось подключиться"

ENDSSH

echo "=========================================="
echo "✅ Проверка завершена"
echo "=========================================="
