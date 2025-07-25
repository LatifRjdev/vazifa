import {
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListCheck,
  LogOut,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-context";
import type { Workspace } from "@/types";
import { ScrollArea } from "../ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";

export const SidebarComponent = ({
  className,
  currentWorkspace,
}: {
  className?: string;
  currentWorkspace?: Workspace | null;
}) => {
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      title: "Панель управления",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Рабочие пространства",
      href: "/workspaces",
      icon: Users,
    },
    {
      title: "Мои задачи",
      href: "/my-tasks",
      icon: ListCheck,
    },
    {
      title: "Участники",
      href: `/members`,
      icon: Users,
    },
    {
      title: "Выполненные",
      href: `/achieved`,
      icon: CheckCircle2,
    },
    {
      title: "Настройки",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16 md:w-[80px]" : "w-16 md:w-[240px]",
        className
      )}
    >
      <div className="flex h-14 items-center border-b px-4 mb-4">
        <Link to="/dashboard" className="flex items-center">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Wrench className="size-6 text-blue-600" />
              <span className="font-semibold text-lg hidden md:block">
                Vazifa
              </span>
            </div>
          )}
          {isCollapsed && <Wrench className="size-6 text-blue-600" />}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto hidden md:block"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        <SidebarNav
          items={navItems}
          isCollapsed={isCollapsed}
          className={cn(isCollapsed && "items-center space-y-2")}
          currentWorkspace={currentWorkspace}
        />
      </ScrollArea>

      <div className="border-t p-4 flex flex-col gap-2">
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          className="justify-start"
          onClick={logout}
        >
          <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
          <span className="hidden md:block">{!isCollapsed && "Выйти"}</span>
        </Button>
      </div>
    </div>
  );
};
