import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { useLoginMutation, useVerify2FALoginMutation } from "@/hooks/use-auth";
import { publicRoutes } from "@/lib";
import { queryClient } from "@/providers/react-query-provider";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const currentPath = useLocation().pathname;
  const isPublicRoute = publicRoutes.includes(currentPath);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          if (!isPublicRoute) {
            navigate("/sign-in");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [currentPath, isPublicRoute, navigate]);

  // JWT expiry auto-logout
  useEffect(() => {
    const token = localStorage.getItem("token");

    let timeout: NodeJS.Timeout | undefined;
    if (token) {
      try {
        const { exp } = jwtDecode<{ exp: number }>(token);
        const expiry = exp * 1000 - Date.now();

        if (expiry <= 0) {
          logout();
          navigate("/sign-in");
        } else {
          timeout = setTimeout(() => {
            logout();
            navigate("/sign-in");
          }, expiry);
        }
      } catch (e) {
        // Invalid token, force logout
        if (isAuthenticated) {
          logout();
          navigate("/sign-in");
        }
      }
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleForceLogout = () => {
      logout();
      navigate("/sign-in");
    };
    window.addEventListener("force-logout", handleForceLogout);
    return () => {
      window.removeEventListener("force-logout", handleForceLogout);
    };
  }, []);

  const login = async (data: any) => {
    localStorage.setItem("user", JSON.stringify(data?.user));
    localStorage.setItem("token", data?.token);

    setUser(data?.user || null);
    setIsAuthenticated(true);
    setIsLoading(false);

    // Redirect based on role
    if (data?.user?.role === "tech_admin") {
      navigate("/dashboard/tech-admin");
    } else if (data?.user?.role === "super_admin") {
      navigate("/important-tasks");
    } else {
      navigate("/dashboard");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Role helper functions
export const isTechAdmin = (user: User | null): boolean => {
  return user?.role === "tech_admin";
};

export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === "super_admin";
};

export const isAdmin = (user: User | null): boolean => {
  return user?.role === "admin";
};

export const isAnyAdmin = (user: User | null): boolean => {
  return ["tech_admin", "super_admin", "admin"].includes(user?.role || "");
};

export const isManager = (user: User | null): boolean => {
  return user?.role === "manager";
};
