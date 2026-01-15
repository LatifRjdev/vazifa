import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import {
  taskAttachments,
  taskWatchers,
  createTask,
  createMultipleTasks,
  commentOnTask,
  createResponse,
  updateTaskStatus,
  getTaskById,
  archiveTask,
  updateTaskPriority,
  updateTaskDueDate,
  updateTaskTitle,
  updateTaskDescription,
  updateTaskAssignees,
  createSubTask,
  updateSubTask,
  getCommentsByTaskId,
  getCompletedTasks,
  getResponsesByTaskId,
  replyToComment,
  getActivitiesByResourceId,
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
  requestStatusChange,
} from "../controllers/task-controller.js";
import {
  commentSchema,
  taskAttachmentSchema,
  taskSchema,
} from "../libs/validator-schema.js";
import { authenticateUser } from "../middleware/auth-middleware.js";

const router = express.Router();

// ============================================================================
// ВАЖНО: Специфичные маршруты БЕЗ параметров ДОЛЖНЫ быть ПЕРВЫМИ!
// Иначе маршруты с параметрами (например /:taskId/...) перехватят их
// ============================================================================

// Маршрут для создания нескольких задач
router.post(
  "/create-multiple",
  authenticateUser,
  validateRequest({
    body: z.object({
      title: z.string().min(1),
      tasks: z.array(z.object({
        description: z.string().min(1),
        dueDate: z.string().optional()
      })).min(2),
      status: z.enum(["To Do", "In Progress", "Done"]).optional(),
      priority: z.enum(["High", "Medium", "Low"]).optional(),
      assignees: z.array(z.string()).optional(),
      responsibleManager: z.string().optional()
    })
  }),
  createMultipleTasks
);

// Маршрут для создания одной задачи (альтернативный путь)
router.post(
  "/create",
  authenticateUser,
  validateRequest({
    body: taskSchema,
  }),
  createTask
);

// Маршрут для создания одной задачи (основной путь)
router.post(
  "/",
  authenticateUser,
  validateRequest({
    body: taskSchema,
  }),
  createTask
);

// ============================================================================
// МАРШРУТЫ С ПАРАМЕТРАМИ - идут ПОСЛЕ специфичных маршрутов
// ============================================================================

router.post(
  "/:taskId/comments",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: commentSchema,
  }),
  commentOnTask
);

router.post(
  "/:taskId/watch",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  taskWatchers
);

router.post(
  "/:taskId/archive",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  archiveTask
);

router.post(
  "/:taskId/attachments",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: taskAttachmentSchema,
  }),
  taskAttachments
);

router.post(
  "/:projectId/create-task",
  authenticateUser,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: taskSchema,
  }),
  createTask
);

router.post(
  "/:taskId/subtasks",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  createSubTask
);

router.put(
  "/:taskId/subtasks/:subtaskId",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string(), subtaskId: z.string() }),
    body: z.object({ completed: z.boolean() }),
  }),
  updateSubTask
);

router.put(
  "/:taskId/status",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ status: z.enum(["To Do", "In Progress", "Done", "Cancelled"]) }),
  }),
  updateTaskStatus
);

// Запросить изменение статуса (для участников)
router.post(
  "/:taskId/request-status-change",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  requestStatusChange
);

router.put(
  "/:taskId/priority",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ priority: z.enum(["High", "Medium", "Low"]) }),
  }),
  updateTaskPriority
);

// Изменение срока выполнения (только для админов и менеджеров)
router.put(
  "/:taskId/due-date",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ dueDate: z.string() }),
  }),
  updateTaskDueDate
);

router.put(
  "/:taskId/title",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ title: z.string() }),
  }),
  updateTaskTitle
);

router.put(
  "/:taskId/description",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ description: z.string() }),
  }),
  updateTaskDescription
);

router.put(
  "/:taskId/assignees",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ assignees: z.array(z.string()) }),
  }),
  updateTaskAssignees
);

router.post(
  "/:commentId/reaction",
  authenticateUser,
  validateRequest({
    params: z.object({ commentId: z.string() }),
    body: z.object({ emoji: z.string() }),
  }),
  toggleCommentReaction
);

// Специфичные роуты должны быть выше общих роутов с параметрами
router.get("/my-tasks/", authenticateUser, getMyTasks);
router.get("/all-tasks/", authenticateUser, getAllTasks);
router.get("/analytics/", authenticateUser, getTasksAnalytics);
router.get("/archived/", authenticateUser, getArchivedTasks);
router.get("/completed/", authenticateUser, getCompletedTasks);
router.get("/important/", authenticateUser, getImportantTasks);
router.get("/my-manager-tasks/", authenticateUser, getMyManagerTasks);

// Маршрут для отметки задачи как важной
router.post(
  "/:taskId/mark-important",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  markTaskAsImportant
);

// Маршрут для получения задач конкретного менеджера
router.get(
  "/manager/:managerId",
  authenticateUser,
  validateRequest({ params: z.object({ managerId: z.string() }) }),
  getManagerTasks
);

router.get(
  "/:taskId/comments",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  getCommentsByTaskId
);

router.get(
  "/:taskId/responses",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  getResponsesByTaskId
);

router.post(
  "/:taskId/responses",
  authenticateUser,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({
      text: z.string().optional(),
      attachments: z.array(z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        fileSize: z.number()
      })).optional()
    })
  }),
  createResponse
);

router.post(
  "/comments/:commentId/reply",
  authenticateUser,
  validateRequest({
    params: z.object({ commentId: z.string() }),
    body: z.object({
      text: z.string().optional(),
      attachments: z.array(z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        fileSize: z.number()
      })).optional()
    })
  }),
  replyToComment
);

router.get(
  "/:resourceId/activities",
  authenticateUser,
  validateRequest({ params: z.object({ resourceId: z.string() }) }),
  getActivitiesByResourceId
);

router.get(
  "/:taskId",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  getTaskById
);

router.delete(
  "/:taskId",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  deleteTask
);

export default router;
