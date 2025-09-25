import { Navigate, Outlet } from "react-router";

import { Loader } from "@/components/loader";
import { useAuth } from "@/providers/auth-context";

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader message="Loading..." />
      </div>
    );
  if (isAuthenticated) return <Navigate to="/dashboard" />;

  return <Outlet />;
};

export default AuthLayout;
