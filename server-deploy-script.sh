#!/bin/bash

# Скрипт для выполнения НА СЕРВЕРЕ
# Этот скрипт будет загружен на сервер и выполнен там

set -e

PROJECT_DIR="/var/www/vazifa"
BACKUP_DIR="$HOME/vazifa-backup-20251221-055317"

echo "🔧 Применяем nginx конфигурацию для ptapi.oci.tj..."

# Копируем конфигурацию в sites-available
sudo cp ~/nginx-ptapi-config /etc/nginx/sites-available/ptapi.oci.tj
sudo chown root:root /etc/nginx/sites-available/ptapi.oci.tj
sudo chmod 644 /etc/nginx/sites-available/ptapi.oci.tj

echo "✅ Конфигурация скопирована в /etc/nginx/sites-available/"

# Создаем симлинк если его нет
if [ ! -L /etc/nginx/sites-enabled/ptapi.oci.tj ]; then
    sudo ln -s /etc/nginx/sites-available/ptapi.oci.tj /etc/nginx/sites-enabled/ptapi.oci.tj
    echo "✅ Создан симлинк в sites-enabled"
else
    echo "ℹ️  Симлинк уже существует"
fi

# Тестируем конфигурацию
echo "🧪 Тестируем nginx конфигурацию..."
sudo nginx -t

echo "✅ Nginx конфигурация валидна"

# Перезагружаем nginx
echo "🔄 Перезагружаем nginx..."
sudo systemctl reload nginx

echo "✅ Nginx успешно перезагружен"
echo ""

# Git pull
echo "📥 Выполняем git pull..."
cd "$PROJECT_DIR"
git pull || echo "⚠️ Git pull завершился с предупреждениями"

# Backend npm install
echo "📦 Устанавливаем зависимости backend..."
cd "$PROJECT_DIR/backend"
npm install --production

echo "✅ Зависимости backend установлены"

# Frontend npm install
echo "📦 Устанавливаем зависимости frontend..."
cd "$PROJECT_DIR/frontend"
npm install

# Build frontend
echo "🏗️  Собираем frontend (это может занять несколько минут)..."
npm run build

echo "✅ Frontend успешно собран"

# Перезапуск pm2
echo "🔄 Перезапускаем pm2 процессы..."
pm2 restart vazifa-backend || pm2 restart backend
pm2 restart vazifa-frontend || pm2 restart frontend

echo "⏳ Ждем запуска процессов (10 секунд)..."
sleep 10

echo ""
echo "📊 Статус pm2 процессов:"
pm2 list

echo ""
echo "✅ ДЕПЛОЙ ЗАВЕРШЕН!"
echo "📦 Бэкап сохранен в: $BACKUP_DIR"
