import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { ProjectMemberRole, Task, User } from "@/types";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { useUpdateTaskAssigneesMutation } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskAssigneeSelector = ({
  task,
  assignee,
  projectMembers,
}: {
  task: Task;
  assignee: User[];
  projectMembers: {
    user: User;
    role: ProjectMemberRole;
  }[];
}) => {
  // Store selected assignee IDs locally
  const [selectedIds, setSelectedIds] = useState<string[]>(
    assignee.map((a) => a._id)
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { mutate, isPending } = useUpdateTaskAssigneesMutation();

  const handleToggle = (id: string) => {
    let newSelected: string[];
    if (selectedIds.includes(id)) {
      newSelected = selectedIds.filter((sid) => sid !== id);
    } else {
      newSelected = [...selectedIds, id];
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = projectMembers.map((m) => m.user._id);
    setSelectedIds(allIds);
    // handleAssigneeChange(allIds);
  };

  const handleUnselectAll = () => {
    setSelectedIds([]);
    // handleAssigneeChange([]);
  };

  const handleAssigneeChange = (ids: string[]) => {
    mutate(
      { taskId: task._id, assignees: ids },
      {
        onSuccess: () => {
          setDropdownOpen(false);
          toast.success("Task assignees updated");
        },
        onError: (error) => {
          console.error("Error updating task assignees:", error);
          toast.error("Error updating task assignees");
        },
      }
    );
  };
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        Исполнители
      </h3>
      {/* Show selected assignees */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedIds.length === 0 ? (
          <span className="text-xs text-gray-400">Неназначенный</span>
        ) : (
          projectMembers
            .filter((m) => selectedIds.includes(m.user._id))
            .map((member) => (
              <div
                key={member.user._id}
                className="flex items-center bg-gray-100 rounded px-2 py-1"
              >
                <Avatar className="h-6 w-6 mr-1">
                  <AvatarImage src={member.user.profilePicture} />
                  <AvatarFallback>
                    {member.user.name ? member.user.name.charAt(0) : "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{member.user.name}</span>
              </div>
            ))
        )}
      </div>
      {/* Dropdown for multi-select */}
      <div className="relative">
        <button
          type="button"
          className="w-full border rounded px-3 py-2 text-left bg-white"
          onClick={() => setDropdownOpen((o) => !o)}
        >
          {selectedIds.length === 0
            ? "Select assignees"
            : `${selectedIds.length} selected`}
        </button>
        {dropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
            <div className="flex justify-between px-2 py-1 border-b">
              <button
                className="text-xs text-blue-600"
                onClick={handleSelectAll}
                type="button"
              >
                Выбрать Все
              </button>
              <button
                className="text-xs text-red-600"
                onClick={handleUnselectAll}
                type="button"
              >
                Отменить выбор всех
              </button>
            </div>
            {projectMembers.map((member) => (
              <label
                key={member.user._id}
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50"
              >
                <Checkbox
                  checked={selectedIds.includes(member.user._id)}
                  onCheckedChange={() => handleToggle(member.user._id)}
                  className="mr-2"
                />
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={member.user.profilePicture} />
                  <AvatarFallback>
                    {member.user.name ? member.user.name.charAt(0) : "?"}
                  </AvatarFallback>
                </Avatar>
                <span>{member.user.name}</span>
              </label>
            ))}

            <div className="flex justify-end px-2 py-1">
              <Button
                variant="outline"
                size="sm"
                className="font-light"
                disabled={isPending}
                onClick={() => {
                  setDropdownOpen(false);
                }}
              >
                Отмена
              </Button>
              <Button
                size="sm"
                className="font-light"
                disabled={isPending}
                onClick={() => {
                  handleAssigneeChange(selectedIds);
                }}
              >
                Сохранить изменения
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
