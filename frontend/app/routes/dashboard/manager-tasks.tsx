import { useQuery } from "@tanstack/react-query";
import { Star, Calendar, User, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/lib/fetch-utils";
import type { Task } from "@/types";
import { useAuth } from "@/providers/auth-context";
import { useLanguage } from "@/providers/language-context";
import { formatDueDateRussian, formatDateDetailedRussian } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export default function ManagerTasksPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: managerTasks, isLoading } = useQuery({
    queryKey: ["manager-tasks"],
    queryFn: async () => {
      const data = await fetchData<{ myManagerTasks: Task[] }>("/tasks/my-manager-tasks/");
      return data.myManagerTasks;
    },
    enabled: !!user && ["admin", "manager", "super_admin", "chief_manager"].includes(user.role || ""),
  });

  if (!user || !["admin", "manager", "super_admin", "chief_manager"].includes(user.role || "")) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          {t('manager_tasks.no_access')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-800 border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('manager_tasks.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('manager_tasks.description')}
          </p>
        </div>
      </div>

      {!managerTasks || managerTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('manager_tasks.no_tasks_title')}
            </h3>
            <p className="text-muted-foreground text-center">
              {t('manager_tasks.no_tasks_description')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {managerTasks.map((task) => (
            <Card
              key={task._id}
              className={cn(
                "hover:shadow-md transition-shadow",
                task.awaitingStatusChange && "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">
                      <Link
                        to={`/dashboard/task/${task._id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {task.title}
                        {task.isImportant && (
                          <Star className="inline-block ml-2 h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </Link>
                    </CardTitle>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 flex-wrap">
                    {task.awaitingStatusChange && (
                      <Badge className="bg-green-500 text-white hover:bg-green-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Ожидает изменения
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={getPriorityColor(task.priority)}
                    >
                      {task.priority === "High"
                        ? t('priority.high')
                        : task.priority === "Medium"
                        ? t('priority.medium')
                        : t('priority.low')}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getStatusColor(task.status)}
                    >
                      {task.status === "To Do"
                        ? t('status.todo')
                        : task.status === "In Progress"
                        ? t('status.in_progress')
                        : task.status === "Review"
                        ? t('status.review')
                        : t('status.done')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>
                          {task.assignees.length === 1
                            ? task.assignees[0].name
                            : t('manager_tasks.assignees_count').replace('{count}', task.assignees.length.toString())}
                        </span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDueDateRussian(task.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDateDetailedRussian(task.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
