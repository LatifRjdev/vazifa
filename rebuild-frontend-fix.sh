#!/bin/bash

echo "🔧 ПОЛНОЕ ИСПРАВЛЕНИЕ: Rebuild Frontend с новыми переменными"
echo "============================================================"
echo ""

# SSH credentials
SSH_USER="ubuntu"
SSH_HOST="193.111.11.98"
SSH_PORT="3022"

echo "📝 Подключение к серверу $SSH_USER@$SSH_HOST:$SSH_PORT..."
echo ""

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'ENDSSH'

cd /var/www/vazifa

echo "📍 Текущая директория: $(pwd)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 1: Проверка текущих переменных frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend
echo "Текущие переменные в .env:"
grep "VITE_API_URL" .env 2>/dev/null || echo "⚠️ .env не найден"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 2: Исправление .env файла (если еще не исправлен)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backup
cp .env .env.backup.rebuild.$(date +%Y%m%d_%H%M%S) 2>/dev/null

# Исправляем все возможные варианты
sed -i 's|VITE_API_URL=https://ptapi.oci.tj/api-v1|VITE_API_URL=https://ptapi.oci.tj|g' .env
sed -i 's|VITE_PRODUCTION_API_URL=https://ptapi.oci.tj/api-v1|VITE_PRODUCTION_API_URL=https://ptapi.oci.tj|g' .env
sed -i 's|VITE_API_URL=http://localhost:5001/api-v1|VITE_API_URL=http://localhost:5001|g' .env

echo "✅ Новые значения в .env:"
grep "VITE_API_URL" .env

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 3: Остановка frontend перед rebuild"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 stop vazifa-frontend || echo "⚠️ Процесс уже остановлен"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 4: Удаление старого build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
rm -rf build dist .vite 2>/dev/null
echo "✅ Старый build удален"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 5: REBUILD с новыми переменными окружения"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ Это займет 1-2 минуты..."
echo ""

# Установка NODE_ENV для продакшн билда
export NODE_ENV=production

# Запуск билда
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build завершен успешно!"
else
    echo ""
    echo "❌ Ошибка при сборке!"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 6: Запуск frontend с новым build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 restart vazifa-frontend --update-env

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 7: Перезапуск backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../backend
pm2 restart vazifa-backend --update-env

# Также перезапускаем процесс 'backend' если он есть
pm2 restart backend --update-env 2>/dev/null || true

echo ""
echo "⏳ Ждем 5 секунд для полной загрузки..."
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 8: Проверка статуса всех процессов"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 9: Проверка логов frontend (последние 20 строк)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs vazifa-frontend --lines 20 --nostream

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ REBUILD ЗАВЕРШЕН!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENDSSH

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ ВСЕ ГОТОВО!"
echo "════════════════════════════════════════════════════"
echo ""
echo "🧪 ТЕПЕРЬ ПРОВЕРЬТЕ В БРАУЗЕРЕ:"
echo ""
echo "1. 🔄 ОБЯЗАТЕЛЬНО сделайте Hard Reload:"
echo "   • Chrome/Edge: Ctrl+Shift+R (Win) / Cmd+Shift+R (Mac)"
echo "   • Firefox: Ctrl+F5 (Win) / Cmd+Shift+R (Mac)"
echo ""
echo "2. 🔍 Откройте DevTools (F12) → Network"
echo ""
echo "3. 🔐 Попробуйте войти или зарегистрироваться"
echo ""
echo "4. ✅ Проверьте URL в Network:"
echo "   ПРАВИЛЬНО:  https://ptapi.oci.tj/api-v1/auth/login-universal"
echo "   НЕПРАВИЛЬНО: https://ptapi.oci.tj/api-v1/api-v1/auth/login-universal"
echo ""
echo "5. ⚡ Сайт должен грузиться быстрее (5-10 секунд вместо 15)"
echo ""
echo "════════════════════════════════════════════════════"
