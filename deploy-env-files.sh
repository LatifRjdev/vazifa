#!/bin/bash
echo "=========================================="
echo "📦 Копирование .env файлов на сервер"
echo "=========================================="

# Копируем backend/.env
echo "📤 1. Копирование backend/.env..."
scp -P 3022 backend/.env ubuntu@193.111.11.98:/tmp/backend.env

# Копируем frontend/.env
echo "📤 2. Копирование frontend/.env..."
scp -P 3022 frontend/.env ubuntu@193.111.11.98:/tmp/frontend.env

echo ""
echo "📥 3. Установка файлов на сервере..."
ssh ubuntu@193.111.11.98 -p 3022 << 'EOFSSH'

# Перемещаем backend .env
echo "   Backend .env..."
sudo mv /tmp/backend.env /var/www/vazifa/backend/.env
sudo chown ubuntu:ubuntu /var/www/vazifa/backend/.env
sudo chmod 600 /var/www/vazifa/backend/.env

# Перемещаем frontend .env
echo "   Frontend .env..."
sudo mv /tmp/frontend.env /var/www/vazifa/frontend/.env
sudo chown ubuntu:ubuntu /var/www/vazifa/frontend/.env  
sudo chmod 600 /var/www/vazifa/frontend/.env

echo ""
echo "✅ 4. Проверка файлов:"
echo "Backend .env:"
ls -lh /var/www/vazifa/backend/.env
head -3 /var/www/vazifa/backend/.env

echo ""
echo "Frontend .env:"
ls -lh /var/www/vazifa/frontend/.env
cat /var/www/vazifa/frontend/.env

echo ""
echo "🔄 5. Перезапуск PM2 процессов..."
cd /var/www/vazifa/backend
pm2 restart all

echo ""
echo "📊 6. Статус PM2:"
pm2 list

echo ""
echo "⏳ 7. Ожидание 5 секунд для инициализации..."
sleep 5

echo ""
echo "🧪 8. Тест подключения backend:"
curl -s http://localhost:5001/api-v1/health || echo "Endpoint не найден (это нормально)"

echo ""
echo "🧪 9. Тест MongoDB подключения:"
mongosh mongodb://vazifa:Asd123@localhost:27017/vazifa-production --eval "db.version()" --quiet

EOFSSH

echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
