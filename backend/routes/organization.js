import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { authenticateUser } from "../middleware/auth-middleware.js";
import {
  getUserOrganizations,
  getOrganizationById,
  updateOrganization,
  createOrganization,
  addMemberToOrganization,
  removeMemberFromOrganization,
} from "../controllers/organization-controller.js";

const router = express.Router();

// Получить все организации пользователя
router.get("/", authenticateUser, getUserOrganizations);

// Получить организацию по ID
router.get(
  "/:organizationId",
  authenticateUser,
  validateRequest({
    params: z.object({ organizationId: z.string() }),
  }),
  getOrganizationById
);

// Создать организацию
router.post(
  "/",
  authenticateUser,
  validateRequest({
    body: z.object({
      name: z.string().min(1, "Название организации обязательно"),
      description: z.string().optional(),
      color: z.string().optional(),
    }),
  }),
  createOrganization
);

// Обновить организацию
router.put(
  "/:organizationId",
  authenticateUser,
  validateRequest({
    params: z.object({ organizationId: z.string() }),
    body: z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      color: z.string().optional(),
    }),
  }),
  updateOrganization
);

// Добавить участника в организацию
router.post(
  "/:organizationId/members",
  authenticateUser,
  validateRequest({
    params: z.object({ organizationId: z.string() }),
    body: z.object({
      userId: z.string(),
    }),
  }),
  addMemberToOrganization
);

// Удалить участника из организации
router.delete(
  "/:organizationId/members/:userId",
  authenticateUser,
  validateRequest({
    params: z.object({
      organizationId: z.string(),
      userId: z.string(),
    }),
  }),
  removeMemberFromOrganization
);

export default router;
