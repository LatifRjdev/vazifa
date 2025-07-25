import mongoose, { Schema } from "mongoose";
import Task from "./tasks.js";

const projectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String, trim: true },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    status: {
      type: String,
      enum: ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"],
      default: "Planning",
    },
    startDate: { type: Date },
    dueDate: { type: Date },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["manager", "contributor", "viewer"],
          default: "contributor",
        },
      },
    ],
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// middleware to delete all tasks when a project is deleted
projectSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const tasks = await Task.find({ project: this._id });

      for (const task of tasks) {
        await task.deleteOne();
      }
      next();
    } catch (error) {
      next(error);
    }
  }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
