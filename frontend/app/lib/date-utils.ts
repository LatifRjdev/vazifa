import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Russian month names
const russianMonths = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

const russianMonthsNominative = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"
];

const russianDays = [
  "воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"
];

const russianDaysShort = [
  "вс", "пн", "вт", "ср", "чт", "пт", "сб"
];

/**
 * Format date in Russian locale with numeric format
 */
export const formatDateRussian = (date: string | Date, formatType: "short" | "medium" | "long" | "full" = "medium"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "Неверная дата";
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  switch (formatType) {
    case "short":
      // "27.07"
      return `${day}.${month}`;
    
    case "medium":
      // "27.07.2025"
      return `${day}.${month}.${year}`;
    
    case "long":
      // "27.07.2025"
      return `${day}.${month}.${year}`;
    
    case "full":
      // "27.07.2025"
      return `${day}.${month}.${year}`;
    
    default:
      return `${day}.${month}.${year}`;
  }
};

/**
 * Format date for due date display
 */
export const formatDueDateRussian = (date: string | Date): string => {
  return formatDateRussian(date, "short");
};

/**
 * Format date for detailed display
 */
export const formatDateDetailedRussian = (date: string | Date): string => {
  return formatDateRussian(date, "full");
};

/**
 * Format date using date-fns with Russian locale
 */
export const formatWithRussianLocale = (date: string | Date, formatStr: string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: ru });
};

/**
 * Get relative time in Russian (like "2 дня назад")
 */
export const getRelativeTimeRussian = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) {
    if (diffInDays === 1) return "вчера";
    if (diffInDays < 7) return `${diffInDays} дня назад`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} недели назад`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} месяца назад`;
    return `${Math.floor(diffInDays / 365)} года назад`;
  }

  if (diffInHours > 0) {
    if (diffInHours === 1) return "час назад";
    return `${diffInHours} часа назад`;
  }

  if (diffInMinutes > 0) {
    if (diffInMinutes === 1) return "минуту назад";
    return `${diffInMinutes} минут назад`;
  }

  return "только что";
};

/**
 * Check if date is overdue
 */
export const isOverdue = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset time to start of day
  dateObj.setHours(0, 0, 0, 0);
  return dateObj < now;
};

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return dateObj.toDateString() === now.toDateString();
};

/**
 * Check if date is tomorrow
 */
export const isTomorrow = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateObj.toDateString() === tomorrow.toDateString();
};
