import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/auth/auth-layout.tsx", [
    index("routes/root/welcome.tsx"),
    route("sign-up", "routes/auth/sign-up.tsx"),
    route("sign-in", "routes/auth/sign-in.tsx"),
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
