import type { TaskFormData } from "@/components/tasks/create-task-dialog";
import { deleteData, fetchData, postData, updateData } from "@/lib/fetch-utils";
import type { Attachment } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskData: TaskFormData; projectId: string }) =>
      postData(`/tasks/${data.projectId}/create-task`, data.taskData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["project", data?.project] });
    },
  });
};

export const useUpdateTaskStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string; status: string }) =>
      updateData(`/tasks/${data.taskId}/status`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({ queryKey: ["project", data?.project] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useUpdateTaskTitleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string; title: string }) =>
      updateData(`/tasks/${data.taskId}/title`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useUpdateTaskDescriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string; description: string }) =>
      updateData(`/tasks/${data.taskId}/description`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useTaskWatcherMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string }) =>
      postData(`/tasks/${data.taskId}/watch`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useArchiveTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string }) =>
      postData(`/tasks/${data.taskId}/archive`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useUpdateTaskAssigneesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string; assignees: string[] }) =>
      updateData(`/tasks/${data.taskId}/assignees`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useUpdateTaskPriorityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string; priority: string }) =>
      updateData(`/tasks/${data.taskId}/priority`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useCreateSubTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string; title: string }) =>
      postData(`/tasks/${data.taskId}/subtasks`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useUpdateSubTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      taskId: string;
      subtaskId: string;
      completed: boolean;
    }) => updateData(`/tasks/${data.taskId}/subtasks/${data.subtaskId}`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useCreateCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string; text: string }) =>
      postData(`/tasks/${data.taskId}/comments`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data?.task] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?.task, 1],
      });
    },
  });
};

export const useToggleCommentReactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { commentId: string; emoji: string }) =>
      postData(`/tasks/${data.commentId}/reaction`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data?.task] });
      // queryClient.invalidateQueries({
      //   queryKey: ["activities", data?.task, 1],
      // });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string }) =>
      deleteData(`/tasks/${data.taskId}`),
  });
};

export const useAddTaskAttachmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      taskId: string;
      attachment: {
        fileName: string;
        fileUrl: string;
        fileType?: string;
        fileSize?: number;
      };
    }) => postData(`/tasks/${data.taskId}/attachments`, data.attachment),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data?._id] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?._id, 1],
      });
    },
  });
};

export const useGetTaskByIdQuery = (taskId: string) => {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchData(`/tasks/${taskId}`),
    enabled: !!taskId,
  });
};

export const useGetTaskCommentsByIdQuery = (taskId: string) => {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => fetchData(`/tasks/${taskId}/comments`),
  });
};

export const useGetMyTasksQuery = () => {
  return useQuery({
    queryKey: ["my-tasks", "user"],
    queryFn: () => fetchData("/tasks/my-tasks"),
  });
};
