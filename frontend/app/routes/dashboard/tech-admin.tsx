import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Activity, Database, MessageSquare, Server, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth, isTechAdmin } from "@/providers/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// API function to fetch dashboard stats
async function fetchDashboardStats() {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/tech-admin/dashboard/stats`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return response.json();
}

export default function TechAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not tech admin
  useEffect(() => {
    if (user && !isTechAdmin(user)) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Fetch dashboard stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["tech-admin", "dashboard-stats"],
    queryFn: fetchDashboardStats,
    enabled: isTechAdmin(user),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!isTechAdmin(user)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tech Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System monitoring and technical operations
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.users?.active || 0} active in last 30 days
                </p>
                <p className="text-xs text-green-600">
                  +{stats?.users?.newToday || 0} today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.tasks?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.tasks?.completed || 0} completed
                </p>
                <p className="text-xs text-blue-600">
                  {stats?.tasks?.completionRate || 0}% completion rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* SMS Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Delivery</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.sms?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.sms?.failed || 0} failed
                </p>
                <p className="text-xs text-green-600">
                  {stats?.sms?.deliveryRate || 0}% delivery rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* System Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.system?.smppConnected ? (
                    <span className="text-green-600">Online</span>
                  ) : (
                    <span className="text-red-600">Offline</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {formatUptime(stats?.system?.uptime || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Env: {stats?.system?.environment || "unknown"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>Distribution of user roles</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats?.users?.byRole || {}).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                    <span className="text-sm font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>SMPP Status</CardTitle>
            <CardDescription>SMS gateway connection</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection</span>
                  <span className={`text-sm font-medium ${stats?.system?.smppConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {stats?.system?.smppConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reconnect Attempts</span>
                  <span className="text-sm font-medium">{stats?.system?.smppReconnectAttempts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMS Today</span>
                  <span className="text-sm font-medium">{stats?.sms?.today || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/users')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>View and manage all users</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/sms-logs')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Logs
            </CardTitle>
            <CardDescription>Monitor SMS delivery and analytics</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/system')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Server metrics and monitoring</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '0m';
}
