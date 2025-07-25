import express from "express";
import { authenticateUser } from "../middleware/auth-middleware.js";
import { requireSuperAdmin, requireAdmin } from "../middleware/role-middleware.js";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserStats
} from "../controllers/admin-controller.js";

const router = express.Router();

// All admin routes require authentication
router.use(authenticateUser);

// Get user statistics (admin and super admin)
router.get("/stats", requireAdmin, getUserStats);

// Get all users (admin and super admin)
router.get("/users", requireAdmin, getAllUsers);

// Update user role (super admin only)
router.put("/users/:userId/role", requireSuperAdmin, updateUserRole);

// Delete user (super admin only)
router.delete("/users/:userId", requireSuperAdmin, deleteUser);

export default router;
