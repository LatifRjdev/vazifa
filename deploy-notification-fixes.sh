#!/bin/bash

# Deployment script для исправления Email и SMS уведомлений
# Дата: 16.12.2025

set -e  # Exit on error

echo "========================================"
echo "🚀 ДЕПЛОЙ ИСПРАВЛЕНИЙ УВЕДОМЛЕНИЙ"
echo "========================================"
echo ""

SERVER="ubuntu@193.111.11.98"
SSH_PORT="3022"
BACKEND_PATH="/var/www/vazifa/backend"

echo "📋 Что будет обновлено:"
echo "  1. backend/libs/send-notification.js - исправлен вызов sendEmail()"
echo "  2. backend/libs/send-sms-bullmq.js - улучшено логирование SMS"
echo "  3. backend/test-complete-task-notifications.js - новый тестовый скрипт"
echo ""

read -p "Продолжить деплой? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Деплой отменен"
    exit 1
fi

echo ""
echo "📦 Шаг 1: Копирование файлов на сервер..."
echo "=========================================="

# Копируем исправленные файлы
scp -P $SSH_PORT backend/libs/send-notification.js $SERVER:$BACKEND_PATH/libs/
echo "✅ send-notification.js скопирован"

scp -P $SSH_PORT backend/libs/send-sms-bullmq.js $SERVER:$BACKEND_PATH/libs/
echo "✅ send-sms-bullmq.js скопирован"

scp -P $SSH_PORT backend/test-complete-task-notifications.js $SERVER:$BACKEND_PATH/
echo "✅ test-complete-task-notifications.js скопирован"

echo ""
echo "🔄 Шаг 2: Перезапуск backend на сервере..."
echo "=========================================="

ssh -p $SSH_PORT $SERVER << 'ENDSSH'
set -e

echo "📍 Переход в директорию backend..."
cd /var/www/vazifa/backend

echo "🔄 Перезапуск PM2 процессов..."
pm2 restart backend

echo "⏳ Ожидание запуска (5 секунд)..."
sleep 5

echo "📊 Проверка статуса PM2..."
pm2 status

echo "✅ Backend перезапущен успешно!"
ENDSSH

echo ""
echo "✅ Деплой завершен успешно!"
echo ""
echo "🎯 СЛЕДУЮЩИЕ ШАГИ:"
echo "=========================================="
echo "1. Запустите тестовый скрипт на сервере:"
echo "   ssh -p $SSH_PORT $SERVER"
echo "   cd $BACKEND_PATH"
echo "   node test-complete-task-notifications.js"
echo ""
echo "2. Создайте задачу через UI и проверьте:"
echo "   - Email уведомление"
echo "   - SMS уведомление"
echo "   - In-app уведомление"
echo ""
echo "3. Проверьте логи backend:"
echo "   pm2 logs backend --lines 100"
echo ""
echo "=========================================="
