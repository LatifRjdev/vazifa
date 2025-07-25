import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  Eye,
  EyeOff,
  FileEdit,
  FolderEdit,
  FolderPlus,
  LogIn,
  MessageSquare,
  Upload,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/dialogs/confirmation-dialog";
import { Loader } from "@/components/loader";
import { CommentSection } from "@/components/tasks/comment-section";
import { NoTaskFound } from "@/components/tasks/no-task-found";
import { SubTasksDetails } from "@/components/tasks/sub-tasks";
import { TaskActivity } from "@/components/tasks/task-activity";
import { TaskAssigneeSelector } from "@/components/tasks/task-assignees";
import { TaskAttachments } from "@/components/tasks/task-attachments";
import { TaskDescription } from "@/components/tasks/task-description";
import { TaskPrioritySelector } from "@/components/tasks/task-priority";
import { TaskStatusSelector } from "@/components/tasks/task-status";
import { TaskTitle } from "@/components/tasks/task-title";
import { WatchersList } from "@/components/tasks/watchers-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/hooks/use-confirmation";
import {
  useArchiveTaskMutation,
  useDeleteTaskMutation,
  useGetTaskByIdQuery,
  useTaskWatcherMutation,
} from "@/hooks/use-task";
import { useAuth } from "@/providers/auth-context";
import type { ActionType, Project, Task } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Route } from "../../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Task Details" },
    { name: "description", content: "Task Details to TaskHub!" },
  ];
}

const TaskDetailsPage = () => {
  const { user } = useAuth();

  const { workspaceId, projectId, taskId } = useParams<{
    workspaceId: string;
    projectId: string;
    taskId: string;
  }>();
  const navigate = useNavigate();
  const { confirm, confirmationOptions, handleCancel, handleConfirm, isOpen } =
    useConfirmation();

  const { data, isLoading } = useGetTaskByIdQuery(taskId!) as {
    data: {
      task: Task;
      project: Project;
    };
    isLoading: boolean;
  };

  const { mutate: updateTaskWatcher, isPending: isUpdatingTaskWatcher } =
    useTaskWatcherMutation();
  const { mutate: archiveTask, isPending: isArchivingTask } =
    useArchiveTaskMutation();
  const { mutate: deleteTask, isPending: isDeletingTask } =
    useDeleteTaskMutation();

  if (isLoading) return <Loader message="Загрузка сведений о задаче..." />;

  if (!data) return <NoTaskFound />;

  const { task } = data;
  const isUserWatching = task.watchers?.some(
    (watcher) => watcher._id === user?._id
  );

  const goBack = () => {
    navigate(-1);
  };

  const toggleWatchStatus = async () => {
    if (!taskId || !task) return;

    try {
      updateTaskWatcher(
        { taskId: task._id },
        {
          onSuccess: () => {
            toast.success(
              isUserWatching ? "Removed from watchers" : "Added to watchers"
            );
          },
          onError: (error) => {
            console.log(error);
            toast.error("Failed to update watch status");
          },
        }
      );
    } catch (error) {
      toast.error("Failed to update watch status");
    }
  };

  const handleArchiveTask = async () => {
    if (!taskId || !task) return;

    try {
      archiveTask(
        { taskId: task._id },
        {
          onSuccess: () => {
            toast.success(
              task.isArchived ? "Задача разархивирована" : "Задача заархивирована"
            );
          },
          onError: (error) => {
            console.log(error);
            toast.error("Failed to update archive status");
          },
        }
      );
    } catch (error) {
      toast.error("Failed to update archive status");
    }
  };

  const handleDeleteTask = () => {
    confirm({
      title: "Delete Task",
      message:
        "This action cannot be undone. This will permanently delete your task and remove all associated data.",
      onConfirm: async () => {
        deleteTask(
          { taskId: taskId! },
          {
            onSuccess: () => {
              toast.success("Task deleted successfully");
              navigate(`/workspaces/${workspaceId}/projects/${projectId}`);
            },
            onError: (error: any) => {
              toast.error(
                error?.response?.data?.message || "Failed to delete task"
              );
              console.log(error);
            },
          }
        );
      },
    });
  };

  const members = task.assignees || [];

  return (
    <div className="contain mx-auto p-0 py-4 md:p-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-4 w-fit px-0 md:px-4"
            onClick={goBack}
          >
            ← Назад
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">{task.title}</h1>
          {task.isArchived && (
            <Badge variant="outline" className="ml-2">
              Архивировано
            </Badge>
          )}
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleWatchStatus}
            disabled={isUpdatingTaskWatcher}
            className="w-fit"
          >
            {isUserWatching ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Отменить просмотр
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Смотреть
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchiveTask}
            disabled={isArchivingTask}
          >
            {task.isArchived ? "Разархивировать" : "В архив"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Task details */}
          <div className="bg-card rounded-lg p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
              <div>
                <Badge
                  className="mb-2 capitalize"
                  variant={
                    task.priority === "High"
                      ? "destructive"
                      : task.priority === "Medium"
                      ? "default"
                      : "outline"
                  }
                >
                  {task.priority} приоритет
                </Badge>
                <TaskTitle title={task.title} taskId={task._id} />
                <div className="text-sm md:text-base text-muted-foreground">
                  Созданно{" "}
                  {formatDistanceToNow(new Date(task.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 md:mt-0">
                {/* Task status dropdown */}
                <TaskStatusSelector status={task.status} taskId={task._id} />

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteTask}
                  disabled={isDeletingTask}
                  className="hidden md:block"
                >
                  Удалить задачу
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-0">
                Описание
              </h3>
              <TaskDescription
                description={task.description || "Описание не предоставлено."}
                taskId={task._id}
              />
            </div>

            {/* Assignee selection */}
            <TaskAssigneeSelector
              task={task}
              assignee={task.assignees}
              projectMembers={data.project.members}
            />

            {/* Priority selection */}
            <TaskPrioritySelector priority={task.priority} taskId={task._id} />

            {/* Attachments */}
            <TaskAttachments
              attachments={task.attachments || []}
              taskId={task._id}
            />

            {/* Subtasks */}
            <SubTasksDetails subtasks={task.subtasks || []} taskId={task._id} />
          </div>

          {/* Comments section */}
          <CommentSection taskId={task._id} members={members} />
        </div>

        {/* Right sidebar - Activity/History */}
        <div>
          <WatchersList watchers={task.watchers || []} />

          <TaskActivity resourceId={task._id} />
        </div>
      </div>

      <Card className="md:hidden">
        <CardHeader>
          <CardTitle className="text-destructive">Опасная зона</CardTitle>
          <CardDescription>Необратимые действия для вашей задачи</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteTask}
            disabled={isDeletingTask}
          >
            Удалить задачу
          </Button>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={confirmationOptions?.title || ""}
        message={confirmationOptions?.message || ""}
      />
    </div>
  );
};

export default TaskDetailsPage;
