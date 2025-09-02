import type { LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon?: LucideIcon;
    requiresRole?: string[];
  }[];
  isCollapsed: boolean;
  userRole?: string;
}

export const SidebarNav = ({
  className,
  items,
  isCollapsed,
  userRole,
  ...props
}: SidebarNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Фильтруем пункты меню по ролям
  const filteredItems = items.filter(item => {
    if (!item.requiresRole) return true;
    return userRole && item.requiresRole.includes(userRole);
  });

  return (
    <nav className={cn("flex flex-col space-y-2", className)} {...props}>
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        const handleClick = () => {
          navigate(item.href);
        };

        return (
          <Button
            key={item.href}
            variant={isActive ? "outline" : "ghost"}
            className={cn(
              "justify-start",
              isActive && "bg-blue-800/20 text-blue-600 font-medium"
            )}
            onClick={handleClick}
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {isCollapsed ? (
              <span className="sr-only">{item.title}</span>
            ) : (
              item.title
            )}
          </Button>
        );
      })}
    </nav>
  );
};
