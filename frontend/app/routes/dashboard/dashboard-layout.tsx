import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
  useParams,
} from "react-router";

import { Header } from "@/components/layout/header";
import { SidebarComponent } from "@/components/layout/sidebar-component";
import { Loader } from "@/components/loader";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { AdminChatWidget } from "@/components/chat/admin-chat-widget";
import { fetchData } from "@/lib/fetch-utils";
import { useAuth } from "@/providers/auth-context";
import type { Workspace } from "@/types";

export const clientLoader = async () => {
  try {
    const [unreadNotificationsCount, myTasks] = await Promise.all([
      fetchData("/users/notifications/unread-count"),
      fetchData("/tasks/my-tasks"),
    ]);
    return { organizations: [], unreadNotificationsCount, myTasks };
  } catch (error) {
    console.error("Dashboard loader error:", error);
    // Return default values instead of redirecting to allow page to load
    return { organizations: [], unreadNotificationsCount: 0, myTasks: [] };
  }
};

const DashboardLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const { organizations } = useLoaderData() as {
    organizations: Workspace[];
    unreadNotificationsCount: number;
    myTasks: any[];
  };

  const [currentOrganization, setCurrentOrganization] = useState<Workspace | null>(
    null
  );

  // Auto-select first organization if none is selected and organizations are available
  useEffect(() => {
    if (!currentOrganization && organizations && organizations.length > 0) {
      setCurrentOrganization(organizations[0]);
    }
  }, [currentOrganization, organizations]);

  if (isLoading) return <Loader message="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const handleOrganizationSelect = (organization: Workspace | null) => {
    setCurrentOrganization(organization);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarComponent className="flex-shrink-0" />

      <div className="flex-1 flex flex-col h-screen min-w-0">
        <Header
          onOrganizationSelect={handleOrganizationSelect}
          selectedOrganization={currentOrganization}
          onCreateOrganization={() => setIsCreateWorkspaceOpen(true)}
        />

        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-4 lg:py-6 xl:py-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CreateWorkspace
        isCreateWorkspaceOpen={isCreateWorkspaceOpen}
        setIsCreateWorkspaceOpen={setIsCreateWorkspaceOpen}
      />
      
      <AdminChatWidget />
    </div>
  );
};

export default DashboardLayout;
