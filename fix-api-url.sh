#!/bin/bash

echo "🔧 Исправление API URL проблемы..."
echo ""

# SSH credentials - CORRECTED
SSH_USER="ubuntu"
SSH_HOST="193.111.11.98"
SSH_PORT="3022"

echo "📝 Подключение к серверу $SSH_USER@$SSH_HOST:$SSH_PORT..."

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'ENDSSH'

# Найти правильный путь к проекту
PROJECT_PATH="/var/www/vazifa"

echo "📂 Переход в директорию проекта..."
cd $PROJECT_PATH || cd /home/ubuntu/vazifa || cd /var/www/html || exit 1

echo "📍 Текущая директория: $(pwd)"
echo ""

echo "🔍 Текущие переменные окружения frontend:"
grep "VITE_API_URL" frontend/.env 2>/dev/null || echo "⚠️ Файл frontend/.env не найден"

echo ""
echo "✏️ Исправление VITE_API_URL в frontend/.env..."

# Backup old .env
cp frontend/.env frontend/.env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null

# Исправить VITE_API_URL - убрать /api-v1 из конца
cd frontend
sed -i 's|VITE_API_URL=https://ptapi.oci.tj/api-v1|VITE_API_URL=https://ptapi.oci.tj|g' .env
sed -i 's|VITE_PRODUCTION_API_URL=https://ptapi.oci.tj/api-v1|VITE_PRODUCTION_API_URL=https://ptapi.oci.tj|g' .env

# Также исправим возможные варианты
sed -i 's|VITE_API_URL=http://localhost:5001/api-v1|VITE_API_URL=http://localhost:5001|g' .env
sed -i 's|/api-v1/api-v1|/api-v1|g' .env

echo ""
echo "✅ Новые значения:"
grep "VITE_API_URL" .env

echo ""
echo "🔄 Перезапуск frontend с новыми переменными..."
pm2 restart frontend --update-env || npm2 restart frontend --update-env || echo "⚠️ PM2 restart не выполнен"

echo ""
echo "🔄 Перезапуск backend для очистки кеша..."
cd ../backend
pm2 restart backend --update-env || npm2 restart backend --update-env || echo "⚠️ PM2 restart не выполнен"

echo ""
echo "⏳ Ждем 3 секунды для применения изменений..."
sleep 3

echo ""
echo "📊 Статус PM2:"
pm2 status || npm2 status || echo "⚠️ PM2 status не выполнен"

echo ""
echo "✅ Исправление завершено!"
echo ""
echo "🧪 Теперь проверьте в браузере:"
echo "   1. Hard reload (Ctrl+Shift+R или Cmd+Shift+R)"
echo "   2. Попробуйте войти со старой почтой"
echo "   3. Попробуйте зарегистрироваться с телефоном"
echo ""
echo "📝 Если endpoints все еще не работают, проверьте:"
echo "   - Backend запущен: pm2 list"
echo "   - Backend порт: netstat -tlnp | grep 5001"
echo "   - Backend логи: pm2 logs backend --lines 50"

ENDSSH

echo ""
echo "✅ Готово! Проверьте работу в браузере с Hard Reload."
