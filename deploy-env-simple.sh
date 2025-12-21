#!/bin/bash
echo "=========================================="
echo "📦 Установка .env файлов (без sudo)"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "📂 Проверка прав доступа:"
ls -ld /var/www/vazifa/backend /var/www/vazifa/frontend

echo ""
echo "📥 Перемещение файлов из /tmp..."
mv /tmp/backend.env /var/www/vazifa/backend/.env
mv /tmp/frontend.env /var/www/vazifa/frontend/.env

echo ""
echo "✅ Проверка установленных файлов:"
echo "Backend .env:"
ls -lh /var/www/vazifa/backend/.env
echo "Первые 3 строки:"
head -3 /var/www/vazifa/backend/.env

echo ""
echo "Frontend .env:"
ls -lh /var/www/vazifa/frontend/.env
cat /var/www/vazifa/frontend/.env

echo ""
echo "🔄 Перезапуск PM2 с новыми env:"
cd /var/www/vazifa/backend
pm2 restart all --update-env

echo ""
echo "⏳ Ожидание 5 секунд..."
sleep 5

echo ""
echo "📊 Статус PM2:"
pm2 list

echo ""
echo "🧪 Тест API:"
curl -s -X POST https://ptapi.oci.tj/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "admin@vazifa2.com", "password": "test"}' | head -1

ENDSSH

echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
