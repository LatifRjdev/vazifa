// Translation utilities for multilingual support

// Task Status Translations
export const taskStatusTranslations = {
  ru: {
    "To Do": "К выполнению",
    "In Progress": "В процессе",
    "Done": "Выполнено",
    "Cancelled": "Отменен",
    "Completed": "Завершено",
    "Active": "Активный",
    "Inactive": "Неактивный",
    "Archived": "В архиве"
  },
  tj: {
    "To Do": "Барои иҷро",
    "In Progress": "Дар ҷараён",
    "Done": "Иҷрошуда",
    "Cancelled": "Бекоршуда",
    "Completed": "Анҷомёфта",
    "Active": "Фаъол",
    "Inactive": "Ғайрифаъол",
    "Archived": "Дар бойгонӣ"
  }
} as const;

// Priority Translations
export const priorityTranslations = {
  ru: {
    "Low": "Низкий",
    "Medium": "Средний", 
    "High": "Высокий",
    "Critical": "Критический",
    "Urgent": "Срочный"
  },
  tj: {
    "Low": "Паст",
    "Medium": "Миёна",
    "High": "Баланд",
    "Critical": "Критикӣ",
    "Urgent": "Зудӣ"
  }
} as const;

// Project Status Translations
export const projectStatusTranslations = {
  ru: {
    "Planning": "Планирование",
    "Active": "Активный",
    "On Hold": "Приостановлен",
    "Completed": "Завершен",
    "Cancelled": "Отменен"
  },
  tj: {
    "Planning": "Нақшакашӣ",
    "Active": "Фаъол",
    "On Hold": "Таваққуфшуда",
    "Completed": "Анҷомёфта",
    "Cancelled": "Бекоршуда"
  }
} as const;

// Role Translations
export const roleTranslations = {
  ru: {
    "admin": "Администратор",
    "member": "Участник",
    "viewer": "Наблюдатель",
    "owner": "Владелец",
    "manager": "Менеджер",
    "contributor": "Автор",
    "super_admin": "Супер админ"
  },
  tj: {
    "admin": "Маъмур",
    "member": "Иштирокчӣ",
    "viewer": "Тамошобин",
    "owner": "Соҳиб",
    "manager": "Менеҷер",
    "contributor": "Муаллиф",
    "super_admin": "Супер маъмур"
  }
} as const;

// Helper functions to get translated values
export const getTaskStatus = (status: string, language: 'ru' | 'tj' = 'ru'): string => {
  return taskStatusTranslations[language][status as keyof typeof taskStatusTranslations[typeof language]] || status;
};

export const getPriority = (priority: string, language: 'ru' | 'tj' = 'ru'): string => {
  return priorityTranslations[language][priority as keyof typeof priorityTranslations[typeof language]] || priority;
};

export const getProjectStatus = (status: string, language: 'ru' | 'tj' = 'ru'): string => {
  return projectStatusTranslations[language][status as keyof typeof projectStatusTranslations[typeof language]] || status;
};

export const getRole = (role: string, language: 'ru' | 'tj' = 'ru'): string => {
  return roleTranslations[language][role as keyof typeof roleTranslations[typeof language]] || role;
};

// Reverse translations (for API calls)
export const taskStatusReverseTranslations = {
  ru: {
    "К выполнению": "To Do",
    "В процессе": "In Progress",
    "Выполнено": "Done",
    "Отменен": "Cancelled",
    "Завершено": "Completed",
    "Активный": "Active",
    "Неактивный": "Inactive",
    "В архиве": "Archived"
  },
  tj: {
    "Барои иҷро": "To Do",
    "Дар ҷараён": "In Progress",
    "Иҷрошуда": "Done",
    "Бекоршуда": "Cancelled",
    "Анҷомёфта": "Completed",
    "Фаъол": "Active",
    "Ғайрифаъол": "Inactive",
    "Дар бойгонӣ": "Archived"
  }
} as const;

export const priorityReverseTranslations = {
  ru: {
    "Низкий": "Low",
    "Средний": "Medium",
    "Высокий": "High", 
    "Критический": "Critical",
    "Срочный": "Urgent"
  },
  tj: {
    "Паст": "Low",
    "Миёна": "Medium",
    "Баланд": "High",
    "Критикӣ": "Critical",
    "Зудӣ": "Urgent"
  }
} as const;

export const getTaskStatusEnglish = (translatedStatus: string, language: 'ru' | 'tj' = 'ru'): string => {
  return taskStatusReverseTranslations[language][translatedStatus as keyof typeof taskStatusReverseTranslations[typeof language]] || translatedStatus;
};

export const getPriorityEnglish = (translatedPriority: string, language: 'ru' | 'tj' = 'ru'): string => {
  return priorityReverseTranslations[language][translatedPriority as keyof typeof priorityReverseTranslations[typeof language]] || translatedPriority;
};

// Legacy functions for backward compatibility
export const getTaskStatusRussian = (status: string): string => getTaskStatus(status, 'ru');
export const getPriorityRussian = (priority: string): string => getPriority(priority, 'ru');
export const getProjectStatusRussian = (status: string): string => getProjectStatus(status, 'ru');
export const getRoleRussian = (role: string): string => getRole(role, 'ru');
