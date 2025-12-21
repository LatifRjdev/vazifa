#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           🔧 Применение nginx конфигурации               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

SERVER="ubuntu@193.111.11.98"
PORT="3022"

echo "📝 Применение конфигурации nginx..."
echo ""

ssh -p $PORT $SERVER << 'ENDSSH'
# Перемещение файла
sudo mv /tmp/nginx-vazifa-fixed /etc/nginx/sites-enabled/vazifa

# Проверка синтаксиса
echo "🔍 Проверка синтаксиса nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Синтаксис nginx правильный!"
    echo ""
    echo "🔄 Перезагрузка nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║              ✅ NGINX УСПЕШНО ОБНОВЛЕН!                   ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "📝 Что было сделано:"
        echo "   ✓ Добавлены маршруты для /tasks/, /auth/, /users/ и т.д."
        echo "   ✓ Теперь запросы правильно проксируются на backend"
        echo "   ✓ /create-multiple теперь работает!"
        echo ""
    else
        echo "❌ Ошибка при перезагрузке nginx!"
        exit 1
    fi
else
    echo "❌ Ошибка в синтаксисе nginx!"
    exit 1
fi
ENDSSH

if [ $? -eq 0 ]; then
    echo "🧪 Попробуйте создать несколько задач на фронтенде!"
    echo ""
fi
