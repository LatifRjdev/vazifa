import jwt from "jsonwebtoken";

import Workspace from "../models/workspace.js";
import { createNotification, recordActivity } from "../libs/index.js";
import Project from "../models/projects.js";
import WorkspaceInvite from "../models/workspace-invites.js";
import { sendEmail } from "../libs/send-emails.js";
import Task from "../models/tasks.js";
import User from "../models/users.js";

const getWorkspaces = async (req, res) => {
  try {
    // Find workspaces where user is a member
    const workspaces = await Workspace.find({
      "members.user": req.user._id,
      isArchived: { $ne: true },
    }).sort({ updatedAt: -1 });

    res.json(workspaces);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getWorkspaceDetails = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId).populate(
      "members.user",
      "name email profilePicture"
    );

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace);
  } catch (error) {
    console.error("Error fetching workspace details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getWorkspaceProjects = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Check if user is a member of the workspace
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    }).populate("members.user");

    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Workspace not found or access denied" });
    }

    // Find projects in the workspace
    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: { $ne: true },
      members: { $elemMatch: { user: req.user._id } },
    })
      .populate("tasks", "status")
      .sort({ createdAt: -1 });

    res.json({ projects, workspace });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createWorkspace = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    const newWorkspace = await Workspace.create({
      name,
      description,
      color: color || "#3b82f6",
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
    });

    // Record activity
    await recordActivity(
      req.user._id,
      "created_workspace",
      "Workspace",
      newWorkspace._id,
      { name, createdBy: req.user.name }
    );

    res.status(201).json(newWorkspace);
  } catch (error) {
    console.error("Error creating workspace:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const workspaceInvitation = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    // Find workspace and verify user is admin or owner
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    // Find the current user's membership in the workspace
    const userMembership = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    // Check if the user is a member and has appropriate permissions
    // Only workspace owners and admins can invite new members
    // If user is not a member or doesn't have the right role, return 403 Forbidden
    if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
      (m) => m.user.toString() === existingUser._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Check if user is already invited
    const isInvited = await WorkspaceInvite.findOne({
      user: existingUser._id,
      workspaceId: workspace._id,
    });

    if (isInvited && isInvited.expiresAt > new Date()) {
      return res.status(400).json({ message: "User is already invited" });
    }

    // delete the existing invite has expired
    if (isInvited && isInvited.expiresAt < new Date()) {
      await WorkspaceInvite.deleteOne({ _id: isInvited._id });
    }

    // Generate token for invitation
    const inviteToken = jwt.sign(
      {
        user: existingUser._id,
        workspaceId: workspace._id,
        role: role || "member",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Add to pending invitations

    await WorkspaceInvite.create({
      user: existingUser._id,
      workspaceId: workspace._id,
      token: inviteToken,
      role: role || "member",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const invitationLink = `${process.env.FRONTEND_URL}/workspace-invite/${workspace._id}?tk=${inviteToken}`;

    const emailContent = `
      <p>You have been invited to join ${workspace.name} workspace</p>
      <p>Click here to join: <a href="${invitationLink}">${invitationLink}</a></p>
    `;

    await sendEmail(
      email,
      "You have been invited to join a workspace",
      existingUser.name,
      emailContent,
      "Join Workspace",
      invitationLink
    );

    // Create notification for the invited user
    await createNotification(
      existingUser._id,
      "workspace_invite",
      "You have been invited to join a workspace",
      `${req.user.name} invited you to ${workspace.name}`,
      {
        workspaceId: workspace._id,
        description: `${req.user.name} пригласил вас в ${workspace.name}`,
        actorId: req.user._id,
      }
    );

    // Record activity
    await recordActivity(
      req.user._id,
      "added_member",
      "Workspace",
      workspace._id,
      {
        invitedEmail: email,
        role: role || "member",
        invitedBy: req.user.name,
        description: `${req.user.name} пригласил вас в ${workspace.name}`,
      }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error inviting to workspace:", error);
    res.status(500).json({ message: "Failed to invite member to workspace." });
  }
};

const acceptWorkspaceInviteByToken = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token and get user id and workspace id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if workspace exists
    const workspace = await Workspace.findById(decoded.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
      (m) => m.user.toString() === decoded.user.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Check if invite exists
    const invite = await WorkspaceInvite.findOne({
      user: decoded.user,
      workspaceId: decoded.workspaceId,
      token: token,
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    // Check if invite has expired
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invite has expired" });
    }

    // Add user to workspace
    workspace.members.push({
      user: decoded.user,
      role: invite.role,
      joinedAt: new Date(),
    });

    await workspace.save();

    await Promise.all([
      // Delete invite
      await WorkspaceInvite.deleteOne({ _id: invite._id }),

      // Record activity
      await recordActivity(
        decoded.user,
        "joined_workspace",
        "Workspace",
        workspace._id,
        {
          title: "Joined workspace",
          role: invite.role,
          joinedBy: req.user.name,
        }
      ),
    ]);

    res.status(200).json({ success: true, message: "Invite accepted" });
  } catch (error) {
    console.error("Error accepting workspace invite:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const acceptGeneralWorkspaceInvite = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Add user to workspace
    workspace.members.push({
      user: req.user._id,
      role: "member",
      joinedAt: new Date(),
    });

    await workspace.save();

    // Record activity
    await recordActivity(
      req.user._id,
      "joined_workspace",
      "Workspace",
      workspace._id,
      {
        title: "Joined workspace",
        role: "member",
        joinedBy: req.user.name,
      }
    );

    res.status(200).json({ success: true, message: "Invite accepted" });
  } catch (error) {
    console.error("Error accepting general workspace invite:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getArchivedItemsByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Validate workspaceId
    if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
      return res.status(400).json({ message: "Invalid workspace ID" });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Workspace not found or you are not a member" });
    }

    const [archivedProjects, archivedTasks] = await Promise.all([
      Project.find({
        workspace: workspaceId,
        isArchived: true,
      }),

      Task.find({ isArchived: true }).populate({
        path: "project",
        match: { workspace: workspaceId },
        select: "title",
      }),
    ]);

    const filteredTasks = archivedTasks.filter((task) => task.project !== null);

    res.status(200).json({ archivedProjects, archivedTasks: filteredTasks });
  } catch (error) {
    console.error("Error archiving workspace:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getWorkspaceStats = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Combine workspace check and member validation into a single query
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Workspace not found or you are not a member" });
    }

    // Get projects with tasks in a single query
    const projects = await Project.find({
      workspace: workspaceId,
    })
      .populate(
        "tasks",
        "title status dueDate project updatedAt isArchived priority"
      )
      .sort({ createdAt: -1 });

    const totalProjects = projects.length;
    const tasks = projects.flatMap((project) => project.tasks);

    // Calculate all task counts in a single pass
    const taskCounts = tasks.reduce(
      (acc, task) => {
        acc.total++;
        if (task.status === "Done") acc.completed++;
        if (task.status === "To Do") acc.todo++;
        if (task.status === "In Progress") acc.inProgress++;
        return acc;
      },
      { total: 0, completed: 0, todo: 0, inProgress: 0 }
    );

    // Calculate project counts in a single pass
    const projectCounts = projects.reduce(
      (acc, project) => {
        if (project.status === "In Progress") acc.inProgress++;
        return acc;
      },
      { inProgress: 0 }
    );

    // Get upcoming tasks
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return taskDate > now && taskDate <= sevenDaysFromNow;
    });

    // Initialize data structures
    const taskTrendsData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        completed: 0,
        inProgress: 0,
        todo: 0,
      };
    });

    // Process task trends in a single pass
    tasks.forEach((task) => {
      const taskDate = new Date(task.updatedAt);
      const dayIndex = taskTrendsData.findIndex(
        (day) => new Date(day.name).getDay() === taskDate.getDay()
      );

      if (dayIndex !== -1) {
        const dayData = taskTrendsData[dayIndex];
        switch (task.status) {
          case "Done":
            dayData.completed++;
            break;
          case "In Progress":
            dayData.inProgress++;
            break;
          case "To Do":
            dayData.todo++;
            break;
        }
      }
    });

    // Process project status and priority data in a single pass
    const projectStatusData = [
      { name: "Completed", value: 0, color: "#10b981" },
      { name: "In Progress", value: 0, color: "#3b82f6" },
      { name: "Planning", value: 0, color: "#f59e0b" },
    ];

    const taskPriorityData = [
      { name: "High", value: 0, color: "#ef4444" },
      { name: "Medium", value: 0, color: "#f59e0b" },
      { name: "Low", value: 0, color: "#6b7280" },
    ];

    // Process all data in a single pass
    projects.forEach((project) => {
      // Project status
      switch (project.status) {
        case "Done":
          projectStatusData[0].value++;
          break;
        case "In Progress":
          projectStatusData[1].value++;
          break;
        case "Planning":
          projectStatusData[2].value++;
          break;
      }

      // Task priority
      project.tasks.forEach((task) => {
        switch (task.priority) {
          case "High":
            taskPriorityData[0].value++;
            break;
          case "Medium":
            taskPriorityData[1].value++;
            break;
          case "Low":
            taskPriorityData[2].value++;
            break;
        }
      });
    });

    // Generate productivity data
    const workspaceProductivityData = projects.map((project) => {
      const projectTasks = tasks.filter(
        (task) => task.project.toString() === project._id.toString()
      );
      const completedTasks = projectTasks.filter(
        (task) => task.status === "Done" && !task.isArchived
      );

      return {
        name: project.title,
        completed: completedTasks.length,
        total: projectTasks.length,
      };
    });

    const stats = {
      totalProjects,
      totalTasks: taskCounts.total,
      totalProjectInProgress: projectCounts.inProgress,
      totalTaskCompleted: taskCounts.completed,
      totalTaskToDo: taskCounts.todo,
      totalTaskInProgress: taskCounts.inProgress,
    };

    res.status(200).json({
      stats,
      taskTrendsData,
      projectStatusData,
      taskPriorityData,
      workspaceProductivityData,
      upcomingTasks,
      recentProjects: projects.slice(0, 5),
    });
  } catch (error) {
    console.error("Error fetching workspace stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, color } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this workspace" });
    }

    const updateWorkspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      {
        name,
        description,
        color,
      },
      { new: true }
    );

    res.status(200).json(updateWorkspace);
  } catch (error) {
    console.error("Error updating workspace:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const transferWorkspaceOwnership = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { newOwnerId } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to transfer ownership" });
    }

    workspace.owner = newOwnerId;

    // update the new owner role to admin
    const newOwner = workspace.members.find(
      (member) => member.user.toString() === newOwnerId.toString()
    );
    newOwner.role = "owner";

    // update the old owner role to member
    const oldOwner = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );
    oldOwner.role = "member";

    // update the workspace members
    workspace.members = [newOwner, oldOwner];

    await workspace.save();

    res
      .status(200)
      .json({ message: "Workspace ownership transferred successfully" });

    // Record activity
    await recordActivity(
      req.user._id,
      "transferred_workspace_ownership",
      "Workspace",
      workspaceId,
      {
        title: "Transferred workspace ownership",
        description: `передал владение ${workspace.name} пользователю ${newOwner.user.name}`,
      }
    );

    // create notification
    await createNotification(
      newOwner._id,
      "workspace_ownership_transferred",
      "Workspace ownership transferred",
      `You have been transferred the ownership of ${workspace.name}`
    );
    res
      .status(200)
      .json({ message: "Workspace ownership transferred successfully" });
  } catch (error) {
    console.error("Error transferring workspace ownership:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this workspace" });
    }

    await workspace.deleteOne();

    res.status(200).json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getWorkspaces,
  createWorkspace,
  workspaceInvitation,
  getWorkspaceProjects,
  acceptWorkspaceInviteByToken,
  acceptGeneralWorkspaceInvite,
  getWorkspaceDetails,
  getArchivedItemsByWorkspace,
  getWorkspaceStats,
  updateWorkspace,
  deleteWorkspace,
  transferWorkspaceOwnership,
};
