import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

import { commentReaction } from "../controllers/comments-controller.js";
import { authenticateUser } from "../middleware/auth-middleware.js";

const router = express.Router();

router.post(
  "/:commentId/reactions",
  authenticateUser,
  validateRequest({
    params: z.object({ commentId: z.string().uuid() }),
    body: z.object({ emoji: z.string() }),
  }),
  commentReaction
);

export default router;
