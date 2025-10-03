# 🚀 Полная инструкция по развертыванию Vazifa на SSH сервере

## Требования
- Ubuntu 24.04 LTS сервер
- SSH доступ (порт 3022)
- Sudo права
- IP: 193.111.11.98
- Домен: protocol.oci.tj

---

## Часть 1: Подготовка сервера

### 1.1 Подключитесь к серверу
```bash
ssh -p 3022 ubuntu@193.111.11.98
```

### 1.2 Обновите систему
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Установите необходимые пакеты
```bash
sudo apt install -y curl git build-essential nginx
```

---

## Часть 2: Установка Node.js

### 2.1 Установите Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.2 Проверьте установку
```bash
node --version  # Должно быть v20.x.x
npm --version   # Должно быть 10.x.x
```

---

## Часть 3: Установка PostgreSQL

### 3.1 Установите PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 3.2 Проверьте статус
```bash
sudo systemctl status postgresql
```

### 3.3 Создайте базу данных и пользователя
```bash
# Войдите как пользователь postgres
sudo -u postgres psql

# В консоли PostgreSQL выполните:
CREATE DATABASE vazifa_db;
CREATE USER vazifa_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE vazifa_db TO vazifa_user;
\q
```

### 3.4 Настройте доступ (если нужно)
```bash
# Отредактируйте pg_hba.conf если нужен доступ не только с localhost
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Добавьте строку:
# host    all             all             127.0.0.1/32            md5

# Перезапустите PostgreSQL
sudo systemctl restart postgresql
```

---

## Часть 4: Установка PM2

### 4.1 Установите PM2 глобально
```bash
sudo npm install -g pm2
```

### 4.2 Настройте автозапуск PM2
```bash
pm2 startup
# Скопируйте и выполните команду которую PM2 выведет
```

---

## Часть 5: Клонирование проекта

### 5.1 Создайте директорию для проекта
```bash
sudo mkdir -p /var/www
sudo chown -R ubuntu:ubuntu /var/www
cd /var/www
```

### 5.2 Клонируйте репозиторий
```bash
git clone https://github.com/LatifRjdev/vazifa.git
cd vazifa
```

---

## Часть 6: Настройка Backend

### 6.1 Перейдите в директорию backend
```bash
cd /var/www/vazifa/backend
```

### 6.2 Установите зависимости
```bash
npm install
```

### 6.3 Создайте .env файл
```bash
nano .env.production
```

Вставьте следующее содержимое:
```env
# Database Configuration
DATABASE_URL=postgresql://vazifa_user:your_secure_password_here@localhost:5432/vazifa_db

# Server Configuration
PORT=5001
NODE_ENV=production

# JWT Secret (замените на случайную строку)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Frontend URL
FRONTEND_URL=http://protocol.oci.tj

# SMTP Configuration (опционально, для email уведомлений)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@vazifa.tj
```

### 6.4 Инициализируйте базу данных
```bash
# Если у вас есть миграции или seeds
npm run migrate  # или аналогичная команда
```

---

## Часть 7: Настройка Frontend

### 7.1 Перейдите в директорию frontend
```bash
cd /var/www/vazifa/frontend
```

### 7.2 Установите зависимости
```bash
npm install
```

### 7.3 Создайте .env файл
```bash
nano .env
```

Вставьте:
```env
# API Configuration
VITE_API_URL=http://protocol.oci.tj/api-v1

# Frontend Configuration
VITE_FRONTEND_URL=http://protocol.oci.tj

# Environment
NODE_ENV=production
```

### 7.4 Соберите проект
```bash
npm run build
```

---

## Часть 8: Запуск с PM2

### 8.1 Запустите Backend
```bash
cd /var/www/vazifa/backend
pm2 start index.js --name vazifa-backend
```

### 8.2 Запустите Frontend
```bash
cd /var/www/vazifa/frontend
pm2 start server.js --name vazifa-frontend --interpreter node
```

### 8.3 Сохраните конфигурацию PM2
```bash
pm2 save
```

### 8.4 Проверьте статус
```bash
pm2 list
pm2 logs
```

---

## Часть 9: Настройка NGINX

### 9.1 Создайте конфигурацию NGINX
```bash
sudo nano /etc/nginx/sites-available/vazifa
```

Вставьте:
```nginx
# HTTP server for protocol.oci.tj
server {
    listen 80;
    server_name protocol.oci.tj 193.111.11.98;

    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend - Proxy to React Router SSR on port 3001
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api-v1/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /uploads/ {
        proxy_pass http://localhost:5001;
    }
}
```

### 9.2 Активируйте конфигурацию
```bash
sudo ln -sf /etc/nginx/sites-available/vazifa /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 9.3 Проверьте конфигурацию
```bash
sudo nginx -t
```

### 9.4 Перезапустите NGINX
```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Часть 10: Настройка Firewall в OCI

### 10.1 Откройте OCI Console
1. Перейдите на https://cloud.oracle.com
2. Войдите в аккаунт

### 10.2 Найдите ваш Instance
1. Меню → **Compute** → **Instances**
2. Найдите сервер с IP 193.111.11.98

### 10.3 Откройте Security List
1. Кликните на имя сервера
2. **Virtual Cloud Network** → кликните на VCN
3. Слева → **Security Lists**
4. Выберите "Default Security List"

### 10.4 Добавьте Ingress Rules

Добавьте следующие правила (если их нет):

**Правило 1: HTTP**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `80`
- Description: `HTTP`

**Правило 2: HTTPS (на будущее)**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `443`
- Description: `HTTPS`

**Правило 3: SSH (должно быть)**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `3022`
- Description: `SSH`

---

## Часть 11: Проверка работы

### 11.1 Проверьте PM2
```bash
pm2 list
# Оба процесса должны быть "online" с минимумом рестартов
```

### 11.2 Проверьте логи
```bash
pm2 logs vazifa-backend --lines 20
pm2 logs vazifa-frontend --lines 20
```

### 11.3 Проверьте NGINX
```bash
sudo systemctl status nginx
```

### 11.4 Проверьте локальный доступ
```bash
curl -I http://localhost
# Должен вернуть 200 OK
```

### 11.5 Проверьте внешний доступ
```bash
curl -I http://193.111.11.98
# Должен вернуть 200 OK
```

### 11.6 Откройте в браузере
- http://protocol.oci.tj
- http://193.111.11.98

---

## Часть 12: Создание Admin пользователя

### 12.1 Перейдите в backend
```bash
cd /var/www/vazifa/backend
```

### 12.2 Запустите скрипт создания админа
```bash
node create-verified-super-admin.js
```

Введите данные админа когда попросит.

---

## Часть 13: Обслуживание

### Просмотр логов
```bash
# PM2 логи
pm2 logs

# NGINX логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL логи
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Перезапуск сервисов
```bash
# PM2
pm2 restart all

# NGINX
sudo systemctl restart nginx

# PostgreSQL
sudo systemctl restart postgresql
```

### Обновление проекта
```bash
cd /var/www/vazifa

# Pull изменений
git pull origin main

# Backend
cd backend
npm install
pm2 restart vazifa-backend

# Frontend  
cd ../frontend
npm install
npm run build
pm2 restart vazifa-frontend
```

---

## Часть 14: Troubleshooting

### Проблема: PM2 процессы крашатся
```bash
pm2 logs vazifa-frontend --lines 50
pm2 logs vazifa-backend --lines 50
```

### Проблема: База данных не подключается
```bash
# Проверьте статус PostgreSQL
sudo systemctl status postgresql

# Проверьте подключение
psql -h localhost -U vazifa_user -d vazifa_db
```

### Проблема: NGINX 502 Bad Gateway
```bash
# Проверьте что PM2 процессы запущены
pm2 list

# Проверьте NGINX логи
sudo tail -50 /var/log/nginx/error.log
```

### Проблема: Сайт недоступен извне
```bash
# Проверьте что порт 80 открыт
sudo netstat -tlnp | grep :80

# Проверьте OCI Security Groups (см. Часть 10)
```

---

## ✅ Готово!

Ваш сайт должен быть доступен по адресам:
- http://protocol.oci.tj
- http://193.111.11.98

### Полезные команды для мониторинга:
```bash
# Статус всех сервисов
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Использование ресурсов
pm2 monit
htop
df -h  # Дисковое пространство
free -h  # Память
