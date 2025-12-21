#!/bin/bash
echo "=========================================="
echo "🔧 Освобождение портов и перезапуск"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ Проверка занятых портов:"
echo ""
echo "Порт 5001 (Backend):"
lsof -ti:5001 && echo "⚠️ ЗАНЯТ!" || echo "✅ Свободен"

echo ""
echo "Порт 3000 (Frontend):"
lsof -ti:3000 && echo "⚠️ ЗАНЯТ!" || echo "✅ Свободен"

echo ""
echo "2️⃣ Остановка PM2 процессов:"
pm2 stop all
pm2 delete all

echo ""
echo "3️⃣ Убийство процессов на портах:"
echo "Убиваем процессы на порту 5001..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || echo "Нет процессов"

echo "Убиваем процессы на порту 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Нет процессов"

echo ""
echo "4️⃣ Проверка MongoDB:"
systemctl status mongod --no-pager | head -5
mongosh mongodb://vazifa:Asd123@localhost:27017/vazifa-production --eval "db.version()" --quiet || echo "MongoDB не отвечает"

echo ""
echo "5️⃣ Перезапуск Backend:"
cd /var/www/vazifa/backend
pm2 start index.js --name vazifa-backend --update-env

echo ""
echo "6️⃣ Перезапуск Frontend:"
cd /var/www/vazifa/frontend
pm2 start ecosystem.config.cjs --update-env

echo ""
echo "⏳ Ожидание 10 секунд для инициализации..."
sleep 10

echo ""
echo "7️⃣ Проверка статуса:"
pm2 list

echo ""
echo "8️⃣ Проверка портов после перезапуска:"
echo "Порт 5001:"
lsof -ti:5001 && echo "✅ Используется" || echo "❌ Не используется"

echo "Порт 3000:"
lsof -ti:3000 && echo "✅ Используется" || echo "❌ Не используется"

echo ""
echo "9️⃣ Тест API:"
curl -s http://localhost:5001/api-v1/health || curl -s http://localhost:5001/ | head -1

echo ""
echo "🔟 Backend логи (последние 20 строк):"
pm2 logs vazifa-backend --lines 20 --nostream

ENDSSH

echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
