import mongoose from "mongoose";

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    // Who performed the action
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorName: {
      type: String,
      required: true,
    },
    actorEmail: {
      type: String,
    },
    actorRole: {
      type: String,
    },

    // What action was performed
    action: {
      type: String,
      required: true,
      enum: [
        // User management
        "user.create",
        "user.update",
        "user.delete",
        "user.disable",
        "user.enable",
        "user.password_reset",

        // Task management
        "task.delete",

        // SMS management
        "sms.resend",

        // Email management
        "email.resend",

        // Queue management
        "queue.pause",
        "queue.resume",
        "queue.job_retry",
        "queue.job_remove",
        "queue.clean",

        // System management
        "system.smpp_reconnect",
        "system.settings_update",

        // Authentication
        "auth.login",
        "auth.logout",
        "auth.failed_login",
      ],
    },

    // Category for filtering
    category: {
      type: String,
      enum: ["user", "task", "sms", "email", "queue", "system", "auth"],
      required: true,
    },

    // Target of the action (e.g., user ID, task ID)
    targetType: {
      type: String,
      enum: ["User", "Task", "SMSLog", "EmailLog", "Job", "System"],
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    targetName: {
      type: String,
    },

    // Description of the action
    description: {
      type: String,
      required: true,
    },

    // Additional details/changes
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Previous values (for updates)
    previousValues: {
      type: Schema.Types.Mixed,
    },

    // New values (for updates)
    newValues: {
      type: Schema.Types.Mixed,
    },

    // Request metadata
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },

    // Status of the action
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },

    // Error message if failed
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ category: 1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ status: 1 });

// Compound indexes
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

// Static method to log an action
auditLogSchema.statics.log = async function ({
  actor,
  action,
  targetType,
  targetId,
  targetName,
  description,
  details,
  previousValues,
  newValues,
  ipAddress,
  userAgent,
  status = "success",
  errorMessage,
}) {
  // Determine category from action
  const category = action.split(".")[0];

  const logEntry = new this({
    actor: actor._id || actor,
    actorName: actor.name || "Unknown",
    actorEmail: actor.email,
    actorRole: actor.role,
    action,
    category,
    targetType,
    targetId,
    targetName,
    description,
    details,
    previousValues,
    newValues,
    ipAddress,
    userAgent,
    status,
    errorMessage,
  });

  try {
    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error("Failed to create audit log:", error.message);
    return null;
  }
};

// Static method to get logs with filters
auditLogSchema.statics.getLogs = async function (filters = {}, options = {}) {
  const {
    actor,
    action,
    category,
    targetId,
    status,
    dateFrom,
    dateTo,
    search,
  } = filters;

  const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = options;

  const query = {};

  if (actor) query.actor = actor;
  if (action) query.action = action;
  if (category) query.category = category;
  if (targetId) query.targetId = targetId;
  if (status) query.status = status;

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  if (search) {
    query.$or = [
      { description: { $regex: search, $options: "i" } },
      { actorName: { $regex: search, $options: "i" } },
      { actorEmail: { $regex: search, $options: "i" } },
      { targetName: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [logs, total] = await Promise.all([
    this.find(query)
      .populate("actor", "name email role")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

// Static method to get statistics
auditLogSchema.statics.getStatistics = async function (dateFrom, dateTo) {
  const dateQuery = {};
  if (dateFrom) dateQuery.$gte = new Date(dateFrom);
  if (dateTo) dateQuery.$lte = new Date(dateTo);

  const matchStage = Object.keys(dateQuery).length > 0
    ? { createdAt: dateQuery }
    : {};

  const [total, byCategory, byAction, byStatus, recentActivity] = await Promise.all([
    this.countDocuments(matchStage),
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]),
  ]);

  return {
    total,
    byCategory,
    byAction,
    byStatus,
    recentActivity,
  };
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
