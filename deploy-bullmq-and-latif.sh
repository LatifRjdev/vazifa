#!/bin/bash

# Скрипт для миграции на BullMQ и создания пользователя Латиф Рачабов
# Использование: ./deploy-bullmq-and-latif.sh

set -e  # Остановить при ошибке

echo "========================================="
echo "🚀 МИГРАЦИЯ НА BullMQ + Латиф Рачабов"
echo "========================================="
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"
BACKEND_DIR="/var/www/vazifa/backend"

echo "📡 Сервер: ${SSH_HOST}:${SSH_PORT}"
echo "📁 Директория: ${BACKEND_DIR}"
echo ""

# Функция для выполнения команд по SSH
run_ssh() {
    ssh -p ${SSH_PORT} ${SSH_HOST} "$1"
}

echo "----------------------------------------"
echo "1️⃣ Копирование новых файлов на сервер..."
echo "----------------------------------------"

# Копировать новые BullMQ файлы
echo "📦 Копирование BullMQ библиотек..."
scp -P ${SSH_PORT} \
    backend/libs/sms-queue-bullmq.js \
    backend/libs/send-sms-bullmq.js \
    ${SSH_HOST}:${BACKEND_DIR}/libs/

# Копировать скрипты
echo "📦 Копирование скриптов..."
scp -P ${SSH_PORT} \
    backend/create-latif-user.js \
    backend/clear-sms-queue-bullmq.js \
    backend/test-latif-sms.js \
    ${SSH_HOST}:${BACKEND_DIR}/

# Копировать обновленный package.json
echo "📦 Копирование package.json..."
scp -P ${SSH_PORT} \
    backend/package.json \
    ${SSH_HOST}:${BACKEND_DIR}/

echo -e "${GREEN}✅ Файлы скопированы${NC}"
echo ""

echo "----------------------------------------"
echo "2️⃣ Установка BullMQ зависимостей..."
echo "----------------------------------------"

run_ssh "cd ${BACKEND_DIR} && npm install bullmq@5.1.0 @bull-board/api@5.10.0 @bull-board/express@5.10.0"

echo -e "${GREEN}✅ Зависимости установлены${NC}"
echo ""

echo "----------------------------------------"
echo "3️⃣ Переключение на BullMQ..."
echo "----------------------------------------"

# Создать бэкап старых файлов
echo "💾 Создание бэкапов..."
run_ssh "cd ${BACKEND_DIR}/libs && cp sms-queue.js sms-queue.bull-old.js && cp send-sms.js send-sms.bull-old.js"

# Заменить файлы
echo "🔄 Замена файлов на BullMQ версии..."
run_ssh "cd ${BACKEND_DIR}/libs && cp sms-queue-bullmq.js sms-queue.js && cp send-sms-bullmq.js send-sms.js"

echo -e "${GREEN}✅ Переключено на BullMQ${NC}"
echo ""

echo "----------------------------------------"
echo "4️⃣ Очистка старой очереди Bull..."
echo "----------------------------------------"

read -p "$(echo -e ${YELLOW}Очистить старую очередь? [y/N]:${NC} )" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    run_ssh "cd ${BACKEND_DIR} && node clear-sms-queue-bullmq.js"
    echo -e "${GREEN}✅ Очередь очищена${NC}"
else
    echo -e "${YELLOW}⏭️  Пропущено${NC}"
fi

echo ""

echo "----------------------------------------"
echo "5️⃣ Перезапуск backend с BullMQ..."
echo "----------------------------------------"

run_ssh "pm2 restart vazifa-backend"
echo -e "${GREEN}✅ Backend перезапущен${NC}"

# Ждем запуска
echo "⏳ Ожидание запуска (5 секунд)..."
sleep 5

echo ""

echo "----------------------------------------"
echo "6️⃣ Создание пользователя Латиф Рачабов..."
echo "----------------------------------------"

run_ssh "cd ${BACKEND_DIR} && node create-latif-user.js"

echo ""

echo "----------------------------------------"
echo "7️⃣ Тестирование SMS на +992557777509..."
echo "----------------------------------------"

read -p "$(echo -e ${YELLOW}Отправить тестовое SMS Латифу? [y/N]:${NC} )" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    run_ssh "cd ${BACKEND_DIR} && node test-latif-sms.js"
    echo ""
    echo -e "${YELLOW}💡 Проверьте телефон +992557777509 на получение SMS${NC}"
else
    echo -e "${YELLOW}⏭️  Пропущено${NC}"
fi

echo ""

echo "----------------------------------------"
echo "8️⃣ Проверка статуса системы..."
echo "----------------------------------------"

echo "📊 PM2 статус:"
run_ssh "pm2 status"

echo ""
echo "📋 Последние логи backend:"
run_ssh "pm2 logs vazifa-backend --lines 20 --nostream"

echo ""

echo "========================================="
echo "✅ МИГРАЦИЯ ЗАВЕРШЕНА!"
echo "========================================="
echo ""
echo -e "${GREEN}🎉 BullMQ успешно установлен и настроен!${NC}"
echo ""
echo "📊 ЧТО ИЗМЕНИЛОСЬ:"
echo "   ✅ Bull → BullMQ (10x быстрее)"
echo "   ✅ Rate limiting: 10 SMS/секунду"
echo "   ✅ Worker с concurrency: 5"
echo "   ✅ Улучшенный retry механизм"
echo "   ✅ Создан пользователь: Латиф Рачабов (+992557777509)"
echo ""
echo "📝 СЛЕДУЮЩИЕ ШАГИ:"
echo "   1. Проверьте SMS на +992557777509"
echo "   2. Создайте задачу через веб-интерфейс:"
echo "      https://protocol.oci.tj/dashboard/all-tasks"
echo "   3. Назначьте задачу на Латифа Рачабова"
echo "   4. Проверьте автоматическую отправку SMS"
echo ""
echo "🔍 МОНИТОРИНГ:"
echo "   pm2 logs vazifa-backend --lines 50"
echo "   pm2 monit"
echo ""
echo "📈 BULL BOARD DASHBOARD (опционально):"
echo "   http://193.111.11.98:5000/admin/queues"
echo "   (требуется дополнительная настройка)"
echo ""
echo "🔙 ОТКАТ НА СТАРУЮ ВЕРСИЮ (если нужно):"
echo "   ssh ${SSH_HOST} -p${SSH_PORT}"
echo "   cd ${BACKEND_DIR}/libs"
echo "   cp sms-queue.bull-old.js sms-queue.js"
echo "   cp send-sms.bull-old.js send-sms.js"
echo "   pm2 restart vazifa-backend"
echo ""
echo "========================================="
