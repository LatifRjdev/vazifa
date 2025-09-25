import type { TaskPriority } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useUpdateTaskPriorityMutation } from "@/hooks/use-task";
import { getPriorityRussian } from "@/lib/translations";
import { toast } from "sonner";

export const TaskPrioritySelector = ({
  priority,
  taskId,
}: {
  priority: TaskPriority;
  taskId: string;
}) => {
  const { mutate, isPending } = useUpdateTaskPriorityMutation();

  const handlePriorityChange = (value: string) => {
    mutate(
      { taskId, priority: value as TaskPriority },
      {
        onSuccess: () => {
          toast.success("Приоритет обновлен");
        },
        onError: (error) => {
          toast.error("Не удалось обновить приоритет");
          console.error(error);
        },
      }
    );
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        Приоритет
      </h3>
      <Select
        value={priority || "Medium"}
        disabled={isPending}
        onValueChange={handlePriorityChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Установить приоритет">
            {priority ? getPriorityRussian(priority) : "Установить приоритет"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Low">Низкий</SelectItem>
          <SelectItem value="Medium">Средний</SelectItem>
          <SelectItem value="High">Высокий</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
