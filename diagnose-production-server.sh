#!/bin/bash

# Скрипт диагностики продакшн сервера
# Использование: ./diagnose-production-server.sh

SERVER="ubuntu@193.111.11.98"
PORT="3022"

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║          ДИАГНОСТИКА ПРОДАКШН СЕРВЕРА - VAZIFA PROJECT                ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Подключение к $SERVER:$PORT"
echo "Введите пароль когда будет запрошен..."
echo ""

ssh -p $PORT $SERVER << 'ENDSSH'

echo "=========================================="
echo "1. NGINX КОНФИГУРАЦИИ"
echo "=========================================="
echo ""
echo "--- Sites Available ---"
ls -la /etc/nginx/sites-available/ 2>/dev/null || echo "Нет доступа или директория не существует"
echo ""

echo "--- Sites Enabled ---"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "Нет доступа или директория не существует"
echo ""

echo "--- Конфигурация для protocol.oci.tj ---"
if [ -f /etc/nginx/sites-available/protocol.oci.tj ]; then
    cat /etc/nginx/sites-available/protocol.oci.tj
else
    echo "Файл не найден"
fi
echo ""

echo "--- Конфигурация для ptapi.oci.tj ---"
if [ -f /etc/nginx/sites-available/ptapi.oci.tj ]; then
    cat /etc/nginx/sites-available/ptapi.oci.tj
else
    echo "Файл не найден (это может быть проблемой!)"
fi
echo ""

echo "=========================================="
echo "2. PM2 ПРОЦЕССЫ"
echo "=========================================="
pm2 list
echo ""
pm2 info backend 2>/dev/null || echo "Backend process info not available"
echo ""
pm2 info frontend 2>/dev/null || echo "Frontend process info not available"
echo ""

echo "=========================================="
echo "3. СТРУКТУРА ПРОЕКТА"
echo "=========================================="
echo "--- Home directory ---"
ls -la ~ | head -20
echo ""

echo "--- Project directory ---"
if [ -d ~/vazifa ]; then
    echo "Проект в ~/vazifa:"
    ls -la ~/vazifa
elif [ -d ~/Vazif* ]; then
    echo "Найден проект:"
    ls -la ~/Vazif*
else
    echo "Ищем проект в других локациях..."
    find ~ -maxdepth 2 -name "backend" -o -name "frontend" 2>/dev/null | head -5
fi
echo ""

echo "=========================================="
echo "4. BACKEND ENV ФАЙЛЫ"
echo "=========================================="
echo "--- Поиск backend директории ---"
BACKEND_DIR=$(find ~ -maxdepth 3 -type d -name "backend" 2>/dev/null | head -1)
if [ -n "$BACKEND_DIR" ]; then
    echo "Backend найден: $BACKEND_DIR"
    echo ""
    echo "--- .env файл (без секретов) ---"
    if [ -f "$BACKEND_DIR/.env" ]; then
        cat "$BACKEND_DIR/.env" | grep -E "^(PORT|NODE_ENV|FRONTEND_URL|BACKEND_URL|MONGODB_URI)" || echo "Основные переменные не найдены"
    else
        echo ".env файл не найден!"
    fi
else
    echo "Backend директория не найдена!"
fi
echo ""

echo "=========================================="
echo "5. FRONTEND ENV ФАЙЛЫ"
echo "=========================================="
echo "--- Поиск frontend директории ---"
FRONTEND_DIR=$(find ~ -maxdepth 3 -type d -name "frontend" 2>/dev/null | head -1)
if [ -n "$FRONTEND_DIR" ]; then
    echo "Frontend найден: $FRONTEND_DIR"
    echo ""
    echo "--- .env файл ---"
    if [ -f "$FRONTEND_DIR/.env" ]; then
        cat "$FRONTEND_DIR/.env"
    else
        echo ".env файл не найден!"
    fi
else
    echo "Frontend директория не найдена!"
fi
echo ""

echo "=========================================="
echo "6. NGINX СТАТУС И ТЕСТЫ"
echo "=========================================="
echo "--- Nginx status ---"
sudo systemctl status nginx --no-pager | head -20
echo ""
echo "--- Nginx config test ---"
sudo nginx -t
echo ""

echo "=========================================="
echo "7. ПОРТЫ И СЕРВИСЫ"
echo "=========================================="
echo "--- Проверка портов 5001 (backend) и 3000/3001 (frontend) ---"
sudo netstat -tlnp | grep -E ':(5001|3000|3001|80|443)\s'
echo ""

echo "=========================================="
echo "8. RECENT LOGS"
echo "=========================================="
echo "--- PM2 logs (последние 30 строк) ---"
pm2 logs --lines 30 --nostream 2>/dev/null || echo "PM2 logs недоступны"
echo ""

echo "=========================================="
echo "9. GIT STATUS"
echo "=========================================="
if [ -n "$BACKEND_DIR" ]; then
    cd $(dirname "$BACKEND_DIR")
    echo "--- Git status ---"
    git status 2>/dev/null || echo "Не git репозиторий"
    echo ""
    echo "--- Current branch ---"
    git branch 2>/dev/null || echo "Git недоступен"
    echo ""
    echo "--- Last commit ---"
    git log -1 --oneline 2>/dev/null || echo "Git history недоступна"
fi

echo ""
echo "=========================================="
echo "ДИАГНОСТИКА ЗАВЕРШЕНА"
echo "=========================================="
echo ""
echo "Скопируйте весь вывод и отправьте для анализа"
echo ""

ENDSSH

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                    ДИАГНОСТИКА ЗАВЕРШЕНА                               ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
