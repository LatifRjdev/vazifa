import { recordActivity } from "../libs/index.js";
import ActivityLog from "../models/activity-logs.js";
import Project from "../models/projects.js";
import Task from "../models/tasks.js";
import Workspace from "../models/workspace.js";

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    // First check if user has access to this project
    const project = await Project.findById(projectId).populate("members.user");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // check if user is a member of the project
    const isMember = project.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const workspace = await Workspace.findOne({
      _id: project.workspace,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find tasks in the project
    const tasks = await Task.find({
      project: projectId,
      isArchived: { $ne: true },
    })
      .populate("assignees", "name profilePicture")
      .sort({ updatedAt: -1 });

    res.json({ tasks, project });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, startDate, dueDate, status, tags, members } =
      req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    // check if the user is a member of the workspace
    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // convert tags to array if it is a string and remove whitespace and duplicates
    const tagsArray =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : tags;

    const newProject = await Project.create({
      title,
      description,
      workspace: workspaceId,
      createdBy: req.user._id,
      startDate,
      dueDate,
      status,
      tags: tagsArray,
      members,
    });

    // Record activity
    await recordActivity(
      req.user._id,
      "created_project",
      "Project",
      newProject._id,
      { title, createdBy: req.user.name }
    );

    // Update workspace with new project
    workspace.projects.push(newProject._id);
    await workspace.save();

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate(
      "members.user",
      "name email profilePicture"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const workspace = await Workspace.findById(project.workspace).populate(
      "members.user",
      "name email profilePicture"
    );

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // check if user is a member of the workspace
    const isMember = workspace.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ project, workspace });
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, startDate, dueDate, status, tags, members } =
      req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // check if user is a member of the project
    const isMember = project.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // update project
    project.title = title;
    project.description = description;
    project.startDate = startDate;
    project.dueDate = dueDate;
    project.status = status;
    project.tags = tags ? tags.split(",").map((tag) => tag.trim()) : [];
    // project.members = members;

    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // check if user is a member of the project
    const projectManager = project.members.find(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!projectManager || projectManager.role !== "manager") {
      return res.status(403).json({ message: "Access denied" });
    }
    const workspace = await Workspace.findById(project.workspace);

    await Promise.all([
      ActivityLog.deleteMany({ resourceId: projectId }),
      project.deleteOne(),
    ]);

    workspace.projects = workspace.projects.filter(
      (project) => project.toString() !== projectId
    );
    await workspace.save();

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add project members
const addProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { members } = req.body;

    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Permission: must be manager or workspace owner
    const workspace = await Workspace.findById(project.workspace);

    const reqUserId = req.user._id.toString();

    const isManager = project.members.some(
      (m) => m.user.toString() === reqUserId && m.role === "manager"
    );

    const isOwner = workspace.owner.toString() === reqUserId;
    if (!isManager && !isOwner) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Add new members (skip if already present)
    members.forEach((newMember) => {
      if (!project.members.some((m) => m.user.toString() === newMember.user)) {
        project.members.push(newMember);
      }
    });

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    console.error("Error adding project members:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove project member
const removeProjectMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Permission: must be manager or workspace owner
    const workspace = await Workspace.findById(project.workspace);

    const reqUserId = req.user._id.toString();

    const isManager = project.members.some(
      (m) => m.user.toString() === reqUserId && m.role === "manager"
    );
    const isOwner = workspace.owner.toString() === reqUserId;

    if (!isManager && !isOwner) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Remove member
    project.members = project.members.filter(
      (m) => m.user.toString() !== userId
    );
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    console.error("Error removing project member:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const archiveProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const workspace = await Workspace.findById(project.workspace);
    const reqUserId = req.user._id.toString();
    const isManager = project.members.some(
      (m) => m.user.toString() === reqUserId && m.role === "manager"
    );
    const isOwner = workspace.owner.toString() === reqUserId;
    if (!isManager && !isOwner) {
      return res.status(403).json({ message: "Permission denied" });
    }

    project.isArchived = !project.isArchived;
    await project.save();

    res.status(200).json({ isArchived: project.isArchived, project });
  } catch (error) {
    console.error("Error archiving project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  createProject,
  deleteProject,
  getProjectDetails,
  getProjectTasks,
  updateProject,
  addProjectMembers,
  removeProjectMember,
  archiveProject,
};
