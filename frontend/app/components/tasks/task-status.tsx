import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTaskStatusMutation } from "@/hooks/use-task";
import { getTaskStatusRussian } from "@/lib/translations";
import type { TaskStatus, Task } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-context";

export const TaskStatusSelector = ({
  status,
  taskId,
  task,
}: {
  status: TaskStatus;
  taskId: string;
  task?: Task;
}) => {
  const { user } = useAuth();

  // Проверка прав на отмену задачи
  const canCancel = user?.role && (
    ["admin", "super_admin", "chief_manager"].includes(user.role) ||
    (task?.responsibleManager && (
      typeof task.responsibleManager === 'string'
        ? task.responsibleManager === user._id
        : task.responsibleManager._id === user._id
    ))
  );
  const { mutate: updateTaskStatus, isPending: isUpdatingTaskStatus } =
    useUpdateTaskStatusMutation();

  const handleStatusChange = (value: string) => {
    updateTaskStatus(
      { taskId, status: value as TaskStatus },
      {
        onSuccess: () => {
          toast.success("Статус обновлен");
        },
        onError: (error) => {
          console.log(error);
          toast.error("Не удалось обновить статус");
        },
      }
    );
  };

  return (
    <Select value={status || ""} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px]" disabled={isUpdatingTaskStatus}>
        <SelectValue placeholder="Статус">
          {status ? getTaskStatusRussian(status) : "Статус"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="To Do">К выполнению</SelectItem>
        <SelectItem value="In Progress">В процессе</SelectItem>
        {/* <SelectItem value="Review">Review</SelectItem> */}
        <SelectItem value="Done">Выполнено</SelectItem>
        {canCancel && <SelectItem value="Cancelled">Отменен</SelectItem>}
      </SelectContent>
    </Select>
  );
};
