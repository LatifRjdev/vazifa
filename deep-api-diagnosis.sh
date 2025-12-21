#!/bin/bash
echo "=========================================="
echo "🔬 Глубокая диагностика API"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ Проверка server.js proxy:"
cd /var/www/vazifa/frontend
grep -A 20 "createProxyMiddleware\|proxy" server.js

echo ""
echo "2️⃣ Тест входа с вашим аккаунтом через backend:"
curl -X POST http://localhost:5001/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "admin@vazifa2.com", "password": "fwr123456"}' \
  -s | jq '.'

echo ""
echo "3️⃣ Тест через Nginx:"
curl -X POST https://protocol.oci.tj/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "admin@vazifa2.com", "password": "fwr123456"}' \
  -s | head -10

echo ""
echo "4️⃣ Проверка frontend build (есть ли VITE_API_URL):"
grep -r "ptapi.oci.tj" /var/www/vazifa/frontend/build/ 2>/dev/null | head -5 || echo "Не найдено ptapi.oci.tj"
grep -r "VITE_API_URL" /var/www/vazifa/frontend/build/ 2>/dev/null | head -5 || echo "Не найдено VITE_API_URL"

echo ""
echo "5️⃣ PM2 статус:"
pm2 list

ENDSSH

echo "=========================================="
echo "✅ Диагностика завершена"
echo "=========================================="
