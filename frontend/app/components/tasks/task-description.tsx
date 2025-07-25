import { Edit, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useUpdateTaskDescriptionMutation } from "@/hooks/use-task";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export const TaskDescription = ({
  description,
  taskId,
}: {
  description: string;
  taskId: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newDescription, setNewDescription] = useState(description);
  const { mutate, isPending } = useUpdateTaskDescriptionMutation();

  const updateTaskDescription = async () => {
    mutate(
      { taskId, description: newDescription },
      {
        onSuccess: () => {
          toast.success("Task description updated successfully");
          setIsEditing(false);
        },
        onError: (error) => {
          toast.error("Failed to update task description");
          console.error(error);
        },
      }
    );
  };

  return (
    <div className="flex gap-2">
      {isEditing ? (
        <Textarea
          className="w-full min-w-3xl"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          disabled={isPending}
        />
      ) : (
        <div className="bg-muted/50 p-4 rounded-md text-sm md:text-base text-pretty text-muted-foreground">
          {description}
        </div>
      )}
      {isEditing ? (
        <Button
          className="py-0"
          size={"sm"}
          disabled={isPending}
          onClick={updateTaskDescription}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
        </Button>
      ) : (
        <Edit
          className="min-w-4 min-h-4 w=4 h-4 cursor-pointer"
          onClick={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};
