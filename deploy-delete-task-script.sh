#!/bin/bash

# Deploy delete-task-by-url.js script to server
# Деплой скрипта удаления задачи на сервер

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🚀 Деплой скрипта delete-task-by-url.js на сервер    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

SERVER="ubuntu@193.111.11.98"
PORT="3022"
REMOTE_PATH="/var/www/vazifa/backend"
LOCAL_FILE="backend/delete-task-by-url.js"

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
scp -P $PORT "$LOCAL_FILE" "$SERVER:$REMOTE_PATH/"

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                  ✅ ДЕПЛОЙ ЗАВЕРШЕН!                      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📝 Скрипт успешно скопирован на сервер!"
    echo ""
    echo "🔧 Использование на сервере:"
    echo ""
    echo "   ssh -p $PORT $SERVER"
    echo "   cd $REMOTE_PATH"
    echo "   node delete-task-by-url.js /dashboard/task/TASK_ID"
    echo "   или"
    echo "   node delete-task-by-url.js TASK_ID"
    echo ""
else
    echo ""
    echo "❌ Ошибка при копировании файла на сервер!"
    exit 1
fi
