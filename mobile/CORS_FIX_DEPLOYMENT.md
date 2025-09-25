# Исправление CORS проблемы для мобильного приложения

## Внесенные изменения

В файл `backend/index.js` добавлены следующие origins в массив `allowedOrigins`:

```javascript
"http://localhost:8081", // Expo web server
"http://localhost:19006", // Alternative Expo port
"exp://localhost:8081", // Expo development server
"exp://192.168.1.78:8081" // Expo LAN development server
```

## Развертывание на продакшн сервер (ptapi.oci.tj)

### Шаг 1: Загрузка изменений на сервер
```bash
# Скопировать обновленный файл на сервер
scp backend/index.js user@ptapi.oci.tj:/path/to/your/backend/

# Или через git (если используете)
git add backend/index.js
git commit -m "Fix CORS for mobile app development"
git push origin main
```

### Шаг 2: Перезапуск сервера
```bash
# Подключиться к серверу
ssh user@ptapi.oci.tj

# Перейти в директорию проекта
cd /path/to/your/backend/

# Перезапустить приложение (в зависимости от используемого процесс-менеджера)
pm2 restart all
# или
systemctl restart your-app-service
# или
docker-compose restart backend
```

### Шаг 3: Проверка изменений
```bash
# Проверить логи сервера
pm2 logs
# или
journalctl -u your-app-service -f
```

## Тестирование мобильного приложения

После развертывания изменений:

1. Запустить мобильное приложение:
   ```bash
   cd mobile/VazifaMobile
   npx expo start --web
   ```

2. Открыть http://localhost:8081 в браузере

3. Попробовать зарегистрироваться или войти в систему

4. Проверить консоль браузера на отсутствие CORS ошибок

## Альтернативные решения

### Если проблема остается:

1. **Проверить IP адрес**: Замените `192.168.1.78` на ваш текущий IP адрес в локальной сети
2. **Добавить wildcard для разработки**: Временно добавить `"http://localhost:*"` (не рекомендуется для продакшена)
3. **Использовать прокси**: Настроить прокси в Expo конфигурации

### Получить текущий IP адрес:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

## Безопасность

⚠️ **Важно**: Добавленные localhost origins должны использоваться только для разработки. В продакшене убедитесь, что они не представляют угрозы безопасности.

## Следующие шаги

1. Развернуть изменения на ptapi.oci.tj
2. Протестировать мобильное приложение
3. Продолжить разработку и подготовку к публикации в магазинах приложений
