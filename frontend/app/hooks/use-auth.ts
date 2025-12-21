import type { SignupValues } from "@/routes/auth/sign-up";
import { useMutation } from "@tanstack/react-query";
import { postData } from "../lib/fetch-utils";
import type { LoginValues } from "@/routes/auth/sign-in";
import type { ResetPasswordValues } from "@/routes/auth/reset-password";

export const useSignUpMutation = () => {
  return useMutation({
    mutationFn: (data: SignupValues) => postData("/auth/register", data),
  });
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (data: LoginValues) => postData("/auth/login", data),
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (data: {
      token: string;
      newPassword: string;
      confirmPassword: string;
    }) => postData("/auth/reset-password", data),
  });
};

export const useRequestResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (data: { emailOrPhone: string }) =>
      postData("/auth/request-reset-password", data),
  });
};

export const useVerify2FALoginMutation = () => {
  return useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      postData("/auth/verify-2fa-login", data),
  });
};
