import { Types } from "mongoose";
import { recordActivity } from "../libs/index.js";
import { sendNotification, createNotification } from "../libs/send-notification.js";
import { sendEmail } from "../libs/send-emails.js";
import ActivityLog from "../models/activity-logs.js";
import Comment from "../models/comments.js";
import Response from "../models/responses.js";
import Task from "../models/tasks.js";
import User from "../models/users.js";

const commentOnTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text, content, attachments } = req.body;
    
    // Support both 'text' and 'content' field names
    const commentText = text || content;
    
    if ((!commentText || !commentText.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Comment text or attachments are required" });
    }

    // Check if task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Extract mentions from text
    const mentionPattern = /@(\w+)/g;
    const mentions = [];
    if (commentText) {
      let match;
      while ((match = mentionPattern.exec(commentText)) !== null) {
        const mentionName = match[1];
        // Find user by name
        const mentionedUser = await User.findOne({
          name: new RegExp(mentionName, "i")
        });

        if (mentionedUser) {
          mentions.push({
            user: mentionedUser._id,
            offset: match.index,
            length: match[0].length,
          });
        }
      }
    }

    // Create comment
    const newComment = await Comment.create({
      text: commentText || "",
      task: taskId,
      author: req.user._id,
      mentions,
      attachments: attachments || [],
    });

    // Add comment to task
    task.comments.push(newComment._id);
    await task.save();

    // Notify task assignees, responsible manager, and mentioned users
    const uniqueRecipients = new Set();

    // Add assignees
    task.assignees.forEach((userId) => {
      if (userId.toString() !== req.user._id.toString()) {
        uniqueRecipients.add(userId.toString());
      }
    });

    // Add responsible manager
    if (task.responsibleManager && task.responsibleManager.toString() !== req.user._id.toString()) {
      uniqueRecipients.add(task.responsibleManager.toString());
    }

    // Add mentioned users
    mentions.forEach((mention) => {
      if (mention.user.toString() !== req.user._id.toString()) {
        uniqueRecipients.add(mention.user.toString());
      }
    });

    // Create notifications and send emails + SMS
    for (const userId of uniqueRecipients) {
      const notificationType = mentions.some(
        (m) => m.user.toString() === userId
      )
        ? "mentioned"
        : "task_message";

      const notificationTitle =
        notificationType === "mentioned"
          ? "Вас упомянули в комментарии"
          : "Новый комментарий в задаче";

      const notificationMessage = `${req.user.name} ${
        notificationType === "mentioned"
          ? `упомянул вас в комментарии к задаче "${task.title}"`
          : `добавил комментарий к задаче "${task.title}"`
      }`;

      await sendNotification({
        recipientId: userId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        relatedData: {
          taskId,
          commentId: newComment._id,
          actorId: req.user._id,
        },
      });
    }

    // Record activity
    await recordActivity(req.user._id, "added_comment", "Comment", taskId, {
      taskId,
      newCommentId: newComment._id,
      description: `добавил комментарий: ${
        commentText.substring(0, 50) + (commentText.length > 50 ? "..." : "")
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
        !isWatching ? "начал проверять" : "закончил проверку"
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
      description: `добавил вложение: ${fileName}`,
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
    const { title, description, status, priority, assignees, dueDate, responsibleManager } = req.body;

    console.log('Создание задачи - пользователь:', req.user);

    // Проверить права доступа (только админы, супер админы и менеджеры могут создавать задачи)
    if (!["admin", "super_admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут создавать задачи." });
    }

    // Если указан ответственный менеджер, проверить что это действительно менеджер, админ или супер админ
    if (responsibleManager) {
      const manager = await User.findById(responsibleManager);
      if (!manager || !["admin", "super_admin", "manager"].includes(manager.role)) {
        return res.status(400).json({ message: "Ответственным может быть только менеджер, админ или супер админ." });
      }
    }

    // Создать задачу без организации
    const newTask = await Task.create({
      title,
      description,
      status: status || "To Do",
      priority: priority || "Medium",
      assignees: assignees || [],
      dueDate,
      responsibleManager,
      createdBy: req.user._id,
      createdAt: new Date(),
    });

    // Populate данные для ответа
    await newTask.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'assignees', select: 'name email' },
      { path: 'responsibleManager', select: 'name email' }
    ]);

    // Уведомить назначенных пользователей (Email + SMS)
    if (assignees && assignees.length > 0) {
      for (const userId of assignees) {
        // Не уведомлять создателя, если он назначил себя
        if (userId.toString() !== req.user._id.toString()) {
          await sendNotification({
            recipientId: userId,
            type: "task_assigned",
            title: "Вам назначена новая задача",
            message: `${req.user.name} назначил вам задачу: ${title}`,
            relatedData: {
              taskId: newTask._id,
              actorId: req.user._id,
            },
          });
        }
      }
    }

    // Уведомить ответственного менеджера (Email + SMS)
    if (responsibleManager && responsibleManager.toString() !== req.user._id.toString()) {
      await sendNotification({
        recipientId: responsibleManager,
        type: "task_assigned_as_manager",
        title: "Вы назначены ответственным менеджером",
        message: `${req.user.name} назначил вас ответственным менеджером задачи: ${title}`,
        relatedData: {
          taskId: newTask._id,
          actorId: req.user._id,
        },
      });
    }

    // Записать активность
    await recordActivity(req.user._id, "created_task", "Task", newTask._id, {
      title,
      description: `создал задачу ${title}`,
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Ошибка создания задачи:", error);
    res.status(500).json({ message: "Ошибка сервера" });
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

    // Проверить права доступа:
    // - админы и супер админы могут изменять любые задачи
    // - chief_manager может изменять статус ЛЮБОЙ задачи
    // - обычный менеджер может изменять только задачи где он ответственный
    const isAdmin = ["admin", "super_admin"].includes(req.user.role);
    const isChiefManager = req.user.role === "chief_manager";
    const isResponsibleManager = task.responsibleManager && task.responsibleManager.toString() === req.user._id.toString();

    if (!isAdmin && !isChiefManager && !isResponsibleManager) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, главные менеджеры или ответственный менеджер могут изменять статус задач." });
    }

    const oldStatus = task.status;

    task.status = status;
    
    // Если статус изменился на "Done", установить completedAt
    if (status === "Done" && oldStatus !== "Done") {
      task.completedAt = new Date();
    } else if (status !== "Done" && oldStatus === "Done") {
      task.completedAt = null;
    }
    
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `изменил статус с ${oldStatus} на ${status}`,
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
      .populate("assignees", "name profilePicture")
      .populate("createdBy", "name profilePicture")
      .populate("responsibleManager", "name profilePicture");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Record task view activity (don't await to not slow down response)
    ActivityLog.create({
      user: req.user._id,
      action: "viewed_task",
      resourceType: "Task",
      resourceId: taskId,
      details: {
        taskTitle: task.title,
      },
    }).catch(err => console.error("Error recording task view:", err));

    const comments = await Comment.find({ task: taskId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 });

    res.json({ task, comments });
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

    // Проверить права доступа (только админы, супер админы и менеджеры могут архивировать задачи)
    if (!["admin", "super_admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут архивировать задачи." });
    }

    const oldStatus = task.isArchived;

    task.isArchived = !task.isArchived;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `${task.isArchived ? "архивировал" : "разархивировал"} задачу`,
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

    const oldPriority = task.priority;
    task.priority = priority;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `изменил приоритет задачи с ${oldPriority} на ${priority}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task priority:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Обновление срока выполнения задачи (только для админов и менеджеров)
const updateTaskDueDate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { dueDate } = req.body;

    // Проверить права доступа (только админы, супер админы, главные менеджеры и менеджеры)
    if (!["admin", "super_admin", "chief_manager", "manager"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Доступ запрещен. Только админы и менеджеры могут изменять срок выполнения задач."
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldDueDate = task.dueDate;
    task.dueDate = new Date(dueDate);
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "changed_task_deadline", "Task", taskId, {
      description: `изменил срок выполнения задачи`,
      oldDueDate: oldDueDate,
      newDueDate: dueDate,
    });

    res.status(200).json({
      message: "Срок выполнения успешно изменён",
      task,
    });
  } catch (error) {
    console.error("Error updating task due date:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    // Проверить права доступа (только админы, супер админы и менеджеры могут редактировать название задачи)
    if (!["admin", "super_admin", "chief_manager", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут редактировать название задачи." });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldTitle = task.title;

    task.title = title;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `изменил название задачи с "${oldTitle}" на "${title}"`,
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

    // Проверить права доступа (только админы, супер админы и менеджеры могут редактировать описание задачи)
    if (!["admin", "super_admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут редактировать описание задачи." });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldDescription =
      task.description ? task.description.substring(0, 50) +
      (task.description.length > 50 ? "..." : "") : "";

    const newDescription =
      description.substring(0, 50) + (description.length > 50 ? "..." : "");

    task.description = description;
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `изменил описание задачи с "${oldDescription}" на "${newDescription}"`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task description:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTaskAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignees } = req.body;

    console.log('=== UPDATE ASSIGNEES BACKEND ===');
    console.log('Task ID:', taskId);
    console.log('New assignees:', assignees);
    console.log('User role:', req.user.role);

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Проверить права доступа (только админы, супер админы и менеджеры могут изменять исполнителей)
    if (!["admin", "super_admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут изменять исполнителей задач." });
    }

    const oldAssignees = task.assignees;

    task.assignees = assignees;
    await task.save();

    // Populate the updated task with assignee details
    const updatedTask = await Task.findById(taskId)
      .populate("watchers", "name profilePicture")
      .populate("assignees", "name profilePicture")
      .populate("createdBy", "name profilePicture");

    console.log('Updated task assignees:', updatedTask.assignees);

    // Determine newly added assignees
    const newAssignees = assignees.filter(
      id => !oldAssignees.some(oldId => oldId.toString() === id.toString())
    );

    // Notify newly added assignees
    if (newAssignees.length > 0) {
      console.log(`Notifying ${newAssignees.length} newly added assignees...`);
      for (const userId of newAssignees) {
        if (userId.toString() !== req.user._id.toString()) {
          try {
            await sendNotification({
              recipientId: userId,
              type: "task_assigned",
              title: "Вы добавлены к задаче",
              message: `${req.user.name} добавил вас к задаче: ${task.title}`,
              relatedData: {
                taskId: task._id,
                actorId: req.user._id,
              },
            });
            console.log(`✅ Notification sent to new assignee: ${userId}`);
          } catch (error) {
            console.error(`❌ Failed to notify assignee ${userId}:`, error.message);
          }
        }
      }
    }

    // Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `изменил исполнителей задачи с ${oldAssignees.length} на ${assignees.length}`,
    });

    res.status(200).json(updatedTask);
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

    const newSubTask = {
      title,
      completed: false,
    };

    task.subtasks.push(newSubTask);
    await task.save();

    // Record activity
    await recordActivity(req.user._id, "created_subtask", "Task", taskId, {
      description: `создал подзадачу "${title}"`,
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
      description: `обновил подзадачу "${subtask.title}"`,
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
    const tasks = await Task.find({
      assignees: { $in: [req.user._id] },
      isArchived: false,
    })
      .sort({ dueDate: -1 })
      .populate("assignees", "name profilePicture")
      .populate("createdBy", "name profilePicture");

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Ошибка получения моих задач:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Получить все задачи (только для админов, супер админов и менеджеров)
const getAllTasks = async (req, res) => {
  try {
    // Проверить права доступа
    if (!["admin", "manager", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут просматривать все задачи." });
    }

    const { search, status, priority, assignee } = req.query;
    
    // Построить фильтр
    const filter = { isArchived: false };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (assignee) {
      filter.assignees = { $in: [assignee] };
    }

    // Получить все задачи БЕЗ пагинации (откатил мои изменения)
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .populate("assignees", "name profilePicture")
      .populate("createdBy", "name profilePicture")
      .populate("responsibleManager", "name profilePicture");

    const total = tasks.length;

    res.json({
      tasks,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: total,
        hasNext: false,
        hasPrev: false
      }
    });
  } catch (error) {
    console.error("Ошибка получения всех задач:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Получить аналитику задач (только для админов, супер админов и менеджеров)
const getTasksAnalytics = async (req, res) => {
  try {
    // Проверить права доступа
    if (!["admin", "manager", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут просматривать аналитику." });
    }

    // Статистика по статусам
    const statusStats = await Task.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Статистика по приоритетам
    const priorityStats = await Task.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Общая статистика
    const totalTasks = await Task.countDocuments({ isArchived: false });
    const completedTasks = await Task.countDocuments({ status: "Done", isArchived: false });
    const overdueTasks = await Task.countDocuments({ 
      dueDate: { $lt: new Date() }, 
      status: { $ne: "Done" },
      isArchived: false 
    });

    // Статистика по участникам (топ 10)
    const memberStats = await Task.aggregate([
      { $match: { isArchived: false } },
      { $unwind: "$assignees" },
      { $group: { _id: "$assignees", taskCount: { $sum: 1 } } },
      { $sort: { taskCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          taskCount: 1,
          name: "$user.name",
          profilePicture: "$user.profilePicture"
        }
      }
    ]);

    res.json({
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      statusStats: statusStats.map(stat => ({
        status: stat._id,
        count: stat.count,
        label: stat._id === "To Do" ? "К выполнению" : 
               stat._id === "In Progress" ? "В процессе" :
               stat._id === "Review" ? "На проверке" : "Выполнено"
      })),
      priorityStats: priorityStats.map(stat => ({
        priority: stat._id,
        count: stat.count,
        label: stat._id === "Low" ? "Низкий" :
               stat._id === "Medium" ? "Средний" : "Высокий"
      })),
      memberStats
    });
  } catch (error) {
    console.error("Ошибка получения аналитики:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Получить архивированные задачи
const getArchivedTasks = async (req, res) => {
  try {
    // Проверить права доступа
    if (!["admin", "super_admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут просматривать архивированные задачи." });
    }

    const archivedTasks = await Task.find({ isArchived: true })
      .sort({ updatedAt: -1 })
      .populate("assignees", "name profilePicture")
      .populate("createdBy", "name profilePicture");

    res.json({ archivedTasks });
  } catch (error) {
    console.error("Ошибка получения архивированных задач:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;

    // Причина удаления обязательна
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: "Причина удаления обязательна",
        code: "REASON_REQUIRED"
      });
    }

    const task = await Task.findById(taskId)
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Проверить права доступа:
    // - Только создатель задачи может удалить её в течение 24 часов после создания
    const isCreator = task.createdBy && task.createdBy._id.toString() === req.user._id.toString();

    if (!isCreator) {
      return res.status(403).json({
        message: "Доступ запрещен. Только создатель задачи может её удалить."
      });
    }

    // Вычислить время с момента создания (в часах)
    const hoursSinceCreation = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      const hoursAgo = Math.floor(hoursSinceCreation);
      return res.status(403).json({
        message: `Время для удаления задачи истекло. Задача была создана ${hoursAgo} часов назад. Создатель может удалить задачу только в течение 24 часов.`,
        code: "DELETE_TIME_EXPIRED",
        hoursSinceCreation: hoursAgo,
      });
    }

    // Собрать информацию о задаче для аудита
    const assigneeNames = task.assignees?.map(a => a.name).join(', ') || 'Не назначены';
    const creatorName = task.createdBy?.name || 'Неизвестно';

    // Record detailed activity with reason and full task info
    await recordActivity(req.user._id, "deleted_task", "Task", taskId, {
      description: `удалил задачу "${task.title}"`,
      taskTitle: task.title,
      taskDescription: task.description,
      taskStatus: task.status,
      taskPriority: task.priority,
      assignees: assigneeNames,
      creator: creatorName,
      dueDate: task.dueDate,
      deletionReason: reason.trim(),
      deletedAt: new Date().toISOString(),
    });

    await task.deleteOne();

    console.log(`🗑️ Task deleted: "${task.title}" by ${req.user.name}. Reason: ${reason}`);

    res.status(200).json({ message: "Задача успешно удалена" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Создать ответ на задачу (только для участников, которым назначена задача)
const createResponse = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text, attachments } = req.body;
    
    if ((!text || !text.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Response text or attachments are required" });
    }

    // Проверить, что задача существует
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Проверить, что пользователь назначен на эту задачу или является админом/супер админом/менеджером
    const isAssigned = task.assignees.some(assignee => assignee.toString() === req.user._id.toString());
    const isAdminOrManager = ["admin", "super_admin", "manager"].includes(req.user.role);
    
    if (!isAssigned && !isAdminOrManager) {
      return res.status(403).json({ message: "Доступ запрещен. Только участники, назначенные на задачу, или админы/супер админы/менеджеры могут отвечать." });
    }

    // Создать ответ
    const newResponse = await Response.create({
      text: text || "",
      task: taskId,
      author: req.user._id,
      attachments: attachments || [],
    });

    // Добавить ответ к задаче
    task.responses.push(newResponse._id);
    await task.save();

    // Уведомить только менеджеров (не создателя задачи)
    const uniqueRecipients = new Set();

    // Добавить всех админов, супер админов и менеджеров
    const adminsAndManagers = await User.find({ role: { $in: ["admin", "super_admin", "manager"] } });
    adminsAndManagers.forEach(user => {
      if (user._id.toString() !== req.user._id.toString()) {
        uniqueRecipients.add(user._id.toString());
      }
    });

    // Создать уведомления и отправить email
    for (const userId of uniqueRecipients) {
      await createNotification(
        userId,
        "response_added",
        "Новый ответ на задачу",
        `${req.user.name} ответил на задачу: ${task.title}`,
        {
          taskId,
          responseId: newResponse._id,
          actorId: req.user._id,
        }
      );
      
      // Отправить email уведомление менеджеру
      const recipient = await User.findById(userId);
      if (recipient && recipient.email) {
        await sendEmail(
          recipient.email,
          "Новый ответ на задачу",
          recipient.name,
          `${req.user.name} ответил на задачу "${task.title}": ${text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : 'Добавил файлы'}`,
          "Открыть задачу",
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/task/${taskId}`
        );
      }
    }

    // Записать активность
    await recordActivity(req.user._id, "added_response", "Response", taskId, {
      taskId,
      newResponseId: newResponse._id,
      description: `добавил ответ: ${
        text ? text.substring(0, 50) + (text.length > 50 ? "..." : "") : "прикрепил файлы"
      }`,
    });

    // Заполнить данные автора для ответа
    const populatedResponse = await Response.findById(newResponse._id).populate(
      "author",
      "name profilePicture"
    );

    res.status(201).json(populatedResponse);
  } catch (error) {
    console.error("Error creating response:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Получить ответы по ID задачи
const getResponsesByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    const responses = await Response.find({ task: taskId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 });

    res.json(responses);
  } catch (error) {
    console.error("Error getting responses by task ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Ответить на комментарий (только участники могут отвечать на комментарии админов/менеджеров)
const replyToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text, attachments } = req.body;
    
    if ((!text || !text.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Reply text or attachments are required" });
    }

    // Найти родительский комментарий
    const parentComment = await Comment.findById(commentId).populate('task');
    if (!parentComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const task = parentComment.task;

    // Проверить, что пользователь может отвечать на этот комментарий
    const parentAuthor = await User.findById(parentComment.author);
    const isParentFromAdminOrManager = ["admin", "manager"].includes(parentAuthor.role);
    const isUserAssigned = task.assignees.some(assignee => assignee.toString() === req.user._id.toString());

    if (!isParentFromAdminOrManager || !isUserAssigned) {
      return res.status(403).json({ message: "Доступ запрещен. Участники могут отвечать только на комментарии админов и менеджеров." });
    }

    // Создать ответ на комментарий
    const newReply = await Comment.create({
      text: text || "",
      task: task._id,
      author: req.user._id,
      parentComment: commentId,
      attachments: attachments || [],
    });

    // Добавить комментарий к задаче
    task.comments.push(newReply._id);
    await task.save();

    // Уведомить автора родительского комментария
    if (parentComment.author.toString() !== req.user._id.toString()) {
      await createNotification(
        parentComment.author,
        "comment_reply",
        "Ответ на ваш комментарий",
        `${req.user.name} ответил на ваш комментарий`,
        {
          taskId: task._id,
          commentId: newReply._id,
          parentCommentId: commentId,
          actorId: req.user._id,
        }
      );
    }

    // Записать активность
    await recordActivity(req.user._id, "replied_comment", "Comment", task._id, {
      taskId: task._id,
      newCommentId: newReply._id,
      parentCommentId: commentId,
      description: `ответил на комментарий: ${
        text ? text.substring(0, 50) + (text.length > 50 ? "..." : "") : "прикрепил файлы"
      }`,
    });

    // Заполнить данные автора для ответа
    const populatedReply = await Comment.findById(newReply._id).populate(
      "author",
      "name profilePicture"
    );

    res.status(201).json(populatedReply);
  } catch (error) {
    console.error("Error replying to comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Получить выполненные задачи с дополнительной информацией
const getCompletedTasks = async (req, res) => {
  try {
    // Проверить права доступа
    if (!["admin", "super_admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут просматривать выполненные задачи." });
    }

    const { 
      search, 
      assignee, 
      priority, 
      dateFrom, 
      dateTo, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Построить фильтр
    const filter = { 
      status: "Done",
      isArchived: false 
    };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (assignee) {
      filter.assignees = { $in: [assignee] };
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    // Упрощенный фильтр по дате завершения
    if (dateFrom || dateTo) {
      const dateFilter = {};
      
      if (dateFrom) {
        dateFilter.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.$lte = new Date(dateTo);
      }
      
      // Используем updatedAt для фильтрации, так как это более надежно
      filter.updatedAt = dateFilter;
    }

    // Получить выполненные задачи с пагинацией
    const completedTasks = await Task.find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("assignees", "name profilePicture")
      .populate("createdBy", "name profilePicture");

    const total = await Task.countDocuments(filter);

    // Добавить информацию о том, выполнена ли задача в срок
    const tasksWithDeadlineInfo = completedTasks.map(task => {
      const taskObj = task.toObject();
      const completionDate = task.completedAt || task.updatedAt;
      
      if (task.dueDate && completionDate) {
        taskObj.completedOnTime = new Date(completionDate) <= new Date(task.dueDate);
      } else {
        taskObj.completedOnTime = null; // Нет срока выполнения
      }
      
      // Убеждаемся, что completedAt установлен
      if (!taskObj.completedAt && taskObj.status === "Done") {
        taskObj.completedAt = taskObj.updatedAt;
      }
      
      return taskObj;
    });

    res.json({
      completedTasks: tasksWithDeadlineInfo,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Ошибка получения выполненных задач:", error);
    res.status(500).json({ message: "Ошибка сервера", details: error.message });
  }
};

// Отметить задачу как важную (только для админов и супер админов)
const markTaskAsImportant = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Проверить права доступа (только админы и супер админы могут отмечать задачи как важные)
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы и супер админы могут отмечать задачи как важные." });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const wasImportant = task.isImportant;
    task.isImportant = !task.isImportant;
    
    if (task.isImportant) {
      task.markedImportantBy = req.user._id;
      task.markedImportantAt = new Date();
    } else {
      task.markedImportantBy = null;
      task.markedImportantAt = null;
    }

    await task.save();

    // Уведомить супер админов при отметке как важная
    if (task.isImportant && !wasImportant) {
      const superAdmins = await User.find({ role: "super_admin" });
      for (const superAdmin of superAdmins) {
        await createNotification(
          superAdmin._id,
          "task_marked_important",
          "Задача отмечена как важная",
          `${req.user.name} отметил задачу как важную: ${task.title}`,
          {
            taskId: task._id,
            actorId: req.user._id,
          }
        );
      }
    }

    // Записать активность
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `${task.isImportant ? "отметил" : "снял отметку"} задачу как важную`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error marking task as important:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Получить важные задачи (только для супер админов)
const getImportantTasks = async (req, res) => {
  try {
    // Проверить права доступа (только супер админы могут просматривать важные задачи)
    if (!["super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только супер админы могут просматривать важные задачи." });
    }

    const importantTasks = await Task.find({ 
      isImportant: true,
      isArchived: false 
    })
      .sort({ markedImportantAt: -1 })
      .populate("assignees", "name profilePicture")
      .populate("createdBy", "name profilePicture")
      .populate("markedImportantBy", "name profilePicture")
      .populate("responsibleManager", "name profilePicture");

    res.json({ importantTasks });
  } catch (error) {
    console.error("Ошибка получения важных задач:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Получить задачи ответственного менеджера
const getManagerTasks = async (req, res) => {
  try {
    const { managerId } = req.params;

    // Проверить права доступа (только админы, супер админы, менеджеры и сам менеджер могут просматривать его задачи)
    if (!["admin", "super_admin", "manager"].includes(req.user.role) && req.user._id.toString() !== managerId) {
      return res.status(403).json({ message: "Доступ запрещен." });
    }

    const managerTasks = await Task.find({ 
      responsibleManager: managerId,
      isArchived: false 
    })
      .sort({ createdAt: -1 })
      .populate("assignees", "name profilePicture")
      .populate("createdBy", "name profilePicture")
      .populate("responsibleManager", "name profilePicture");

    res.json({ managerTasks });
  } catch (error) {
    console.error("Ошибка получения задач менеджера:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Получить задачи текущего пользователя как ответственного менеджера
const getMyManagerTasks = async (req, res) => {
  try {
    // Проверить, что пользователь является менеджером, админом или супер админом
    if (!["manager", "admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только менеджеры, админы и супер админы могут просматривать свои задачи как ответственного менеджера." });
    }

    const myManagerTasks = await Task.find({ 
      responsibleManager: req.user._id,
      isArchived: false 
    })
      .sort({ createdAt: -1 })
      .populate("assignees", "name profilePicture")
      .populate("createdBy", "name profilePicture")
      .populate("responsibleManager", "name profilePicture");

    res.json({ myManagerTasks });
  } catch (error) {
    console.error("Ошибка получения моих задач как менеджера:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Создать несколько задач с одним названием
const createMultipleTasks = async (req, res) => {
  try {
    const { title, tasks, status, priority, assignees, responsibleManager } = req.body;

    console.log('Создание мультизадач - пользователь:', req.user);
    console.log('Количество задач:', tasks.length);

    // Проверить права доступа
    if (!["admin", "super_admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы, супер админы и менеджеры могут создавать задачи." });
    }

    // Проверить что tasks это массив и содержит минимум 2 элемента
    if (!Array.isArray(tasks) || tasks.length < 2) {
      return res.status(400).json({ message: "Необходимо минимум 2 задачи для создания мультизадач." });
    }

    // Если указан ответственный менеджер, проверить что это действительно менеджер
    if (responsibleManager) {
      const manager = await User.findById(responsibleManager);
      if (!manager || !["admin", "super_admin", "manager"].includes(manager.role)) {
        return res.status(400).json({ message: "Ответственным может быть только менеджер, админ или супер админ." });
      }
    }

    const createdTasks = [];
    const allNotifiedAssignees = new Set(); // Собрать всех уникальных исполнителей для уведомлений
    const mainAssignees = assignees || []; // "Ответственный исполнитель" - получает ВСЕ задачи

    // Создать каждую задачу
    for (let i = 0; i < tasks.length; i++) {
      const taskItem = tasks[i];

      // Индивидуальные участники задачи (только для этой задачи)
      const individualParticipants = taskItem.assignees || [];

      // Объединяем: индивидуальные участники + основные исполнители (без дубликатов)
      const combinedAssignees = [...new Set([...individualParticipants, ...mainAssignees])];

      // Добавить всех исполнителей в набор для уведомлений
      combinedAssignees.forEach(a => allNotifiedAssignees.add(a.toString()));

      const newTask = await Task.create({
        title: title,
        description: `${i + 1}. ${taskItem.description}`,
        status: status || "To Do",
        priority: priority || "Medium",
        assignees: combinedAssignees,
        dueDate: taskItem.dueDate,
        responsibleManager,
        createdBy: req.user._id,
        createdAt: new Date(),
      });

      await newTask.populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'assignees', select: 'name email' },
        { path: 'responsibleManager', select: 'name email' }
      ]);

      createdTasks.push(newTask);

      // Записать активность для каждой задачи
      await recordActivity(req.user._id, "created_task", "Task", newTask._id, {
        title,
        description: `создал задачу ${title} (${i + 1} из ${tasks.length})`,
      });
    }

    // Уведомить всех уникальных исполнителей (один раз для всех задач) с Email + SMS
    for (const userId of allNotifiedAssignees) {
      if (userId !== req.user._id.toString()) {
        try {
          await sendNotification({
            recipientId: userId,
            type: "task_assigned",
            title: "Вам назначены новые задачи",
            message: `${req.user.name} назначил вам задачи: ${title}`,
            relatedData: {
              taskId: createdTasks[0]._id,
              actorId: req.user._id,
            },
          });
          console.log(`✅ Multi-task notification sent to assignee: ${userId}`);
        } catch (error) {
          console.error(`❌ Failed to notify assignee ${userId}:`, error.message);
        }
      }
    }

    // Уведомить ответственного менеджера с Email + SMS
    if (responsibleManager && responsibleManager.toString() !== req.user._id.toString()) {
      try {
        await sendNotification({
          recipientId: responsibleManager,
          type: "task_assigned_as_manager",
          title: "Вы назначены ответственным менеджером",
          message: `${req.user.name} назначил вас ответственным менеджером ${tasks.length} задач: ${title}`,
          relatedData: {
            taskId: createdTasks[0]._id,
            actorId: req.user._id,
          },
        });
        console.log(`✅ Multi-task notification sent to responsible manager: ${responsibleManager}`);
      } catch (error) {
        console.error(`❌ Failed to notify responsible manager ${responsibleManager}:`, error.message);
      }
    }

    res.status(201).json({ 
      message: `Успешно создано ${createdTasks.length} задач`,
      tasks: createdTasks 
    });
  } catch (error) {
    console.error("Ошибка создания мультизадач:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export {
  archiveTask,
  commentOnTask,
  createSubTask,
  createTask,
  createMultipleTasks,
  createResponse,
  getActivitiesByResourceId,
  getCommentsByTaskId,
  getCompletedTasks,
  getResponsesByTaskId,
  getTaskById,
  replyToComment,
  taskAttachments,
  taskWatchers,
  updateSubTask,
  updateTaskAssignees,
  updateTaskDescription,
  updateTaskPriority,
  updateTaskDueDate,
  updateTaskStatus,
  updateTaskTitle,
  toggleCommentReaction,
  getMyTasks,
  getAllTasks,
  getTasksAnalytics,
  getArchivedTasks,
  deleteTask,
  markTaskAsImportant,
  getImportantTasks,
  getManagerTasks,
  getMyManagerTasks,
};
