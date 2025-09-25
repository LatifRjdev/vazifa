# Руководство по развертыванию мобильного приложения Vazifa

Это руководство поможет вам развернуть мобильное приложение Vazifa на iOS и Android платформах.

## 📋 Содержание

1. [Предварительные требования](#предварительные-требования)
2. [Настройка проекта](#настройка-проекта)
3. [Конфигурация для продакшена](#конфигурация-для-продакшена)
4. [Сборка для iOS](#сборка-для-ios)
5. [Сборка для Android](#сборка-для-android)
6. [Публикация в магазинах приложений](#публикация-в-магазинах-приложений)
7. [Over-the-Air обновления](#over-the-air-обновления)
8. [Мониторинг и аналитика](#мониторинг-и-аналитика)

## 🔧 Предварительные требования

### Общие требования
- Node.js (версия 16 или выше)
- npm или yarn
- Expo CLI (`npm install -g @expo/cli`)
- Аккаунт Expo (создайте на [expo.dev](https://expo.dev))

### Для iOS
- macOS (обязательно для сборки iOS приложений)
- Xcode (последняя версия)
- Apple Developer аккаунт ($99/год)
- iOS Simulator (входит в Xcode)

### Для Android
- Android Studio
- Android SDK
- Java Development Kit (JDK)
- Android эмулятор или физическое устройство

## 🚀 Настройка проекта

### 1. Установка зависимостей

```bash
cd mobile/VazifaMobile
npm install
```

### 2. Вход в Expo аккаунт

```bash
expo login
```

### 3. Настройка app.json

Убедитесь, что файл `app.json` правильно настроен:

```json
{
  "expo": {
    "name": "Vazifa",
    "slug": "vazifa-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.vazifa.mobile",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.vazifa.mobile",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## ⚙️ Конфигурация для продакшена

### 1. Настройка переменных окружения

Создайте файл `app.config.js` для управления конфигурацией:

```javascript
export default {
  expo: {
    name: process.env.NODE_ENV === 'production' ? 'Vazifa' : 'Vazifa Dev',
    slug: 'vazifa-mobile',
    version: '1.0.0',
    // ... остальная конфигурация
    extra: {
      apiUrl: process.env.NODE_ENV === 'production' 
        ? 'https://api.vazifa.com/api-v1'
        : 'http://localhost:5001/api-v1',
      eas: {
        projectId: 'your-project-id'
      }
    }
  }
};
```

### 2. Обновление API конфигурации

В файле `src/services/api.ts`:

```typescript
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5001/api-v1';
```

## 📱 Сборка для iOS

### 1. Настройка EAS Build

Установите EAS CLI:

```bash
npm install -g eas-cli
```

Инициализируйте EAS:

```bash
eas build:configure
```

### 2. Создание eas.json

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3. Сборка для iOS

```bash
# Для разработки
eas build --platform ios --profile development

# Для тестирования
eas build --platform ios --profile preview

# Для продакшена
eas build --platform ios --profile production
```

### 4. Настройка Apple Developer

1. Войдите в [Apple Developer Console](https://developer.apple.com)
2. Создайте App ID для вашего приложения
3. Создайте Distribution Certificate
4. Создайте Provisioning Profile

## 🤖 Сборка для Android

### 1. Генерация ключа подписи

```bash
# Создание keystore файла
keytool -genkeypair -v -keystore vazifa-release-key.keystore -alias vazifa-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Получение SHA-1 отпечатка
keytool -list -v -keystore vazifa-release-key.keystore -alias vazifa-key-alias
```

### 2. Настройка credentials

```bash
eas credentials
```

Выберите Android → Production → Upload new keystore

### 3. Сборка для Android

```bash
# Для разработки
eas build --platform android --profile development

# Для тестирования
eas build --platform android --profile preview

# Для продакшена
eas build --platform android --profile production
```

## 🏪 Публикация в магазинах приложений

### App Store (iOS)

1. **Подготовка метаданных:**
   - Название приложения
   - Описание
   - Ключевые слова
   - Скриншоты (различные размеры экранов)
   - Иконка приложения

2. **Загрузка через EAS Submit:**

```bash
eas submit --platform ios
```

3. **Ручная загрузка через App Store Connect:**
   - Войдите в [App Store Connect](https://appstoreconnect.apple.com)
   - Создайте новое приложение
   - Загрузите IPA файл через Transporter или Xcode

### Google Play Store (Android)

1. **Создание аккаунта разработчика:**
   - Зарегистрируйтесь в [Google Play Console](https://play.google.com/console)
   - Оплатите регистрационный взнос ($25)

2. **Загрузка через EAS Submit:**

```bash
eas submit --platform android
```

3. **Ручная загрузка:**
   - Создайте новое приложение в Play Console
   - Загрузите AAB файл
   - Заполните метаданные и скриншоты

## 🔄 Over-the-Air обновления

### 1. Настройка Expo Updates

```bash
npm install expo-updates
```

### 2. Конфигурация в app.json

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

### 3. Публикация обновлений

```bash
# Публикация обновления
eas update --branch production --message "Bug fixes and improvements"

# Публикация для конкретной платформы
eas update --branch production --platform ios --message "iOS specific update"
```

### 4. Управление каналами

```bash
# Создание канала для бета-тестирования
eas update --branch beta --message "Beta version with new features"

# Переключение пользователей на другой канал
eas channel:edit production --branch main
```

## 📊 Мониторинг и аналитика

### 1. Настройка Sentry для отслеживания ошибок

```bash
npm install @sentry/react-native
```

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
});
```

### 2. Настройка Firebase Analytics

```bash
expo install @react-native-firebase/app @react-native-firebase/analytics
```

### 3. Мониторинг производительности

```typescript
import { startNetworkLogging } from 'react-native-flipper';

if (__DEV__) {
  startNetworkLogging();
}
```

## 🔒 Безопасность

### 1. Обфускация кода

```bash
# Установка metro-react-native-babel-preset
npm install --save-dev metro-react-native-babel-preset

# Настройка в babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['transform-remove-console', { exclude: ['error', 'warn'] }]
  ]
};
```

### 2. Защита API ключей

```typescript
// Используйте expo-constants для безопасного хранения
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.apiKey;
```

### 3. Certificate Pinning

```typescript
// Настройка SSL pinning для дополнительной безопасности
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // SSL pinning конфигурация
});
```

## 🧪 Тестирование

### 1. Unit тесты

```bash
npm install --save-dev jest @testing-library/react-native
npm test
```

### 2. E2E тестирование

```bash
npm install --save-dev detox
detox test
```

### 3. Тестирование на устройствах

```bash
# Создание development build
eas build --platform ios --profile development
eas build --platform android --profile development

# Установка на устройство
eas device:create
```

## 📈 Оптимизация производительности

### 1. Анализ размера bundle

```bash
npx react-native-bundle-visualizer
```

### 2. Оптимизация изображений

```bash
# Сжатие изображений
npm install --save-dev imagemin imagemin-pngquant imagemin-mozjpeg
```

### 3. Code Splitting

```typescript
// Ленивая загрузка экранов
const LazyScreen = React.lazy(() => import('./LazyScreen'));
```

## 🚨 Устранение неполадок

### Общие проблемы

1. **Ошибки сборки:**
   ```bash
   # Очистка кэша
   expo r -c
   npm start -- --reset-cache
   ```

2. **Проблемы с зависимостями:**
   ```bash
   # Переустановка зависимостей
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Проблемы с Metro:**
   ```bash
   # Перезапуск Metro bundler
   npx react-native start --reset-cache
   ```

### Логи и отладка

```bash
# Просмотр логов iOS
npx react-native log-ios

# Просмотр логов Android
npx react-native log-android

# Отладка через Flipper
npx react-native doctor
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте [документацию Expo](https://docs.expo.dev/)
2. Посетите [форум Expo](https://forums.expo.dev/)
3. Создайте issue в репозитории проекта
4. Обратитесь к команде разработки

---

**Удачного развертывания!** 🚀
