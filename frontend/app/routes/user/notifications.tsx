import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Loader } from "@/components/loader";
import { BackButton } from "@/components/shared/back-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotificationsQuery,
} from "@/hooks/use-user";
import type { Notification } from "@/types";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Notifications" },
    { name: "description", content: "Notifications to TaskHub!" },
  ];
}

const NotificationsPage = () => {
  const { data, isLoading } = useNotificationsQuery() as {
    data: {
      notifications: Notification[];
      unreadCount: number;
    };
    isLoading: boolean;
  };

  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
    useMarkAllNotificationsAsRead();
  const { mutate: markAsRead, isPending: isMarkingAsRead } =
    useMarkNotificationAsRead();

  const handleMarkAllAsRead = () => {
    markAllAsRead(undefined, {
      onSuccess: () => {
        toast.success("All notifications marked as read");
      },
      onError: (error: any) => {
        const errorMessage =
          error.response?.data?.message || "An error occurred";
        toast.error(errorMessage);
        console.error(error);
      },
    });
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id, {
      onSuccess: () => {
        toast.success("Notification marked as read");
      },
      onError: (error: any) => {
        const errorMessage =
          error.response?.data?.message || "An error occurred";
        toast.error(errorMessage);
        console.error(error);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader message="Loading notifications..." />
      </div>
    );
  }

  const { notifications, unreadCount } = data;

  return (
    <div className="">
      <div className="flex items-center justify-between mb-6 px-4 md:px-0">
        <div>
          <BackButton />
          <h1 className="text-xl md:text-2xl font-bold">Уведомления</h1>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="default" className="rounded-full">
              {unreadCount} новый
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isMarkingAllAsRead}
          >
            Отметить все как прочитанное
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-1">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 rounded-lg transition-colors ${
                  notification.isRead ? "bg-card" : "bg-accent"
                }`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="flex items-start gap-4">
                  {notification.relatedData.actorId ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={notification.relatedData.actorId.profilePicture}
                        alt={notification.relatedData.actorId.name}
                      />
                      <AvatarFallback className="bg-black text-white">
                        {notification.relatedData.actorId.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="M2 20h.01"></path>
                        <path d="M7 20v-4"></path>
                        <path d="M12 20v-8"></path>
                        <path d="M17 20V8"></path>
                        <path d="M22 4v16"></path>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{notification.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification._id)}
                      disabled={isMarkingAsRead}
                    >
                      Отметить как прочитанное
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет уведомлений</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotificationsPage;
