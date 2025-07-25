import { Bell, ChevronDownIcon, PlusCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, useLoaderData, useLocation, useNavigate } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import {
  useWorkspaceId,
  useWorkspaceSearchParamId,
} from "@/hooks/use-workspace-id";
import { useAuth } from "@/providers/auth-context";
import type { Workspace } from "@/types";
import { Badge } from "../ui/badge";

interface HeaderProps {
  onWorkspaceSelect: (workspace: Workspace | null) => void;
  selectedWorkspace: Workspace | null;
  onCreateWorkspace: () => void;
}

export const Header = ({
  onWorkspaceSelect,
  selectedWorkspace,
  onCreateWorkspace,
}: HeaderProps) => {
  const { user, logout } = useAuth();
  const workspaceId = useWorkspaceId();
  const workspaceIdByQuery = useWorkspaceSearchParamId();
  const navigate = useNavigate();

  const { workspaces, unreadNotificationsCount } = useLoaderData() as {
    workspaces: Workspace[];
    unreadNotificationsCount: number;
  };
  const isOnWorkspacePage = useLocation().pathname.includes("/workspaces");

  useEffect(() => {
    if (workspaceId || workspaceIdByQuery) {
      const workspace = workspaces.find(
        (workspace) =>
          workspace._id === workspaceId || workspace._id === workspaceIdByQuery
      );
      onWorkspaceSelect(workspace!);
    }

    // if (!workspaceId) {
    //   onWorkspaceSelect(workspaces[0]);
    // }
  }, [workspaceId, workspaceIdByQuery]);

  const handleOnClick = (ws: Workspace) => {
    onWorkspaceSelect(ws);
    const location = window.location;

    if (isOnWorkspacePage) {
      navigate(`/workspaces/${ws._id}`);
    } else {
      // Remove any existing query params and set workspaceId
      const basePath = location.pathname;
      navigate(`${basePath}?workspaceId=${ws._id}`);
    }
  };

  return (
    <header className="bg-background sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={"outline"}>
              {selectedWorkspace ? (
                <>
                  {selectedWorkspace.color && (
                    <WorkspaceAvatar
                      color={selectedWorkspace.color}
                      name={selectedWorkspace.name}
                    />
                  )}
                  <span className="font-medium">{selectedWorkspace.name}</span>
                </>
              ) : (
                <span className="font-medium">Выберите рабочую область</span>
              )}

              <ChevronDownIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuLabel>Рабочая область</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws._id}
                  onClick={() => handleOnClick(ws)}
                >
                  {ws.color && (
                    <WorkspaceAvatar color={ws.color} name={ws.name} />
                  )}
                  <span className="font-medium">{ws.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuGroup className="mt-4">
              <DropdownMenuItem onClick={onCreateWorkspace}>
                <PlusCircle className="w-4 h-4 text-muted-foreground" />
                Создать рабочую область
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Button
            variant={"outline"}
            className="relative"
            onClick={() => navigate("/user/notifications")}
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <div className="absolute -top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                <span className="text-xs">{unreadNotificationsCount}</span>
              </div>
            )}
          </Button>
          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full border p-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.profilePicture || undefined}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link to="/user/profile">Профиль</Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <Link to="/user/settings">Settings</Link>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
