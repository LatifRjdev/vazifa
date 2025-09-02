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

// OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/apple", appleAuth);
router.get("/apple/callback", appleCallback);

export default router;
