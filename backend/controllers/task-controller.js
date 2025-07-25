import { Types } from "mongoose";
import { createNotification, recordActivity } from "../libs/index.js";
import ActivityLog from "../models/activity-logs.js";
import Comment from "../models/comments.js";
import Project from "../models/projects.js";
import Task from "../models/tasks.js";
import User from "../models/users.js";
import Workspace from "../models/workspace.js";

const commentOnTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    // Check if task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project).populate(
      "members.user"
    );

    // Extract mentions from text
    const mentionPattern = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionPattern.exec(text)) !== null) {
      const mentionName = match[1];
      // Find user by name
      // const mentionedUser = await User.findOne({
      //   $or: [{ name: new RegExp(mentionName, "i") }],
      // });
      const mentionedUser = project.members.find(
        (member) => member.user.name.toLowerCase() === mentionName.toLowerCase()
      );

      if (mentionedUser) {
        mentions.push({
          user: mentionedUser._id,
          offset: match.index,
          length: match[0].length,
        });
      }
    }

    // Create comment
    const newComment = await Comment.create({
      text,
      task: taskId,
      author: req.user._id,
      mentions,
    });

    // Add comment to task
    task.comments.push(newComment._id);
    await task.save();

    // Notify task assignees and mentioned users
    const uniqueRecipients = new Set();

    // Add assignees
    task.assignees.forEach((userId) => {
      if (userId.toString() !== req.user._id.toString()) {
        uniqueRecipients.add(userId.toString());
      }
    });

    // Add mentioned users
    mentions.forEach((mention) => {
      if (mention.user.toString() !== req.user._id.toString()) {
        uniqueRecipients.add(mention.user.toString());
      }
    });

    // Create notifications
    for (const userId of uniqueRecipients) {
      const notificationType = mentions.some(
        (m) => m.user.toString() === userId
      )
        ? "mentioned"
        : "comment_added";

      const notificationTitle =
        notificationType === "mentioned"
          ? "You were mentioned in a comment"
          : "New comment on your task";

      await createNotification(
        userId,
        notificationType,
        notificationTitle,
        `${req.user.name} ${
          notificationType === "mentioned"
            ? "mentioned you in a comment"
            : "commented on your task"
        }`,
        {
          taskId,
          commentId: newComment._id,
          actorId: req.user._id,
        }
      );
    }

    // Record activity
    await recordActivity(req.user._id, "added_comment", "Comment", taskId, {
      taskId,
      newCommentId: newComment._id,
      description: `added a comment:${
        text.substring(0, 50) + (text.length > 50 ? "..." : "")
      }`,
    });

    // Populate author details for response
    const populatedComment = await Comment.findById(newComment._id).populate(
      "author",
      "name profilePicture"
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const taskWatchers = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user is already watching
    const isWatching = task.watchers.includes(req.user._id);

    if (isWatching) {
      // Remove user from watchers
      task.watchers = task.watchers.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      // Add user to watchers
      task.watchers.push(req.user._id);
    }

    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `${
        !isWatching ? "started watching" : "stopped watching"
      } task ${task.title}`,
      user: req.user._id,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating watch status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const taskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { fileName, fileUrl, fileType, fileSize } = req.body;

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const attachment = {
      fileName,
      fileUrl,
      fileType,
      fileSize,
      uploadedBy: req.user._id,
    };

    task.attachments.push(attachment);
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "added_attachment", "Task", taskId, {
      description: `added attachment: ${fileName}`,
      fileName,
      fileType,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Error adding attachment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, assignees, dueDate } =
      req.body;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const workspace = await Workspace.findOne({
      _id: project.workspace,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create task
    const newTask = await Task.create({
      title,
      description,
      project: projectId,
      status: status || "To Do",
      priority: priority || "Medium",
      assignees: assignees || [],
      dueDate,
      createdBy: req.user._id,
    });

    // Add task to project
    project.tasks.push(newTask._id);
    await project.save();

    // Notify assigned users
    if (assignees && assignees.length > 0) {
      for (const userId of assignees) {
        // Don't notify the creator if they assigned themselves
        if (userId.toString() !== req.user._id.toString()) {
          await createNotification(
            userId,
            "task_assigned",
            "New task assigned to you",
            `${req.user.name} assigned you a task: ${title}`,
            {
              taskId: newTask._id,
              projectId,
              workspaceId: project.workspace,
              actorId: req.user._id,
            }
          );
        }
      }
    }

    // Record activity
    await recordActivity(req.user._id, "created_task", "Task", newTask._id, {
      title,
      description: `created task ${title}`,
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const oldStatus = task.status;

    task.status = status;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `changed status from ${oldStatus} to ${status}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("watchers", "name profilePicture")
      .populate("assignees", "name profilePicture");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project).populate(
      "members.user",
      "name profilePicture"
    );

    const comments = await Comment.find({ task: taskId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 });

    res.json({ task, project });
  } catch (error) {
    console.error("Error getting task by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const archiveTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const oldStatus = task.isArchived;

    task.isArchived = !task.isArchived;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `changed isAchieve from ${oldStatus} to ${task.isArchived}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error archiving task:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const updateTaskPriority = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { priority } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }
    const oldPriority = task.priority;
    task.priority = priority;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task priority from ${oldPriority} to ${priority}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task priority:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }
    const oldTitle = task.title;

    task.title = title;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task title from ${oldTitle} to ${title}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task title:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTaskDescription = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }
    const oldDescription =
      task.description.substring(0, 50) +
      (task.description.length > 50 ? "..." : "");

    const newDescription =
      description.substring(0, 50) + (description.length > 50 ? "..." : "");

    task.description = description;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task description from ${oldDescription} to ${newDescription}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task title:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTaskAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignees } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    const isMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember || !["admin", "manager"].includes(isMember.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const oldAssignees = task.assignees;

    task.assignees = assignees;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task assignees from ${oldAssignees.length} to ${assignees.length}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task assignees:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createSubTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const newSubTask = {
      title,
      completed: false,
    };

    task.subtasks.push(newSubTask);
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "created_subtask", "Task", taskId, {
      description: `created subtask ${title}`,
    });

    res.status(201).json({ newSubTask, _id: task._id });
  } catch (error) {
    console.error("Error creating sub task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateSubTask = async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;
    const { completed } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const subtask = task.subtasks.find(
      (subtask) => subtask._id.toString() === subtaskId
    );

    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    subtask.completed = completed;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_subtask", "Task", taskId, {
      description: `updated subtask ${subtask.title}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating subtask:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error("Error getting task by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getActivitiesByResourceId = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // const endIndex = page * limit;

    const total = await ActivityLog.countDocuments({ resourceId });

    const activities = await ActivityLog.find({ resourceId })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 })
      // .skip(startIndex)
      .limit(limit * page);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    };

    res.json({ activities, pagination });
  } catch (error) {
    console.error("Error getting activities by resource ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleCommentReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const existingReaction = comment.reactions.find(
      (reaction) => reaction.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        comment.reactions = comment.reactions.filter(
          (reaction) => reaction.user.toString() !== req.user._id.toString()
        );
      } else {
        existingReaction.emoji = emoji;
      }
    } else {
      comment.reactions.push({ user: req.user._id, emoji });
    }

    await comment.save();

    res.status(200).json(comment);
  } catch (error) {
    console.error("Error toggling comment reaction:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMyTasks = async (req, res) => {
  try {
    // assignees: { $in: [Types.ObjectId.createFromHexString(req.user._id)] },
    const tasks = await Task.find({
      assignees: { $in: [req.user._id] },
    })
      .sort({ dueDate: -1 })
      .populate("project", "title workspace");

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error getting my tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    const projectManager = project.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!projectManager || projectManager.role !== "manager") {
      return res.status(403).json({ message: "Access denied" });
    }

    await task.deleteOne();

    project.tasks = project.tasks.filter((task) => task.toString() !== taskId);
    await project.save();

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  archiveTask,
  commentOnTask,
  createSubTask,
  createTask,
  getActivitiesByResourceId,
  getCommentsByTaskId,
  getTaskById,
  taskAttachments,
  taskWatchers,
  updateSubTask,
  updateTaskAssignees,
  updateTaskDescription,
  updateTaskPriority,
  updateTaskStatus,
  updateTaskTitle,
  toggleCommentReaction,
  getMyTasks,
  deleteTask,
};
