#!/bin/bash
echo "=========================================="
echo "🔧 ИСПРАВЛЕНИЕ 502 BAD GATEWAY"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ Диагностика PM2 Frontend:"
pm2 list
echo ""
pm2 logs vazifa-frontend --lines 30 --nostream

echo ""
echo "2️⃣ Проверка порта 3000:"
lsof -ti:3000 && echo "⚠️ Порт 3000 ЗАНЯТ" || echo "✅ Порт 3000 свободен"

echo ""
echo "3️⃣ Nginx конфигурация для protocol.oci.tj:"
cat /etc/nginx/sites-enabled/protocol.oci.tj | grep -A 5 "proxy_pass"

echo ""
echo "4️⃣ Nginx логи ошибок:"
tail -20 /var/log/nginx/error.log

echo ""
echo "5️⃣ Остановка и очистка PM2:"
pm2 stop vazifa-frontend
pm2 delete vazifa-frontend

echo ""
echo "6️⃣ Убийство процессов на порту 3000:"
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Нет процессов"

echo ""
echo "7️⃣ Проверка ecosystem.config.cjs:"
cd /var/www/vazifa/frontend
head -20 ecosystem.config.cjs

echo ""
echo "8️⃣ Перезапуск Frontend:"
pm2 start ecosystem.config.cjs --update-env

echo ""
echo "⏳ Ожидание 10 секунд..."
sleep 10

echo ""
echo "9️⃣ Проверка статуса:"
pm2 list
pm2 logs vazifa-frontend --lines 10 --nostream

echo ""
echo "🔟 Проверка порта 3000 после перезапуска:"
lsof -ti:3000 && echo "✅ Порт 3000 используется" || echo "❌ Порт 3000 НЕ используется!"

echo ""
echo "1️⃣1️⃣ Тест локального подключения:"
curl -s http://localhost:3000 | head -3

echo ""
echo "1️⃣2️⃣ Перезапуск Nginx:"
sudo systemctl reload nginx

echo ""
echo "1️⃣3️⃣ Тест внешнего подключения:"
curl -s https://protocol.oci.tj | head -5

ENDSSH

echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
