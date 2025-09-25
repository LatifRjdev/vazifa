# Руководство по запуску проекта Vazifa

Это руководство поможет вам быстро запустить полную экосистему Vazifa, включающую веб-приложение, API сервер и мобильное приложение.

## 🚀 Быстрый старт

### Предварительные требования

Убедитесь, что у вас установлены:
- **Node.js** (версия 16 или выше) - [Скачать](https://nodejs.org/)
- **MongoDB** - [Скачать](https://www.mongodb.com/try/download/community) или используйте [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Скачать](https://git-scm.com/)
- **Expo CLI** (для мобильного приложения) - `npm install -g @expo/cli`

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/vazifa.git
cd vazifa
```

### 2. Запуск Backend (API сервер)

```bash
# Переход в папку backend
cd backend

# Установка зависимостей
npm install

# Создание файла окружения
cp .env.example .env

# Редактирование .env файла (настройте MongoDB URI и другие параметры)
# nano .env

# Запуск сервера в режиме разработки
npm run dev
```

Backend будет доступен по адресу: `http://localhost:5001`

### 3. Запуск Frontend (Веб-приложение)

Откройте новый терминал:

```bash
# Переход в папку frontend
cd frontend

# Установка зависимостей
npm install

# Создание файла окружения
cp .env.example .env

# Запуск веб-приложения
npm run dev
```

Веб-приложение будет доступно по адресу: `http://localhost:5173`

### 4. Запуск Mobile приложения

Откройте третий терминал:

```bash
# Переход в папку мобильного приложения
cd mobile/VazifaMobile

# Установка зависимостей
npm install

# Запуск мобильного приложения
npm start
# или
expo start
```

Отсканируйте QR-код с помощью приложения Expo Go на вашем мобильном устройстве.

## 📱 Тестирование синхронизации

После запуска всех компонентов вы можете протестировать синхронизацию:

1. **Создайте аккаунт** в веб-приложении
2. **Войдите в мобильное приложение** с теми же данными
3. **Создайте задачу** в веб-приложении
4. **Проверьте**, что задача появилась в мобильном приложении
5. **Измените статус задачи** в мобильном приложении
6. **Убедитесь**, что изменения отразились в веб-приложении

## 🔧 Конфигурация

### Backend (.env)

```env
# Порт сервера
PORT=5001

# База данных MongoDB
MONGODB_URI=mongodb://localhost:27017/vazifa

# JWT секретный ключ
JWT_SECRET=your-super-secret-jwt-key-here

# Email настройки (для уведомлений)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (для загрузки файлов)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (.env)

```env
# URL API сервера
VITE_API_URL=http://localhost:5001/api-v1

# Cloudinary настройки
VITE_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## 🗄️ Настройка базы данных

### Локальная MongoDB

1. **Установите MongoDB Community Server**
2. **Запустите MongoDB:**
   ```bash
   # macOS (с Homebrew)
   brew services start mongodb-community

   # Windows
   net start MongoDB

   # Linux
   sudo systemctl start mongod
   ```

### MongoDB Atlas (облачная база данных)

1. Создайте аккаунт на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Создайте новый кластер
3. Получите строку подключения
4. Обновите `MONGODB_URI` в файле `.env`

## 👥 Создание первого пользователя

После запуска backend, создайте администратора:

```bash
cd backend
node create-admin-user.js
```

Следуйте инструкциям для создания учетной записи администратора.

## 🔍 Проверка работоспособности

### Backend API

Проверьте, что API работает:

```bash
curl http://localhost:5001/api-v1/health
```

Ответ должен быть:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### Frontend

Откройте браузер и перейдите на `http://localhost:5173`. Вы должны увидеть страницу приветствия Vazifa.

### Mobile

В приложении Expo Go отсканируйте QR-код. Приложение должно загрузиться и показать экран входа.

## 🚨 Устранение неполадок

### Общие проблемы

#### 1. Ошибка подключения к MongoDB

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Решение:**
- Убедитесь, что MongoDB запущен
- Проверьте правильность `MONGODB_URI` в `.env`

#### 2. Порт уже используется

```
Error: listen EADDRINUSE: address already in use :::5001
```

**Решение:**
- Измените порт в `.env` файле backend
- Или остановите процесс, использующий порт:
  ```bash
  # Найти процесс
  lsof -i :5001
  
  # Остановить процесс
  kill -9 <PID>
  ```

#### 3. CORS ошибки

**Решение:**
- Убедитесь, что в backend настроен правильный CORS
- Проверьте, что frontend обращается к правильному URL API

#### 4. Мобильное приложение не подключается к API

**Решение:**
- Убедитесь, что устройство и компьютер в одной сети
- Используйте IP адрес компьютера вместо localhost:
  ```typescript
  const API_BASE_URL = 'http://192.168.1.100:5001/api-v1';
  ```

### Очистка кэша

Если возникают странные ошибки, попробуйте очистить кэш:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Mobile
cd mobile/VazifaMobile
rm -rf node_modules package-lock.json
npm install
expo r -c
```

## 📊 Мониторинг

### Логи Backend

```bash
cd backend
npm run dev
# Логи будут отображаться в консоли
```

### Логи Frontend

Откройте Developer Tools в браузере (F12) для просмотра логов.

### Логи Mobile

В Expo CLI будут отображаться логи мобильного приложения.

## 🔄 Разработка

### Структура проекта

```
vazifa/
├── backend/              # Node.js API сервер
│   ├── controllers/      # Контроллеры API
│   ├── models/          # Модели базы данных
│   ├── routes/          # Маршруты API
│   └── middleware/      # Промежуточное ПО
├── frontend/            # React веб-приложение
│   ├── app/
│   │   ├── components/  # React компоненты
│   │   ├── routes/      # Страницы приложения
│   │   └── hooks/       # Пользовательские хуки
└── mobile/              # React Native приложение
    └── VazifaMobile/
        └── src/
            ├── screens/ # Экраны приложения
            ├── services/# API сервисы
            └── contexts/# React контексты
```

### Горячая перезагрузка

Все три компонента поддерживают горячую перезагрузку:
- **Backend**: Автоматически перезапускается при изменении файлов
- **Frontend**: Мгновенно обновляется в браузере
- **Mobile**: Обновляется в Expo Go при сохранении файлов

### Добавление новых функций

1. **API Endpoint**: Добавьте в `backend/routes/`
2. **Веб-страница**: Добавьте в `frontend/app/routes/`
3. **Мобильный экран**: Добавьте в `mobile/VazifaMobile/src/screens/`

## 🧪 Тестирование

### Запуск тестов

```bash
# Backend тесты
cd backend
npm test

# Frontend тесты
cd frontend
npm test

# Mobile тесты
cd mobile/VazifaMobile
npm test
```

## 📚 Дополнительные ресурсы

- [Backend API документация](./backend/README.md)
- [Frontend документация](./frontend/README.md)
- [Mobile приложение документация](./mobile/VazifaMobile/README.md)
- [Руководство по развертыванию](./DEPLOYMENT_GUIDE.md)
- [Руководство по развертыванию мобильного приложения](./mobile/DEPLOYMENT_GUIDE.md)

## 🤝 Поддержка

Если у вас возникли проблемы:

1. Проверьте этот документ на наличие решений
2. Посмотрите логи в консоли
3. Создайте issue в репозитории
4. Обратитесь к команде разработки

## 🎉 Готово!

Теперь у вас запущена полная экосистема Vazifa:
- ✅ Backend API сервер
- ✅ Веб-приложение
- ✅ Мобильное приложение
- ✅ Синхронизация в реальном времени

Начните создавать задачи и управлять проектами! 🚀

---

**Vazifa** - Делайте больше вместе!
