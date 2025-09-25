import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/dialogs/confirmation-dialog";
import { Loader } from "@/components/loader";
import { ProjectSettingsForm } from "@/components/projects/project-settings-form";
import { NoDataFound } from "@/components/shared/no-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfirmation } from "@/hooks/use-confirmation";
import {
  useDeleteProjectMutation,
  useGetProjectDetailsQuery,
  useRemoveProjectMemberMutation,
} from "@/hooks/use-project";
import type { Project, Workspace } from "@/types";

import { AddProjectMembers } from "@/components/projects/add-project-members";
import { useAuth } from "@/providers/auth-context";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Route } from "../../../+types/root";
import { ArchiveProject } from "@/components/projects/archive-project";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Project Settings" },
    { name: "description", content: "Project Settings to TaskHub!" },
  ];
}

const ProjectSettingsPage = () => {
  const { projectId, workspaceId } = useParams<{
    projectId: string;
    workspaceId: string;
  }>();
  const navigate = useNavigate();
  const { isOpen, confirm, handleConfirm, handleCancel, confirmationOptions } =
    useConfirmation();
  const { user } = useAuth();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data, isLoading } = useGetProjectDetailsQuery(projectId!) as {
    data: { project: Project; workspace: Workspace };
    isLoading: boolean;
  };

  const { mutate: deleteProject, isPending: isDeleting } =
    useDeleteProjectMutation();

  const workspaceMembers = data?.workspace?.members || [];

  // Permission checks
  const currentProjectMember = data?.project?.members?.find(
    (m) => m.user._id === user?._id
  );
  const currentWorkspaceMember = workspaceMembers?.find(
    (m) => m.user._id === user?._id
  );
  const isManager = currentProjectMember?.role === "manager";
  const isOwner = currentWorkspaceMember?.role === "owner";
  const canEditMembers = isManager || isOwner;

  const handleDelete = () => {
    confirm({
      title: "Delete Project",
      message:
        "This action cannot be undone. This will permanently delete your project and remove all associated data.",
      onConfirm: async () => {
        deleteProject(projectId!, {
          onSuccess: () => {
            toast.success("Project deleted successfully");
            navigate(`/workspaces/${workspaceId}`);
          },
          onError: (error: any) => {
            toast.error(
              error?.response?.data?.message || "Failed to delete project"
            );
            console.log(error);
          },
        });
      },
    });
  };

  const { mutate: removeUser, isPending: isRemoving } =
    useRemoveProjectMemberMutation();

  // Remove member logic
  const handleRemoveMember = (userId: string) => {
    if (!data?.project) return;

    confirm({
      title: "Remove Project Member",
      message:
        "This action will remove the member from the project and remove all associated data.",
      onConfirm: async () => {
        removeUser(
          {
            projectId: projectId!,
            userId: userId,
          },
          {
            onSuccess: () => {
              toast.success("Member removed successfully");
              setRemovingId(null);
            },
            onError: (error: any) => {
              toast.error(
                error?.response?.data?.message || "Failed to remove member"
              );
            },
          }
        );
      },
    });
  };

  if (isLoading) return <Loader message="Loading project settings..." />;

  const { project, workspace } = data;

  if (!project)
    return (
      <NoDataFound
        title="Project not found"
        description="The project you are looking for does not exist."
        buttonText="Go to projects"
        buttonOnClick={() => navigate(-1)}
      />
    );

  return (
    <div className="p-3 md:p-6 max-w-4xl mx-auto space-y-6">
      <ProjectSettingsForm project={project} projectId={projectId!} />

      <Card>
        <CardHeader>
          <CardTitle>Участники проекта</CardTitle>
          <CardDescription>
            Список всех участников этого проекта.
          </CardDescription>
          {canEditMembers && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" /> Добавить участника
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {project.members && project.members.length > 0 ? (
              project.members.map((member) => (
                <div
                  key={member.user._id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.profilePicture} />
                      <AvatarFallback>
                        {member.user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        member.role === "manager" ? "destructive" : "secondary"
                      }
                      className="capitalize"
                    >
                      {member.role}
                    </Badge>
                    {canEditMembers && user?._id !== member.user._id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.user._id)}
                        disabled={isRemoving && removingId === member.user._id}
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground py-3">
                Участники не найдены.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Archive Project Section */}
      <ArchiveProject project={project} workspace={workspace} />

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Опасная зона</CardTitle>
          <CardDescription>
            Необратимые действия для вашего проекта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full md:w-auto"
          >
            Удалить проект
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

      {/* Add Member Dialog */}
      <AddProjectMembers
        projectId={projectId!}
        addDialogOpen={addDialogOpen}
        setAddDialogOpen={setAddDialogOpen}
        workspaceMembers={workspaceMembers}
        projectMembers={project.members}
      />
    </div>
  );
};

export default ProjectSettingsPage;
