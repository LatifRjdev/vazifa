import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_completed",
        "comment_added",
        "mentioned",
        "due_date_approaching",
        "workspace_invite",
        "workspace_ownership_transferred",
        "task_message",
        "response_added",
        "comment_reply",
        "task_assigned_as_manager",
        "task_marked_important",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedData: {
      taskId: {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
      projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
      workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
      },
      commentId: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
      actorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
