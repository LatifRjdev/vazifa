#!/bin/bash

# Скрипт восстановления из резервной копии
# Использование: ./restore-from-backup.sh <backup-directory-name>

SERVER="ubuntu@193.111.11.98"
PORT="3022"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    echo -e "${RED}❌ Не указана директория с бэкапом!${NC}"
    echo ""
    echo "Использование: ./restore-from-backup.sh <backup-directory-name>"
    echo ""
    echo "Пример: ./restore-from-backup.sh vazifa-backup-20251221-054000"
    echo ""
    echo "Для получения списка доступных бэкапов выполните:"
    echo "ssh -p $PORT $SERVER 'ls -la ~ | grep vazifa-backup'"
    exit 1
fi

BACKUP_DIR="$1"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          ВОССТАНОВЛЕНИЕ ИЗ РЕЗЕРВНОЙ КОПИИ - VAZIFA PROJECT           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Этот скрипт восстановит систему из бэкапа:${NC}"
echo "  Директория бэкапа: $BACKUP_DIR"
echo ""
echo "  Будут восстановлены:"
echo "  • MongoDB база данных"
echo "  • Nginx конфигурации"
echo "  • .env файлы"
echo ""
echo -e "${RED}⚠️  ВСЕ ТЕКУЩИЕ ДАННЫЕ БУДУТ ПЕРЕЗАПИСАНЫ!${NC}"
echo ""
read -p "Вы уверены что хотите продолжить? (yes/no): " -r
echo
if [ "$REPLY" != "yes" ]; then
    echo -e "${YELLOW}Восстановление отменено${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ПРОВЕРКА СУЩЕСТВОВАНИЯ БЭКАПА${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

ssh -p $PORT $SERVER << ENDSSH1
if [ ! -d "~/$BACKUP_DIR" ]; then
    echo "❌ Директория бэкапа не найдена: ~/$BACKUP_DIR"
    echo ""
    echo "Доступные бэкапы:"
    ls -la ~ | grep vazifa-backup || echo "  Нет доступных бэкапов"
    exit 1
fi

echo "✅ Директория бэкапа найдена: ~/$BACKUP_DIR"
echo ""
echo "Содержимое бэкапа:"
ls -lh ~/$BACKUP_DIR
echo ""
ENDSSH1

if [ $? -ne 0 ]; then
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ВОССТАНОВЛЕНИЕ MONGODB${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

ssh -p $PORT $SERVER << 'ENDSSH2'
set -e

BACKUP_DIR="$1"

if [ -f "~/$BACKUP_DIR/mongodb-backup.tar.gz" ]; then
    echo "💾 Найден бэкап MongoDB"
    
    # Извлекаем архив
    cd ~/$BACKUP_DIR
    tar -xzf mongodb-backup.tar.gz
    
    # Получаем MongoDB URI
    PROJECT_DIR=$(find ~ -maxdepth 3 -type d -name "backend" 2>/dev/null | head -1 | xargs dirname)
    
    if [ -f "$PROJECT_DIR/backend/.env" ]; then
        MONGODB_URI=$(grep "MONGODB_URI=" "$PROJECT_DIR/backend/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
        
        if [ -n "$MONGODB_URI" ]; then
            echo "🔄 Восстанавливаем базу данных..."
            echo "⚠️  Это удалит все текущие данные и восстановит из бэкапа!"
            
            # Используем mongorestore
            mongorestore --uri="$MONGODB_URI" --drop ~/$BACKUP_DIR/mongodb/
            
            if [ $? -eq 0 ]; then
                echo "✅ MongoDB успешно восстановлена из бэкапа"
            else
                echo "❌ Ошибка при восстановлении MongoDB"
                exit 1
            fi
        else
            echo "❌ MONGODB_URI не найден в .env"
            exit 1
        fi
    else
        echo "❌ .env файл не найден"
        exit 1
    fi
    
    # Очищаем временные файлы
    rm -rf ~/$BACKUP_DIR/mongodb
else
    echo "⚠️  MongoDB бэкап не найден в директории"
fi

echo ""
ENDSSH2

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ВОССТАНОВЛЕНИЕ NGINX КОНФИГУРАЦИЙ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

ssh -p $PORT $SERVER << ENDSSH3
set -e

BACKUP_DIR="$1"

# Восстановление ptapi.oci.tj
if [ -f "~/$BACKUP_DIR/ptapi.oci.tj.nginx.backup" ]; then
    echo "🔧 Восстанавливаем ptapi.oci.tj nginx config..."
    sudo cp ~/$BACKUP_DIR/ptapi.oci.tj.nginx.backup /etc/nginx/sites-available/ptapi.oci.tj
    echo "✅ ptapi.oci.tj восстановлен"
else
    echo "⚠️  Бэкап ptapi.oci.tj nginx не найден"
fi

# Восстановление protocol.oci.tj
if [ -f "~/$BACKUP_DIR/protocol.oci.tj.nginx.backup" ]; then
    echo "🔧 Восстанавливаем protocol.oci.tj nginx config..."
    sudo cp ~/$BACKUP_DIR/protocol.oci.tj.nginx.backup /etc/nginx/sites-available/protocol.oci.tj
    echo "✅ protocol.oci.tj восстановлен"
else
    echo "⚠️  Бэкап protocol.oci.tj nginx не найден"
fi

# Тестируем и перезагружаем nginx
echo "🧪 Тестируем nginx конфигурацию..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "🔄 Перезагружаем nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в nginx конфигурации!"
    exit 1
fi

echo ""
ENDSSH3

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ВОССТАНОВЛЕНИЕ .ENV ФАЙЛОВ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

ssh -p $PORT $SERVER << 'ENDSSH4'
set -e

BACKUP_DIR="$1"
PROJECT_DIR=$(find ~ -maxdepth 3 -type d -name "backend" 2>/dev/null | head -1 | xargs dirname)

# Backend .env
if [ -f "~/$BACKUP_DIR/backend.env.backup" ]; then
    echo "📋 Восстанавливаем backend/.env..."
    cp ~/$BACKUP_DIR/backend.env.backup "$PROJECT_DIR/backend/.env"
    echo "✅ backend/.env восстановлен"
else
    echo "⚠️  Бэкап backend/.env не найден"
fi

# Frontend .env
if [ -f "~/$BACKUP_DIR/frontend.env.backup" ]; then
    echo "📋 Восстанавливаем frontend/.env..."
    cp ~/$BACKUP_DIR/frontend.env.backup "$PROJECT_DIR/frontend/.env"
    echo "✅ frontend/.env восстановлен"
else
    echo "⚠️  Бэкап frontend/.env не найден"
fi

echo ""
ENDSSH4

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ПЕРЕЗАПУСК СЕРВИСОВ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

ssh -p $PORT $SERVER << 'ENDSSH5'
set -e

echo "🔄 Перезапускаем pm2 процессы..."

pm2 restart all

echo "⏳ Ждем запуска процессов (10 секунд)..."
sleep 10

echo ""
echo "📊 Статус pm2:"
pm2 list

echo ""
ENDSSH5

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО! ✅                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Система восстановлена из бэкапа: $BACKUP_DIR${NC}"
echo ""
echo "📝 Проверьте работоспособность:"
echo "  • Frontend: https://protocol.oci.tj"
echo "  • API: https://ptapi.oci.tj"
echo "  • Логи: ssh -p $PORT $SERVER 'pm2 logs'"
echo ""
