import type { Subtask } from "@/types";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  useCreateSubTaskMutation,
  useUpdateSubTaskMutation,
} from "@/hooks/use-task";
import { toast } from "sonner";

export const SubTasksDetails = ({
  subtasks,
  taskId,
}: {
  subtasks: Subtask[];
  taskId: string;
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const { mutate: createSubTask, isPending: isCreatingSubTask } =
    useCreateSubTaskMutation();
  const { mutate: updateSubTask, isPending: isUpdatingSubTask } =
    useUpdateSubTaskMutation();

  const handleSubtaskToggle = (subtaskId: string, checked: boolean) => {
    updateSubTask(
      { taskId, subtaskId, completed: checked },
      {
        onSuccess: () => {
          toast.success("Subtask updated successfully");
        },
        onError: (error) => {
          toast.error("Failed to update subtask");
          console.error(error);
        },
      }
    );
  };

  const handleAddSubtask = () => {
    createSubTask(
      { taskId, title: newSubtaskTitle.trim() },
      {
        onSuccess: () => {
          toast.success("Subtask created successfully");
          setNewSubtaskTitle("");
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.message || "Failed to create subtask";
          toast.error(errorMessage);
          console.error(error);
        },
      }
    );
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        Подзадачи
      </h3>

      <div className="space-y-2 mb-4">
        {subtasks.length > 0 ? (
          subtasks.map((subtask) => (
            <div key={subtask._id} className="flex items-center space-x-2">
              <Checkbox
                id={subtask._id}
                checked={subtask.completed}
                onCheckedChange={(checked) =>
                  handleSubtaskToggle(subtask._id, !!checked)
                }
                disabled={isUpdatingSubTask}
              />
              <label
                htmlFor={subtask._id}
                className={`text-sm ${
                  subtask.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {subtask.title}
              </label>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">Подзадач нет</div>
        )}
      </div>

      <div className="flex">
        <Input
          placeholder="Добавить подзадачу..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          disabled={isCreatingSubTask}
          className="mr-2"
        />
        <Button
          onClick={handleAddSubtask}
          disabled={!newSubtaskTitle.trim() || isCreatingSubTask}
        >
          Добавить
        </Button>
      </div>
    </div>
  );
};
