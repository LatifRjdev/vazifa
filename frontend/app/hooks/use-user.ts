import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { fetchData, postData, updateData } from "@/lib/fetch-utils";
import { queryClient } from "@/providers/react-query-provider";
import { toast } from "sonner";
import type {
  ChangePasswordFormData,
  ProfileFormData,
} from "@/routes/user/profile";

const queryKey: QueryKey = ["user"];

export const useUserProfileQuery = () => {
  return useQuery({
    queryKey,
    queryFn: () => fetchData("/users/profile"),
  });
};

export const useNotificationsQuery = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchData("/users/notifications"),
  });
};

export const useMarkAllNotificationsAsRead = () => {
  return useMutation({
    mutationFn: () => updateData("/users/notifications", { data: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkNotificationAsRead = () => {
  return useMutation({
    mutationFn: (id: string) =>
      updateData(`/users/notifications/${id}`, { data: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordFormData) =>
      updateData("/users/change-password", data),
  });
};

export const useUpdateUserProfile = () => {
  return useMutation({
    mutationFn: (data: ProfileFormData) => updateData("/users/profile", data),
  });
};

export const useGet2FAStatus = () => {
  return useQuery({
    queryKey: ["2fa-status"],
    queryFn: () => fetchData("/users/2fa-status"),
  });
};

export const useEnable2FA = () => {
  return useMutation({
    mutationFn: (data: any) => postData("/users/enable-2fa", data),
  });
};
``;
export const useVerify2FA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string }) => postData("/users/verify-2fa", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
  });
};

export const useDisable2FA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => postData("/users/disable-2fa", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const token = localStorage.getItem("token");
      const response = await fetch("/api-v1/users/avatar", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка загрузки аватара");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};
