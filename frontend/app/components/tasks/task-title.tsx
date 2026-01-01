import { Edit, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useUpdateTaskTitleMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskTitle = ({
  title,
  taskId,
}: {
  title: string;
  taskId: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const { mutate, isPending } = useUpdateTaskTitleMutation();

  const updateTaskTitle = async () => {
    mutate(
      { taskId, title: newTitle },
      {
        onSuccess: () => {
          toast.success("Task title updated successfully");
          setIsEditing(false);
        },
        onError: (error) => {
          toast.error("Failed to update task title");
          console.error(error);
        },
      }
    );
  };

  return (
    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
      {isEditing ? (
        <Input
          className="text-xl font-semibold flex-1 min-w-0"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isPending}
        />
      ) : (
        <h2 className="text-xl flex-1 font-semibold truncate min-w-0">{title}</h2>
      )}
      {isEditing ? (
        <Button
          className="shrink-0"
          size={"sm"}
          disabled={isPending}
          onClick={updateTaskTitle}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
