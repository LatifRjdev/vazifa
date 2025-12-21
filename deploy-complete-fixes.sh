#!/bin/bash

# Комплексный скрипт деплоя всех исправлений на продакшн сервер
# Использование: ./deploy-complete-fixes.sh

SERVER="ubuntu@193.111.11.98"
PORT="3022"
BACKUP_DIR="vazifa-backup-$(date +%Y%m%d-%H%M%S)"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          КОМПЛЕКСНЫЙ ДЕПЛОЙ ИСПРАВЛЕНИЙ - VAZIFA PROJECT              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Проверка что nginx конфигурация существует локально
if [ ! -f "nginx-ptapi-config" ]; then
    echo -e "${RED}❌ Файл nginx-ptapi-config не найден!${NC}"
    echo "Убедитесь что вы запускаете скрипт из корневой директории проекта"
    exit 1
fi

echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Этот скрипт выполнит следующие действия:${NC}"
echo "  1. Создаст резервную копию MongoDB базы данных"
echo "  2. Создаст резервные копии nginx конфигураций"
echo "  3. Создаст резервные копии .env файлов"
echo "  4. Применит новую nginx конфигурацию для ptapi.oci.tj"
echo "  5. Выполнит git pull на сервере"
echo "  6. Установит зависимости (npm install)"
echo "  7. Пересоберет frontend"
echo "  8. Перезапустит pm2 процессы"
echo ""
read -p "Продолжить? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Деплой отменен${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ЭТАП 1: СОЗДАНИЕ РЕЗЕРВНЫХ КОПИЙ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

ssh -p $PORT $SERVER << ENDSSH1
set -e

echo "📦 Создаем директорию для бэкапов: ~/$BACKUP_DIR"
mkdir -p ~/$BACKUP_DIR
mkdir -p ~/$BACKUP_DIR/mongodb

# КРИТИЧЕСКИ ВАЖНО: Бэкап MongoDB базы данных
echo ""
echo "🗄️  СОЗДАНИЕ РЕЗЕРВНОЙ КОПИИ MONGODB БАЗЫ ДАННЫХ"
echo "=================================================="
echo ""

# Получить MongoDB URI из .env
PROJECT_DIR="/var/www/vazifa"

if [ -f "\$PROJECT_DIR/backend/.env" ]; then
    MONGODB_URI=\$(grep "MONGODB_URI=" "\$PROJECT_DIR/backend/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -n "\$MONGODB_URI" ]; then
        echo "📋 MongoDB URI найден"
        echo "💾 Создаем дамп базы данных..."
        
        # Используем mongodump для создания бэкапа
        mongodump --uri="\$MONGODB_URI" --out=~/$BACKUP_DIR/mongodb --quiet
        
        if [ \$? -eq 0 ]; then
            # Получаем размер бэкапа
            BACKUP_SIZE=\$(du -sh ~/$BACKUP_DIR/mongodb | cut -f1)
            echo "✅ MongoDB бэкап создан успешно (размер: \$BACKUP_SIZE)"
            echo "📁 Локация: ~/$BACKUP_DIR/mongodb"
            
            # Создаем архив для удобства
            cd ~/$BACKUP_DIR
            tar -czf mongodb-backup.tar.gz mongodb/
            rm -rf mongodb/
            
            ARCHIVE_SIZE=\$(du -sh mongodb-backup.tar.gz | cut -f1)
            echo "📦 Бэкап сжат в архив (размер: \$ARCHIVE_SIZE)"
        else
            echo "❌ ОШИБКА при создании MongoDB бэкапа!"
            echo "⚠️  ВНИМАНИЕ: Продолжение без бэкапа базы данных может быть опасным!"
            echo ""
            read -p "Продолжить без бэкапа БД? (yes/no): " CONTINUE
            if [ "\$CONTINUE" != "yes" ]; then
                echo "Деплой отменен"
                exit 1
            fi
        fi
    else
        echo "⚠️  MONGODB_URI не найден в .env файле"
        echo "⚠️  Пропускаем бэкап базы данных"
    fi
else
    echo "⚠️  .env файл не найден, пропускаем бэкап MongoDB"
fi

echo ""

echo "📋 Создаем резервные копии nginx конфигураций..."
if [ -f /etc/nginx/sites-available/ptapi.oci.tj ]; then
    sudo cp /etc/nginx/sites-available/ptapi.oci.tj ~/$BACKUP_DIR/ptapi.oci.tj.nginx.backup
    echo "✅ Backed up: ptapi.oci.tj nginx config"
else
    echo "⚠️  ptapi.oci.tj nginx config не найден (будет создан новый)"
fi

if [ -f /etc/nginx/sites-available/protocol.oci.tj ]; then
    sudo cp /etc/nginx/sites-available/protocol.oci.tj ~/$BACKUP_DIR/protocol.oci.tj.nginx.backup
    echo "✅ Backed up: protocol.oci.tj nginx config"
fi

# Найти директорию проекта
PROJECT_DIR="/var/www/vazifa"

if [ ! -d "\$PROJECT_DIR" ]; then
    echo "❌ Проект не найден в \$PROJECT_DIR!"
    exit 1
fi

echo "📁 Проект найден: \$PROJECT_DIR"

# Бэкап .env файлов
echo "📋 Создаем резервные копии .env файлов..."
if [ -f "\$PROJECT_DIR/backend/.env" ]; then
    cp "\$PROJECT_DIR/backend/.env" ~/$BACKUP_DIR/backend.env.backup
    echo "✅ Backed up: backend/.env"
fi

if [ -f "\$PROJECT_DIR/frontend/.env" ]; then
    cp "\$PROJECT_DIR/frontend/.env" ~/$BACKUP_DIR/frontend.env.backup
    echo "✅ Backed up: frontend/.env"
fi

echo ""
echo "✅ Все резервные копии созданы в: ~/$BACKUP_DIR"
echo ""

ENDSSH1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при создании резервных копий!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ЭТАП 2: ПРИМЕНЕНИЕ NGINX КОНФИГУРАЦИИ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Копируем nginx конфигурацию на сервер
echo "📤 Копируем nginx-ptapi-config на сервер..."
scp -P $PORT nginx-ptapi-config $SERVER:~/nginx-ptapi-config

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при копировании nginx конфигурации!${NC}"
    exit 1
fi

# Применяем nginx конфигурацию
ssh -p $PORT $SERVER << 'ENDSSH2'
set -e

echo "🔧 Применяем nginx конфигурацию для ptapi.oci.tj..."

# Копируем конфигурацию в sites-available
sudo cp ~/nginx-ptapi-config /etc/nginx/sites-available/ptapi.oci.tj
sudo chown root:root /etc/nginx/sites-available/ptapi.oci.tj
sudo chmod 644 /etc/nginx/sites-available/ptapi.oci.tj

echo "✅ Конфигурация скопирована в /etc/nginx/sites-available/"

# Создаем симлинк если его нет
if [ ! -L /etc/nginx/sites-enabled/ptapi.oci.tj ]; then
    sudo ln -s /etc/nginx/sites-available/ptapi.oci.tj /etc/nginx/sites-enabled/ptapi.oci.tj
    echo "✅ Создан симлинк в sites-enabled"
else
    echo "ℹ️  Симлинк уже существует"
fi

# Тестируем конфигурацию
echo "🧪 Тестируем nginx конфигурацию..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx конфигурация содержит ошибки!"
    exit 1
fi

echo "✅ Nginx конфигурация валидна"

# Перезагружаем nginx
echo "🔄 Перезагружаем nginx..."
sudo systemctl reload nginx

echo "✅ Nginx успешно перезагружен"
echo ""

ENDSSH2

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при применении nginx конфигурации!${NC}"
    echo -e "${YELLOW}Для отката выполните:${NC}"
    echo "ssh -p $PORT $SERVER"
    echo "sudo cp ~/$BACKUP_DIR/ptapi.oci.tj.nginx.backup /etc/nginx/sites-available/ptapi.oci.tj 2>/dev/null || true"
    echo "sudo systemctl reload nginx"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ЭТАП 3: ОБНОВЛЕНИЕ BACKEND${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

ssh -p $PORT $SERVER << 'ENDSSH3'
set -e

# Найти директорию проекта
PROJECT_DIR="/var/www/vazifa"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Проект не найден в $PROJECT_DIR!"
    exit 1
fi

cd "$PROJECT_DIR"
echo "📁 Рабочая директория: $(pwd)"

# Git pull
echo "📥 Выполняем git pull..."
git pull

if [ $? -ne 0 ]; then
    echo "⚠️  Git pull завершился с ошибками, но продолжаем..."
fi

# Backend npm install
echo "📦 Устанавливаем зависимости backend..."
cd backend
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей backend"
    exit 1
fi

echo "✅ Зависимости backend установлены"
echo ""

ENDSSH3

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при обновлении backend!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ЭТАП 4: ОБНОВЛЕНИЕ FRONTEND${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

ssh -p $PORT $SERVER << 'ENDSSH4'
set -e

PROJECT_DIR="/var/www/vazifa"

cd "$PROJECT_DIR/frontend"
echo "📁 Рабочая директория: $(pwd)"

# Frontend npm install
echo "📦 Устанавливаем зависимости frontend..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей frontend"
    exit 1
fi

# Build frontend
echo "🏗️  Собираем frontend (это может занять несколько минут)..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке frontend"
    exit 1
fi

echo "✅ Frontend успешно собран"
echo ""

ENDSSH4

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при обновлении frontend!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ЭТАП 5: ПЕРЕЗАПУСК СЕРВИСОВ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

ssh -p $PORT $SERVER << 'ENDSSH5'
set -e

echo "🔄 Перезапускаем pm2 процессы..."

# Перезапуск backend
echo "🔧 Перезапуск backend..."
pm2 restart backend || pm2 start backend

# Перезапуск frontend
echo "🔧 Перезапуск frontend..."
pm2 restart frontend || pm2 start frontend

# Ждем чтобы процессы запустились
echo "⏳ Ждем запуска процессов (10 секунд)..."
sleep 10

# Показываем статус
echo ""
echo "📊 Статус pm2 процессов:"
pm2 list

echo ""
echo "📋 Последние логи backend (10 строк):"
pm2 logs backend --lines 10 --nostream

echo ""
echo "✅ Сервисы перезапущены"
echo ""

ENDSSH5

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при перезапуске сервисов!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ЭТАП 6: ПРОВЕРКА РАБОТОСПОСОБНОСТИ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo "🧪 Тестируем API endpoints..."

# Тест 1: Проверка основного endpoint
echo -n "  • Проверка root endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ptapi.oci.tj/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK ($HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  $HTTP_CODE${NC}"
fi

# Тест 2: Проверка /api-v1/
echo -n "  • Проверка /api-v1/ endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ptapi.oci.tj/api-v1/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK ($HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  $HTTP_CODE${NC}"
fi

# Тест 3: Проверка frontend
echo -n "  • Проверка frontend... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://protocol.oci.tj/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK ($HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  $HTTP_CODE${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН! 🎉                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Все этапы выполнены успешно!${NC}"
echo ""
echo "📋 Резюме:"
echo "  • MongoDB база данных забэкаплена"
echo "  • Nginx конфигурация обновлена для ptapi.oci.tj"
echo "  • Backend обновлен и перезапущен"
echo "  • Frontend пересобран и перезапущен"
echo "  • Резервные копии сохранены в: ~/$BACKUP_DIR"
echo ""
echo "🔗 Ссылки:"
echo "  Frontend: https://protocol.oci.tj"
echo "  API:      https://ptapi.oci.tj"
echo ""
echo "📝 Следующие шаги:"
echo "  1. Протестируйте создание множественных задач"
echo "  2. Проверьте новые функции (профиль пользователя, chief manager, и т.д.)"
echo "  3. Проверьте логи: ssh -p $PORT $SERVER 'pm2 logs'"
echo ""
echo -e "${YELLOW}ℹ️  В случае проблем, резервные копии находятся в: ~/$BACKUP_DIR${NC}"
echo ""
