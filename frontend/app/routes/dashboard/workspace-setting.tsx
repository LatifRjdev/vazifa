import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/shared/no-data";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { useGetWorkspaceDetailsQuery } from "@/hooks/use-workspace";
import { useWorkspaceSearchParamId } from "@/hooks/use-workspace-id";
import type { Workspace } from "@/types";
import { useNavigate } from "react-router";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Workspace Settings" },
    { name: "description", content: "Workspace Settings to TaskHub!" },
  ];
}
const WorkspaceSetting = () => {
  const workspaceId = useWorkspaceSearchParamId();
  const navigate = useNavigate();

  const { data, isPending } = useGetWorkspaceDetailsQuery(workspaceId!) as {
    data: Workspace;
    isPending: boolean;
  };

  if (isPending) {
    return <Loader message="Загрузка данных рабочего пространства" />;
  }

  if (!workspaceId || !data) {
    return (
      <NoDataFound
        title="Рабочее пространство не найдено"
        description="Пожалуйста, попробуйте еще раз"
        buttonText="Перейти к рабочим пространствам"
        buttonOnClick={() => {
          navigate(-1);
        }}
      />
    );
  }

  return (
    <div>
      <WorkspaceSettingsForm data={data} />
    </div>
  );
};

export default WorkspaceSetting;
