# Протокол - Система управления задачами

Протокол - это современная облачная платформа для управления задачами и проектами, которая помогает командам эффективно организовывать, отслеживать и выполнять работу.

## 🚀 Возможности

### Веб-приложение
- 🔐 Аутентификация и авторизация пользователей
- 👥 Управление командами и рабочими пространствами
- 📋 Создание и управление задачами
- 🎯 Установка приоритетов и сроков выполнения
- 💬 Комментарии и обсуждения
- 📎 Прикрепление файлов
- 📊 Аналитика и отчеты
- 🔔 Система уведомлений
- 🌐 Многоязычная поддержка

### Мобильное приложение
- 📱 Нативные приложения для iOS и Android
- 🔄 Синхронизация в реальном времени с веб-версией
- 📋 Полный функционал управления задачами
- 🔔 Push-уведомления
- 💾 Офлайн поддержка
- 👤 Управление профилем

## 🏗️ Архитектура

Проект состоит из трех основных компонентов:

```
protocol/
├── backend/          # Node.js API сервер
├── frontend/         # React веб-приложение
└── mobile/           # React Native мобильное приложение
    └── VazifaMobile/
```

### Backend Features (API):

The backend is a NodeJs and Express application `/backend`. This API is a real backend by managing data in MongoDB.

- Authentication and Authorization
- CRUD Operations (Create, Read, Update & Delete) - Workspace, Project & Tasks
- **Notifications:**
  - Email Notification with SendGrid.
  - Security with Arcjet

## Tech Stack

- **Frontend:**
  - **React:** JavaScript library for building user interfaces.
  - **TypeScript:** Superset of JavaScript that adds static typing.
  - **Vite:** Fast frontend build tool.
  - **React Router v7:** For client-side routing.
  - **Tailwind CSS:** Utility-first CSS framework for styling.
  - **Shadcn UI:** Re-usable components built with Radix UI and Tailwind CSS.
  - **Lucide React:** Icon library.
  - **Recharts:** Composable charting library.
  - **TanStack Query (React Query):** For data fetching, caching, and state synchronization.

## Setup and Installation

### Prerequisites

- Node.js v20 and above (LTS version recommended)
- npm (comes with Node.js) or yarn/pnpm
- MongoDB database (local or cloud, e.g., MongoDB Atlas)
- (Optional) SendGrid and Arcjet accounts for email and security features

### 1. Get the Source Code

You can either **clone the repository from GitHub** or **unzip a provided zip file** containing the code.

#### Option 1: Clone from GitHub

```sh
git clone https://github.com/LatifRjdev/vazifa.git
```

### Backend (Node.js + Express + MongoDB)
- RESTful API
- JWT аутентификация
- MongoDB база данных
- Загрузка файлов
- Email уведомления

### Frontend (React + Remix + TypeScript)
- Современный React с Remix фреймворком
- TypeScript для типобезопасности
- Tailwind CSS для стилизации
- React Query для управления состоянием
- Responsive дизайн

### Mobile (React Native + Expo)
- Кроссплатформенное мобильное приложение
- Expo для быстрой разработки
- TypeScript поддержка
- Навигация с React Navigation
- Локальное хранение с AsyncStorage

## 🛠️ Технологии

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Веб-фреймворк
- **MongoDB** - NoSQL база данных
- **Mongoose** - ODM для MongoDB
- **JWT** - Аутентификация
- **Multer** - Загрузка файлов
- **Nodemailer** - Email отправка

### Frontend
- **React** - UI библиотека
- **Remix** - Full-stack веб-фреймворк
- **TypeScript** - Типизированный JavaScript
- **Tailwind CSS** - CSS фреймворк
- **React Query** - Управление состоянием сервера
- **Framer Motion** - Анимации

### Mobile
- **React Native** - Мобильный фреймворк
- **Expo** - Платформа разработки
- **TypeScript** - Типизированный JavaScript
- **React Navigation** - Навигация
- **Axios** - HTTP клиент
- **AsyncStorage** - Локальное хранилище

## 🚀 Быстрый старт

### Предварительные требования
- Node.js (версия 16 или выше)
- MongoDB
- npm или yarn
- Expo CLI (для мобильного приложения)

### Установка и запуск

#### 1. Клонирование репозитория
```bash
git clone https://github.com/LatifRjdev/vazifa.git
cd protocol
```

#### 2. Настройка Backend
```bash
cd backend
npm install

# Создайте .env файл и настройте переменные окружения
cp .env.example .env

# Запуск сервера
npm run dev
```

#### 3. Настройка Frontend
```bash
cd frontend
npm install

# Создайте .env файл
cp .env.example .env

# Запуск веб-приложения
npm run dev
```

#### 4. Настройка Mobile приложения
```bash
cd mobile/VazifaMobile
npm install

# Запуск мобильного приложения
npm start
# или
expo start
```

## 📱 Мобильное приложение

### Особенности
- **Кроссплатформенность**: Одна кодовая база для iOS и Android
- **Реальное время**: Мгновенная синхронизация с веб-версией
- **Офлайн режим**: Работа без интернета с последующей синхронизацией
- **Push-уведомления**: Мгновенные уведомления о важных событиях
- **Нативный UX**: Платформо-специфичный пользовательский интерфейс

### Установка на устройство

#### Для разработки:
1. Установите Expo Go на свое устройство
2. Запустите `expo start` в папке `mobile/VazifaMobile`
3. Отсканируйте QR-код с помощью Expo Go

#### Для продакшена:
- **iOS**: Приложение будет доступно в App Store
- **Android**: Приложение будет доступно в Google Play Store

### Синхронизация данных

Мобильное приложение использует тот же API, что и веб-версия, обеспечивая:
- ✅ Единую базу данных для всех платформ
- ✅ Мгновенную синхронизацию изменений
- ✅ Консистентность данных между устройствами
- ✅ Офлайн кэширование для быстрого доступа

## 🔧 Конфигурация

### Переменные окружения

#### Backend (.env)
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/protocol
JWT_SECRET=your-jwt-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

#### Frontend (.env)
```env
VITE_API_URL=https://ptapi.oci.tj/api-v1
VITE_APP_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
VITE_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## 📦 Развертывание

### Backend
- Поддерживает развертывание на Heroku, DigitalOcean, AWS
- Docker контейнеризация включена
- MongoDB Atlas для облачной базы данных

### Frontend
- Развертывание на Vercel, Netlify, или любом статическом хостинге
- Автоматическая сборка и оптимизация

### Mobile
- Сборка через Expo Build Service
- Публикация в App Store и Google Play Store
- Over-the-air обновления через Expo Updates

## 🤝 Синхронизация между платформами

Все платформы (веб, iOS, Android) используют единый API и базу данных:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Web App   │    │  iOS App    │    │ Android App │
│  (React)    │    │(React Native│    │(React Native│
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                   ┌──────▼──────┐
                   │   Backend   │
                   │  (Node.js)  │
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │  MongoDB    │
                   │  Database   │
                   └─────────────┘
```

### Преимущества единой архитектуры:
- **Консистентность**: Одинаковые данные на всех устройствах
- **Реальное время**: Изменения мгновенно отражаются везде
- **Простота поддержки**: Одна бизнес-логика для всех платформ
- **Масштабируемость**: Легко добавлять новые функции

## 📚 Документация

- [Backend API Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Mobile App Documentation](./mobile/VazifaMobile/README.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [API Migration Changes](./API_MIGRATION_CHANGES.md)

## 🧪 Тестирование

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

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

## 👥 Команда

- **Backend разработка**: Node.js, Express, MongoDB
- **Frontend разработка**: React, Remix, TypeScript
- **Mobile разработка**: React Native, Expo
- **UI/UX дизайн**: Современный, адаптивный интерфейс

## 📞 Поддержка

Если у вас есть вопросы или предложения:
- Создайте [Issue](https://github.com/LatifRjdev/vazifa/issues)
- Напишите на email: support@protocol.com
- Присоединяйтесь к нашему [Discord сообществу](https://discord.gg/protocol)

---

**Протокол** - Делайте больше вместе! 🚀
