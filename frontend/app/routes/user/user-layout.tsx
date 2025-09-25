import { Navigate, Outlet } from "react-router";

import { Loader } from "@/components/loader";
import { useAuth } from "@/providers/auth-context";

const UserLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loader message="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;

  return (
    <div className="container max-w-3xl mx-auto py-8 md:py-16">
      <Outlet />
    </div>
  );
};

export default UserLayout;
