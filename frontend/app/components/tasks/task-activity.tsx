import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { fetchData } from "@/lib/fetch-utils";
import type { ActivityLog } from "@/types";
import { Button } from "../ui/button";
import { getActivityIcon } from "./task-icons";

export const TaskActivity = ({ resourceId }: { resourceId: string }) => {
  const [page, setPage] = useState(1);

  const { data, isPending } = useQuery({
    queryKey: ["activities", resourceId, page],
    queryFn: () => fetchData(`/tasks/${resourceId}/activities?page=${page}`),
    placeholderData: keepPreviousData,
  }) as {
    data: {
      activities: ActivityLog[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
      };
    };
    isPending: boolean;
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const { activities, pagination } = data;

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Активность</h3>
      <div className="space-y-4">
        {activities?.map((activity) => (
          <div key={activity._id} className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {getActivityIcon(activity.action)}
            </div>
            <div>
              <p className="text-sm">
                <span className="font-medium">{activity?.user?.name || 'Неизвестный пользователь'}</span>{" "}
                {activity?.details?.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(activity.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          onClick={() => {
            if (page < pagination.totalPages) {
              setPage(page + 1);
            }
          }}
          disabled={page >= pagination.totalPages}
        >
          Загрузить больше
        </Button>
      </div>
    </div>
  );
};
