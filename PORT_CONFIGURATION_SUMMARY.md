# 🔌 Сводка конфигурации портов Vazifa

## Текущие порты

### Internal Ports (внутренние):
- **Backend**: `5001`
- **Frontend**: `3001`
- **MongoDB**: `27017` (default)

### External Ports (внешние):
- **NGINX HTTP**: `80`
- **SSH**: `3022`

---

## Архитектура

```
Internet (Port 80)
       ↓
    NGINX
    ├─→ / → Frontend (localhost:3001)
    ├─→ /api-v1/ → Backend (localhost:5001)
    └─→ /uploads/ → Backend (localhost:5001)
       
Frontend (3001) → proxies /api-v1/ → Backend (5001)
Backend (5001) → MongoDB (27017)
```

---

## Конфигурация по файлам

### 1. Backend (`backend/index.js`)
```javascript
const PORT = process.env.PORT || 5001;
```
- Слушает порт: **5001**
- MongoDB: **localhost:27017**

### 2. Backend Environment (`backend/.env.production.template`)
```env
PORT=5001
MONGODB_URI=mongodb://vazifa:password@localhost:27017/vazifa-production
```

### 3. Frontend (`frontend/server.js`)
```javascript
const port = process.env.PORT || 3001;
// Proxy to backend
target: 'http://localhost:5001'
```
- Слушает порт: **3001**
- Проксирует API на: **localhost:5001**

### 4. Frontend Environment (`frontend/.env.example`)
```env
VITE_API_URL=https://ptapi.oci.tj/api-v1
VITE_DOMAIN=https://protocol.oci.tj
```
- Использует внешние URL через NGINX

### 5. NGINX (`nginx-vazifa-final`)
```nginx
listen 80;
location / {
    proxy_pass http://localhost:3001;  # Frontend
}
location /api-v1/ {
    proxy_pass http://localhost:5001;  # Backend
}
```

### 6. Mobile App (`mobile/VazifaMobile/app.config.js`)
```javascript
apiUrl: 'https://ptapi.oci.tj/api-v1'
```
- Использует внешний URL через NGINX

---

## Проверка конфигурации

### На сервере:
```bash
# Backend
pm2 list  # vazifa-backend должен быть online
curl http://localhost:5001  # Должен отвечать

# Frontend  
curl http://localhost:3001  # Должен отвечать HTML

# MongoDB
mongosh mongodb://localhost:27017  # Должен подключиться

# NGINX
curl http://localhost  # Должен отвечать через порт 80
```

### Снаружи:
```bash
# HTTP (если порт 80 открыт)
curl http://193.111.11.98
curl http://protocol.oci.tj

# API
curl http://protocol.oci.tj/api-v1
```

---

## Firewall Rules (OCI Security Groups)

Должны быть открыты:
- **Port 80** (HTTP) - для веб доступа
- **Port 3022** (SSH) - для администрирования
- **Port 443** (HTTPS) - для будущего SSL

НЕ нужно открывать:
- Port 5001 (Backend) - только localhost
- Port 3001 (Frontend) - только localhost  
- Port 27017 (MongoDB) - только localhost

---

## Изменение портов

### Если нужно изменить Backend порт:

1. `backend/.env.production`:
```env
PORT=5001  # Измените здесь
```

2. `frontend/server.js`:
```javascript
target: 'http://localhost:5001'  # Измените здесь
```

3. `nginx-vazifa-final`:
```nginx
proxy_pass http://localhost:5001;  # Измените здесь
```

4. Перезапустите:
```bash
pm2 restart vazifa-backend
pm2 restart vazifa-frontend
sudo systemctl reload nginx
```

### Если нужно изменить Frontend порт:

1. `frontend/server.js`:
```javascript
const port = process.env.PORT || 3001;  # Измените здесь
```

2. `nginx-vazifa-final`:
```nginx
proxy_pass http://localhost:3001;  # Измените здесь
```

3. Перезапустите:
```bash
pm2 restart vazifa-frontend
sudo systemctl reload nginx
```

---

## ✅ Все порты настроены правильно!

- Backend: 5001 ✅
- Frontend: 3001 ✅  
- MongoDB: 27017 ✅
- NGINX: 80 ✅
- Все конфигурации согласованы ✅
