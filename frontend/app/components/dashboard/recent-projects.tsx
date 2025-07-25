import { Link, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import type { Project } from "@/types";
import { getProgressPercentage, getTaskStatusColor } from "@/lib";
import { cn } from "@/lib/utils";

export const RecentProjects = ({ data }: { data: Project[] }) => {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams?.get("workspaceId");

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Недавние проекты</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Проектов нет
          </p>
        ) : (
          data.map((project) => {
            const projectProgress = getProgressPercentage(project.tasks);

            return (
              <div key={project._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    to={`/workspaces/${project.workspace}/projects/${project._id}`}
                  >
                    <h3 className="font-medium hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                  </Link>
                  <span
                    className={cn(
                      `px-2 py-1 text-xs rounded-full `,
                      getTaskStatusColor(project.status)
                    )}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {project.description}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Прогресс</span>
                    <span>{projectProgress}%</span>
                  </div>
                  <Progress value={projectProgress} className="h-2" />
                </div>
              </div>
            );
          })
        )}
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link
              to={
                workspaceId
                  ? `/workspaces/${workspaceId}/projects`
                  : "/workspaces"
              }
              className="text-xs md:text-sm"
            >
              Показать все Проекты
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
