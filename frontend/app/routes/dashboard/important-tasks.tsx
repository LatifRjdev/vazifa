import { useQuery } from "@tanstack/react-query";
import { Star, Calendar, User, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/lib/fetch-utils";
import type { Task } from "@/types";
import { useAuth } from "@/providers/auth-context";
import { formatDueDateRussian, formatDateDetailedRussian } from "@/lib/date-utils";

export default function ImportantTasksPage() {
  const { user } = useAuth();

  const { data: importantTasks, isLoading } = useQuery({
    queryKey: ["important-tasks"],
    queryFn: async () => {
      const data = await fetchData<{ importantTasks: Task[] }>("/tasks/important/");
      return data.importantTasks;
    },
    enabled: !!user && user.role === "super_admin",
  });

  if (!user || user.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          У вас нет доступа к этой странице. Только супер админы могут просматривать важные задачи.
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500 fill-current" />
            Важные задачи
          </h1>
          <p className="text-muted-foreground">
            Задачи, отмеченные администраторами как важные
          </p>
        </div>
      </div>

      {!importantTasks || importantTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Нет важных задач
            </h3>
            <p className="text-muted-foreground text-center">
              Пока нет задач, отмеченных как важные
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {importantTasks.map((task) => (
            <Card key={task._id} className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <Link
                        to={`/dashboard/task/${task._id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {task.title}
                      </Link>
                    </CardTitle>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {task.markedImportantBy && task.markedImportantAt && (
                      <p className="text-xs text-muted-foreground">
                        Отмечено как важное{" "}
                        {typeof task.markedImportantBy === "object" 
                          ? task.markedImportantBy.name 
                          : "администратором"}{" "}
                        {new Date(task.markedImportantAt).toLocaleDateString("ru-RU")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge
                      variant="outline"
                      className={getPriorityColor(task.priority)}
                    >
                      {task.priority === "High"
                        ? "Высокий"
                        : task.priority === "Medium"
                        ? "Средний"
                        : "Низкий"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getStatusColor(task.status)}
                    >
                      {task.status === "To Do"
                        ? "К выполнению"
                        : task.status === "In Progress"
                        ? "В процессе"
                        : task.status === "Review"
                        ? "На проверке"
                        : "Выполнено"}
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
                            : `${task.assignees.length} исполнителей`}
                        </span>
                      </div>
                    )}
                    {task.responsibleManager && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>
                          Менеджер:{" "}
                          {typeof task.responsibleManager === "object"
                            ? task.responsibleManager.name
                            : "Не указан"}
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
