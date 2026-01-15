import type { ProjectStatus, TaskStatus } from "@/types";
import { differenceInDays } from "date-fns";

// Re-export api and utilities from fetch-utils
export { api, postData, fetchData, fetchDataFresh, updateData, deleteData } from "./fetch-utils";

export const getUserAvatar = (name: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

export const getProgressPercentage = (tasks: { status: TaskStatus }[]) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "Done").length;

  const projectProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return projectProgress;
};

export const getTaskStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case "In Progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "Cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "On Hold":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "Planning":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export const checkNumberOfDaysLeftToOverdue = (dueDate: Date) => {
  const today = new Date();
  const days = differenceInDays(dueDate, today);

  return days;
};

export const getProjectDueDateColor = (dueDate: Date) => {
  const days = checkNumberOfDaysLeftToOverdue(dueDate);

  if (days < 0) {
    return "text-red-600 dark:bg-red-900/30 dark:text-red-300";
  }

  if (days < 3) {
    return "text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300";
  }

  return "text-muted-foreground";
};

export const publicRoutes = [
  "/",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "*",
];
