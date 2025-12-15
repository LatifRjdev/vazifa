#!/bin/bash

echo "🔄 Перезапуск frontend с новыми переменными окружения..."
echo ""

# SSH credentials
SSH_USER="ubuntu"
SSH_HOST="193.111.11.98"
SSH_PORT="3022"

echo "📝 Подключение к серверу $SSH_USER@$SSH_HOST:$SSH_PORT..."

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'ENDSSH'

cd /var/www/vazifa

echo "📍 Текущая директория: $(pwd)"
echo ""

echo "✅ Проверяем переменные frontend/.env:"
grep "VITE_API_URL" frontend/.env

echo ""
echo "🔄 Перезапуск vazifa-frontend..."
pm2 restart vazifa-frontend --update-env

echo ""
echo "🔄 Перезапуск vazifa-backend..."
pm2 restart vazifa-backend --update-env

echo ""
echo "⏳ Ждем 3 секунды..."
sleep 3

echo ""
echo "📊 Статус всех процессов:"
pm2 status

echo ""
echo "✅ Перезапуск завершен!"

ENDSSH

echo ""
echo "✅ Готово!"
echo ""
echo "🧪 ВАЖНО! Теперь в браузере:"
echo "   1. Откройте DevTools (F12)"
echo "   2. Перейдите на вкладку Network"
echo "   3. Сделайте Hard Reload (Ctrl+Shift+R или Cmd+Shift+R)"
echo "   4. Попробуйте войти или зарегистрироваться"
echo "   5. Проверьте в Network какой URL вызывается"
echo ""
echo "Ожидаемый URL: https://ptapi.oci.tj/api-v1/auth/login-universal"
echo "Неправильный URL: https://ptapi.oci.tj/api-v1/api-v1/auth/login-universal"
