#!/bin/bash
echo "=========================================="
echo "🚀 Деплой исправленных файлов и пересборка"
echo "=========================================="

# Копируем исправленный sign-in.tsx на сервер
echo "1️⃣ Копирую sign-in.tsx на сервер..."
scp -P 3022 frontend/app/routes/auth/sign-in.tsx ubuntu@193.111.11.98:/var/www/vazifa/frontend/app/routes/auth/

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "2️⃣ Проверяю что файл скопирован:"
grep -n "api-v1/auth/login-universal" /var/www/vazifa/frontend/app/routes/auth/sign-in.tsx | head -3

echo ""
echo "3️⃣ Останавливаю frontend:"
pm2 stop vazifa-frontend

echo ""
echo "4️⃣ Удаляю старый build:"
cd /var/www/vazifa/frontend
rm -rf build/

echo ""
echo "5️⃣ Пересборка frontend (4-й раз):"
npm run build 2>&1 | tail -30

echo ""
echo "6️⃣ Запуск frontend:"
pm2 start ecosystem.config.cjs

echo ""
echo "⏳ Ожидание 10 секунд..."
sleep 10

echo ""
echo "7️⃣ PM2 статус:"
pm2 list

echo ""
echo "8️⃣ Тест входа:"
curl -X POST https://protocol.oci.tj/api-v1/auth/login-universal \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "admin@vazifa2.com", "password": "fwr123456"}' \
  -s | jq -r '.token' | head -c 50

echo ""
echo "9️⃣ Создание MongoDB backup:"
mongodump --uri="mongodb://localhost:27017/vazifa" --out=/tmp/vazifa-backup-$(date +%Y%m%d-%H%M%S)
echo "Backup создан в /tmp/"
ls -lh /tmp/vazifa-backup-* | tail -1

ENDSSH

echo ""
echo "=========================================="
echo "✅ Готово! Попробуйте войти снова!"
echo "=========================================="
