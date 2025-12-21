#!/bin/bash

echo "🚀 Деплой скрипта массового удаления пользователей"
echo "=================================================="

SERVER="ubuntu@193.111.11.98"
PORT="3022"

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Копирование файлов на сервер...${NC}"

# Копировать скрипт
echo "Копирование delete-multiple-users.js..."
scp -P $PORT backend/delete-multiple-users.js $SERVER:/var/www/vazifa/backend/

# Копировать пример файла
echo "Копирование users-to-delete-example.txt..."
scp -P $PORT backend/users-to-delete-example.txt $SERVER:/var/www/vazifa/backend/

echo ""
echo -e "${GREEN}✅ Файлы успешно скопированы на сервер!${NC}"
echo ""
echo "📝 Скопированные файлы:"
echo "   • /var/www/vazifa/backend/delete-multiple-users.js"
echo "   • /var/www/vazifa/backend/users-to-delete-example.txt"
echo ""
echo "🎯 Использование:"
echo "   1. Подключитесь к серверу: ssh -p 3022 ubuntu@193.111.11.98"
echo "   2. Перейдите в папку: cd /var/www/vazifa/backend"
echo "   3. Запустите скрипт:"
echo "      node delete-multiple-users.js user1@mail.com user2@mail.com"
echo "      или"
echo "      node delete-multiple-users.js --file users.txt"
echo ""
