// Translation utilities for Russian localization

// Task Status Translations
export const taskStatusTranslations = {
  "To Do": "К выполнению",
  "In Progress": "В процессе",
  "Done": "Выполнено",
  "Completed": "Завершено",
  "Active": "Активный",
  "Inactive": "Неактивный",
  "Archived": "В архиве"
} as const;

// Priority Translations
export const priorityTranslations = {
  "Low": "Низкий",
  "Medium": "Средний", 
  "High": "Высокий",
  "Critical": "Критический",
  "Urgent": "Срочный"
} as const;

// Project Status Translations
export const projectStatusTranslations = {
  "Planning": "Планирование",
  "Active": "Активный",
  "On Hold": "Приостановлен",
  "Completed": "Завершен",
  "Cancelled": "Отменен"
} as const;

// Helper functions to get translated values
export const getTaskStatusRussian = (status: string): string => {
  return taskStatusTranslations[status as keyof typeof taskStatusTranslations] || status;
};

export const getPriorityRussian = (priority: string): string => {
  return priorityTranslations[priority as keyof typeof priorityTranslations] || priority;
};

export const getProjectStatusRussian = (status: string): string => {
  return projectStatusTranslations[status as keyof typeof projectStatusTranslations] || status;
};

// Reverse translations (Russian to English) for API calls
export const taskStatusReverseTranslations = {
  "К выполнению": "To Do",
  "В процессе": "In Progress", 
  "Выполнено": "Done",
  "Завершено": "Completed",
  "Активный": "Active",
  "Неактивный": "Inactive",
  "В архиве": "Archived"
} as const;

export const priorityReverseTranslations = {
  "Низкий": "Low",
  "Средний": "Medium",
  "Высокий": "High", 
  "Критический": "Critical",
  "Срочный": "Urgent"
} as const;

export const getTaskStatusEnglish = (russianStatus: string): string => {
  return taskStatusReverseTranslations[russianStatus as keyof typeof taskStatusReverseTranslations] || russianStatus;
};

export const getPriorityEnglish = (russianPriority: string): string => {
  return priorityReverseTranslations[russianPriority as keyof typeof priorityReverseTranslations] || russianPriority;
};

// Role Translations
export const roleTranslations = {
  "admin": "Администратор",
  "member": "Участник",
  "viewer": "Наблюдатель",
  "owner": "Владелец",
  "manager": "Менеджер",
  "contributor": "Автор"
} as const;

export const roleReverseTranslations = {
  "Администратор": "admin",
  "Участник": "member",
  "Наблюдатель": "viewer",
  "Владелец": "owner",
  "Менеджер": "manager",
  "Автор": "contributor"
} as const;

export const getRoleRussian = (role: string): string => {
  return roleTranslations[role as keyof typeof roleTranslations] || role;
};

export const getRoleEnglish = (russianRole: string): string => {
  return roleReverseTranslations[russianRole as keyof typeof roleReverseTranslations] || russianRole;
};
