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
} from "../controllers/auth-controller.js";
import {
  sendPhoneVerificationCode,
  verifyPhoneCode,
  registerWithPhone,
  loginWithPhone,
  resetPasswordWithPhone,
} from "../controllers/phone-auth-controller.js";
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

// Phone authentication routes
router.post(
  "/phone/send-code",
  validateRequest({
    body: z.object({
      phoneNumber: z.string().regex(/^\+992\d{9}$/, "Invalid phone number format"),
      type: z.enum(["registration", "login", "password_reset", "phone_update"]).optional(),
    }),
  }),
  sendPhoneVerificationCode
);

router.post(
  "/phone/verify-code",
  validateRequest({
    body: z.object({
      phoneNumber: z.string().regex(/^\+992\d{9}$/, "Invalid phone number format"),
      code: z.string().length(6),
      type: z.enum(["registration", "login", "password_reset", "phone_update"]).optional(),
    }),
  }),
  verifyPhoneCode
);

router.post(
  "/phone/register",
  validateRequest({
    body: z.object({
      phoneNumber: z.string().regex(/^\+992\d{9}$/, "Invalid phone number format"),
      password: z.string().min(6),
      name: z.string().min(1),
      verificationCode: z.string().length(6),
    }),
  }),
  registerWithPhone
);

router.post(
  "/phone/login",
  validateRequest({
    body: z.object({
      phoneNumber: z.string().regex(/^\+992\d{9}$/, "Invalid phone number format"),
      password: z.string().min(6),
    }),
  }),
  loginWithPhone
);

router.post(
  "/phone/reset-password",
  validateRequest({
    body: z.object({
      phoneNumber: z.string().regex(/^\+992\d{9}$/, "Invalid phone number format"),
      verificationCode: z.string().length(6),
      newPassword: z.string().min(6),
    }),
  }),
  resetPasswordWithPhone
);

// OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/apple", appleAuth);
router.get("/apple/callback", appleCallback);

export default router;
