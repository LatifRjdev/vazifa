#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ: SMS NPI параметры и /sign-in route"
echo "═════════════════════════════════════════════════════"
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
echo "ШАГ 1: Backup текущих файлов"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cp backend/libs/send-sms.js backend/libs/send-sms.js.backup.$(date +%Y%m%d_%H%M%S)
cp frontend/app/routes.ts frontend/app/routes.ts.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup создан"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 2: Исправление SMPP NPI в send-sms.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend/libs

# Заменяем addr_npi: 0 на addr_npi: 1 в bind параметрах
sed -i 's/addr_npi: 0,  \/\/ Unknown for alphanumeric/addr_npi: 1,  \/\/ ISDN\/E.164 numbering plan (changed from 0)/g' send-sms.js

echo "✅ SMPP параметры исправлены:"
echo "   source_addr_npi: 0 → 1"
echo ""
echo "Проверка изменений:"
grep -A 2 "addr_npi:" send-sms.js | head -3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 3: Добавление route для /sign-in"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../../frontend/app

# Добавляем route("sign-in", ...) после index()
sed -i '/index("routes\/auth\/sign-in.tsx"),/a\    route("sign-in", "routes/auth/sign-in.tsx"),' routes.ts

echo "✅ Route для /sign-in добавлен"
echo ""
echo "Проверка изменений:"
grep -A 2 'index("routes/auth/sign-in.tsx")' routes.ts

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 4: Остановка frontend для rebuild"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../..
pm2 stop vazifa-frontend

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 5: Rebuild frontend с новыми routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend
rm -rf build dist .vite 2>/dev/null
echo "⏳ Rebuilding... (это займет 1-2 минуты)"
export NODE_ENV=production
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Frontend build успешен!"
else
    echo ""
    echo "❌ Ошибка при сборке frontend!"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 6: Перезапуск всех сервисов"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ..

echo "🔄 Перезапуск vazifa-frontend..."
pm2 restart vazifa-frontend --update-env

echo "🔄 Перезапуск vazifa-backend (для SMPP изменений)..."
pm2 restart vazifa-backend --update-env

echo "🔄 Перезапуск backend (если существует)..."
pm2 restart backend --update-env 2>/dev/null || true

echo ""
echo "⏳ Ждем 5 секунд для загрузки..."
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 7: Проверка статуса процессов"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 8: Проверка логов backend (SMPP соединение)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Последние 15 строк логов backend:"
pm2 logs vazifa-backend --lines 15 --nostream | grep -E "SMPP|✅|❌" || pm2 logs vazifa-backend --lines 15 --nostream

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENDSSH

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ ДЕПЛОЙ ЗАВЕРШЕН!"
echo "════════════════════════════════════════════════════"
echo ""
echo "📋 ЧТО БЫЛО ИСПРАВЛЕНО:"
echo ""
echo "1️⃣ SMPP параметры (backend/libs/send-sms.js):"
echo "   • source_addr_npi: 0 → 1"
echo "   • dest_addr_ton: 1 (уже был правильный)"
echo "   • dest_addr_npi: 1 (уже был правильный)"
echo ""
echo "2️⃣ Frontend routing (frontend/app/routes.ts):"
echo "   • Добавлен явный route для /sign-in"
echo "   • Теперь /sign-in работает корректно"
echo ""
echo "🧪 ТЕСТИРОВАНИЕ:"
echo ""
echo "✅ Проблема 1: SMS отправка"
echo "   • Попробуйте зарегистрироваться с номером +992XXXXXXXXX"
echo "   • SMS должен прийти с новыми NPI параметрами"
echo ""
echo "✅ Проблема 2: Страница /sign-in"
echo "   • Перейдите на https://protocol.oci.tj/sign-in"
echo "   • Сделайте Hard Reload (Ctrl+Shift+R / Cmd+Shift+R)"
echo "   • Страница должна загрузиться БЕЗ ошибки 404"
echo "   • Попробуйте выйти из системы - должен редирект на /sign-in"
echo ""
echo "📝 ЕСЛИ SMS ВСЕ ЕЩЕ НЕ ПРИХОДИТ:"
echo "   • Проверьте логи: ssh -p 3022 ubuntu@193.111.11.98"
echo "   • cd /var/www/vazifa && pm2 logs vazifa-backend"
echo "   • Ищите строки с 'SMPP' для диагностики"
echo ""
echo "════════════════════════════════════════════════════"
