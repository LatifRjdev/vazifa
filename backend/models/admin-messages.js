import mongoose from "mongoose";
const { Schema, model } = mongoose;

const adminMessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // null for broadcast messages
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["direct", "broadcast", "system"],
      default: "direct",
    },
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String },
        fileSize: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    originalMessage: {
      type: String,
    },
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "AdminMessage",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    language: {
      type: String,
      enum: ["ru", "tj", "en"],
      default: "ru",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for better query performance
adminMessageSchema.index({ sender: 1, createdAt: -1 });
adminMessageSchema.index({ recipient: 1, createdAt: -1 });
adminMessageSchema.index({ messageType: 1, createdAt: -1 });
adminMessageSchema.index({ isRead: 1, recipient: 1 });

// Virtual for reply count
adminMessageSchema.virtual('replyCount', {
  ref: 'AdminMessage',
  localField: '_id',
  foreignField: 'replyTo',
  count: true
});

const AdminMessage = mongoose.model("AdminMessage", adminMessageSchema);

export default AdminMessage;
