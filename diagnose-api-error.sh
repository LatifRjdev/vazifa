#!/bin/bash

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"

echo "=========================================="
echo "🔍 Диагностика API ошибки"
echo "=========================================="
echo ""

ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'

echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📝 Backend logs (последние 30 строк):"
pm2 logs vazifa-backend --lines 30 --nostream

echo ""
echo "🔍 Проверка backend API:"
curl -s http://localhost:4000/api-v1/auth/health || echo "Backend не отвечает"

echo ""
echo "🔍 Проверка процессов:"
netstat -tulpn | grep :4000 || echo "Порт 4000 не слушает"

ENDSSH

echo ""
echo "=========================================="
echo "✅ Диагностика завершена"
echo "=========================================="
