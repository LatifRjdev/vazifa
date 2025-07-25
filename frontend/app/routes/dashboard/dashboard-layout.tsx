import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  redirect,
  useNavigate,
  useParams,
} from "react-router";

import { Header } from "@/components/layout/header";
import { SidebarComponent } from "@/components/layout/sidebar-component";
import { Loader } from "@/components/loader";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { fetchData } from "@/lib/fetch-utils";
import { useAuth } from "@/providers/auth-context";
import type { Workspace } from "@/types";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

export const clientLoader = async () => {
  try {
    const [workspaces, unreadNotificationsCount] = await Promise.all([
      fetchData("/workspaces"),
      fetchData("/users/notifications/unread-count"),
    ]);
    return { workspaces, unreadNotificationsCount };
      } catch (error) {
      return redirect("/sign-in");
    }
};

const DashboardLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );

  if (isLoading) return <Loader message="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;

  const handleWorkspaceSelect = (workspace: Workspace | null) => {
    setCurrentWorkspace(workspace);
  };

  return (
    <div className="flex  h-screen w-full">
      <SidebarComponent currentWorkspace={currentWorkspace} />

      <div className="flex-1 flex flex-col h-screen">
        <Header
          onWorkspaceSelect={handleWorkspaceSelect}
          selectedWorkspace={currentWorkspace}
          onCreateWorkspace={() => setIsCreateWorkspaceOpen(true)}
        />

        <main className="flex-1 overflow-y-auto h-full w-full">
          <div className="mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CreateWorkspace
        isCreateWorkspaceOpen={isCreateWorkspaceOpen}
        setIsCreateWorkspaceOpen={setIsCreateWorkspaceOpen}
      />
    </div>
  );
};

export default DashboardLayout;
