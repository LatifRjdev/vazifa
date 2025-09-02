import type { TaskFormData } from "@/components/tasks/create-task-dialog";
import { deleteData, fetchData, fetchDataFresh, postData, updateData } from "@/lib/fetch-utils";
import type { Attachment } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskData: TaskFormData }) =>
      postData(`/tasks`, data.taskData),
    onSuccess: async (data: any) => {
      // Принудительно инвалидируем все связанные кэши
      await queryClient.invalidateQueries({ 
        queryKey: ["my-tasks", "user"]
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["all-tasks"]
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["tasks-analytics"]
      });
      
      // Принудительно перезапрашиваем данные с сервера
      queryClient.refetchQueries({ 
        queryKey: ["my-tasks", "user"],
        type: 'active'
      });
      queryClient.refetchQueries({ 
        queryKey: ["all-tasks"],
        type: 'active'
      });
      queryClient.refetchQueries({ 
        queryKey: ["tasks-analytics"],
        type: 'active'
      });
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
    mutationFn: (data: { taskId: string; text: string; attachments?: any[] }) =>
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

export const useGetAllTasksQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["all-tasks"],
    queryFn: () => fetchData("/tasks/all-tasks"),
    enabled,
  });
};

export const useGetTasksAnalyticsQuery = () => {
  return useQuery({
    queryKey: ["tasks-analytics"],
    queryFn: () => fetchData("/tasks/analytics"),
  });
};

// Хуки для работы с ответами
export const useCreateResponseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string; text?: string; attachments?: any[] }) =>
      postData(`/tasks/${data.taskId}/responses`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["responses", data?.task] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?.task, 1],
      });
    },
  });
};

export const useGetTaskResponsesByIdQuery = (taskId: string) => {
  return useQuery({
    queryKey: ["responses", taskId],
    queryFn: () => fetchData(`/tasks/${taskId}/responses`),
    enabled: !!taskId,
  });
};

// Хук для ответа на комментарий
export const useReplyToCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { commentId: string; text?: string; attachments?: any[] }) =>
      postData(`/tasks/comments/${data.commentId}/reply`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data?.task] });
      queryClient.invalidateQueries({
        queryKey: ["activities", data?.task, 1],
      });
    },
  });
};

// Хук для получения выполненных задач
export const useGetCompletedTasksQuery = (params?: {
  search?: string;
  assignee?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const queryString = params ? new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)])
  ).toString() : "";
  
  return useQuery({
    queryKey: ["completed-tasks", params],
    queryFn: () => fetchData(`/tasks/completed${queryString ? `?${queryString}` : ""}`),
  });
};
