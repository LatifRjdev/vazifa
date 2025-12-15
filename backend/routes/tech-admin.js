import express from "express";
import { authenticateUser } from "../middleware/auth-middleware.js";
import { requireTechAdmin } from "../middleware/tech-admin-middleware.js";
import {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getUserActivity,
  toggleUserStatus,
  
  getAllTasks,
  deleteTask,
  getTaskStatistics,
  
  getSMSLogs,
  getSMSLogDetails,
  getSMSStatistics,
  
  getSystemHealth,
  getDatabaseStats,
} from "../controllers/tech-admin-controller.js";

const router = express.Router();

// Apply authentication and tech_admin requirement to all routes
router.use(authenticateUser);
router.use(requireTechAdmin);

// ===== DASHBOARD OVERVIEW =====
/**
 * @route   GET /api/tech-admin/dashboard/stats
 * @desc    Get overview statistics for tech admin dashboard
 * @access  Tech Admin only
 */
router.get("/dashboard/stats", getDashboardStats);

// ===== USER MANAGEMENT =====
/**
 * @route   GET /api/tech-admin/users
 * @desc    Get all users with pagination and filters
 * @access  Tech Admin only
 * @query   page, limit, role, search, verified, authProvider, sortBy, sortOrder
 */
router.get("/users", getAllUsers);

/**
 * @route   GET /api/tech-admin/users/:id/activity
 * @desc    Get user activity history (tasks, SMS, logs)
 * @access  Tech Admin only
 */
router.get("/users/:id/activity", getUserActivity);

/**
 * @route   DELETE /api/tech-admin/users/:id
 * @desc    Delete a user (except admin accounts)
 * @access  Tech Admin only
 * @body    { reason: string }
 */
router.delete("/users/:id", deleteUser);

/**
 * @route   POST /api/tech-admin/users/:id/toggle-status
 * @desc    Enable/disable a user account
 * @access  Tech Admin only
 * @body    { disabled: boolean, reason: string }
 */
router.post("/users/:id/toggle-status", toggleUserStatus);

// ===== TASK MANAGEMENT =====
/**
 * @route   GET /api/tech-admin/tasks
 * @desc    Get all tasks with pagination and filters
 * @access  Tech Admin only
 * @query   page, limit, status, priority, search, createdBy, sortBy, sortOrder
 */
router.get("/tasks", getAllTasks);

/**
 * @route   GET /api/tech-admin/tasks/statistics
 * @desc    Get task statistics and analytics
 * @access  Tech Admin only
 */
router.get("/tasks/statistics", getTaskStatistics);

/**
 * @route   DELETE /api/tech-admin/tasks/:id
 * @desc    Delete a task
 * @access  Tech Admin only
 * @body    { reason: string }
 */
router.delete("/tasks/:id", deleteTask);

// ===== SMS LOGS & ANALYTICS =====
/**
 * @route   GET /api/tech-admin/sms-logs
 * @desc    Get SMS logs with pagination and filters
 * @access  Tech Admin only
 * @query   page, limit, status, type, dateFrom, dateTo, search, sortBy, sortOrder
 */
router.get("/sms-logs", getSMSLogs);

/**
 * @route   GET /api/tech-admin/sms-logs/:id
 * @desc    Get specific SMS log details
 * @access  Tech Admin only
 */
router.get("/sms-logs/:id", getSMSLogDetails);

/**
 * @route   GET /api/tech-admin/sms-logs/statistics
 * @desc    Get SMS statistics and analytics
 * @access  Tech Admin only
 * @query   dateFrom, dateTo
 */
router.get("/sms-logs/statistics", getSMSStatistics);

// ===== SYSTEM MONITORING =====
/**
 * @route   GET /api/tech-admin/system/health
 * @desc    Get system health metrics (CPU, memory, SMPP, database)
 * @access  Tech Admin only
 */
router.get("/system/health", getSystemHealth);

/**
 * @route   GET /api/tech-admin/system/database
 * @desc    Get database statistics (collections, size, indexes)
 * @access  Tech Admin only
 */
router.get("/system/database", getDatabaseStats);

export default router;
