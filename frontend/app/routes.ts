import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/auth/auth-layout.tsx", [
    index("routes/auth/sign-in.tsx"),
    route("sign-up", "routes/auth/sign-up.tsx"),
    route("forgot-password", "routes/auth/forgot-password.tsx"),
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
    route("dashboard/user/:userId", "routes/dashboard/user.$userId.tsx"),
    // Tech Admin routes
    route("dashboard/tech-admin", "routes/dashboard/tech-admin.tsx"),
    route("dashboard/tech-admin/users", "routes/dashboard/tech-admin/users.tsx"),
    route("dashboard/tech-admin/sms-logs", "routes/dashboard/tech-admin/sms-logs.tsx"),
    route("dashboard/tech-admin/email-logs", "routes/dashboard/tech-admin/email-logs.tsx"),
    route("dashboard/tech-admin/queue", "routes/dashboard/tech-admin/queue.tsx"),
    route("dashboard/tech-admin/audit-logs", "routes/dashboard/tech-admin/audit-logs.tsx"),
    route("dashboard/tech-admin/settings", "routes/dashboard/tech-admin/settings.tsx"),
    route("dashboard/tech-admin/system", "routes/dashboard/tech-admin/system.tsx"),
  ]),
  layout("routes/user/user-layout.tsx", [
    route("user/notifications", "routes/user/notifications.tsx"),
    route("user/profile", "routes/user/profile.tsx"),
  ]),

  route("reset-password", "routes/auth/reset-password.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
