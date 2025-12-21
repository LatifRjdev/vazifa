#!/bin/bash
echo "=========================================="
echo "🔧 Исправление Frontend API URL"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ Текущий frontend .env:"
cat /var/www/vazifa/frontend/.env

echo ""
echo "2️⃣ Изменение VITE_API_URL на относительный путь:"
cd /var/www/vazifa/frontend
sed -i 's|VITE_API_URL=https://ptapi.oci.tj/api-v1|VITE_API_URL=/api-v1|g' .env

echo ""
echo "3️⃣ Новый frontend .env:"
cat /var/www/vazifa/frontend/.env

echo ""
echo "4️⃣ Перезапуск frontend с новым .env:"
pm2 restart vazifa-frontend --update-env

echo ""
echo "⏳ Ожидание 5 секунд..."
sleep 5

echo ""
echo "5️⃣ Проверка статуса:"
pm2 list

echo ""
echo "6️⃣ Тест API через protocol.oci.tj:"
curl -X POST https://protocol.oci.tj/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "test@test.com", "password": "test"}' \
  -s

ENDSSH

echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
