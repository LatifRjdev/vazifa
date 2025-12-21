import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const workspaceInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

const workspaceSchema = z.object({
  name: z.string().min(3, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  // owner: z.string().uuid("Invalid owner ID"),
});

const projectSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  status: z.enum([
    "Planning",
    "In Progress",
    "On Hold",
    "Completed",
    "Cancelled",
  ]),
  startDate: z.string(),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
  members: z
    .array(
      z.object({
        user: z.string(),
        role: z.enum(["manager", "contributor", "viewer"]),
      })
    )
    .optional(),
});

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["To Do", "In Progress", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string().optional(),
  assignees: z.array(z.string()).optional(),
});

const commentSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(8, "Password must be at least 8 characters long"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
});

const taskAttachmentSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
});

const addProjectMembersSchema = z.object({
  members: z.array(
    z.object({
      user: z.string(),
      role: z.enum(["manager", "contributor", "viewer"]),
    })
  ),
});

export {
  registerSchema,
  loginSchema,
  workspaceInvitationSchema,
  workspaceSchema,
  projectSchema,
  taskSchema,
  commentSchema,
  resetPasswordSchema,
  taskAttachmentSchema,
  addProjectMembersSchema,
};
