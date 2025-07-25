import { useAddProjectMembersMutation } from "@/hooks/use-project";
import type { User } from "@/types";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Props {
  addDialogOpen: boolean;
  setAddDialogOpen: (open: boolean) => void;
  workspaceMembers: { user: User; role: string }[];
  projectMembers: { user: User; role: string }[];
  projectId: string;
}

export const AddProjectMembers = ({
  projectId,
  addDialogOpen,
  setAddDialogOpen,
  workspaceMembers,
  projectMembers,
}: Props) => {
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [addRole, setAddRole] = useState("contributor");

  // Add member logic
  const { mutate: updateProject, isPending: isUpdating } =
    useAddProjectMembersMutation();

  const handleAddMembers = () => {
    if (!projectId) return;

    const newMembers = [
      ...projectMembers.map((m) => ({ user: m.user._id, role: m.role })),
      ...selectedToAdd.map((userId) => ({ user: userId, role: addRole })),
    ];

    updateProject(
      {
        projectId: projectId!,
        members: newMembers,
      },
      {
        onSuccess: () => {
          toast.success("Members added successfully");
          setAddDialogOpen(false);
          setSelectedToAdd([]);
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Failed to add members"
          );
          console.log(error);
        },
      }
    );
  };

  return (
    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить участников проекта</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="font-medium">Выберите участников для добавления:</div>
          <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
            {workspaceMembers
              ?.filter(
                (wm) =>
                  !projectMembers.some((pm) => pm.user._id === wm.user._id)
              )
              .map((wm) => (
                <div
                  key={wm.user._id}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <Checkbox
                    checked={selectedToAdd.includes(wm?.user?._id)}
                    onCheckedChange={(checked) => {
                      setSelectedToAdd((prev) =>
                        checked
                          ? [...prev, wm.user._id]
                          : prev.filter((id) => id !== wm.user._id)
                      );
                    }}
                    id={`add-member-${wm.user._id}`}
                  />
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={wm.user.profilePicture} />
                    <AvatarFallback>
                      {wm.user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1">
                    {wm.user.name} ({wm.user.email})
                  </span>
                </div>
              ))}
          </div>
          <div>
            <div className="font-medium mb-1">Роль для новых участников</div>
            <Select value={addRole} onValueChange={setAddRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Менеджер</SelectItem>
                <SelectItem value="contributor">Автор</SelectItem>
                <SelectItem value="viewer">Оценщик</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAddMembers}
            disabled={selectedToAdd.length === 0 || isUpdating}
          >
            Добавить выбранных участников
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
