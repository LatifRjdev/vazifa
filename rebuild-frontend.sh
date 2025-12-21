#!/bin/bash

# Скрипт для пересборки frontend на production

echo "🔧 Пересборка Frontend..."
echo ""

cd /var/www/vazifa

# Git pull
echo "📥 Git pull..."
git pull

# Frontend
cd frontend

# Установка зависимостей
echo "📦 npm install..."
npm install

# Build
echo "🏗️  npm run build..."
npm run build

# Перезапуск PM2
echo "🔄 pm2 restart..."
pm2 restart vazifa-frontend

echo ""
echo "✅ Frontend пересобран и перезапущен!"
echo ""
echo "🧪 Теперь проверьте создание мультизадач в браузере!"
