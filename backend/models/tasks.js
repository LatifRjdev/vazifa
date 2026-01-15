import mongoose, { Schema } from "mongoose";
import Comment from "./comments.js";
import Response from "./responses.js";
import ActivityLog from "./activity-logs.js";

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Review", "Done", "Cancelled"],
      default: "To Do",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    watchers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    responsibleManager: { type: Schema.Types.ObjectId, ref: "User" },
    isImportant: { type: Boolean, default: false },
    markedImportantBy: { type: Schema.Types.ObjectId, ref: "User" },
    markedImportantAt: { type: Date },
    // startDate: { type: Date },
    dueDate: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    awaitingStatusChange: { type: Boolean, default: false },
    awaitingStatusChangeAt: { type: Date },
    awaitingStatusChangeBy: { type: Schema.Types.ObjectId, ref: "User" },
    estimatedHours: { type: Number, min: 0 },
    actualHours: { type: Number, min: 0 },
    tags: [{ type: String }],
    subtasks: [
      {
        title: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    responses: [{ type: Schema.Types.ObjectId, ref: "Response" }],
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String },
        fileSize: { type: Number },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// middleware to delete all tasks when a project is deleted
taskSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      await Promise.all([
        Comment.deleteMany({ task: this._id }),
        Response.deleteMany({ task: this._id }),
        ActivityLog.deleteMany({ resourceId: this._id }),
      ]);
      next();
    } catch (error) {
      next(error);
    }
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
