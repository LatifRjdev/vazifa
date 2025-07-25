import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTaskStatusMutation } from "@/hooks/use-task";
import { getTaskStatusRussian } from "@/lib/translations";
import type { TaskStatus } from "@/types";
import { toast } from "sonner";

export const TaskStatusSelector = ({
  status,
  taskId,
}: {
  status: TaskStatus;
  taskId: string;
}) => {
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
        <SelectItem value="To Do">Сделать</SelectItem>
        <SelectItem value="In Progress">В процессе</SelectItem>
        {/* <SelectItem value="Review">Review</SelectItem> */}
        <SelectItem value="Done">Сделано</SelectItem>
      </SelectContent>
    </Select>
  );
};
