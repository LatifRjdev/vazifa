import mongoose, { Schema } from "mongoose";
import Project from "./projects.js";

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    color: { type: String, default: "#3b82f6" },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["owner", "admin", "member", "viewer"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// middleware to delete all projects when a workspace is deleted
workspaceSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const projects = await Project.find({ _id: { $in: this.projects } });

      for (const project of projects) {
        await project.deleteOne();
      }
      next();
    } catch (error) {
      next(error);
    }
  }
);

const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;
