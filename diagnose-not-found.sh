#!/bin/bash
echo "=========================================="
echo "🔍 Диагностика Not Found Error"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ PM2 статус:"
pm2 list

echo ""
echo "2️⃣ Backend логи (последние ошибки):"
pm2 logs vazifa-backend --err --lines 10 --nostream

echo ""
echo "3️⃣ Frontend логи (последние ошибки):"
pm2 logs vazifa-frontend --err --lines 10 --nostream

echo ""
echo "4️⃣ Тест API напрямую через backend:"
curl -X POST http://localhost:5001/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "admin@vazifa2.com", "password": "fwr123456"}' \
  -s -w "\nHTTP Code: %{http_code}\n"

echo ""
echo "5️⃣ Тест через Nginx:"
curl -X POST https://protocol.oci.tj/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "admin@vazifa2.com", "password": "fwr123456"}' \
  -s -w "\nHTTP Code: %{http_code}\n" | head -20

echo ""
echo "6️⃣ Nginx access log (последние API запросы):"
tail -10 /var/log/nginx/access.log | grep api-v1

echo ""
echo "7️⃣ Nginx error log:"
tail -10 /var/log/nginx/error.log

ENDSSH

echo "=========================================="
echo "✅ Диагностика завершена"
echo "=========================================="
