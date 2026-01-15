import express from "express";
import multer from "multer";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import {
  changePassword,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  get2FAStatus,
  enable2FA,
  verify2FA,
  disable2FA,
  getAllUsers,
  deleteUser,
  getUserProfileById,
  getUserActivity,
  getUserLoginHistory,
  getUserTaskViews,
} from "../controllers/user-controller.js";
import { authenticateUser } from "../middleware/auth-middleware.js";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification-controller.js";

const router = express.Router();

// Конфигурация Multer для аватаров
const avatarStorage = multer.memoryStorage();

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB максимум (до оптимизации)
  },
  fileFilter: (req, file, cb) => {
    // Валидация только изображений
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (JPEG, PNG, GIF, WebP)'), false);
    }
  },
});

router.get("/me", authenticateUser, getUserProfile);
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

// Загрузка аватара
router.post(
  "/avatar",
  authenticateUser,
  avatarUpload.single("avatar"),
  uploadAvatar
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

// Get all users for task assignment
router.get("/all", authenticateUser, getAllUsers);

// Get user profile by ID (for managers/admins to view member details)
router.get(
  "/:userId/profile",
  authenticateUser,
  validateRequest({ params: z.object({ userId: z.string() }) }),
  getUserProfileById
);

// Get user activity history
router.get(
  "/:userId/activity",
  authenticateUser,
  validateRequest({ params: z.object({ userId: z.string() }) }),
  getUserActivity
);

// Get user login history
router.get(
  "/:userId/logins",
  authenticateUser,
  validateRequest({ params: z.object({ userId: z.string() }) }),
  getUserLoginHistory
);

// Get tasks that user viewed or not viewed
router.get(
  "/:userId/task-views",
  authenticateUser,
  validateRequest({ params: z.object({ userId: z.string() }) }),
  getUserTaskViews
);

// Delete user (admin only)
router.delete(
  "/:userId",
  authenticateUser,
  validateRequest({ params: z.object({ userId: z.string() }) }),
  deleteUser
);

export default router;
