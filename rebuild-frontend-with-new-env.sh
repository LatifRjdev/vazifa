#!/bin/bash
echo "=========================================="
echo "🔨 Пересборка Frontend с новым .env"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ Текущий .env:"
cat /var/www/vazifa/frontend/.env

echo ""
echo "2️⃣ Останавливаем frontend:"
pm2 stop vazifa-frontend

echo ""
echo "3️⃣ Пересборка frontend (это займет ~2-3 минуты):"
cd /var/www/vazifa/frontend
npm run build

echo ""
echo "4️⃣ Запуск frontend с новым build:"
pm2 start ecosystem.config.cjs --update-env

echo ""
echo "⏳ Ожидание 10 секунд..."
sleep 10

echo ""
echo "5️⃣ Проверка статуса:"
pm2 list

echo ""
echo "6️⃣ Проверка логов:"
pm2 logs vazifa-frontend --lines 10 --nostream

ENDSSH

echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
