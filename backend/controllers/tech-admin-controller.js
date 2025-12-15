import User from "../models/users.js";
import Task from "../models/tasks.js";
import SMSLog from "../models/sms-logs.js";
import ActivityLog from "../models/activity-logs.js";
import Workspace from "../models/workspace.js";
import mongoose from "mongoose";
import os from 'os';
import process from 'process';
import { getSMPPService } from "../libs/send-sms-bullmq.js";

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
      verified,
      authProvider,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};
    
    if (role) filter.role = role;
    if (verified !== undefined) {
      filter.$or = [
        { isEmailVerified: verified === 'true' },
        { isPhoneVerified: verified === 'true' },
      ];
    }
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

    // Note: You'll need to add a 'disabled' field to User model
    // For now, this is a placeholder
    res.json({ 
      message: "Feature coming soon - requires User model update",
      note: "Add 'disabled: Boolean' field to User schema"
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
