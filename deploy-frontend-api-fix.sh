#!/bin/bash

echo "🚀 Деплой исправления /api-v1 на фронтенде"
echo "============================================"

SERVER="ubuntu@193.111.11.98"
PORT="3022"

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Шаг 1: Загрузка nginx конфигурации${NC}"
scp -P $PORT nginx-vazifa-simple $SERVER:/tmp/

echo -e "${BLUE}📦 Шаг 2: Загрузка обновленных файлов фронтенда${NC}"
scp -P $PORT frontend/app/components/tasks/create-task-dialog.tsx $SERVER:/tmp/
scp -P $PORT frontend/app/routes/dashboard/tech-admin.tsx $SERVER:/tmp/
scp -P $PORT frontend/app/routes/dashboard/tech-admin/sms-logs.tsx $SERVER:/tmp/
scp -P $PORT frontend/app/routes/dashboard/tech-admin/users.tsx $SERVER:/tmp/
scp -P $PORT frontend/app/routes/dashboard/tech-admin/system.tsx $SERVER:/tmp/

echo -e "${BLUE}⚙️  Шаг 3: Применение изменений на сервере${NC}"
ssh -p $PORT $SERVER << 'ENDSSH'
set -e

echo "📝 Применение nginx конфигурации..."
sudo cp /tmp/nginx-vazifa-simple /etc/nginx/sites-enabled/vazifa
sudo nginx -t
sudo systemctl reload nginx

echo "📝 Копирование обновленных файлов фронтенда..."
cp /tmp/create-task-dialog.tsx /var/www/vazifa/frontend/app/components/tasks/
cp /tmp/tech-admin.tsx /var/www/vazifa/frontend/app/routes/dashboard/
cp /tmp/sms-logs.tsx /var/www/vazifa/frontend/app/routes/dashboard/tech-admin/
cp /tmp/users.tsx /var/www/vazifa/frontend/app/routes/dashboard/tech-admin/
cp /tmp/system.tsx /var/www/vazifa/frontend/app/routes/dashboard/tech-admin/

echo "🔄 Перезапуск фронтенда (SSR не требует rebuild)..."
cd /var/www/vazifa/frontend
pm2 restart vazifa-frontend

echo "✅ Готово!"
ENDSSH

echo ""
echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo ""
echo "🧪 Проверка:"
echo "1. Откройте https://protocol.oci.tj"
echo "2. Попробуйте создать несколько задач"
echo "3. Должно работать! 🚀"
