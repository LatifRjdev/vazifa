import mongoose from "mongoose";
const { Schema, model } = mongoose;

const smsLogSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Some SMS might be sent to non-users
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      required: false, // Set when SMS is successfully submitted to SMPP
    },
    type: {
      type: String,
      enum: [
        "verification",
        "otp",
        "password_reset",
        "task_notification",
        "workspace_invite",
        "general_notification",
        "test",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["high", "normal", "low"],
      default: "normal",
    },
    status: {
      type: String,
      enum: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "failed",
        "expired",
        "rejected",
      ],
      default: "queued",
    },
    parts: {
      type: Number,
      default: 1, // Number of SMS parts (for long messages)
    },
    errorMessage: {
      type: String,
      required: false,
    },
    queueJobId: {
      type: String,
      required: false, // Bull queue job ID
    },
    sentAt: {
      type: Date,
      required: false,
    },
    deliveredAt: {
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
    // Delivery receipt details
    deliveryReceipt: {
      status: String,
      errorCode: String,
      networkStatus: String,
      receivedAt: Date,
    },
    // Cost tracking (optional)
    estimatedCost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
smsLogSchema.index({ phoneNumber: 1, createdAt: -1 });
smsLogSchema.index({ recipient: 1, createdAt: -1 });
smsLogSchema.index({ status: 1, createdAt: -1 });
smsLogSchema.index({ type: 1, createdAt: -1 });
smsLogSchema.index({ messageId: 1 });

// Static method to create log entry
smsLogSchema.statics.logSMS = async function (data) {
  return await this.create({
    recipient: data.recipient,
    phoneNumber: data.phoneNumber,
    message: data.message,
    messageId: data.messageId,
    type: data.type,
    priority: data.priority || "normal",
    status: data.status || "queued",
    parts: data.parts || 1,
    queueJobId: data.queueJobId,
    relatedEntity: data.relatedEntity,
    estimatedCost: data.estimatedCost || 0,
  });
};

// Update status method
smsLogSchema.methods.updateStatus = async function (status, additionalData = {}) {
  this.status = status;
  
  if (status === "sent" && !this.sentAt) {
    this.sentAt = new Date();
  }
  
  if (status === "delivered" && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  if (additionalData.errorMessage) {
    this.errorMessage = additionalData.errorMessage;
  }
  
  if (additionalData.deliveryReceipt) {
    this.deliveryReceipt = additionalData.deliveryReceipt;
  }
  
  return await this.save();
};

// Static method to get statistics
smsLogSchema.statics.getStats = async function (startDate, endDate) {
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
        totalParts: { $sum: "$parts" },
        totalCost: { $sum: "$estimatedCost" },
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
    totalCost: stats.reduce((sum, s) => sum + s.totalCost, 0),
  };
};

// Static method to find by message ID
smsLogSchema.statics.findByMessageId = async function (messageId) {
  return await this.findOne({ messageId });
};

// Static method to get recent failures
smsLogSchema.statics.getRecentFailures = async function (limit = 10) {
  return await this.find({ status: "failed" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("recipient", "name email phoneNumber");
};

// Static method to get user SMS history
smsLogSchema.statics.getUserSMSHistory = async function (userId, limit = 20) {
  return await this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const SMSLog = model("SMSLog", smsLogSchema);

export default SMSLog;
