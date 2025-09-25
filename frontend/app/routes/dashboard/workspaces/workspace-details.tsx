import { useState } from "react";
import { useParams } from "react-router";

import { Loader } from "@/components/loader";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { InviteMembersDialog } from "@/components/workspace/invite-members-dialog";
import { ProjectsList } from "@/components/workspace/projects-list";
import {
  WorkspaceHeader,
  type MemberProps,
} from "@/components/workspace/workspace-header";
import { useGetWorkspaceQuery } from "@/hooks/use-workspace";
import type { Project, Workspace } from "@/types";

import type { Route } from "../../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Workspace Details" },
    { name: "description", content: "Workspace Details to TaskHub!" },
  ];
}

const WorkspaceDetailsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  if (!workspaceId) {
    return <div>Рабочее пространство не найдено</div>;
  }

  const { data, isPending } = useGetWorkspaceQuery(workspaceId) as {
    data: {
      workspace: Workspace;
      projects: Project[];
    };
    isPending: boolean;
  };

  if (isPending) return <Loader message="Загрузка данных рабочего пространства..." />;

  return (
    <div className="space-y-8">
      <WorkspaceHeader
        workspace={data?.workspace as Workspace}
        members={data?.workspace?.members as MemberProps[]}
        onCreateProject={() => setIsCreateProjectOpen(true)}
        onInviteMembers={() => setIsInviteDialogOpen(true)}
      />

      <ProjectsList
        projects={data?.projects}
        workspaceId={workspaceId}
        onCreateProject={() => setIsCreateProjectOpen(true)}
      />

      {/* Create Project */}
      <CreateProjectDialog
        workspaceId={data?.workspace._id}
        isOpen={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        workspaceMembers={data?.workspace?.members as MemberProps[]}
      />

      <InviteMembersDialog
        workspaceId={workspaceId}
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </div>
  );
};

export default WorkspaceDetailsPage;
