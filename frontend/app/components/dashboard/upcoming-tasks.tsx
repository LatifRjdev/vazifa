import { format } from "date-fns";
import { CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router";

import { useWorkspaceSearchParamId } from "@/hooks/use-workspace-id";
import type { Task } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export const UpcomingTasks = ({ upcomingTasks }: { upcomingTasks: Task[] }) => {
  const workspaceId = useWorkspaceSearchParamId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Предстоящие задачи</CardTitle>
        <CardDescription>Задачи, которые необходимо выполнить в течение следующих 7 дней</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingTasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Нет предстоящих задач (через 7 дней)
          </p>
        ) : (
          upcomingTasks.map((task) => (
            <Link
              key={task._id}
              to={`/workspaces/${workspaceId}/projects/${task.project}/tasks/${task._id}`}
              className="flex items-start space-x-3 border-b pb-3 last:border-0"
            >
              <div
                className={`mt-0.5 rounded-full p-1 ${
                  task.priority === "High"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : task.priority === "Medium"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {task.status === "Done" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">{task.title}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{task.status}</span>
                  {task.dueDate && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Срок {format(task.dueDate, "MMM d, yyyy")}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
};
