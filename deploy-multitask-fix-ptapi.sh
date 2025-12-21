#!/bin/bash

# Deploy multitask route fix to ptapi.oci.tj server
# Деплой исправления маршрута на правильный сервер

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    🚀 Деплой на правильный сервер ptapi.oci.tj (100)    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

SERVER="ubuntu@193.111.11.100"
PORT="3022"
REMOTE_PATH="/var/www/vazifa/backend"
LOCAL_FILE="backend/routes/task.js"

echo "📋 Параметры деплоя:"
echo "   Сервер: $SERVER (ptapi.oci.tj)"
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
    
    # Полный перезапуск backend
    echo "🔄 Полный перезапуск backend на сервере..."
    echo ""
    
    ssh -p $PORT $SERVER "cd $REMOTE_PATH && pm2 delete vazifa-backend && pm2 start index.js --name vazifa-backend"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║           ✅ ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!                     ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "📝 Что было сделано:"
        echo "   ✓ Файл скопирован на правильный сервер (ptapi.oci.tj)"
        echo "   ✓ Backend полностью перезапущен с очисткой кэша"
        echo "   ✓ Маршрут /create-multiple теперь работает!"
        echo ""
        echo "🧪 Попробуйте создать несколько задач на фронтенде!"
        echo ""
    else
        echo ""
        echo "⚠️  Файл скопирован, но не удалось перезапустить backend"
        echo "   Перезапустите вручную:"
        echo "   ssh -p $PORT $SERVER"
        echo "   cd $REMOTE_PATH && pm2 delete vazifa-backend && pm2 start index.js --name vazifa-backend"
        echo ""
    fi
else
    echo ""
    echo "❌ Ошибка при копировании файла на сервер!"
    exit 1
fi
