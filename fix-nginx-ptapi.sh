#!/bin/bash

# Скрипт для исправления nginx конфигурации ptapi.oci.tj
# Удаляет конфликтующий блок из default

echo "🔧 Исправляем nginx конфигурацию для ptapi.oci.tj..."
echo ""

# Создаем бэкап default
echo "📦 Создаем бэкап /etc/nginx/sites-available/default..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Бэкап создан"
echo ""

# Удаляем блок ptapi.oci.tj из default
echo "🗑️  Удаляем конфликтующий блок ptapi.oci.tj из default..."
sudo sed -i '/# Backend API server (ptapi.oci.tj)/,/^}/d' /etc/nginx/sites-available/default

echo "✅ Блок удален"
echo ""

# Тестируем nginx конфигурацию
echo "🧪 Тестируем nginx конфигурацию..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Ошибка в конфигурации! Восстанавливаем бэкап..."
    sudo cp /etc/nginx/sites-available/default.backup-* /etc/nginx/sites-available/default
    exit 1
fi

echo "✅ Конфигурация валидна"
echo ""

# Перезагружаем nginx
echo "🔄 Перезагружаем nginx..."
sudo systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx успешно перезагружен!"
else
    echo "❌ Ошибка при перезагрузке nginx"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ИСПРАВЛЕНИЕ ПРИМЕНЕНО!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Активные конфигурации для ptapi.oci.tj:"
ls -la /etc/nginx/sites-enabled/ | grep ptapi
echo ""
echo "🧪 Тестируем endpoint:"
curl -I http://localhost/tasks/create-multiple
echo ""
echo "🎉 Теперь попробуйте создать задачи в браузере!"
echo ""
