#!/bin/bash
echo "=========================================="
echo "🔍 ДИАГНОСТИКА JSON ERROR"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ Frontend .env (API URL):"
cat /var/www/vazifa/frontend/.env

echo ""
echo "2️⃣ server.js proxy configuration:"
cd /var/www/vazifa/frontend
grep -A 10 "proxy" server.js | head -15

echo ""
echo "3️⃣ Тест API endpoint (login):"
curl -X POST https://protocol.oci.tj/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "test@test.com", "password": "test"}' \
  -v 2>&1 | grep -E "HTTP|Content-Type|{|message"

echo ""
echo "4️⃣ Тест через localhost (backend напрямую):"
curl -X POST http://localhost:5001/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "test@test.com", "password": "test"}' \
  -s | head -3

echo ""
echo "5️⃣ PM2 статус backend:"
pm2 list | grep backend

echo ""
echo "6️⃣ Nginx access log (последние 5 API запросов):"
tail -20 /var/log/nginx/access.log | grep "api-v1" | tail -5

echo ""
echo "7️⃣ Проверка что отдает корневой URL:"
curl -s https://protocol.oci.tj/api-v1/ | head -3

ENDSSH

echo "=========================================="
echo "✅ Диагностика завершена"
echo "=========================================="
