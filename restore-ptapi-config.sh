#!/bin/bash
echo "=========================================="
echo "🔄 Восстановление ptapi.oci.tj конфигурации"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ Проверка существующих Nginx конфигураций:"
ls -la /etc/nginx/sites-available/ | grep -E "ptapi|protocol|vazifa"

echo ""
echo "2️⃣ Проверка активных конфигураций:"
ls -la /etc/nginx/sites-enabled/

echo ""
echo "3️⃣ Содержимое текущей конфигурации vazifa:"
cat /etc/nginx/sites-available/vazifa

echo ""
echo "4️⃣ Тест ptapi.oci.tj:"
curl -s https://ptapi.oci.tj/api-v1/auth/login-universal \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "test", "password": "test"}' \
  -w "\nHTTP: %{http_code}\n" | head -5

echo ""
echo "5️⃣ Тест protocol.oci.tj/api-v1:"
curl -s https://protocol.oci.tj/api-v1/auth/login-universal \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "test", "password": "test"}' \
  -w "\nHTTP: %{http_code}\n"

ENDSSH

echo "=========================================="
echo "✅ Проверка завершена"
echo "=========================================="
