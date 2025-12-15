#!/bin/bash

echo "🔧 ПРАВИЛЬНОЕ ИСПРАВЛЕНИЕ /sign-in route"
echo "════════════════════════════════════════"
echo ""

# SSH credentials
SSH_USER="ubuntu"
SSH_HOST="193.111.11.98"
SSH_PORT="3022"

echo "📝 Подключение к серверу..."
echo ""

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'ENDSSH'

cd /var/www/vazifa/frontend/app

echo "📍 Исправление routes.ts..."
echo ""

# Восстанавливаем из backup и делаем правильное исправление
cp routes.ts.backup.* routes.ts 2>/dev/null || echo "Backup не найден, продолжаем"

# Создаем правильную версию routes.ts
cat > routes.ts << 'EOF'
import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Auth layout - корневой путь "/" будет sign-in
  layout("routes/auth/auth-layout.tsx", [
    index("routes/auth/sign-in.tsx"),           // "/" -> sign-in
    route("sign-up", "routes/auth/sign-up.tsx"),
    route("welcome", "routes/root/welcome.tsx"),
    route("forgot-password", "routes/auth/forgot-password.tsx"),
    route("verify-email", "routes/auth/verify-email.tsx"),
    route("auth/callback", "routes/auth/callback.tsx"),
  ]),
  layout("routes/dashboard/dashboard-layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("dashboard/my-tasks", "routes/dashboard/my-tasks.tsx"),
    route("dashboard/achieved", "routes/dashboard/achieved.tsx"),
    route("dashboard/all-tasks", "routes/dashboard/all-tasks.tsx"),
    route("dashboard/manager-tasks", "routes/dashboard/manager-tasks.tsx"),
    route("dashboard/important-tasks", "routes/dashboard/important-tasks.tsx"),
    route("dashboard/analytics", "routes/dashboard/analytics.tsx"),
    route("dashboard/members", "routes/dashboard/members.tsx"),
    route("dashboard/settings", "routes/dashboard/workspace-setting.tsx"),
    route("dashboard/task/:taskId", "routes/dashboard/task.$taskId.tsx"),
  ]),
  layout("routes/user/user-layout.tsx", [
    route("user/notifications", "routes/user/notifications.tsx"),
    route("user/profile", "routes/user/profile.tsx"),
  ]),

  route("reset-password", "routes/auth/reset-password.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
EOF

echo "✅ routes.ts обновлен"
echo ""
echo "📄 Проверка нового содержимого:"
head -20 routes.ts

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Теперь:"
echo "  / → sign-in (index)"
echo "  /sign-up → работает"
echo "  Logout redirect на / → показывает sign-in ✅"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENDSSH

echo ""
echo "✅ Исправление routes.ts завершено!"
echo ""
echo "Теперь запустите rebuild-frontend-fix.sh для полной пересборки"
