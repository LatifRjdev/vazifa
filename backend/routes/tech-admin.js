import express from "express";
import { authenticateUser } from "../middleware/auth-middleware.js";
import { requireTechAdmin } from "../middleware/tech-admin-middleware.js";
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserActivity,
  toggleUserStatus,
  resetUserPassword,

  getAllTasks,
  deleteTask,
  getTaskStatistics,

  getSMSLogs,
  getSMSLogDetails,
  getSMSStatistics,
  resendSMS,

  getEmailLogs,
  getEmailLogDetails,
  getEmailStatistics,
  resendEmail,

  getQueueStats,
  getQueueJobs,
  pauseQueue,
  resumeQueue,
  retryJob,
  removeJob,
  cleanQueue,

  getSystemHealth,
  getDatabaseStats,
  reconnectSMPP,

  getAuditLogs,
  getAuditLogDetails,
  getAuditStatistics,
  getAuditLogsByActor,

  getSystemSettings,
  updateSystemSettings,
  getSettingsCategory,
  toggleMaintenanceMode,
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
 * @query   page, limit, role, search, status, authProvider, sortBy, sortOrder
 */
router.get("/users", getAllUsers);

/**
 * @route   POST /api/tech-admin/users
 * @desc    Create a new user
 * @access  Tech Admin only
 * @body    { name, email, phoneNumber, password, role }
 */
router.post("/users", createUser);

/**
 * @route   GET /api/tech-admin/users/:id
 * @desc    Get user details by ID
 * @access  Tech Admin only
 */
router.get("/users/:id", getUserById);

/**
 * @route   PUT /api/tech-admin/users/:id
 * @desc    Update user details
 * @access  Tech Admin only
 * @body    { name, email, phoneNumber, role, settings }
 */
router.put("/users/:id", updateUser);

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

/**
 * @route   POST /api/tech-admin/users/:id/reset-password
 * @desc    Reset a user's password
 * @access  Tech Admin only
 * @body    { newPassword, sendNotification }
 */
router.post("/users/:id/reset-password", resetUserPassword);

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

/**
 * @route   POST /api/tech-admin/sms-logs/:id/resend
 * @desc    Resend a failed SMS
 * @access  Tech Admin only
 */
router.post("/sms-logs/:id/resend", resendSMS);

// ===== EMAIL LOGS & ANALYTICS =====
/**
 * @route   GET /api/tech-admin/email-logs
 * @desc    Get email logs with pagination and filters
 * @access  Tech Admin only
 * @query   page, limit, status, type, dateFrom, dateTo, search, sortBy, sortOrder
 */
router.get("/email-logs", getEmailLogs);

/**
 * @route   GET /api/tech-admin/email-logs/statistics
 * @desc    Get email statistics and analytics
 * @access  Tech Admin only
 * @query   dateFrom, dateTo
 */
router.get("/email-logs/statistics", getEmailStatistics);

/**
 * @route   GET /api/tech-admin/email-logs/:id
 * @desc    Get specific email log details
 * @access  Tech Admin only
 */
router.get("/email-logs/:id", getEmailLogDetails);

/**
 * @route   POST /api/tech-admin/email-logs/:id/resend
 * @desc    Resend a failed email
 * @access  Tech Admin only
 */
router.post("/email-logs/:id/resend", resendEmail);

// ===== QUEUE MANAGEMENT =====
/**
 * @route   GET /api/tech-admin/queue/stats
 * @desc    Get SMS queue statistics
 * @access  Tech Admin only
 */
router.get("/queue/stats", getQueueStats);

/**
 * @route   GET /api/tech-admin/queue/jobs
 * @desc    Get queue jobs by status
 * @access  Tech Admin only
 * @query   status (waiting, active, completed, failed, delayed), page, limit
 */
router.get("/queue/jobs", getQueueJobs);

/**
 * @route   POST /api/tech-admin/queue/pause
 * @desc    Pause the SMS queue
 * @access  Tech Admin only
 */
router.post("/queue/pause", pauseQueue);

/**
 * @route   POST /api/tech-admin/queue/resume
 * @desc    Resume the SMS queue
 * @access  Tech Admin only
 */
router.post("/queue/resume", resumeQueue);

/**
 * @route   POST /api/tech-admin/queue/jobs/:jobId/retry
 * @desc    Retry a failed job
 * @access  Tech Admin only
 */
router.post("/queue/jobs/:jobId/retry", retryJob);

/**
 * @route   DELETE /api/tech-admin/queue/jobs/:jobId
 * @desc    Remove a job from the queue
 * @access  Tech Admin only
 */
router.delete("/queue/jobs/:jobId", removeJob);

/**
 * @route   POST /api/tech-admin/queue/clean
 * @desc    Clean old jobs from the queue
 * @access  Tech Admin only
 * @body    { status: 'completed'|'failed', olderThan: number (ms) }
 */
router.post("/queue/clean", cleanQueue);

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

/**
 * @route   POST /api/tech-admin/system/smpp/reconnect
 * @desc    Attempt to reconnect SMPP connection
 * @access  Tech Admin only
 */
router.post("/system/smpp/reconnect", reconnectSMPP);

// ===== AUDIT LOGS =====
/**
 * @route   GET /api/tech-admin/audit-logs
 * @desc    Get audit logs with pagination and filters
 * @access  Tech Admin only
 * @query   page, limit, actor, action, category, status, dateFrom, dateTo, search
 */
router.get("/audit-logs", getAuditLogs);

/**
 * @route   GET /api/tech-admin/audit-logs/statistics
 * @desc    Get audit log statistics
 * @access  Tech Admin only
 * @query   dateFrom, dateTo
 */
router.get("/audit-logs/statistics", getAuditStatistics);

/**
 * @route   GET /api/tech-admin/audit-logs/actor/:userId
 * @desc    Get audit logs for a specific user
 * @access  Tech Admin only
 */
router.get("/audit-logs/actor/:userId", getAuditLogsByActor);

/**
 * @route   GET /api/tech-admin/audit-logs/:id
 * @desc    Get specific audit log details
 * @access  Tech Admin only
 */
router.get("/audit-logs/:id", getAuditLogDetails);

// ===== SYSTEM SETTINGS =====
/**
 * @route   GET /api/tech-admin/settings
 * @desc    Get all system settings
 * @access  Tech Admin only
 */
router.get("/settings", getSystemSettings);

/**
 * @route   PUT /api/tech-admin/settings
 * @desc    Update system settings
 * @access  Tech Admin only
 * @body    { category, settings }
 */
router.put("/settings", updateSystemSettings);

/**
 * @route   GET /api/tech-admin/settings/:category
 * @desc    Get settings for a specific category
 * @access  Tech Admin only
 */
router.get("/settings/:category", getSettingsCategory);

/**
 * @route   POST /api/tech-admin/settings/maintenance
 * @desc    Toggle maintenance mode
 * @access  Tech Admin only
 * @body    { enabled, message }
 */
router.post("/settings/maintenance", toggleMaintenanceMode);

export default router;
