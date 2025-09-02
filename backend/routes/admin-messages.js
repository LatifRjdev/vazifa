import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import {
  sendMessage,
  getMessages,
  markAsRead,
  editMessage,
  deleteMessage,
  replyToMessage,
  addReaction,
  getUnreadCount,
  getOnlineAdmins,
} from "../controllers/admin-messages-controller.js";
import { authenticateUser } from "../middleware/auth-middleware.js";

const router = express.Router();

// Send message
router.post(
  "/",
  authenticateUser,
  validateRequest({
    body: z.object({
      recipient: z.string().optional(),
      message: z.string().min(1, "Сообщение не может быть пустым"),
      messageType: z.enum(["direct", "broadcast", "system"]).default("direct"),
      attachments: z.array(z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
      })).default([]),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      language: z.enum(["ru", "tj", "en"]).default("ru"),
    }),
  }),
  sendMessage
);

// Get messages
router.get("/", authenticateUser, getMessages);

// Get unread count
router.get("/unread-count", authenticateUser, getUnreadCount);

// Get online admins
router.get("/online-admins", authenticateUser, getOnlineAdmins);

// Mark message as read
router.put(
  "/:messageId/read",
  authenticateUser,
  validateRequest({ params: z.object({ messageId: z.string() }) }),
  markAsRead
);

// Edit message
router.put(
  "/:messageId",
  authenticateUser,
  validateRequest({
    params: z.object({ messageId: z.string() }),
    body: z.object({
      message: z.string().min(1, "Сообщение не может быть пустым"),
    }),
  }),
  editMessage
);

// Delete message
router.delete(
  "/:messageId",
  authenticateUser,
  validateRequest({ params: z.object({ messageId: z.string() }) }),
  deleteMessage
);

// Reply to message
router.post(
  "/:messageId/reply",
  authenticateUser,
  validateRequest({
    params: z.object({ messageId: z.string() }),
    body: z.object({
      message: z.string().min(1, "Сообщение не может быть пустым"),
      attachments: z.array(z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
      })).default([]),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      language: z.enum(["ru", "tj", "en"]).default("ru"),
    }),
  }),
  replyToMessage
);

// Add reaction
router.post(
  "/:messageId/reaction",
  authenticateUser,
  validateRequest({
    params: z.object({ messageId: z.string() }),
    body: z.object({
      emoji: z.string().min(1, "Эмодзи обязательно"),
    }),
  }),
  addReaction
);

export default router;
