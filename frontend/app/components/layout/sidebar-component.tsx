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
  BarChart3,
  ClipboardList,
  Star,
  UserCheck,
  MessageSquare,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-context";
import { useLanguage } from "@/providers/language-context";
import { ScrollArea } from "../ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";

export const SidebarComponent = ({
  className,
}: {
  className?: string;
}) => {
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Define different navigation items based on user role
  const getNavItems = () => {
    if (user?.role === "super_admin") {
      // Super admin only sees specific items in specific order
      return [
        {
          title: t('nav.important_tasks'),
          href: "/dashboard/important-tasks",
          icon: Star,
        },
        {
          title: t('nav.all_tasks'),
          href: "/dashboard/all-tasks",
          icon: ClipboardList,
        },
        {
          title: t('nav.analytics'),
          href: "/dashboard/analytics",
          icon: BarChart3,
        },
        {
          title: t('nav.members'),
          href: "/dashboard/members",
          icon: Users,
        },
        {
          title: t('nav.completed_tasks'),
          href: "/dashboard/achieved",
          icon: CheckCircle2,
        },
      ];
    }

    // Default navigation for other roles
    return [
      {
        title: t('nav.dashboard'),
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: t('nav.my_tasks'),
        href: "/dashboard/my-tasks",
        icon: ListCheck,
      },
      {
        title: t('nav.all_tasks'),
        href: "/dashboard/all-tasks",
        icon: ClipboardList,
        requiresRole: ["admin", "manager", "super_admin"],
      },
      {
        title: t('nav.manager_tasks'),
        href: "/dashboard/manager-tasks",
        icon: UserCheck,
        requiresRole: ["admin", "manager", "super_admin"],
      },
      {
        title: t('nav.important_tasks'),
        href: "/dashboard/important-tasks",
        icon: Star,
        requiresRole: ["super_admin"],
      },
      {
        title: t('nav.analytics'),
        href: "/dashboard/analytics",
        icon: BarChart3,
        requiresRole: ["admin", "manager", "super_admin"],
      },
      {
        title: t('nav.members'),
        href: "/dashboard/members",
        icon: Users,
        requiresRole: ["admin", "manager", "super_admin"],
      },
      {
        title: t('nav.completed_tasks'),
        href: "/dashboard/achieved",
        icon: CheckCircle2,
      },
      {
        title: t('nav.settings'),
        href: "/dashboard/settings",
        icon: Settings,
      },
    ];
  };

  const navItems = getNavItems();

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
          userRole={user?.role}
        />
      </ScrollArea>

      <div className="border-t p-4 flex flex-col gap-2">
        <Link to="/user/profile">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className="justify-start w-full"
          >
            <User className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
            <span className="hidden md:block">{!isCollapsed && t('nav.profile')}</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          className="justify-start"
          onClick={logout}
        >
          <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
          <span className="hidden md:block">{!isCollapsed && t('nav.logout')}</span>
        </Button>
      </div>
    </div>
  );
};
