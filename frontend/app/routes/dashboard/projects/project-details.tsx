import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CirclePlus,
  Clock,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Loader } from "@/components/loader";
import { BackButton } from "@/components/shared/back-button";
import { NoDataFound } from "@/components/shared/no-data";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetProjectQuery } from "@/hooks/use-project";
import { useUpdateTaskStatusMutation } from "@/hooks/use-task";
import { getProgressPercentage } from "@/lib";
import { formatDueDateRussian } from "@/lib/date-utils";
import { getTaskStatusRussian, getPriorityRussian } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { Project, Task, TaskStatus } from "@/types";

import type { Route } from "../../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Project Details" },
    { name: "description", content: "Project Details to TaskHub!" },
  ];
}

const ProjectDetailsPage = () => {
  const { projectId, workspaceId } = useParams<{
    projectId: string;
    workspaceId: string;
  }>();
  const navigate = useNavigate();

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "All">("All");

  const { data, isLoading } = useGetProjectQuery(projectId!) as {
    data: {
      tasks: Task[];
      project: Project;
    };
    isLoading: boolean;
  };

  const { tasks, project } = data || { tasks: [], project: null };

  const handleTaskClick = (taskId: string) => {
    navigate(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
    );
  };

  const filteredTasks =
    taskFilter === "All"
      ? tasks
      : tasks.filter((task: any) => task.status === taskFilter);

  if (isLoading) {
    return <Loader message="Загрузка деталей проекта..." />;
  }

  const projectProgress = getProgressPercentage(tasks);

  if (!project) {
    return (
      <NoDataFound
        title="Проект не найден"
        description="Создайте новый проект, чтобы начать"
        buttonText="Назад"
        buttonOnClick={() => {}}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BackButton />
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold">{project.title}</h1>
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 min-w-32">
            <div className="text-sm text-muted-foreground">Прогресс:</div>
            <div className="flex-1">
              <Progress value={projectProgress || 0} className="h-2" />
            </div>
            <span className="text-sm font-medium">{projectProgress || 0}%</span>
          </div>
          <Button onClick={() => setIsCreateTaskOpen(true)}>
            <CirclePlus className="mr-2 h-4 w-4" />
            Добавить задачу
          </Button>
          <Link
            to={`/workspaces/${workspaceId}/projects/${projectId}/settings`}
          >
            <Button variant={"outline"}>
              <Settings className="mr-2 h-4 w-4" />
              <span className="block md:hidden">Настройки</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setTaskFilter("All")}>
                Все задачи
              </TabsTrigger>
              <TabsTrigger value="todo" onClick={() => setTaskFilter("To Do")}>
                Сделать
              </TabsTrigger>
              <TabsTrigger
                value="inprogress"
                onClick={() => setTaskFilter("In Progress")}
              >
                В ходе выполнения
              </TabsTrigger>
              <TabsTrigger value="done" onClick={() => setTaskFilter("Done")}>
                Сделано
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center text-sm">
              <span className="text-muted-foreground mr-2">Статус:</span>
              <div className="flex gap-1">
                <Badge variant="outline" className="bg-background">
                  {tasks.filter((t) => t.status === "To Do").length} Сделать
                </Badge>
                <Badge variant="outline" className="bg-background">
                  {tasks.filter((t) => t.status === "In Progress").length} В
                  ходе выполнения
                </Badge>
                <Badge variant="outline" className="bg-background">
                  {tasks.filter((t) => t.status === "Done").length} Сделано
                </Badge>
              </div>
            </div>
          </div>

          <TabsContent value="all" className="m-0">
            <div className="grid gap-4 md:grid-cols-3">
              <TasksColumn
                title="К выполнению"
                tasks={tasks.filter((task) => task.status === "To Do")} // Use all tasks for columns
                onTaskClick={handleTaskClick}
              />
              <TasksColumn
                title="В процессе"
                tasks={tasks.filter((task) => task.status === "In Progress")}
                onTaskClick={handleTaskClick}
              />
              <TasksColumn
                title="Выполнено"
                tasks={tasks.filter((task) => task.status === "Done")}
                onTaskClick={handleTaskClick}
              />
            </div>
          </TabsContent>

          <TabsContent value="todo" className="m-0">
            <div className="grid gap-4 md:grid-cols-1">
              <TasksColumn
                title="К выполнению"
                tasks={filteredTasks.filter((task) => task.status === "To Do")}
                onTaskClick={handleTaskClick}
                isFullWidth
              />
            </div>
          </TabsContent>

          <TabsContent value="inprogress" className="m-0">
            <div className="grid gap-4 md:grid-cols-1">
              <TasksColumn
                title="В процессе"
                tasks={filteredTasks.filter(
                  (task) => task.status === "In Progress"
                )}
                onTaskClick={handleTaskClick}
                isFullWidth
              />
            </div>
          </TabsContent>

          <TabsContent value="done" className="m-0">
            <div className="grid gap-4 md:grid-cols-1">
              <TasksColumn
                title="Выполнено"
                tasks={filteredTasks.filter((task) => task.status === "Done")}
                onTaskClick={handleTaskClick}
                isFullWidth
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isCreateTaskOpen={isCreateTaskOpen}
        setIsCreateTaskOpen={setIsCreateTaskOpen}
        projectId={projectId!}
        projectMembers={data?.project?.members as any}
      />
    </div>
  );
};
export default ProjectDetailsPage;

export interface TasksColumnProps {
  title: string;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  isFullWidth?: boolean;
}

const TasksColumn = ({
  title,
  tasks,
  onTaskClick,
  isFullWidth,
}: TasksColumnProps) => {
  return (
    <div
      className={
        isFullWidth
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : ""
      }
    >
      <div
        className={`space-y-4 ${
          !isFullWidth ? "h-full" : "col-span-full mb-6"
        }`}
      >
        {!isFullWidth && (
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{title}</h3>
            <Badge variant="outline">{tasks.length}</Badge>
          </div>
        )}

        <div
          className={`space-y-3 ${
            !isFullWidth
              ? ""
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          }`}
        >
          {tasks.length === 0 ? (
            <div className="h-24 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
              Нет задач
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick(task._id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onClick }: { task: Task; onClick: () => void }) => {
  const { mutate: updateTaskStatus, isPending: isUpdatingTaskStatus } =
    useUpdateTaskStatusMutation();

  const handleUpdateTaskStatus = (e: React.MouseEvent, status: TaskStatus) => {
    e.stopPropagation();
    updateTaskStatus({ taskId: task._id, status });
  };

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
    >
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <Badge
            className={
              task.priority === "High"
                ? "bg-red-600 text-white" // Added text-white for better contrast
                : task.priority === "Medium"
                ? "bg-orange-500 text-white" // Added text-white
                : "bg-slate-500 text-white" // Added text-white
            }
          >
            {getPriorityRussian(task.priority)}
          </Badge>
          <div className="flex gap-1">
            {task.status !== "To Do" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => handleUpdateTaskStatus(e, "To Do")}
                title="Mark as To Do"
                disabled={isUpdatingTaskStatus}
              >
                <AlertCircle
                  className={cn(
                    "h-4 w-4",
                    isUpdatingTaskStatus && "animate-spin"
                  )}
                />
                <span className="sr-only">Отметить как сделать</span>
              </Button>
            )}
            {task.status !== "In Progress" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => handleUpdateTaskStatus(e, "In Progress")}
                title="Mark as In Progress"
                disabled={isUpdatingTaskStatus}
              >
                <Clock
                  className={cn(
                    "h-4 w-4",
                    isUpdatingTaskStatus && "animate-spin"
                  )}
                />
                <span className="sr-only">Отметить как В процессе</span>
              </Button>
            )}
            {task.status !== "Done" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => handleUpdateTaskStatus(e, "Done")}
                title="Mark as Done"
                disabled={isUpdatingTaskStatus}
              >
                <CheckCircle2
                  className={cn(
                    "h-4 w-4",
                    isUpdatingTaskStatus && "animate-spin"
                  )}
                />
                <span className="sr-only">Отметить как выполненное</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="">
        <h4 className="font-medium mb-2">{task.title}</h4>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-2">
                {task.assignees.slice(0, 5).map((member) => (
                  <Avatar
                    key={member._id}
                    className="relative h-8 w-8 bg-gray-700 rounded-full border-2 border-background overflow-hidden"
                    title={member?.name || "Member"}
                  >
                    <AvatarImage
                      src={member?.profilePicture || undefined}
                      alt={member.name}
                    />
                    <AvatarFallback>
                      {member.name ? member.name.charAt(0) : "M"}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 5 && (
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                    +{task.assignees.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>

          {task.dueDate && (
            <div className="text-xs text-muted-foreground flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDueDateRussian(task.dueDate)}
            </div>
          )}
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {task.subtasks.filter((st) => st.completed).length}/
            {task.subtasks.length} подзадачи
          </div>
        )}
      </CardContent>
    </Card>
  );
};
