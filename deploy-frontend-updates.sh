#!/bin/bash

# Скрипт для деплоя обновленных frontend файлов
# Usage: ./deploy-frontend-updates.sh

SERVER="ubuntu@193.111.11.98"
PORT="3022"
REMOTE_DIR="/var/www/vazifa"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🚀 Деплой Frontend обновлений на сервер           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Копируем измененные файлы на сервер
echo "📤 Копирование измененных файлов на сервер..."
echo ""

echo "  📄 Копирование header.tsx..."
scp -P $PORT frontend/app/components/layout/header.tsx $SERVER:$REMOTE_DIR/frontend/app/components/layout/
if [ $? -ne 0 ]; then
    echo "  ❌ Ошибка при копировании header.tsx"
    exit 1
fi
echo "  ✅ header.tsx скопирован"
echo ""

echo "  📄 Копирование sidebar-component.tsx..."
scp -P $PORT frontend/app/components/layout/sidebar-component.tsx $SERVER:$REMOTE_DIR/frontend/app/components/layout/
if [ $? -ne 0 ]; then
    echo "  ❌ Ошибка при копировании sidebar-component.tsx"
    exit 1
fi
echo "  ✅ sidebar-component.tsx скопирован"
echo ""

echo "  📄 Копирование auth-context.tsx..."
scp -P $PORT frontend/app/providers/auth-context.tsx $SERVER:$REMOTE_DIR/frontend/app/providers/
if [ $? -ne 0 ]; then
    echo "  ❌ Ошибка при копировании auth-context.tsx"
    exit 1
fi
echo "  ✅ auth-context.tsx скопирован"
echo ""

echo "  📄 Копирование profile.tsx..."
scp -P $PORT frontend/app/routes/user/profile.tsx $SERVER:$REMOTE_DIR/frontend/app/routes/user/
if [ $? -ne 0 ]; then
    echo "  ❌ Ошибка при копировании profile.tsx"
    exit 1
fi
echo "  ✅ profile.tsx скопирован"
echo ""

echo "✅ Все файлы успешно скопированы"
echo ""

# 2. Build frontend на сервере
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Сборка frontend на сервере..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -p $PORT $SERVER << 'ENDSSH'
cd /var/www/vazifa/frontend

echo "📦 Запуск npm run build..."
echo ""

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build завершен успешно"
else
    echo ""
    echo "❌ Ошибка при сборке"
    exit 1
fi
ENDSSH

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Ошибка при выполнении build"
    exit 1
fi

echo ""

# 3. Перезапуск frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Перезапуск frontend на сервере..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -p $PORT $SERVER << 'ENDSSH'
pm2 restart vazifa-frontend

echo ""
echo "⏳ Ожидание 3 секунды..."
sleep 3
echo ""
echo "📊 Статус PM2:"
pm2 status
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Деплой завершен успешно!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 Обновленные файлы:"
    echo "   ✓ header.tsx"
    echo "   ✓ sidebar-component.tsx"
    echo "   ✓ auth-context.tsx"
    echo "   ✓ profile.tsx"
    echo ""
    echo "🎯 Frontend пересобран и перезапущен"
else
    echo ""
    echo "❌ Ошибка при перезапуске сервера"
    exit 1
fi
