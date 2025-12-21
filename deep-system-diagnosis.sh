#!/bin/bash
echo "=========================================="
echo "🔬 ГЛУБОКАЯ ДИАГНОСТИКА СИСТЕМЫ"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

echo "📅 Текущее время на сервере:"
date

echo ""
echo "==========================================
1️⃣ ПРОВЕРКА .ENV ФАЙЛОВ
==========================================="
echo "Backend .env:"
if [ -f /var/www/vazifa/backend/.env ]; then
  echo "✅ Существует"
  ls -lh /var/www/vazifa/backend/.env
  echo "Содержимое (первые 10 строк):"
  head -10 /var/www/vazifa/backend/.env
else
  echo "❌ НЕ НАЙДЕН!"
fi

echo ""
echo "Frontend .env:"
if [ -f /var/www/vazifa/frontend/.env ]; then
  echo "✅ Существует"
  ls -lh /var/www/vazifa/frontend/.env
  cat /var/www/vazifa/frontend/.env
else
  echo "❌ НЕ НАЙДЕН!"
fi

echo ""
echo "==========================================
2️⃣ MONGODB ДИАГНОСТИКА
==========================================="
echo "Статус сервиса:"
systemctl status mongod --no-pager | head -20

echo ""
echo "Процесс MongoDB:"
ps aux | grep mongod | grep -v grep || echo "❌ Процесс не найден!"

echo ""
echo "Порт 27017:"
ss -tlnp | grep 27017 || echo "❌ Порт не слушает!"

echo ""
echo "Последние ошибки MongoDB (last 20 lines):"
tail -20 /var/log/mongodb/mongod.log | grep -i "error\|fatal\|warn" || echo "Нет критичных ошибок"

echo ""
echo "Тест подключения:"
mongosh mongodb://vazifa:Asd123@localhost:27017/vazifa-production --eval "db.version()" --quiet || echo "❌ Не удается подключиться!"

echo ""
echo "==========================================
3️⃣ PM2 И BACKEND АНАЛИЗ
==========================================="
echo "PM2 статус:"
pm2 status

echo ""
echo "PM2 info backend (рестарты и ошибки):"
pm2 info vazifa-backend | grep -E "restart|error|uptime|status"

echo ""
echo "Backend логи (последние 50 строк):"
pm2 logs vazifa-backend --lines 50 --nostream

echo ""
echo "==========================================
4️⃣ СИСТЕМНЫЕ РЕСУРСЫ
==========================================="
echo "�� RAM:"
free -h

echo ""
echo "💿 Disk:"
df -h | grep -E "Filesystem|/$|/var"

echo ""
echo "🔥 CPU Load:"
uptime

echo ""
echo "Top процессы по памяти:"
ps aux --sort=-%mem | head -6

echo ""
echo "==========================================
5️⃣ REDIS И BULLMQ
==========================================="
echo "Redis статус:"
systemctl status redis --no-pager | head -10 || echo "Redis не установлен"

echo ""
echo "==========================================
6️⃣ API ТЕСТИРОВАНИЕ
==========================================="
echo "Проверка порта 5001:"
ss -tlnp | grep 5001 || echo "❌ Порт 5001 не слушает!"

echo ""
echo "Тест localhost API:"
curl -s http://localhost:5001/api-v1/health || echo "Health endpoint не найден"

echo ""
echo "Тест внешнего API:"
curl -s https://ptapi.oci.tj/api-v1/health || echo "Внешний API не отвечает"

echo ""
echo "==========================================
7️⃣ GIT ИЗМЕНЕНИЯ ЗА 24 ЧАСА
==========================================="
cd /var/www/vazifa
echo "Последние коммиты:"
git log --since="24 hours ago" --oneline || echo "Нет изменений"

echo ""
echo "==========================================
8️⃣ NGINX СТАТУС
==========================================="
echo "Nginx процесс:"
systemctl status nginx --no-pager | head -10

echo ""
echo "Nginx ошибки:"
tail -20 /var/log/nginx/error.log | grep -i error || echo "Нет ошибок"

ENDSSH

echo "=========================================="
echo "✅ Диагностика завершена"
echo "=========================================="
