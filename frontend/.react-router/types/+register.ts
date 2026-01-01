import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }

  interface Future {
    unstable_middleware: false
  }
}

type Params = {
  "/": {};
  "/sign-up": {};
  "/forgot-password": {};
  "/auth/callback": {};
  "/dashboard": {};
  "/dashboard/my-tasks": {};
  "/dashboard/achieved": {};
  "/dashboard/all-tasks": {};
  "/dashboard/manager-tasks": {};
  "/dashboard/important-tasks": {};
  "/dashboard/analytics": {};
  "/dashboard/members": {};
  "/dashboard/settings": {};
  "/dashboard/task/:taskId": {
    "taskId": string;
  };
  "/dashboard/user/:userId": {
    "userId": string;
  };
  "/dashboard/tech-admin": {};
  "/user/notifications": {};
  "/user/profile": {};
  "/reset-password": {};
  "/*": {
    "*": string;
  };
};