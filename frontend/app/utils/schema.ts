import { z } from "zod";

const signupSchema = z
  .object({
    name: z.string().min(2, { message: "Имя должно содержать минимум 2 символа" }),
    email: z.string().email({ message: "Введите корректный адрес электронной почты" }),
    password: z
      .string()
      .min(8, { message: "Пароль должен содержать минимум 8 символов" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Подтвердите пароль (минимум 8 символов)" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email({ message: "Введите корректный адрес электронной почты" }),
  password: z
    .string()
    .min(1, { message: "Введите пароль" }),
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

// NEW: Phone authentication schemas
const phoneSignUpSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Имя обязательно" })
      .refine(
        (val) => val.trim().split(/\s+/).length >= 2,
        { message: "Введите Имя и Фамилию через пробел" }
      ),
    phoneNumber: z
      .string()
      .regex(/^\+992\d{9}$/, { message: "Формат: +992XXXXXXXXX (9 цифр после +992)" }),
    email: z
      .string()
      .min(1, { message: "Email обязателен" })
      .email({ message: "Неверный формат email" }),
    password: z
      .string()
      .min(8, { message: "Пароль должен содержать минимум 8 символов" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Подтвердите пароль (минимум 8 символов)" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

const universalLoginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, { message: "Email или телефон обязателен" }),
  password: z
    .string()
    .min(1, { message: "Введите пароль" }),
});

const verifyPhoneSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+992\d{9}$/, { message: "Неверный формат телефона" }),
  code: z
    .string()
    .length(6, { message: "Код должен содержать 6 цифр" })
    .regex(/^\d+$/, { message: "Код должен содержать только цифры" }),
});

const resendCodeSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+992\d{9}$/, { message: "Неверный формат телефона" }),
});

export {
  signupSchema,
  loginSchema,
  workspaceSchema,
  projectSchema,
  inviteMemberSchema,
  createTaskSchema,
  resetPasswordSchema,
  // NEW: Phone authentication
  phoneSignUpSchema,
  universalLoginSchema,
  verifyPhoneSchema,
  resendCodeSchema,
};
