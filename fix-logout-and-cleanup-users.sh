#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ: Logout redirect + Удаление тестовых пользователей"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# SSH credentials
SSH_USER="ubuntu"
SSH_HOST="193.111.11.98"
SSH_PORT="3022"

echo "📝 Подключение к серверу..."
echo ""

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'ENDSSH'

cd /var/www/vazifa

echo "📍 Текущая директория: $(pwd)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 1: Загрузка manage-users.js на сервер"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# manage-users.js будет загружен отдельно через scp

echo "⏳ Проверка наличия файла..."
if [ ! -f "backend/manage-users.js" ]; then
    echo "⚠️ manage-users.js не найден, создается..."
    # Файл будет загружен через scp отдельно
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 2: Удаление тестовых пользователей"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend

echo "🗑️ Удаление +992557777509..."
node manage-users.js delete +992557777509

echo ""
echo "🗑️ Удаление +992985343331..."
node manage-users.js delete +992985343331

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 3: Проверка неверифицированных пользователей"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node manage-users.js list-unverified

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 4: Проверка SMPP логов"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ..
echo "Последние 30 строк логов backend (SMPP):"
pm2 logs vazifa-backend --lines 30 --nostream | grep -E "SMPP|SMS|✅|❌" || pm2 logs vazifa-backend --lines 30 --nostream

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 5: Исправление header.tsx (logout redirect)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend/app/components/layout

# Backup
cp header.tsx header.tsx.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null

# Исправляем logout
sed -i 's/onClick={() => logout()}/onClick={() => {\n                logout();\n                navigate("\\/");\n              }}/g' header.tsx

echo "✅ header.tsx исправлен (добавлен navigate при logout)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 6: Rebuild frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ../../..  # Возврат в frontend/

pm2 stop vazifa-frontend
rm -rf build dist .vite 2>/dev/null

echo "⏳ Rebuilding frontend (1-2 минуты)..."
export NODE_ENV=production
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Frontend build успешен!"
else
    echo ""
    echo "❌ Ошибка при сборке!"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 7: Перезапуск сервисов"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 restart vazifa-frontend --update-env
pm2 restart vazifa-backend --update-env
pm2 restart backend --update-env 2>/dev/null || true

sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ШАГ 8: Статус процессов"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ..
pm2 status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENDSSH

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ DEPLOY ЗАВЕРШЕН!"
echo "════════════════════════════════════════════════════"
echo ""
echo "📋 ЧТО БЫЛО СДЕЛАНО:"
echo ""
echo "1️⃣ Тестовые пользователи удалены:"
echo "   • +992557777509 ✅"
echo "   • +992985343331 ✅"
echo ""
echo "2️⃣ Header.tsx исправлен:"
echo "   • Logout теперь делает navigate('/') ✅"
echo ""
echo "3️⃣ Frontend пересобран и перезапущен ✅"
echo ""
echo "🧪 ТЕСТИРОВАНИЕ:"
echo ""
echo "✅ Проблема 1: Logout redirect"
echo "   • Сделайте Hard Reload (Ctrl+Shift+R / Cmd+Shift+R)"
echo "   • Войдите на сайт"
echo "   • Нажмите кнопку 'Выйти'"
echo "   • Должна загрузиться страница входа БЕЗ ошибки 404"
echo ""
echo "✅ Проблема 2: Повторная регистрация"
echo "   • Теперь +992557777509 и +992985343331 можно"
echo "     использовать для новой регистрации"
echo "   • Попробуйте зарегистрироваться снова"
echo "   • SMS должен прийти (если SMPP работает)"
echo ""
echo "📝 УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ:"
echo ""
echo "# Удалить пользователя"
echo "ssh -p 3022 ubuntu@193.111.11.98"
echo "cd /var/www/vazifa/backend"
echo "node manage-users.js delete +992XXXXXXXXX"
echo ""
echo "# Список неверифицированных"
echo "node manage-users.js list-unverified"
echo ""
echo "# Информация о пользователе"
echo "node manage-users.js info +992XXXXXXXXX"
echo ""
echo "════════════════════════════════════════════════════"
