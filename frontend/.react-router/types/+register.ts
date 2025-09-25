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
  "/sign-in": {};
  "/forgot-password": {};
  "/verify-email": {};
  "/auth/callback": {};
  "/dashboard": {};
  "/my-tasks": {};
  "/achieved": {};
  "/all-tasks": {};
  "/manager-tasks": {};
  "/important-tasks": {};
  "/analytics": {};
  "/members": {};
  "/settings": {};
  "/dashboard/task/:taskId": {
    "taskId": string;
  };
  "/user/notifications": {};
  "/user/profile": {};
  "/reset-password": {};
  "/*": {
    "*": string;
  };
};