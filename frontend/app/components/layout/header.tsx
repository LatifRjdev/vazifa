import { Bell, ChevronDownIcon, Plus, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useLanguage } from "@/providers/language-context";
import type { Workspace } from "@/types";
import { Badge } from "../ui/badge";
import { CreateTaskDialog } from "../tasks/create-task-dialog";
import { LanguageSwitcher } from "../shared/language-switcher";

interface HeaderProps {
  onOrganizationSelect?: (organization: any | null) => void;
  selectedOrganization?: any | null;
  onCreateOrganization?: () => void;
}

export const Header = ({
  onOrganizationSelect,
  selectedOrganization,
  onCreateOrganization,
}: HeaderProps) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const { organizations, unreadNotificationsCount } = useLoaderData() as {
    organizations: any[];
    unreadNotificationsCount: number;
  };

  // Проверить, может ли пользователь создавать задачи
  const canCreateTasks = user?.role && ["admin", "manager", "super_admin"].includes(user.role);

  return (
    <header className="bg-background sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">{t('app.name')}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Переключатель языка */}
          <LanguageSwitcher />
          
          {canCreateTasks && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateTaskOpen(true)}
              className="p-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
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
              <DropdownMenuLabel>{t('nav.profile')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link to="/user/profile">{t('nav.profile')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                logout();
                navigate("/");
              }}>
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Диалог создания задач */}
      {canCreateTasks && (
        <CreateTaskDialog
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
          organizations={[]}
        />
      )}
    </header>
  );
};
