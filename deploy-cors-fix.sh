#!/bin/bash

# Скрипт для развертывания исправления CORS на продакшн сервер

echo "🚀 Развертывание исправления CORS на ptapi.oci.tj..."

# Добавить изменения в git
echo "📝 Добавление изменений в git..."
git add backend/index.js mobile/CORS_FIX_DEPLOYMENT.md

# Создать коммит
echo "💾 Создание коммита..."
git commit -m "Fix CORS for mobile app development - add Expo origins"

# Отправить изменения в репозиторий
echo "📤 Отправка изменений в репозиторий..."
git push origin main

echo "✅ Изменения отправлены в репозиторий!"
echo ""
echo "🔧 Следующие шаги:"
echo "1. Подключитесь к серверу ptapi.oci.tj"
echo "2. Выполните git pull для получения изменений"
echo "3. Перезапустите backend сервис"
echo "4. Протестируйте мобильное приложение"
echo ""
echo "Команды для сервера:"
echo "ssh user@ptapi.oci.tj"
echo "cd /path/to/your/backend/"
echo "git pull origin main"
echo "pm2 restart all  # или другой способ перезапуска"
echo ""
echo "🧪 Для тестирования откройте: http://localhost:8081"
