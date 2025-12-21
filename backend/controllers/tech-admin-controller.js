import User from "../models/users.js";
import Task from "../models/tasks.js";
import SMSLog from "../models/sms-logs.js";
import EmailLog from "../models/email-logs.js";
import ActivityLog from "../models/activity-logs.js";
import AuditLog from "../models/audit-logs.js";
import Workspace from "../models/workspace.js";
import mongoose from "mongoose";
import os from 'os';
import process from 'process';
import { getSMPPService, smsQueue } from "../libs/send-sms-bullmq.js";

// Helper to log audit events
const logAudit = async (req, action, options = {}) => {
  try {
    await AuditLog.log({
      actor: req.user,
      action,
      targetType: options.targetType,
      targetId: options.targetId,
      targetName: options.targetName,
      description: options.description,
      details: options.details,
      previousValues: options.previousValues,
      newValues: options.newValues,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent'],
      status: options.status || 'success',
      errorMessage: options.errorMessage,
    });
  } catch (err) {
    console.error("Failed to log audit event:", err.message);
  }
};

// ===== DASHBOARD OVERVIEW =====
export const getDashboardStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalSMS,
      sentSMS,
      failedSMS,
      smsToday,
      usersByRole,
      totalWorkspaces,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Done' }),
      Task.countDocuments({ status: 'In Progress' }),
      SMSLog.countDocuments(),
      SMSLog.countDocuments({ status: 'sent' }),
      SMSLog.countDocuments({ status: 'failed' }),
      SMSLog.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]),
      Workspace.countDocuments(),
    ]);

    const smppService = getSMPPService();
    const smppStatus = smppService.getStatus();

    const deliveryRate = totalSMS > 0 
      ? ((sentSMS / totalSMS) * 100).toFixed(2)
      : 0;

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        completionRate: totalTasks > 0 
          ? ((completedTasks / totalTasks) * 100).toFixed(2)
          : 0,
      },
      sms: {
        total: totalSMS,
        sent: sentSMS,
        failed: failedSMS,
        today: smsToday,
        deliveryRate: parseFloat(deliveryRate),
      },
      workspaces: {
        total: totalWorkspaces,
      },
      system: {
        uptime: Math.floor(process.uptime()),
        smppConnected: smppStatus.connected,
        smppReconnectAttempts: smppStatus.reconnectAttempts,
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== USER MANAGEMENT =====
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      role,
      search,
      status, // 'active', 'disabled', 'all'
      authProvider,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (role) filter.role = role;
    if (status === 'active') filter.disabled = { $ne: true };
    if (status === 'disabled') filter.disabled = true;
    if (authProvider) filter.authProvider = authProvider;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -twoFAOtp -twoFAOtpExpires')
        .populate('disabledBy', 'name email')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -twoFAOtp -twoFAOtpExpires')
      .populate('disabledBy', 'name email')
      .populate('createdBy', 'name email');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, role = 'member' } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!email && !phoneNumber) {
      return res.status(400).json({ message: "Either email or phone number is required" });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phoneNumber ? [{ phoneNumber }] : []),
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email or phone number already exists"
      });
    }

    // Only tech_admin can create other admins
    if (['tech_admin', 'super_admin'].includes(role) && req.user.role !== 'tech_admin') {
      return res.status(403).json({
        message: "Only tech admins can create administrator accounts"
      });
    }

    // Hash password if provided
    let hashedPassword;
    if (password) {
      const bcrypt = await import('bcryptjs');
      hashedPassword = await bcrypt.default.hash(password, 10);
    }

    const newUser = new User({
      name,
      email: email?.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      role,
      createdBy: req.user._id,
      authProvider: 'local',
    });

    await newUser.save();

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'create_user',
        resourceType: 'User',
        resourceId: newUser._id,
        metadata: {
          createdUserName: name,
          createdUserEmail: email,
          createdUserRole: role,
        },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phoneNumber, role, settings } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot modify tech_admin/super_admin unless you're tech_admin
    if (['tech_admin', 'super_admin'].includes(user.role) && req.user.role !== 'tech_admin') {
      return res.status(403).json({
        message: "Cannot modify administrator accounts"
      });
    }

    // Cannot promote to admin unless you're tech_admin
    if (['tech_admin', 'super_admin'].includes(role) && req.user.role !== 'tech_admin') {
      return res.status(403).json({
        message: "Only tech admins can assign administrator roles"
      });
    }

    // Check for email/phone conflicts with other users
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already in use by another user" });
      }
    }

    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber, _id: { $ne: id } });
      if (existingPhone) {
        return res.status(409).json({ message: "Phone number already in use by another user" });
      }
    }

    // Update fields
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email.toLowerCase();
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (role !== undefined) updateFields.role = role;
    if (settings !== undefined) updateFields.settings = { ...user.settings, ...settings };

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -twoFAOtp -twoFAOtpExpires');

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'update_user',
        resourceType: 'User',
        resourceId: id,
        metadata: {
          updatedFields: Object.keys(updateFields),
        },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;

    const user = await User.findById(id).select('-password -twoFAOtp -twoFAOtpExpires');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's tasks
    const tasks = await Task.find({
      $or: [
        { createdBy: id },
        { assignees: id },
      ]
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('title status createdAt completedAt');

    // Get user's SMS logs
    const smsLogs = await SMSLog.find({ recipient: id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('type status message createdAt');

    // Get activity logs if model exists
    let activityLogs = [];
    try {
      activityLogs = await ActivityLog.find({ user: id })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    } catch (err) {
      // ActivityLog model might not exist yet
      console.log("ActivityLog model not available");
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      activity: {
        tasks: {
          created: tasks.filter(t => t.createdBy?.toString() === id).length,
          assigned: tasks.filter(t => t.assignees?.some(a => a.toString() === id)).length,
          completed: tasks.filter(t => t.status === 'Done').length,
          recent: tasks.slice(0, 10),
        },
        sms: {
          total: smsLogs.length,
          sent: smsLogs.filter(s => s.status === 'sent').length,
          failed: smsLogs.filter(s => s.status === 'failed').length,
          recent: smsLogs.slice(0, 10),
        },
        logs: activityLogs.slice(0, 20),
      },
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Prevent self-deletion
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot delete admin accounts (tech_admin, super_admin)
    if (['tech_admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ 
        message: "Cannot delete administrator accounts" 
      });
    }

    // Delete user
    await User.findByIdAndDelete(id);

    // Log the action if ActivityLog model exists
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'delete_user',
        resourceType: 'User',
        resourceId: id,
        metadata: {
          deletedUserName: user.name,
          deletedUserEmail: user.email,
          deletedUserRole: user.role,
          reason: reason || 'No reason provided',
        },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({ 
      message: "User deleted successfully",
      deletedUser: {
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { disabled, reason } = req.body;

    // Prevent self-disabling
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "Cannot disable your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot disable admin accounts
    if (['tech_admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        message: "Cannot disable administrator accounts"
      });
    }

    const updateData = {
      disabled: disabled === true,
    };

    if (disabled) {
      updateData.disabledAt = new Date();
      updateData.disabledBy = req.user._id;
      updateData.disabledReason = reason || 'No reason provided';
    } else {
      // Re-enabling user - clear disabled fields
      updateData.disabledAt = null;
      updateData.disabledBy = null;
      updateData.disabledReason = null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
    .select('-password -twoFAOtp -twoFAOtpExpires')
    .populate('disabledBy', 'name email');

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: disabled ? 'disable_user' : 'enable_user',
        resourceType: 'User',
        resourceId: id,
        metadata: {
          userName: user.name,
          userEmail: user.email,
          reason: reason || 'No reason provided',
        },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({
      message: disabled ? "User disabled successfully" : "User enabled successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== TASK MANAGEMENT =====
export const getAllTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      search,
      createdBy,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (createdBy) filter.createdBy = createdBy;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('createdBy', 'name email phoneNumber')
        .populate('assignees', 'name email phoneNumber')
        .populate('workspace', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getTaskStatistics = async (req, res) => {
  try {
    const [
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      averageCompletionTime,
      recentTasks,
    ] = await Promise.all([
      Task.countDocuments(),
      Task.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        {
          $match: {
            status: 'Done',
            completedAt: { $exists: true },
          }
        },
        {
          $project: {
            completionTime: {
              $subtract: ["$completedAt", "$createdAt"]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$completionTime" }
          }
        }
      ]),
      Task.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('createdBy', 'name')
        .populate('assignees', 'name')
        .select('title status priority createdAt'),
    ]);

    const avgCompletionHours = averageCompletionTime[0]?.avgTime 
      ? (averageCompletionTime[0].avgTime / (1000 * 60 * 60)).toFixed(2)
      : 0;

    res.json({
      total: totalTasks,
      byStatus: tasksByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: tasksByPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      averageCompletionTimeHours: parseFloat(avgCompletionHours),
      recentTasks,
    });
  } catch (error) {
    console.error("Error fetching task statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Task.findByIdAndDelete(id);

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'delete_task',
        resourceType: 'Task',
        resourceId: id,
        metadata: {
          taskTitle: task.title,
          reason: reason || 'No reason provided',
        },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({ 
      message: "Task deleted successfully",
      deletedTask: {
        title: task.title,
        status: task.status,
      }
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== SMS LOGS & ANALYTICS =====
export const getSMSLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    if (search) {
      filter.$or = [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [logs, total] = await Promise.all([
      SMSLog.find(filter)
        .populate('recipient', 'name email phoneNumber')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      SMSLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching SMS logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getSMSLogDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await SMSLog.findById(id)
      .populate('recipient', 'name email phoneNumber role');

    if (!log) {
      return res.status(404).json({ message: "SMS log not found" });
    }

    res.json({ log });
  } catch (error) {
    console.error("Error fetching SMS log details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getSMSStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    const [
      totalSMS,
      byStatus,
      byType,
      recentFailures,
      deliveryStats,
    ] = await Promise.all([
      SMSLog.countDocuments(dateFilter),
      SMSLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 }, totalParts: { $sum: "$parts" } } }
      ]),
      SMSLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]),
      SMSLog.find({ status: 'failed' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('recipient', 'name phoneNumber')
        .select('phoneNumber message errorMessage createdAt type'),
      SMSLog.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
            },
            total: { $sum: 1 },
            sent: {
              $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
            }
          }
        },
        { $sort: { "_id.date": 1 } },
        { $limit: 30 }
      ]),
    ]);

    const sentCount = byStatus.find(s => s._id === 'sent')?.count || 0;
    const deliveryRate = totalSMS > 0 
      ? ((sentCount / totalSMS) * 100).toFixed(2)
      : 0;

    res.json({
      total: totalSMS,
      deliveryRate: parseFloat(deliveryRate),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          parts: item.totalParts,
        };
        return acc;
      }, {}),
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentFailures,
      deliveryTrend: deliveryStats,
    });
  } catch (error) {
    console.error("Error fetching SMS statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== SYSTEM HEALTH =====
export const getSystemHealth = async (req, res) => {
  try {
    const smppService = getSMPPService();
    const smppStatus = smppService.getStatus();

    // Database health check
    let dbHealth = { connected: false, responseTime: 0 };
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbHealth = {
        connected: true,
        responseTime: Date.now() - start,
      };
    } catch (err) {
      console.error("Database health check failed:", err);
    }

    const health = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: Math.floor(process.uptime()),
        uptimeFormatted: formatUptime(process.uptime()),
        version: process.version,
        environment: process.env.NODE_ENV,
        platform: process.platform,
        arch: process.arch,
      },
      resources: {
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || 'Unknown',
          loadAverage: os.loadavg(),
        },
        memory: {
          total: os.totalmem(),
          totalFormatted: formatBytes(os.totalmem()),
          free: os.freemem(),
          freeFormatted: formatBytes(os.freemem()),
          used: os.totalmem() - os.freemem(),
          usedFormatted: formatBytes(os.totalmem() - os.freemem()),
          percentage: parseFloat(((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)),
        },
        process: {
          memory: process.memoryUsage(),
          pid: process.pid,
        },
      },
      database: dbHealth,
      smpp: {
        connected: smppStatus.connected,
        connecting: smppStatus.connecting,
        reconnectAttempts: smppStatus.reconnectAttempts,
        config: {
          host: smppStatus.config?.host,
          port: smppStatus.config?.port,
          systemId: smppStatus.config?.system_id,
        },
      },
    };

    res.json(health);
  } catch (error) {
    console.error("Error fetching system health:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getDatabaseStats = async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    const stats = await Promise.all(
      collections.map(async (collection) => {
        try {
          const collStats = await mongoose.connection.db.collection(collection.name).stats();
          return {
            name: collection.name,
            count: collStats.count,
            size: collStats.size,
            sizeFormatted: formatBytes(collStats.size),
            avgObjSize: collStats.avgObjSize,
            storageSize: collStats.storageSize,
            indexes: collStats.nindexes,
            indexSize: collStats.totalIndexSize,
          };
        } catch (err) {
          return {
            name: collection.name,
            error: 'Could not fetch stats',
          };
        }
      })
    );

    const totalSize = stats.reduce((acc, stat) => acc + (stat.size || 0), 0);
    const totalDocs = stats.reduce((acc, stat) => acc + (stat.count || 0), 0);

    res.json({
      database: mongoose.connection.name,
      collections: stats,
      summary: {
        totalCollections: collections.length,
        totalDocuments: totalDocs,
        totalSize: totalSize,
        totalSizeFormatted: formatBytes(totalSize),
      },
    });
  } catch (error) {
    console.error("Error fetching database stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== SMS ACTIONS =====
export const resendSMS = async (req, res) => {
  try {
    const { id } = req.params;

    const smsLog = await SMSLog.findById(id).populate('recipient', 'name phoneNumber');
    if (!smsLog) {
      return res.status(404).json({ message: "SMS log not found" });
    }

    // Import SMS service
    const { getSMPPService } = await import('../libs/send-sms-bullmq.js');
    const smppService = getSMPPService();

    // Resend the SMS
    await smppService.addToQueue(
      smsLog.phoneNumber,
      smsLog.message,
      smsLog.type || 'general_notification',
      smsLog.recipient?._id,
      { resendFromLogId: id }
    );

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'resend_sms',
        resourceType: 'SMSLog',
        resourceId: id,
        metadata: {
          phoneNumber: smsLog.phoneNumber,
          originalStatus: smsLog.status,
        },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({
      message: "SMS queued for resend",
      originalLog: {
        id: smsLog._id,
        phoneNumber: smsLog.phoneNumber,
        status: smsLog.status,
        type: smsLog.type,
      },
    });
  } catch (error) {
    console.error("Error resending SMS:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== USER PASSWORD RESET =====
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, sendNotification = true } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot reset password for tech_admin/super_admin unless you're tech_admin
    if (['tech_admin', 'super_admin'].includes(user.role) && req.user.role !== 'tech_admin') {
      return res.status(403).json({
        message: "Cannot reset password for administrator accounts"
      });
    }

    // Hash the new password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(newPassword, 10);

    await User.findByIdAndUpdate(id, { password: hashedPassword });

    // Send notification if requested
    if (sendNotification && user.phoneNumber) {
      try {
        const { getSMPPService } = await import('../libs/send-sms-bullmq.js');
        const smppService = getSMPPService();
        await smppService.addToQueue(
          user.phoneNumber,
          `Ваш пароль был сброшен администратором. Новый пароль: ${newPassword}`,
          'password_reset',
          user._id
        );
      } catch (smsErr) {
        console.error("Failed to send password reset SMS:", smsErr);
      }
    }

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'reset_user_password',
        resourceType: 'User',
        resourceId: id,
        metadata: {
          userName: user.name,
          userEmail: user.email,
          notificationSent: sendNotification,
        },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({
      message: "Password reset successfully",
      notificationSent: sendNotification && !!user.phoneNumber,
    });
  } catch (error) {
    console.error("Error resetting user password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== SMPP CONTROL =====
export const reconnectSMPP = async (req, res) => {
  try {
    const smppService = getSMPPService();
    const currentStatus = smppService.getStatus();

    if (currentStatus.connected) {
      return res.json({
        message: "SMPP is already connected",
        status: currentStatus,
      });
    }

    // Attempt reconnect
    await smppService.connect();

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'reconnect_smpp',
        resourceType: 'System',
        metadata: {
          previousStatus: currentStatus,
        },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({
      message: "SMPP reconnection initiated",
      status: smppService.getStatus(),
    });
  } catch (error) {
    console.error("Error reconnecting SMPP:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== EMAIL LOGS =====
export const getEmailLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .populate('recipient', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      EmailLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEmailLogDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await EmailLog.findById(id)
      .populate('recipient', 'name email phoneNumber role');

    if (!log) {
      return res.status(404).json({ message: "Email log not found" });
    }

    res.json({ log });
  } catch (error) {
    console.error("Error fetching email log details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEmailStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    const [
      totalEmails,
      byStatus,
      byType,
      recentFailures,
      deliveryTrend,
    ] = await Promise.all([
      EmailLog.countDocuments(dateFilter),
      EmailLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      EmailLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]),
      EmailLog.find({ status: 'failed' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('recipient', 'name email')
        .select('email subject errorMessage createdAt type'),
      EmailLog.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
            },
            total: { $sum: 1 },
            sent: {
              $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
            }
          }
        },
        { $sort: { "_id.date": 1 } },
        { $limit: 30 }
      ]),
    ]);

    const sentCount = byStatus.find(s => s._id === 'sent')?.count || 0;
    const deliveryRate = totalEmails > 0
      ? ((sentCount / totalEmails) * 100).toFixed(2)
      : 0;

    res.json({
      total: totalEmails,
      deliveryRate: parseFloat(deliveryRate),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentFailures,
      deliveryTrend,
    });
  } catch (error) {
    console.error("Error fetching email statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const resendEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const emailLog = await EmailLog.findById(id).populate('recipient', 'name email');
    if (!emailLog) {
      return res.status(404).json({ message: "Email log not found" });
    }

    // Import email service
    const { sendEmail } = await import('../libs/send-emails.js');

    // Extract button info from metadata
    const buttonText = emailLog.metadata?.buttonText || "View";
    const buttonLink = emailLog.body?.match(/Click here: (.+)/)?.[1] || "#";

    // Resend the email
    const success = await sendEmail(
      emailLog.email,
      emailLog.subject,
      emailLog.metadata?.name || emailLog.recipient?.name || "User",
      emailLog.body?.split('\n\n')[0] || emailLog.subject,
      buttonText,
      buttonLink,
      {
        type: emailLog.type,
        recipientId: emailLog.recipient?._id,
        relatedEntity: emailLog.relatedEntity,
      }
    );

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'resend_email',
        resourceType: 'EmailLog',
        resourceId: id,
        metadata: {
          email: emailLog.email,
          originalStatus: emailLog.status,
          success,
        },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({
      message: success ? "Email resent successfully" : "Failed to resend email",
      success,
      originalLog: {
        id: emailLog._id,
        email: emailLog.email,
        status: emailLog.status,
        type: emailLog.type,
      },
    });
  } catch (error) {
    console.error("Error resending email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== QUEUE MANAGEMENT =====
export const getQueueStats = async (req, res) => {
  try {
    // Get queue reference from the SMS service
    const smppService = getSMPPService();
    const queue = smsQueue;

    if (!queue) {
      return res.json({
        message: "Queue not available",
        stats: null,
      });
    }

    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    res.json({
      data: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
        paused,
      },
      name: queue.name,
    });
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getQueueJobs = async (req, res) => {
  try {
    const {
      status = 'all', // waiting, active, completed, failed, delayed
      page = 1,
      limit = 20,
    } = req.query;

    const queue = smsQueue;

    if (!queue) {
      return res.json({
        jobs: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    }

    let jobs = [];
    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit) - 1;

    switch (status) {
      case 'waiting':
        jobs = await queue.getWaiting(start, end);
        break;
      case 'active':
        jobs = await queue.getActive(start, end);
        break;
      case 'completed':
        jobs = await queue.getCompleted(start, end);
        break;
      case 'failed':
        jobs = await queue.getFailed(start, end);
        break;
      case 'delayed':
        jobs = await queue.getDelayed(start, end);
        break;
      default:
        // Get all jobs
        const [w, a, c, f, d] = await Promise.all([
          queue.getWaiting(0, 100),
          queue.getActive(0, 100),
          queue.getCompleted(0, 100),
          queue.getFailed(0, 100),
          queue.getDelayed(0, 100),
        ]);
        jobs = [...w, ...a, ...f, ...d].slice(start, end + 1);
    }

    // Format jobs for response
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: {
        phoneNumber: job.data?.phoneNumber,
        type: job.data?.type,
        messagePreview: job.data?.message?.substring(0, 50) + '...',
      },
      status: job.finishedOn ? (job.failedReason ? 'failed' : 'completed') :
              job.processedOn ? 'active' :
              job.delay > 0 ? 'delayed' : 'waiting',
      attempts: job.attemptsMade,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    }));

    const counts = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    const totalByStatus = {
      waiting: counts[0],
      active: counts[1],
      completed: counts[2],
      failed: counts[3],
      delayed: counts[4],
    };

    const total = status === 'all'
      ? Object.values(totalByStatus).reduce((a, b) => a + b, 0)
      : totalByStatus[status] || 0;

    res.json({
      jobs: formattedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      countByStatus: totalByStatus,
    });
  } catch (error) {
    console.error("Error fetching queue jobs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const pauseQueue = async (req, res) => {
  try {
    const queue = smsQueue;

    if (!queue) {
      return res.status(400).json({ message: "Queue not available" });
    }

    await queue.pause();

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'pause_queue',
        resourceType: 'System',
        metadata: { queueName: queue.name },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({ message: "Queue paused successfully", isPaused: true });
  } catch (error) {
    console.error("Error pausing queue:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const resumeQueue = async (req, res) => {
  try {
    const queue = smsQueue;

    if (!queue) {
      return res.status(400).json({ message: "Queue not available" });
    }

    await queue.resume();

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'resume_queue',
        resourceType: 'System',
        metadata: { queueName: queue.name },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({ message: "Queue resumed successfully", isPaused: false });
  } catch (error) {
    console.error("Error resuming queue:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const retryJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const queue = smsQueue;

    if (!queue) {
      return res.status(400).json({ message: "Queue not available" });
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await job.retry();

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'retry_job',
        resourceType: 'System',
        metadata: { jobId, queueName: queue.name },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({ message: "Job retried successfully", jobId });
  } catch (error) {
    console.error("Error retrying job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const queue = smsQueue;

    if (!queue) {
      return res.status(400).json({ message: "Queue not available" });
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await job.remove();

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'remove_job',
        resourceType: 'System',
        metadata: { jobId, queueName: queue.name },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({ message: "Job removed successfully", jobId });
  } catch (error) {
    console.error("Error removing job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const cleanQueue = async (req, res) => {
  try {
    const { status = 'completed', olderThan = 3600000 } = req.body; // Default: older than 1 hour
    const queue = smsQueue;

    if (!queue) {
      return res.status(400).json({ message: "Queue not available" });
    }

    let cleaned = 0;

    switch (status) {
      case 'completed':
        cleaned = await queue.clean(parseInt(olderThan), 1000, 'completed');
        break;
      case 'failed':
        cleaned = await queue.clean(parseInt(olderThan), 1000, 'failed');
        break;
      case 'delayed':
        cleaned = await queue.clean(parseInt(olderThan), 1000, 'delayed');
        break;
      default:
        // Clean all
        const [c1, c2, c3] = await Promise.all([
          queue.clean(parseInt(olderThan), 1000, 'completed'),
          queue.clean(parseInt(olderThan), 1000, 'failed'),
          queue.clean(parseInt(olderThan), 1000, 'delayed'),
        ]);
        cleaned = (c1?.length || 0) + (c2?.length || 0) + (c3?.length || 0);
    }

    // Log the action
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'clean_queue',
        resourceType: 'System',
        metadata: { status, olderThan, cleaned: Array.isArray(cleaned) ? cleaned.length : cleaned },
      });
    } catch (err) {
      console.log("ActivityLog model not available for logging");
    }

    res.json({
      message: "Queue cleaned successfully",
      cleaned: Array.isArray(cleaned) ? cleaned.length : cleaned,
    });
  } catch (error) {
    console.error("Error cleaning queue:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== HELPER FUNCTIONS =====
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
}

// ===== AUDIT LOGS =====
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      actor,
      action,
      category,
      status,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await AuditLog.getLogs(
      { actor, action, category, status, dateFrom, dateTo, search },
      { page: parseInt(page), limit: parseInt(limit), sortBy, sortOrder }
    );

    res.json({
      data: result,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAuditLogDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id)
      .populate('actor', 'name email role');

    if (!log) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    res.json({ data: log });
  } catch (error) {
    console.error("Error fetching audit log details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAuditStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const stats = await AuditLog.getStatistics(dateFrom, dateTo);

    res.json({ data: stats });
  } catch (error) {
    console.error("Error fetching audit statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAuditLogsByActor = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await AuditLog.getLogs(
      { actor: userId },
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({ data: result });
  } catch (error) {
    console.error("Error fetching user audit logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== SYSTEM SETTINGS =====
// In-memory settings cache (in production, use Redis or database)
let systemSettings = {
  sms: {
    enabled: true,
    retryAttempts: 3,
    retryDelayMs: 30000,
    dailyLimit: 10000,
  },
  email: {
    enabled: true,
    retryAttempts: 3,
    retryDelayMs: 2000,
  },
  notifications: {
    taskAssignment: true,
    taskCompletion: true,
    taskReminder: true,
    passwordReset: true,
  },
  maintenance: {
    enabled: false,
    message: "System is under maintenance. Please try again later.",
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    sessionTimeoutMinutes: 60,
    requireTwoFactor: false,
  },
};

export const getSystemSettings = async (req, res) => {
  try {
    // Get environment variables that are safe to expose
    const envSettings = {
      environment: process.env.NODE_ENV,
      smtpHost: process.env.SMTP_HOST ? '***configured***' : 'not configured',
      smppHost: process.env.SMPP_HOST ? '***configured***' : 'not configured',
      redisHost: process.env.REDIS_HOST ? '***configured***' : 'not configured',
      mongoUri: process.env.MONGO_URI ? '***configured***' : 'not configured',
    };

    res.json({
      data: {
        settings: systemSettings,
        environment: envSettings,
      },
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    const { category, settings } = req.body;

    if (!category || !settings) {
      return res.status(400).json({ message: "Category and settings are required" });
    }

    if (!systemSettings[category]) {
      return res.status(400).json({ message: `Invalid category: ${category}` });
    }

    // Store previous values for audit log
    const previousValues = { ...systemSettings[category] };

    // Update settings
    systemSettings[category] = {
      ...systemSettings[category],
      ...settings,
    };

    // Log the action
    await logAudit(req, 'system.settings_update', {
      targetType: 'System',
      targetName: category,
      description: `Updated ${category} settings`,
      previousValues,
      newValues: systemSettings[category],
    });

    res.json({
      message: "Settings updated successfully",
      data: { category, settings: systemSettings[category] },
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getSettingsCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!systemSettings[category]) {
      return res.status(404).json({ message: `Category not found: ${category}` });
    }

    res.json({
      data: {
        category,
        settings: systemSettings[category],
      },
    });
  } catch (error) {
    console.error("Error fetching settings category:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleMaintenanceMode = async (req, res) => {
  try {
    const { enabled, message } = req.body;

    const previousValues = { ...systemSettings.maintenance };

    systemSettings.maintenance = {
      enabled: enabled === true,
      message: message || systemSettings.maintenance.message,
    };

    // Log the action
    await logAudit(req, 'system.settings_update', {
      targetType: 'System',
      targetName: 'maintenance',
      description: enabled ? 'Enabled maintenance mode' : 'Disabled maintenance mode',
      previousValues,
      newValues: systemSettings.maintenance,
    });

    res.json({
      message: enabled ? "Maintenance mode enabled" : "Maintenance mode disabled",
      data: systemSettings.maintenance,
    });
  } catch (error) {
    console.error("Error toggling maintenance mode:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
