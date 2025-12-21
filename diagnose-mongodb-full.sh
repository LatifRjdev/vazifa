#!/bin/bash
echo "=========================================="
echo "🔍 Полная диагностика MongoDB"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "1️⃣ MongoDB конфигурация:"
echo "📄 Файл: /etc/mongod.conf"
cat /etc/mongod.conf | grep -v "^#" | grep -v "^$"

echo ""
echo "2️⃣ Текущий статус MongoDB:"
systemctl status mongod --no-pager | head -20

echo ""
echo "3️⃣ Автозапуск настроен?"
systemctl is-enabled mongod || echo "❌ Автозапуск ОТКЛЮЧЕН"

echo ""
echo "4️⃣ Порты (должен быть 27017):"
sudo ss -tlnp | grep mongod || echo "MongoDB не слушает порты"

echo ""
echo "5️⃣ Системные ресурсы:"
echo "�� RAM:"
free -h

echo ""
echo "💿 Disk:"
df -h | grep -E "Filesystem|/$"

echo ""
echo "🔥 CPU Load:"
uptime

echo ""
echo "6️⃣ Процессы MongoDB:"
ps aux | grep mongod | grep -v grep || echo "Нет процессов MongoDB"

echo ""
echo "7️⃣ Последние логи MongoDB (ошибки):"
sudo tail -50 /var/log/mongodb/mongod.log | grep -i "error\|warn\|fatal" | tail -10 || echo "Нет критичных ошибок"

echo ""
echo "8️⃣ Backend .env MongoDB URL:"
cd /var/www/vazifa/backend
grep MONGODB_URI .env || echo "MONGODB_URI не найден"

ENDSSH

echo "=========================================="
echo "✅ Диагностика завершена"
echo "=========================================="
