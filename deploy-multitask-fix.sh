#!/bin/bash

# Deploy multitask route fix to server
# Деплой исправления маршрута создания нескольких задач

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🚀 Деплой исправления create-multiple маршрута     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

SERVER="ubuntu@193.111.11.98"
PORT="3022"
REMOTE_PATH="/var/www/vazifa/backend"
LOCAL_FILE="backend/routes/task.js"

echo "📋 Параметры деплоя:"
echo "   Сервер: $SERVER"
echo "   Порт: $PORT"
echo "   Путь: $REMOTE_PATH"
echo "   Файл: $LOCAL_FILE"
echo ""

# Проверка существования локального файла
if [ ! -f "$LOCAL_FILE" ]; then
    echo "❌ Ошибка: Файл $LOCAL_FILE не найден!"
    exit 1
fi

echo "✅ Локальный файл найден"
echo ""

# Копирование файла на сервер
echo "📤 Копирование файла на сервер..."
scp -P $PORT "$LOCAL_FILE" "$SERVER:$REMOTE_PATH/routes/"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Файл успешно скопирован на сервер!"
    echo ""
    
    # Перезапуск backend на сервере
    echo "🔄 Перезапуск backend на сервере..."
    echo ""
    
    ssh -p $PORT $SERVER "cd $REMOTE_PATH && pm2 restart backend"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║              ✅ ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!                  ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "📝 Что было исправлено:"
        echo "   ✓ Маршрут /create-multiple перемещен ПЕРЕД маршрутом /"
        echo "   ✓ Теперь Express правильно обрабатывает запросы"
        echo "   ✓ Backend перезапущен"
        echo ""
        echo "🧪 Проверьте создание нескольких задач на фронтенде!"
        echo ""
    else
        echo ""
        echo "⚠️  Файл скопирован, но не удалось перезапустить backend"
        echo "   Перезапустите вручную: ssh -p $PORT $SERVER"
        echo "   Затем: cd $REMOTE_PATH && pm2 restart backend"
        echo ""
    fi
else
    echo ""
    echo "❌ Ошибка при копировании файла на сервер!"
    exit 1
fi
