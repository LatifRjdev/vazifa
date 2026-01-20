import { Navigate, Outlet } from "react-router";

import { Loader } from "@/components/loader";
import { useAuth } from "@/providers/auth-context";

const UserLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loader message="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container max-w-3xl mx-auto py-8 md:py-16 flex-1">
        <Outlet />
      </div>

      <footer className="py-4 text-center text-sm border-t">
        <a
          href="https://itlsolutions.net"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-blue-600 hover:underline"
        >
          © 2026 Протокол. Все права защищены - by ITls
        </a>
      </footer>
    </div>
  );
};

export default UserLayout;
