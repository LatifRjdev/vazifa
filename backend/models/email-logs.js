import mongoose from "mongoose";
const { Schema, model } = mongoose;

const emailLogSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Some emails might be sent to non-users
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String, // Plain text version
      required: false,
    },
    htmlBody: {
      type: String, // HTML version (truncated for storage)
      required: false,
    },
    type: {
      type: String,
      enum: [
        "verification",
        "password_reset",
        "task_notification",
        "workspace_invite",
        "otp",
        "welcome",
        "general",
      ],
      default: "general",
    },
    status: {
      type: String,
      enum: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "failed",
        "bounced",
        "opened",
        "clicked",
      ],
      default: "queued",
    },
    messageId: {
      type: String, // Email provider message ID
      required: false,
    },
    errorMessage: {
      type: String,
      required: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    sentAt: {
      type: Date,
      required: false,
    },
    deliveredAt: {
      type: Date,
      required: false,
    },
    openedAt: {
      type: Date,
      required: false,
    },
    clickedAt: {
      type: Date,
      required: false,
    },
    // Related entity (if applicable)
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["task", "workspace", "notification", "user"],
        required: false,
      },
      entityId: {
        type: Schema.Types.ObjectId,
        required: false,
      },
    },
    // Tracking metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // SMTP response info
    smtpResponse: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
emailLogSchema.index({ email: 1, createdAt: -1 });
emailLogSchema.index({ recipient: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ type: 1, createdAt: -1 });
emailLogSchema.index({ messageId: 1 });

// Static method to create log entry
emailLogSchema.statics.logEmail = async function (data) {
  return await this.create({
    recipient: data.recipient,
    email: data.email,
    subject: data.subject,
    body: data.body,
    htmlBody: data.htmlBody ? data.htmlBody.substring(0, 10000) : null, // Truncate HTML
    type: data.type || "general",
    status: data.status || "queued",
    messageId: data.messageId,
    relatedEntity: data.relatedEntity,
    metadata: data.metadata || {},
  });
};

// Update status method
emailLogSchema.methods.updateStatus = async function (status, additionalData = {}) {
  this.status = status;
  this.attempts = (this.attempts || 0) + 1;

  if (status === "sent" && !this.sentAt) {
    this.sentAt = new Date();
  }

  if (status === "delivered" && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }

  if (status === "opened" && !this.openedAt) {
    this.openedAt = new Date();
  }

  if (status === "clicked" && !this.clickedAt) {
    this.clickedAt = new Date();
  }

  if (additionalData.errorMessage) {
    this.errorMessage = additionalData.errorMessage;
  }

  if (additionalData.messageId) {
    this.messageId = additionalData.messageId;
  }

  if (additionalData.smtpResponse) {
    this.smtpResponse = additionalData.smtpResponse;
  }

  return await this.save();
};

// Static method to get statistics
emailLogSchema.statics.getStats = async function (startDate, endDate) {
  const match = {};

  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const typeStats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    byStatus: stats,
    byType: typeStats,
    totalSent: stats.reduce((sum, s) => sum + s.count, 0),
  };
};

// Static method to get recent failures
emailLogSchema.statics.getRecentFailures = async function (limit = 10) {
  return await this.find({ status: "failed" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("recipient", "name email");
};

// Static method to get user email history
emailLogSchema.statics.getUserEmailHistory = async function (userId, limit = 20) {
  return await this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const EmailLog = model("EmailLog", emailLogSchema);

export default EmailLog;
