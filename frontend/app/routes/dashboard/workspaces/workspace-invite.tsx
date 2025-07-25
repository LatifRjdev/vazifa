import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import {
  useAcceptGeneralWorkspaceInviteMutation,
  useAcceptWorkspaceInviteByTokenMutation,
  useGetWorkspaceDetailsQuery,
} from "@/hooks/use-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import type { Workspace } from "@/types";

const WorkspaceInvitePage = () => {
  const workspaceId = useWorkspaceId();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("tk");

  const navigate = useNavigate();

  if (!workspaceId) {
    return <div>Рабочее пространство не найдено</div>;
  }

  const { data: workspace, isLoading } = useGetWorkspaceDetailsQuery(
    workspaceId
  ) as {
    data: Workspace;
    isLoading: boolean;
  };

  const { mutate: acceptInviteByToken, isPending: isAcceptingByToken } =
    useAcceptWorkspaceInviteByTokenMutation();
  const { mutate: acceptGeneralInvite, isPending: isAcceptingGeneral } =
    useAcceptGeneralWorkspaceInviteMutation();

  const handleAcceptInvite = async () => {
    if (!workspaceId) return;

    try {
      if (token) {
        acceptInviteByToken(
          { token },
          {
            onSuccess: () => {
              toast.success(
                `You've joined ${workspace?.name || "the workspace"}`
              );
              navigate(`/workspaces/${workspaceId}`);
            },
            onError: (error: any) => {
              toast.error(error.response.data.message);
            },
          }
        );
      } else {
        acceptGeneralInvite(
          { workspaceId },
          {
            onSuccess: () => {
              toast.success(
                `You've joined ${workspace?.name || "the workspace"}`
              );
              navigate(`/workspaces/${workspaceId}`);
            },
            onError: (error) => {
              toast.error(error.message);
            },
          }
        );
      }
    } catch (error) {
      toast.error("Failed to join workspace");
    }
  };

  const handleDeclineInvite = () => {
    toast.info("Invitation declined");
    navigate("/workspaces");
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader message="Загрузка данных рабочего пространства..." />
      </div>
    );

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Недействительное приглашение</CardTitle>
            <CardDescription>
              Это приглашение в рабочее пространство недействительно или срок его действия истек.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/workspaces")} className="w-full">
              Перейти к рабочим пространствам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <WorkspaceAvatar name={workspace.name} color={workspace.color} />
            <CardTitle>{workspace.name}</CardTitle>
          </div>
          <CardDescription>
            Вас пригласили присоединиться "<strong>{workspace.name}</strong>"
            к рабочему пространству.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workspace.description && (
            <p className="text-sm text-muted-foreground">
              {workspace.description}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="default"
              className="flex-1"
              onClick={handleAcceptInvite}
              disabled={isAcceptingByToken || isAcceptingGeneral}
            >
              {isAcceptingByToken || isAcceptingGeneral
                ? "Joining..."
                : "Accept Invitation"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDeclineInvite}
              disabled={isAcceptingByToken || isAcceptingGeneral}
            >
              Отклонить
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceInvitePage;
