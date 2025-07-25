import { format } from "date-fns";
import { CirclePlus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/shared/no-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import { useGetWorkspacesQuery } from "@/hooks/use-workspace";
import type { Workspace } from "@/types";

import type { Route } from "../../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Workspaces" },
    { name: "description", content: "Workspaces to TaskHub!" },
  ];
}

const Workspaces = () => {
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const { data: workspaces, isPending } = useGetWorkspacesQuery() as {
    data: Workspace[];
    isPending: boolean;
  };

  if (isPending) return <Loader message="Загрузка рабочих пространств..." />;

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-3xl font-bold">Рабочие пространства</h2>
          <Button
            onClick={() => setIsCreateWorkspaceOpen(true)}
            className="text-xs md:text-sm"
          >
            <CirclePlus className="mr-2 h-4 w-4 hidden md:block" />
            Новая рабочая область
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces?.map((workspace: Workspace) => (
            <WorkspaceCard key={workspace._id} workspace={workspace} />
          ))}

          {workspaces?.length === 0 && (
            <NoDataFound
              title="Рабочие пространства не найдены"
              description="Создайте новое рабочее пространство, чтобы начать работу"
              buttonText="Создать рабочую область"
              buttonOnClick={() => setIsCreateWorkspaceOpen(true)}
            />
          )}
        </div>
      </div>

      <CreateWorkspace
        isCreateWorkspaceOpen={isCreateWorkspaceOpen}
        setIsCreateWorkspaceOpen={setIsCreateWorkspaceOpen}
      />
    </>
  );
};

const WorkspaceCard = ({ workspace }: { workspace: Workspace }) => {
  return (
    <Link to={`/workspaces/${workspace._id}`}>
      <Card className="transition-all hover:shadow-md hover:-translate-y-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <WorkspaceAvatar color={workspace.color} name={workspace.name} />
              <div>
                <CardTitle>{workspace.name}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  Создано в {format(workspace.createdAt, "MMM d, yyyy h:mm a")}
                </span>
              </div>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span className="text-xs">{workspace?.members?.length || 1}</span>
            </div>
          </div>
          <CardDescription>
            {workspace.description || "Нет описания"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Просмотр информации о рабочем пространстве и проектах
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Workspaces;
