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
    route("my-tasks", "routes/dashboard/my-tasks.tsx"),
    route("achieved", "routes/dashboard/achieved.tsx"),
    route("all-tasks", "routes/dashboard/all-tasks.tsx"),
    route("manager-tasks", "routes/dashboard/manager-tasks.tsx"),
    route("important-tasks", "routes/dashboard/important-tasks.tsx"),
    route("analytics", "routes/dashboard/analytics.tsx"),
    route("members", "routes/dashboard/members.tsx"),
    route("settings", "routes/dashboard/workspace-setting.tsx"),
    route("dashboard/task/:taskId", "routes/dashboard/task.$taskId.tsx"),
  ]),
  layout("routes/user/user-layout.tsx", [
    route("user/notifications", "routes/user/notifications.tsx"),
    route("user/profile", "routes/user/profile.tsx"),
  ]),

  route("my-tasks", "routes/my-tasks.tsx"),
  route("reset-password", "routes/auth/reset-password.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
