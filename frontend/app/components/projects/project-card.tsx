import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarDays } from "lucide-react";
import { Link } from "react-router";

import type { Project } from "@/types";
import { getProjectDueDateColor, getTaskStatusColor } from "@/lib";
import { formatDueDateRussian } from "@/lib/date-utils";
import { getProjectStatusRussian } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  workspaceId: string;
  progress: number;
}

export const ProjectCard = ({
  project,
  workspaceId,
  progress,
}: ProjectCardProps) => {
  return (
    <Link to={`/workspaces/${workspaceId}/projects/${project._id}`}>
      <Card className="transition-all hover:shadow-md hover:-translate-y-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getTaskStatusColor(
                project.status
              )}`}
            >
              {getProjectStatusRussian(project.status)}
            </span>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description || "Нет описания"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Прогресс</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm gap-2 text-muted-foreground">
                <span>{project.tasks.length}</span>
                <span>Задачи</span>
              </div>

              {project.dueDate && (
                <div
                  className={cn(
                    "flex items-center text-xs text-muted-foreground",
                    getProjectDueDateColor(project.dueDate)
                  )}
                >
                  <CalendarDays className="mr-1 h-3 w-3" />
                  Срок: {formatDueDateRussian(project.dueDate)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
