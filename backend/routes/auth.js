import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import {
  loginUser,
  registerUser,
  resetPasswordRequest,
  verifyEmail,
  verifyResetTokenAndResetPassword,
  verify2FALogin,
  googleAuth,
  googleCallback,
  appleAuth,
  appleCallback,
  // NEW: Phone authentication
  registerUserWithPhone,
  verifyPhoneCode,
  resendVerificationCode,
  loginWithEmailOrPhone,
} from "../controllers/auth-controller.js";
import { verifyPhoneViaLink } from "../controllers/phone-auth-controller.js";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailTokenSchema,
} from "../libs/validator-schema.js";

const router = express.Router();

router.post(
  "/register",
  validateRequest({
    body: registerSchema,
  }),
  registerUser
);
router.post(
  "/login",
  validateRequest({
    body: loginSchema,
  }),
  loginUser
);
router.post(
  "/verify-email",
  validateRequest({
    body: verifyEmailTokenSchema,
  }),
  verifyEmail
);
router.post(
  "/request-reset-password",
  validateRequest({
    body: z.object({
      email: z.string().email(),
    }),
  }),
  resetPasswordRequest
);

router.post(
  "/reset-password",
  validateRequest({
    body: resetPasswordSchema,
  }),
  verifyResetTokenAndResetPassword
);

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

// NEW: Phone authentication routes with SMS verification
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

router.post(
  "/verify-phone",
  validateRequest({
    body: z.object({
      phoneNumber: z.string().regex(/^\+992\d{9}$/, "Invalid phone number format"),
      code: z.string().length(6, "Код должен содержать 6 цифр"),
    }),
  }),
  verifyPhoneCode
);

router.post(
  "/resend-code",
  validateRequest({
    body: z.object({
      phoneNumber: z.string().regex(/^\+992\d{9}$/, "Invalid phone number format"),
    }),
  }),
  resendVerificationCode
);

// NEW: Link-based verification endpoint
router.get("/verify-phone-link/:token", verifyPhoneViaLink);

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
