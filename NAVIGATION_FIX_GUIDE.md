# Руководство по исправлению навигации

## Обнаруженные проблемы

### 1. Проблема с доступом к настройкам и другим страницам

**Симптомы:**
- При клике на "Настройки" в sidebar страница не открывается
- При клике на другие пункты меню (Мои задачи, Все задачи и т.д.) навигация не работает
- Даже администраторы не могут попасть на страницы через sidebar

**Причина:**
Несоответствие путей в навигации (sidebar) и реальных маршрутах приложения.

**Технические детали:**

В файле `frontend/app/components/layout/sidebar-component.tsx` пути были указаны неправильно:
```typescript
// ❌ НЕПРАВИЛЬНО (старый код)
{
  title: t('nav.settings'),
  href: "/settings",  // Ведет на несуществующий маршрут
  icon: Settings,
}
```

В то время как в `frontend/app/routes.ts` маршруты находятся внутри layout `/dashboard`:
```typescript
// ✅ ПРАВИЛЬНО (структура маршрутов)
layout("routes/dashboard/dashboard-layout.tsx", [
  route("settings", "routes/dashboard/workspace-setting.tsx")  // /dashboard/settings
])
```

### 2. Отсутствие быстрого доступа к профилю

**Симптомы:**
- Профиль доступен только через header → аватар → dropdown
- Нет прямой ссылки из sidebar

**Причина:**
В sidebar не было кнопки для быстрого доступа к профилю пользователя.

---

## Решение

### ✅ Исправление 1: Корректировка путей навигации

Все пути в sidebar были обновлены с добавлением префикса `/dashboard/`:

```typescript
// ✅ ИСПРАВЛЕНО
const getNavItems = () => {
  if (user?.role === "super_admin") {
    return [
      { title: t('nav.important_tasks'), href: "/dashboard/important-tasks", icon: Star },
      { title: t('nav.all_tasks'), href: "/dashboard/all-tasks", icon: ClipboardList },
      { title: t('nav.analytics'), href: "/dashboard/analytics", icon: BarChart3 },
      { title: t('nav.members'), href: "/dashboard/members", icon: Users },
      { title: t('nav.completed_tasks'), href: "/dashboard/achieved", icon: CheckCircle2 },
    ];
  }

  return [
    { title: t('nav.dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { title: t('nav.my_tasks'), href: "/dashboard/my-tasks", icon: ListCheck },
    { title: t('nav.all_tasks'), href: "/dashboard/all-tasks", icon: ClipboardList },
    { title: t('nav.manager_tasks'), href: "/dashboard/manager-tasks", icon: UserCheck },
    { title: t('nav.important_tasks'), href: "/dashboard/important-tasks", icon: Star },
    { title: t('nav.analytics'), href: "/dashboard/analytics", icon: BarChart3 },
    { title: t('nav.members'), href: "/dashboard/members", icon: Users },
    { title: t('nav.completed_tasks'), href: "/dashboard/achieved", icon: CheckCircle2 },
    { title: t('nav.settings'), href: "/dashboard/settings", icon: Settings },
  ];
};
```

### ✅ Исправление 2: Добавление кнопки профиля

В нижней части sidebar добавлена кнопка для быстрого доступа к профилю:

```typescript
<div className="border-t p-4 flex flex-col gap-2">
  {/* Новая кнопка профиля */}
  <Link to="/user/profile">
    <Button variant="ghost" size={isCollapsed ? "icon" : "default"} className="justify-start w-full">
      <User className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
      <span className="hidden md:block">{!isCollapsed && t('nav.profile')}</span>
    </Button>
  </Link>
  
  {/* Существующая кнопка выхода */}
  <Button variant="ghost" onClick={logout}>
    <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
    <span className="hidden md:block">{!isCollapsed && t('nav.logout')}</span>
  </Button>
</div>
```

---

## Деплой на производственный сервер

### Автоматический деплой

Создан скрипт `deploy-navigation-fix.sh` для автоматического деплоя исправлений.

#### Способ 1: С переменными окружения

```bash
# Установите переменные окружения
export SSH_USER='ваш_пользователь'
export SSH_HOST='ваш_хост_или_ip'
export SSH_PATH='/путь/к/vazifa'

# Сделайте скрипт исполняемым
chmod +x deploy-navigation-fix.sh

# Запустите деплой
./deploy-navigation-fix.sh
```

#### Способ 2: Интерактивный режим

Если переменные окружения не установлены, скрипт запросит их при запуске:

```bash
chmod +x deploy-navigation-fix.sh
./deploy-navigation-fix.sh
```

Скрипт попросит ввести:
- SSH пользователя
- SSH хост (IP или домен)
- Путь к проекту на сервере

### Ручной деплой

Если нужно выполнить деплой вручную:

#### 1. Сборка проекта локально

```bash
cd frontend
npm run build
```

#### 2. Загрузка на сервер

```bash
# Создайте backup на сервере
ssh user@host "cd /path/to/vazifa/frontend && cp -r build build.backup.$(date +%Y%m%d_%H%M%S)"

# Загрузите новые файлы
rsync -avz build/ user@host:/path/to/vazifa/frontend/build/
```

#### 3. Перезапуск PM2

```bash
ssh user@host "cd /path/to/vazifa && pm2 restart vazifa-frontend && pm2 save"
```

#### 4. Проверка статуса

```bash
ssh user@host "pm2 list"
ssh user@host "pm2 logs vazifa-frontend --lines 50"
```

---

## Проверка после деплоя

После успешного деплоя проверьте:

### ✅ Checklist проверки

1. **Навигация в sidebar:**
   - [ ] Все пункты меню кликабельны
   - [ ] При клике открывается правильная страница
   - [ ] URL в адресной строке соответствует ожидаемому

2. **Доступ к настройкам:**
   - [ ] Кнопка "Настройки" работает для всех ролей
   - [ ] Страница настроек открывается корректно
   - [ ] Администраторы видят расширенные настройки

3. **Доступ к профилю:**
   - [ ] Кнопка "Профиль" в sidebar видна и работает
   - [ ] Страница профиля открывается
   - [ ] Можно редактировать информацию профиля
   - [ ] Доступ через header → аватар также работает

4. **Навигация для разных ролей:**
   - [ ] Super Admin видит специальный набор пунктов меню
   - [ ] Admin/Manager видят полный набор пунктов
   - [ ] Обычные пользователи видят ограниченный набор

5. **Навигация внутри задачи:**
   - [ ] Можно зайти в задачу
   - [ ] Внутри задачи можно перейти в профиль исполнителя (если доступно)
   - [ ] Кнопка "Назад" работает корректно

---

## Откат изменений (если нужно)

Если после деплоя возникли проблемы:

### Быстрый откат

```bash
ssh user@host "cd /path/to/vazifa/frontend && rm -rf build && mv build.backup.YYYYMMDD_HHMMSS build"
ssh user@host "pm2 restart vazifa-frontend"
```

Замените `YYYYMMDD_HHMMSS` на временную метку вашего backup.

### Проверка доступных backup

```bash
ssh user@host "ls -la /path/to/vazifa/frontend/ | grep backup"
```

---

## Техническая информация

### Измененные файлы

1. **frontend/app/components/layout/sidebar-component.tsx**
   - Обновлены все href с добавлением `/dashboard/` префикса
   - Добавлена кнопка профиля в нижнюю часть sidebar
   - Добавлен импорт иконки `User` из lucide-react

### Структура маршрутов

```
/                              → welcome page
/sign-in                       → авторизация
/sign-up                       → регистрация
/dashboard                     → главная панель (требует auth)
  ├─ /my-tasks                 → мои задачи
  ├─ /all-tasks                → все задачи (admin+)
  ├─ /manager-tasks            → задачи менеджера (manager+)
  ├─ /important-tasks          → важные задачи (super_admin)
  ├─ /achieved                 → выполненные задачи
  ├─ /analytics                → аналитика (admin+)
  ├─ /members                  → участники (admin+)
  ├─ /settings                 → настройки
  └─ /task/:taskId             → детали задачи
/user                          → пользовательский раздел
  ├─ /profile                  → профиль пользователя
  └─ /notifications            → уведомления
```

---

## Часто задаваемые вопросы (FAQ)

**Q: Почему навигация не работала раньше?**  
A: Пути в sidebar указывали на корневой уровень (например `/settings`), но все маршруты находятся внутри `/dashboard/` layout.

**Q: Нужно ли что-то менять в backend?**  
A: Нет, все изменения только во frontend части.

**Q: Влияет ли это на мобильное приложение?**  
A: Нет, мобильное приложение использует свою собственную навигацию.

**Q: Нужно ли очищать кэш браузера?**  
A: Рекомендуется, но не обязательно. React Router должен автоматически обработать новые маршруты.

**Q: Что делать, если после деплоя страница не загружается?**  
A: Проверьте логи PM2: `pm2 logs vazifa-frontend`. Возможно, нужно откатить изменения и проверить сборку локально.

---

## Поддержка

Если возникли проблемы:

1. Проверьте логи PM2: `pm2 logs vazifa-frontend`
2. Проверьте консоль браузера на наличие ошибок
3. Убедитесь, что сборка прошла успешно локально
4. При необходимости откатите изменения через backup

---

## Дата обновления

Последнее обновление: 30 сентября 2025

## Автор

Исправление навигации Vazifa Task Management System
