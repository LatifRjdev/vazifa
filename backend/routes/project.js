import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import {
  addProjectMembers,
  createProject,
  deleteProject,
  getProjectDetails,
  getProjectTasks,
  removeProjectMember,
  updateProject,
  archiveProject,
} from "../controllers/project-controller.js";
import {
  addProjectMembersSchema,
  projectSchema,
} from "../libs/validator-schema.js";
import { authenticateUser } from "../middleware/auth-middleware.js";

const router = express.Router();

router.get(
  "/:projectId",
  authenticateUser,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  getProjectDetails
);

router.get(
  "/:projectId/tasks",
  authenticateUser,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  getProjectTasks
);

router.post(
  "/:workspaceId/create-project",
  authenticateUser,
  validateRequest({
    params: z.object({ workspaceId: z.string() }),
    body: projectSchema,
  }),
  createProject
);

router.put(
  "/:projectId/update",
  authenticateUser,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: projectSchema,
  }),
  updateProject
);

router.post(
  "/:projectId/add-member",
  authenticateUser,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: addProjectMembersSchema,
  }),
  addProjectMembers
);

router.put(
  "/:projectId/archive",
  authenticateUser,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  archiveProject
);

router.delete(
  "/:projectId/remove-member/:userId",
  authenticateUser,
  validateRequest({
    params: z.object({
      projectId: z.string(),
      userId: z.string(),
    }),
  }),
  removeProjectMember
);

router.delete(
  "/:projectId",
  authenticateUser,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  deleteProject
);

export default router;
