#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    Обновление NGINX конфигурации${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# SSH параметры
SSH_USER="ubuntu"
SSH_HOST="193.111.11.98"
SSH_PORT="3022"

echo -e "${BLUE}1. Копирование файла конфигурации на сервер...${NC}"
scp -P $SSH_PORT nginx-protocol-config $SSH_USER@$SSH_HOST:/tmp/nginx-protocol-config

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при копировании файла${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Файл скопирован${NC}"
echo ""

echo -e "${BLUE}2. Применение конфигурации на сервере...${NC}"

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'ENDSSH'
set -e

echo "Перемещение конфигурации в /etc/nginx/sites-available/..."
sudo mv /tmp/nginx-protocol-config /etc/nginx/sites-available/vazifa
sudo chown root:root /etc/nginx/sites-available/vazifa
sudo chmod 644 /etc/nginx/sites-available/vazifa

echo "Проверка конфигурации NGINX..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Конфигурация корректна"
    echo "Перезапуск NGINX..."
    sudo systemctl reload nginx
    echo "✓ NGINX перезапущен"
else
    echo "✗ Ошибка в конфигурации NGINX"
    exit 1
fi

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  ✓ NGINX конфигурация обновлена!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${BLUE}Сайт теперь доступен по адресу:${NC}"
    echo -e "  • https://protocol.oci.tj (HTTPS)"
    echo -e "  • http://193.111.11.98 (HTTP по IP)"
    echo ""
    echo -e "${YELLOW}Проверьте сайт в браузере!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}  ❌ Ошибка при обновлении конфигурации${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
fi
