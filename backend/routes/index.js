import express from "express";

import authRoutes from "./auth.js";
import commentRoutes from "./comment.js";
import taskRoutes from "./task.js";
import userRoutes from "./user.js";
import adminRoutes from "./admin.js";
import techAdminRoutes from "./tech-admin.js";
import adminChatRoutes from "./admin-chat.js";
import adminMessagesRoutes from "./admin-messages.js";
import uploadRoutes from "./upload.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/comments", commentRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/tech-admin", techAdminRoutes);
router.use("/admin-chat", adminChatRoutes);
router.use("/admin-messages", adminMessagesRoutes);
router.use("/upload", uploadRoutes);

export default router;
