import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import {
  taskAttachments,
  taskWatchers,
  createTask,
  commentOnTask,
  updateTaskStatus,
  getTaskById,
  archiveTask,
  updateTaskPriority,
  updateTaskTitle,
  updateTaskDescription,
  updateTaskAssignees,
  createSubTask,
  updateSubTask,
  getCommentsByTaskId,
  getActivitiesByResourceId,
  toggleCommentReaction,
  getMyTasks,
  deleteTask,
} from "../controllers/task-controller.js";
import {
  commentSchema,
  taskAttachmentSchema,
  taskSchema,
} from "../libs/validator-schema.js";
import { authenticateUser } from "../middleware/auth-middleware.js";

const router = express.Router();

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
    body: z.object({ status: z.enum(["To Do", "In Progress", "Done"]) }),
  }),
  updateTaskStatus
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

router.get("/my-tasks/", authenticateUser, getMyTasks);

router.get(
  "/:taskId",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  getTaskById
);

router.get(
  "/:taskId/comments",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  getCommentsByTaskId
);

router.get(
  "/:resourceId/activities",
  authenticateUser,
  validateRequest({ params: z.object({ resourceId: z.string() }) }),
  getActivitiesByResourceId
);

router.delete(
  "/:taskId",
  authenticateUser,
  validateRequest({ params: z.object({ taskId: z.string() }) }),
  deleteTask
);

export default router;
