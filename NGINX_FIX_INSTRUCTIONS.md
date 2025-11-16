# Инструкция: Исправление NGINX для protocol.oci.tj

## Проблема
Сайт не загружается из-за отсутствия NGINX конфигурации для домена protocol.oci.tj

## Решение

Выполните эти команды на сервере:

### Шаг 1: Подключитесь к серверу

```bash
ssh -p 3022 ubuntu@193.111.11.98
```

### Шаг 2: Скопируйте конфигурацию

Сначала скачайте файл конфигурации с локальной машины:

**На локальной машине выполните:**
```bash
scp -P 3022 nginx-protocol-config ubuntu@193.111.11.98:/tmp/
```

### Шаг 3: Примените конфигурацию на сервере

**На сервере выполните:**

```bash
# Переместите конфигурацию
sudo mv /tmp/nginx-protocol-config /etc/nginx/sites-available/vazifa

# Установите правильные права
sudo chown root:root /etc/nginx/sites-available/vazifa
sudo chmod 644 /etc/nginx/sites-available/vazifa

# Проверьте конфигурацию
sudo nginx -t

# Если проверка прошла успешно, перезагрузите NGINX
sudo systemctl reload nginx

# Проверьте статус
sudo systemctl status nginx
```

### Шаг 4: Проверьте сайт

Откройте в браузере:
- https://protocol.oci.tj

Сайт должен загрузиться без ошибок MIME type.

---

## Альтернативный метод (если нет SSL сертификата)

Если у вас нет SSL сертификата для protocol.oci.tj, используйте эту упрощенную конфигурацию:

```bash
# На сервере создайте файл
sudo nano /etc/nginx/sites-available/vazifa
```

Вставьте этот контент:

```nginx
# HTTP server for protocol.oci.tj (без SSL)
server {
    listen 80;
    server_name protocol.oci.tj;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Increase client body size
    client_max_body_size 100M;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
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

    # Uploads
    location /uploads/ {
        proxy_pass http://localhost:5001;
    }
}

# IP access
server {
    listen 80 default_server;
    server_name 193.111.11.98 _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api-v1/ {
        proxy_pass http://localhost:5001;
    }

    location /uploads/ {
        proxy_pass http://localhost:5001;
    }
}
```

Затем:

```bash
# Проверьте и перезагрузите
sudo nginx -t
sudo systemctl reload nginx
```

---

## Проверка

После применения конфигурации:

1. Откройте https://protocol.oci.tj (или http:// если без SSL)
2. Страница должна загрузиться без ошибок
3. Проверьте консоль браузера - не должно быть ошибок MIME type
4. Попробуйте войти с учетными данными admin

---

## Текущее состояние

✅ Frontend server (PM2): РАБОТАЕТ на порту 3000  
✅ Backend server (PM2): РАБОТАЕТ на порту 5001  
❌ NGINX: Нужна конфигурация для protocol.oci.tj  

После применения конфигурации все должно заработать!
