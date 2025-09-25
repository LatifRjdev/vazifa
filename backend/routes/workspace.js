import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import {
  acceptGeneralWorkspaceInvite,
  acceptWorkspaceInviteByToken,
  createWorkspace,
  deleteWorkspace,
  getArchivedItemsByWorkspace,
  getWorkspaceDetails,
  getWorkspaceProjects,
  getWorkspaces,
  getWorkspaceStats,
  transferWorkspaceOwnership,
  updateWorkspace,
  workspaceInvitation,
} from "../controllers/workspace-controller.js";
import {
  workspaceInvitationSchema,
  workspaceSchema,
} from "../libs/validator-schema.js";
import { authenticateUser } from "../middleware/auth-middleware.js";

const router = express.Router();

router.get("/", authenticateUser, getWorkspaces);

router.get(
  "/:workspaceId",
  authenticateUser,
  validateRequest({
    params: z.object({ workspaceId: z.string() }),
  }),
  getWorkspaceDetails
);

router.get(
  "/:workspaceId/projects",
  authenticateUser,
  validateRequest({ params: z.object({ workspaceId: z.string() }) }),
  getWorkspaceProjects
);

// POST REQUESTS
router.post(
  "/",
  authenticateUser,
  validateRequest({ body: workspaceSchema }),
  createWorkspace
);

router.post(
  "/accept-invite-token",
  authenticateUser,
  validateRequest({
    body: z.object({ token: z.string() }),
  }),
  acceptWorkspaceInviteByToken
);

router.post(
  "/:workspaceId/invite-member",
  authenticateUser,
  validateRequest({
    params: z.object({ workspaceId: z.string() }),
    body: workspaceInvitationSchema,
  }),
  workspaceInvitation
);
router.post(
  "/:workspaceId/accept-invite-general",
  authenticateUser,
  validateRequest({ params: z.object({ workspaceId: z.string() }) }),
  acceptGeneralWorkspaceInvite
);

router.post(
  "/:workspaceId/transfer-ownership",
  authenticateUser,
  validateRequest({ params: z.object({ workspaceId: z.string() }) }),
  transferWorkspaceOwnership
);

// PATCH REQUESTS
router.put(
  "/:workspaceId",
  authenticateUser,
  validateRequest({
    params: z.object({ workspaceId: z.string() }),
    body: workspaceSchema,
  }),
  updateWorkspace
);

// GET REQUESTS
router.get(
  "/:workspaceId/archives",
  authenticateUser,
  validateRequest({ params: z.object({ workspaceId: z.string() }) }),
  getArchivedItemsByWorkspace
);

router.get(
  "/:workspaceId/stats",
  authenticateUser,
  validateRequest({ params: z.object({ workspaceId: z.string() }) }),
  getWorkspaceStats
);

// DELETE REQUESTS
router.delete(
  "/:workspaceId",
  authenticateUser,
  validateRequest({ params: z.object({ workspaceId: z.string() }) }),
  deleteWorkspace
);

export default router;
