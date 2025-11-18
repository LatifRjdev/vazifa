# Руководство по деплою на SSH сервер

**Сервер:** ubuntu@193.111.11.98  
**Порт:** 3022  
**Путь проекта:** /var/www/vazifa

## 1. Подключение к серверу

```bash
ssh ubuntu@193.111.11.98 -p3022
```

## 2. Перейти в директорию проекта

```bash
cd /var/www/vazifa
```

## 3. Получить последние изменения из Git

```bash
# Остановить приложения перед обновлением
pm2 stop all

# Получить изменения
git pull origin main

# Если возникнут конфликты
git stash
git pull origin main
git stash pop
```

## 4. Обновить зависимости

### Backend

```bash
cd backend
npm install
cd ..
```

### Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

## 5. Перезапустить приложения с PM2

```bash
# Перезапустить все процессы
pm2 restart all

# Или по отдельности
pm2 restart vazifa-backend
pm2 restart vazifa-frontend
```

## 6. Проверить статус приложений

```bash
pm2 status
pm2 logs
```

## Автоматический скрипт деплоя

Создайте файл `deploy.sh` в корне проекта:

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Переход в директорию проекта
cd /var/www/vazifa

# Остановка приложений
echo "⏸️  Stopping applications..."
pm2 stop all

# Получение изменений
echo "📥 Pulling latest changes..."
git stash
git pull origin main

# Установка зависимостей backend
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Сборка и установка зависимостей frontend
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Перезапуск приложений
echo "🔄 Restarting applications..."
pm2 restart all

# Показать статус
echo "✅ Deployment complete! Status:"
pm2 status

echo "📊 Recent logs:"
pm2 logs --lines 20
```

### Использование скрипта:

```bash
# На сервере
chmod +x deploy.sh
./deploy.sh
```

## Быстрый деплой (одной командой)

Со своего локального компьютера:

```bash
ssh ubuntu@193.111.11.98 -p3022 "cd /var/www/vazifa && pm2 stop all && git pull && cd backend && npm install && cd ../frontend && npm install && npm run build && cd .. && pm2 restart all && pm2 status"
```

## Проверка логов

```bash
# Все логи
pm2 logs

# Логи backend
pm2 logs vazifa-backend

# Логи frontend  
pm2 logs vazifa-frontend

# Последние 50 строк
pm2 logs --lines 50
```

## Откат к предыдущей версии

```bash
# Посмотреть историю коммитов
git log --oneline -10

# Откатиться к определенному коммиту
git reset --hard <commit-hash>

# Перезапустить приложен ия
pm2 restart all
```

## Проблемы и решения

### Проблема: Ошибка прав доступа

```bash
# Исправить владельца файлов
sudo chown -R ubuntu:ubuntu /var/www/vazifa

# Исправить права
sudo chmod -R 755 /var/www/vazifa
```

### Проблема: PM2 процессы не запускаются

```bash
# Удалить все процессы
pm2 delete all

# Запустить заново
cd /var/www/vazifa/backend
pm2 start index.js --name vazifa-backend

cd /var/www/vazifa/frontend
pm2 start npm --name vazifa-frontend -- start
```

### Проблема: Порт уже занят

```bash
# Найти процесс на порту (например 5000)
lsof -i :5000

# Убить процесс
kill -9 <PID>
```

### Проблема: MongoDB не подключается

```bash
# Проверить статус MongoDB
sudo systemctl status mongod

# Перезапустить MongoDB
sudo systemctl restart mongod
```

## Мониторинг

### Проверить использование ресурсов

```bash
# CPU и память
htop

# Дисковое пространство
df -h

# Использование PM2
pm2 monit
```

### Настроить автозапуск PM2 при перезагрузке

```bash
pm2 startup
pm2 save
```

## Безопасность

### Обновление .env файлов

```bash
# Backend
nano /var/www/vazifa/backend/.env

# Проверить настройки SMTP
# SMTP_HOST=...
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASS=...
# FRONTEND_URL=https://your-domain.com
```

### Резервное копирование

```bash
# Создать бэкап MongoDB
mongodump --out=/backup/mongo-$(date +%Y%m%d)

# Создать бэкап файлов
tar -czf /backup/vazifa-$(date +%Y%m%d).tar.gz /var/www/vazifa
```

## Полезные команды

```bash
# Проверить версию Node.js
node --version

# Проверить версию npm
npm --version

# Очистить кэш npm
npm cache clean --force

# Проверить открытые порты
sudo netstat -tulpn | grep LISTEN

# Проверить Nginx
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

## Контакты для помощи

Если возникли проблемы, проверьте:
1. Логи PM2: `pm2 logs`
2. Логи Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Логи MongoDB: `sudo tail -f /var/log/mongodb/mongod.log`
