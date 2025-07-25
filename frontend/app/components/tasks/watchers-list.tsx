import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getUserAvatar } from "@/lib";

export const WatchersList = ({ watchers }: { watchers: User[] }) => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4">Наблюдатели</h3>
      <div className="space-y-2">
        {watchers && watchers.length > 0 ? (
          watchers.map((watcher) => (
            <div key={watcher._id} className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={watcher?.profilePicture || getUserAvatar(watcher.name)}
                />
                <AvatarFallback>
                  {watcher?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{watcher?.name || "Unknown User"}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Нет наблюдателей</p>
        )}
      </div>
    </div>
  );
};
