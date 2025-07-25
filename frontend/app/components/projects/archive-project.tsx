import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader } from "@/components/loader";
import { useAuth } from "@/providers/auth-context";
import { Archive, ArchiveX, Loader2 } from "lucide-react";
import { useArchiveProjectMutation } from "@/hooks/use-project";
import type { Project, Workspace } from "@/types";

export const ArchiveProject = ({
  project,
  workspace,
}: {
  project: Project;
  workspace: Workspace;
}) => {
  const { user } = useAuth();

  const { mutate: archiveProject, isPending } = useArchiveProjectMutation();

  const currentProjectMember = project.members.find(
    (m) => m.user._id === user?._id
  );
  const currentWorkspaceMember = workspace.members.find(
    (m) => m.user._id === user?._id
  );
  const isManager = currentProjectMember?.role === "manager";
  const isOwner = currentWorkspaceMember?.role === "owner";
  const canArchive = isManager || isOwner;

  const handleArchive = () => {
    archiveProject(
      { projectId: project._id },
      {
        onSuccess: (data: any) => {
          toast.success(
            data.isArchived ? "Проект в архиве." : "Проект разархивирован."
          );
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Не удалось обновить статус архива."
          );
        },
      }
    );
  };

  return (
    <div className="my-6 p-4 border rounded bg-muted">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-lg flex items-center gap-2">
            {project.isArchived ? (
              <>
                <ArchiveX className="w-5 h-5 text-destructive" /> В архиве
              </>
            ) : (
              <>
                <Archive className="w-5 h-5 text-muted-foreground" /> Нет в Архиве
                
              </>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {project.isArchived
              ? "This project is archived and read-only."
              : "You can archive this project to make it read-only."}
          </div>
        </div>
        {canArchive && (
          <Button
            variant={project.isArchived ? "secondary" : "outline"}
            onClick={handleArchive}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : project.isArchived ? (
              "Unarchive"
            ) : (
              "Archive"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
