import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import {
  changePassword,
  getUserProfile,
  updateUserProfile,
  get2FAStatus,
  enable2FA,
  verify2FA,
  disable2FA,
} from "../controllers/user-controller.js";
import { authenticateUser } from "../middleware/auth-middleware.js";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification-controller.js";

const router = express.Router();

router.get("/profile", authenticateUser, getUserProfile);
router.put(
  "/profile",
  authenticateUser,
  validateRequest({
    body: z.object({
      name: z.string(),
      profilePicture: z.string().optional(),
    }),
  }),
  updateUserProfile
);

router.put(
  "/change-password",
  authenticateUser,
  validateRequest({
    body: z.object({
      currentPassword: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string(),
    }),
  }),
  changePassword
);

router.get("/notifications", authenticateUser, getNotifications);
router.get(
  "/notifications/unread-count",
  authenticateUser,
  getUnreadNotificationsCount
);

router.put("/notifications", authenticateUser, markAllNotificationsAsRead);
router.put(
  "/notifications/:id",
  authenticateUser,
  validateRequest({ params: z.object({ id: z.string() }) }),
  markNotificationAsRead
);

router.get("/2fa-status", authenticateUser, get2FAStatus);
router.post("/enable-2fa", authenticateUser, enable2FA);
router.post("/verify-2fa", authenticateUser, verify2FA);
router.post("/disable-2fa", authenticateUser, disable2FA);

export default router;
