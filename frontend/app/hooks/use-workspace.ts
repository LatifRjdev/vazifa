import type { CreateWorkspaceForm } from "@/components/workspace/create-workspace";
import { deleteData, fetchData, postData, updateData } from "@/lib/fetch-utils";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

const queryKey: QueryKey = ["workspaces"];

// MUTATIONS - POST PATCH DELETE
export const useCreateWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkspaceForm) => postData("/workspaces", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useAcceptWorkspaceInviteByTokenMutation = () => {
  return useMutation({
    mutationFn: (data: { token: string }) =>
      postData("/workspaces/accept-invite-token", data),
  });
};

export const useAcceptGeneralWorkspaceInviteMutation = () => {
  return useMutation({
    mutationFn: (data: { workspaceId: string }) =>
      postData(`/workspaces/${data.workspaceId}/accept-invite-general`, data),
  });
};

export const useUpdateWorkspaceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      name: string;
      description: string;
      color: string;
    }) => updateData(`/workspaces/${data.workspaceId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

export const useTransferWorkspaceOwnershipMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { workspaceId: string; newOwnerId: string }) =>
      postData(`/workspaces/${data.workspaceId}/transfer-ownership`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useInviteMembersToWorkspaceMutation = () => {
  return useMutation({
    mutationFn: (data: { workspaceId: string; email: string; role: string }) =>
      postData(`/workspaces/${data.workspaceId}/invite-member`, data),
  });
};

// QUERIES - GET

export const useGetWorkspaceStatsQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", "stats", workspaceId],
    queryFn: () => fetchData(`/workspaces/${workspaceId}/stats`),
    enabled: !!workspaceId,
  });
};

export const useGetWorkspaceDetailsQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", "detail", workspaceId],
    queryFn: () => fetchData(`/workspaces/${workspaceId}`),
    enabled: !!workspaceId,
  });
};

export const useGetWorkspaceQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => fetchData(`/workspaces/${workspaceId}/projects`),
    // enabled: !!workspaceId,
  });
};

export const useGetWorkspacesQuery = () => {
  return useQuery({
    queryKey,
    queryFn: () => fetchData("/workspaces"),
  });
};

export const useDeleteWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) =>
      deleteData(`/workspaces/${workspaceId}`),
  });
};
