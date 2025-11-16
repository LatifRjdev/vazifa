# Инструкция: Исправление ошибки AdminChatWidget

## Проблема
При открытии настроек или профиля появляется ошибка:
```
Error fetching unread count: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Что было исправлено
- AdminChatWidget теперь проверяет роль пользователя ДО вызова API
- Добавлена правильная обработка ошибок для всех API запросов
- Виджет теперь безопасно работает для обычных пользователей

---

## Шаг 1: Добавить изменения в GitHub

Откройте терминал в папке проекта и выполните:

```bash
# 1. Проверить статус git
git status

# 2. Добавить измененный файл
git add frontend/app/components/chat/admin-chat-widget.tsx

# 3. Закоммитить изменения
git commit -m "Fix: AdminChatWidget API error - prevent calls for non-admin users"

# 4. Запушить в GitHub
git push origin main
```

---

## Шаг 2: Обновить код на SSH сервере

### Вариант A: Использовать готовый скрипт (РЕКОМЕНДУЕТСЯ)

```bash
# Запустить автоматический скрипт обновления
./deploy-git-update.sh
```

Скрипт автоматически:
- Подключится к серверу
- Сделает git pull
- Пересоберет frontend
- Перезапустит PM2

### Вариант B: Вручную через SSH

```bash
# 1. Подключиться к серверу
ssh -p 3022 ubuntu@193.111.11.98

# 2. Перейти в директорию проекта
cd /var/www/vazifa

# 3. Настроить git remote (если еще не настроен)
git remote set-url origin https://github.com/LatifRjdev/vazifa.git

# 4. Получить последние изменения
git fetch origin main

# 5. Обновить код
git pull origin main

# 6. Пересобрать frontend
cd frontend
npm install
npm run build

# 7. Вернуться в корень
cd ..

# 8. Перезапустить frontend в PM2
pm2 restart vazifa-frontend

# 9. Сохранить конфигурацию PM2
pm2 save

# 10. Проверить статус
pm2 list

# 11. Выйти с сервера
exit
```

---

## Шаг 3: Проверить результат

1. Откройте ваше приложение в браузере
2. Зайдите под обычным пользователем (НЕ админом)
3. Попробуйте открыть:
   - ⚙️ Настройки
   - 👤 Профиль
   - 📋 Любую задачу

**Ожидаемый результат:**
- ✅ Никаких ошибок в консоли
- ✅ Страницы открываются нормально
- ✅ Виджет админ-чата НЕ отображается для обычных пользователей
- ✅ Виджет админ-чата ОТОБРАЖАЕТСЯ только для админов

---

## Быстрая команда (все в одной строке)

Если хотите все сделать одной командой:

```bash
git add frontend/app/components/chat/admin-chat-widget.tsx && \
git commit -m "Fix: AdminChatWidget API error" && \
git push origin main && \
./deploy-git-update.sh
```

---

## Если что-то пошло не так

### ⚠️ Проблема: "Your local changes would be overwritten by merge"

Если при `git pull` на сервере вы видите эту ошибку:
```
error: Your local changes to the following files would be overwritten by merge:
	frontend/app/components/chat/admin-chat-widget.tsx
Please commit your changes or stash them before you merge.
```

**Решение - сбросить локальные изменения на сервере:**
```bash
# На сервере, сбросить все локальные изменения
git reset --hard HEAD
git pull origin main
```

**Или сохранить изменения (если нужны):**
```bash
# На сервере, сохранить изменения во временное хранилище
git stash
git pull origin main
git stash pop  # Восстановить изменения если нужно
```

### Проблема: Git push не работает (с локального компьютера)
```bash
# Проверить настройки git
git remote -v

# Если нужно, добавить remote
git remote add origin https://github.com/LatifRjdev/vazifa.git
```

### Проблема: PM2 не перезапускается
```bash
# На сервере
pm2 delete vazifa-frontend
pm2 start frontend/build/server/index.js --name vazifa-frontend
pm2 save
```

### Проблема: Ошибка при сборке frontend
```bash
# На сервере, в папке frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Техническая информация

### Что было изменено в коде:

**До:**
```typescript
export const AdminChatWidget = ({ className }: AdminChatWidgetProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  // ... другие useState
  
  // Проверка роли в конце
  if (!user || !["admin", "super_admin"].includes(user.role)) {
    return null;
  }
```

**После:**
```typescript
export const AdminChatWidget = ({ className }: AdminChatWidgetProps) => {
  const { user } = useAuth();
  
  // Ранний выход - проверка роли ДО useState
  if (!user || !["admin", "super_admin"].includes(user.role)) {
    return null;
  }
  
  const [isOpen, setIsOpen] = useState(false);
  // ... остальные useState
```

### Добавлена обработка ошибок:

```typescript
const fetchUnreadCount = async () => {
  try {
    const response = await fetch("/api-v1/admin-messages/unread-count", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch unread count: HTTP ${response.status}`);
      return; // Тихо выходим, если ошибка
    }

    const data = await response.json();
    setUnreadCount(data.unreadCount);
  } catch (error) {
    console.warn("Error fetching unread count:", error);
  }
};
```

---

## Готово! 🎉

После выполнения всех шагов:
- ✅ Ошибка исправлена
- ✅ Код в GitHub обновлен
- ✅ Сервер обновлен и работает
- ✅ Приложение работает корректно для всех пользователей
