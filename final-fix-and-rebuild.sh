#!/bin/bash
echo "=========================================="
echo "🔧 Финальное исправление и пересборка"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

cd /var/www/vazifa/frontend

echo "1️⃣ Остановить frontend:"
pm2 stop vazifa-frontend

echo ""
echo "2️⃣ Удалить старый build:"
rm -rf build/

echo ""
echo "3️⃣ Очистить npm cache:"
npm cache clean --force

echo ""
echo "4️⃣ Пересборка frontend:"
npm run build

echo ""
echo "5️⃣ Запуск frontend:"
pm2 start ecosystem.config.cjs

echo ""
echo "⏳ Ожидание 10 секунд..."
sleep 10

echo ""
echo "6️⃣ Статус:"
pm2 list

echo ""
echo "7️⃣ Тест входа:"
curl -X POST https://protocol.oci.tj/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "admin@vazifa2.com", "password": "fwr123456"}' \
  -s | jq -r '.token' | head -c 50

ENDSSH

echo ""
echo "=========================================="
echo "✅ Готово! Очистите browser cache (Ctrl+Shift+R)!"
echo "=========================================="
