import { z } from "zod";

const signupSchema = z
  .object({
    name: z.string().min(2, { message: "Имя должно быть не менее 2 символов." }),
    email: z.string().email({ message: "Пожалуйста, введите действительный адрес электронной почты" }),
    password: z
      .string()
      .min(6, { message: "Пароль должен быть не менее 6 символов." }),
    confirmPassword: z
      .string()
      .min(6, { message: "Требуется подтверждение пароля" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email({ message: "Пожалуйста, введите действительный адрес электронной почты" }),
  password: z
    .string()
    .min(1, { message: "Пароль должен быть не менее 6 символов." }),
});

const workspaceSchema = z.object({
  name: z.string().min(1, "Требуется имя рабочего пространства"),
  color: z.string().min(1, "Требуется цвет рабочего пространства"),
  description: z.string().optional(),
});

const projectSchema = z.object({
  title: z.string().min(2, "Название проекта должно содержать не менее 2 символов."),
  description: z.string().optional(),
  status: z.enum([
    "Planning",
    "In Progress",
    "On Hold",
    "Completed",
    "Cancelled",
  ]),
  startDate: z.string().min(1, "Укажите дату начала."),
  dueDate: z.string().min(1, "Укажите дату сдачи."),
  tags: z.string().trim().optional(),
  members: z
    .array(
      z.object({
        user: z.string(),
        role: z.enum(["manager", "contributor", "viewer"]),
      })
    )
    .optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]),
});

const createTaskSchema = z.object({
  title: z.string().min(1, "Укажите название задачи."),
  description: z.string().optional(),
  status: z.enum(["To Do", "In Progress", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string().min(1, "Укажите дату сдачи."),
  assignees: z.array(z.string()).min(1, "Требуется по крайней мере один уполномоченный"),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Пароль должен быть не менее 6 символов." }),
    confirmPassword: z
      .string()
      .min(6, { message: "Требуется подтверждение пароля" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export {
  signupSchema,
  loginSchema,
  workspaceSchema,
  projectSchema,
  inviteMemberSchema,
  createTaskSchema,
  resetPasswordSchema,
};
