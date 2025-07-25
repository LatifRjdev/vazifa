import type { ProjectData } from "@/components/projects/create-project-dialog";
import type { ProjectSettingsForm } from "@/components/projects/project-settings-form";
import { deleteData, fetchData, postData, updateData } from "@/lib/fetch-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectData: ProjectData; workspaceId: string }) =>
      postData(
        `/projects/${data?.workspaceId}/create-project`,
        data.projectData
      ),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace", data?.workspace],
      });
    },
  });
};

export const useGetProjectQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchData(`/projects/${projectId}/tasks`),
    enabled: !!projectId,
  });
};

export const useGetProjectDetailsQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project-details", projectId],
    queryFn: () => fetchData(`/projects/${projectId}`),
    enabled: !!projectId,
  });
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      projectId: string;
      projectData: ProjectSettingsForm;
    }) => updateData(`/projects/${data.projectId}/update`, data.projectData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["project", data?._id] });
    },
  });
};

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => deleteData(`/projects/${projectId}`),
    // onSuccess: (_data, projectId) => {
    //   queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    // },
  });
};

export const useAddProjectMembersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      members: { user: string; role: string }[];
    }) =>
      postData(`/projects/${data.projectId}/add-member`, {
        members: data.members,
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["project-details", data?._id],
      });
      queryClient.invalidateQueries({ queryKey: ["project", data?._id] });
    },
  });
};

export const useRemoveProjectMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string; userId: string }) =>
      deleteData(`/projects/${data.projectId}/remove-member/${data.userId}`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["project-details", data?._id],
      });
      queryClient.invalidateQueries({ queryKey: ["project", data?._id] });
    },
  });
};

export const useArchiveProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) =>
      updateData(`/projects/${projectId}/archive`, {}),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project-details", variables.projectId],
      });
    },
  });
};
