import { useParams, useSearchParams } from "react-router";

export const useWorkspaceId = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  return workspaceId;
};

export const useWorkspaceSearchParamId = () => {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  return workspaceId;
};
