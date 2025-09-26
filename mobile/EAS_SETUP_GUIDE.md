# Руководство по настройке EAS Build и публикации приложения

## 🚀 Настройка EAS CLI

### 1. Установка EAS CLI
```bash
npm install -g eas-cli
```

### 2. Вход в Expo аккаунт
```bash
eas login
```

### 3. Инициализация проекта
```bash
cd mobile/VazifaMobile
eas build:configure
```

## 📱 Настройка проекта

### 1. Получение EAS Project ID
После выполнения `eas build:configure` вы получите Project ID. Обновите следующие файлы:

**app.config.js:**
```javascript
// Замените "your-project-id-here" на ваш реальный Project ID
projectId: "ваш-реальный-project-id"
```

**app.json:**
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "ваш-реальный-project-id"
      }
    }
  }
}
```

### 2. Обновление owner
Замените "your-expo-username" на ваш реальный Expo username в app.config.js

## 🔐 Настройка подписания

### iOS (Apple Developer Account - $99/год)

1. **Создание Apple Developer аккаунта:**
   - Перейдите на https://developer.apple.com
   - Зарегистрируйтесь как разработчик
   - Оплатите годовую подписку ($99)

2. **Настройка в eas.json:**
   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "ваш-apple-id@example.com",
           "ascAppId": "id-приложения-в-app-store-connect",
           "appleTeamId": "ваш-team-id"
         }
       }
     }
   }
   ```

### Android (Google Play Console - $25 единоразово)

1. **Создание Google Play Console аккаунта:**
   - Перейдите на https://play.google.com/console
   - Зарегистрируйтесь как разработчик
   - Оплатите регистрационный взнос ($25)

2. **Создание Service Account:**
   - В Google Cloud Console создайте Service Account
   - Скачайте JSON ключ
   - Сохраните как `google-service-account.json` в корне проекта

## 🏗️ Создание builds

### Development Build (для тестирования)
```bash
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development

# Обе платформы
eas build --profile development
```

### Preview Build (для внутреннего тестирования)
```bash
eas build --profile preview
```

### Production Build (для публикации)
```bash
eas build --profile production
```

## 📦 Публикация в магазинах

### App Store (iOS)
```bash
eas submit --platform ios
```

### Google Play Store (Android)
```bash
eas submit --platform android
```

## 🔄 Over-the-Air Updates

### Публикация обновления
```bash
eas update --branch production --message "Исправления и улучшения"
```

### Создание канала для бета-тестирования
```bash
eas update --branch beta --message "Бета-версия с новыми функциями"
```

## 📋 Чек-лист перед публикацией

### Обязательные шаги:
- [ ] Создан Apple Developer аккаунт (для iOS)
- [ ] Создан Google Play Console аккаунт (для Android)
- [ ] Обновлен EAS Project ID в конфигурации
- [ ] Обновлен Expo username
- [ ] Созданы и протестированы development builds
- [ ] Подготовлены скриншоты для магазинов
- [ ] Написаны описания приложения
- [ ] Настроены privacy policy и terms of service

### Рекомендуемые шаги:
- [ ] Настроена аналитика (Firebase, Amplitude)
- [ ] Настроен crash reporting (Sentry)
- [ ] Добавлены push-уведомления
- [ ] Проведено тестирование на реальных устройствах
- [ ] Настроен CI/CD pipeline

## 🛠️ Команды для разработки

### Запуск в режиме разработки
```bash
npx expo start
```

### Запуск на конкретной платформе
```bash
npx expo start --ios
npx expo start --android
npx expo start --web
```

### Очистка кэша
```bash
npx expo start --clear
```

### Проверка конфигурации
```bash
eas build:configure
eas credentials
```

## 🔍 Отладка

### Просмотр логов сборки
```bash
eas build:list
eas build:view [BUILD_ID]
```

### Локальная сборка (для отладки)
```bash
eas build --local
```

## 📱 Тестирование

### Установка development build
```bash
# Создание QR-кода для установки
eas build --profile development --platform ios
eas build --profile development --platform android
```

### TestFlight (iOS) и Internal Testing (Android)
- iOS: Автоматически загружается в TestFlight после сборки
- Android: Загружается в Internal Testing в Google Play Console

## 🚨 Устранение неполадок

### Частые проблемы:

1. **Ошибка подписания iOS:**
   ```bash
   eas credentials
   # Выберите iOS → Production → Manage everything needed to build your project
   ```

2. **Проблемы с Android keystore:**
   ```bash
   eas credentials
   # Выберите Android → Production → Manage everything needed to build your project
   ```

3. **Ошибки сборки:**
   ```bash
   # Очистка и переустановка зависимостей
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📞 Поддержка

- [Документация EAS](https://docs.expo.dev/build/introduction/)
- [Форум Expo](https://forums.expo.dev/)
- [Discord сообщество](https://chat.expo.dev/)

---

**Удачной публикации!** 🎉
