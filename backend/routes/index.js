import express from "express";

import authRoutes from "./auth.js";
import commentRoutes from "./comment.js";
import projectRoutes from "./project.js";
import taskRoutes from "./task.js";
import userRoutes from "./user.js";
import workspaceRoutes from "./workspace.js";
import adminRoutes from "./admin.js";
import uploadRoutes from "./upload.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/tasks", taskRoutes);
router.use("/comments", commentRoutes);
router.use("/projects", projectRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/upload", uploadRoutes);

export default router;
