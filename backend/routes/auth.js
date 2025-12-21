import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import {
  loginUser,
  registerUser,
  resetPasswordRequest,
  verifyResetTokenAndResetPassword,
  verify2FALogin,
  googleAuth,
  googleCallback,
  appleAuth,
  appleCallback,
  registerUserWithPhone,
  loginWithEmailOrPhone,
} from "../controllers/auth-controller.js";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../libs/validator-schema.js";

const router = express.Router();

// Email registration
router.post(
  "/register",
  validateRequest({
    body: registerSchema,
  }),
  registerUser
);

// Email login
router.post(
  "/login",
  validateRequest({
    body: loginSchema,
  }),
  loginUser
);

// Password reset request
router.post(
  "/request-reset-password",
  validateRequest({
    body: z.object({
      emailOrPhone: z.string().min(1, "Email или телефон обязателен"),
    }),
  }),
  resetPasswordRequest
);

// Password reset with token
router.post(
  "/reset-password",
  validateRequest({
    body: resetPasswordSchema,
  }),
  verifyResetTokenAndResetPassword
);

// 2FA verification
router.post(
  "/verify-2fa-login",
  validateRequest({
    body: z.object({
      email: z.string().email(),
      code: z.string().length(6),
    }),
  }),
  verify2FALogin
);

// Phone registration
router.post(
  "/register-phone",
  validateRequest({
    body: z.object({
      name: z.string().min(1).refine(val => val.trim().split(/\s+/).length >= 2, {
        message: "Полное имя должно содержать минимум Имя и Фамилию через пробел"
      }),
      phoneNumber: z.string().regex(/^\+992\d{9}$/, "Номер телефона должен быть в формате +992XXXXXXXXX"),
      email: z.string().email("Email должен быть действительным"),
      password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
    }),
  }),
  registerUserWithPhone
);

// Universal login (email or phone)
router.post(
  "/login-universal",
  validateRequest({
    body: z.object({
      emailOrPhone: z.string().min(1, "Email или телефон обязателен"),
      password: z.string().min(1, "Пароль обязателен"),
    }),
  }),
  loginWithEmailOrPhone
);

// OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/apple", appleAuth);
router.get("/apple/callback", appleCallback);

export default router;
