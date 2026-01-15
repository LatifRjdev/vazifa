import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Activity, Database, ListTodo, Mail, MessageSquare, Server, Settings, Shield, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth, isTechAdmin } from "@/providers/auth-context";
import { useLanguage } from "@/providers/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// API function to fetch dashboard stats
async function fetchDashboardStats() {
  const token = localStorage.getItem("token");
  const response = await fetch('/api-v1/tech-admin/dashboard/stats', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return response.json();
}

export default function TechAdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
        <h1 className="text-3xl font-bold tracking-tight">{t('tech_admin.title')}</h1>
        <p className="text-muted-foreground">
          {t('tech_admin.subtitle')}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {t('tech_admin.load_error')}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tech_admin.total_users')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.users?.active || 0} {t('tech_admin.active_users')}
                </p>
                <p className="text-xs text-green-600">
                  +{stats?.users?.newToday || 0} {t('tech_admin.today')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tech_admin.tasks')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.tasks?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.tasks?.completed || 0} {t('tech_admin.completed')}
                </p>
                <p className="text-xs text-blue-600">
                  {stats?.tasks?.completionRate || 0}% {t('tech_admin.completion_rate')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* SMS Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tech_admin.sms_delivery')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.sms?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.sms?.failed || 0} {t('tech_admin.failed')}
                </p>
                <p className="text-xs text-green-600">
                  {stats?.sms?.deliveryRate || 0}% {t('tech_admin.delivery_rate')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* System Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tech_admin.system_status')}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.system?.smppConnected ? (
                    <span className="text-green-600">{t('tech_admin.online')}</span>
                  ) : (
                    <span className="text-red-600">{t('tech_admin.offline')}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('tech_admin.uptime')}: {formatUptime(stats?.system?.uptime || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('tech_admin.environment')}: {stats?.system?.environment || "unknown"}
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
            <CardTitle>{t('tech_admin.users_by_role')}</CardTitle>
            <CardDescription>{t('tech_admin.role_distribution')}</CardDescription>
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
            <CardTitle>{t('tech_admin.smpp_status')}</CardTitle>
            <CardDescription>{t('tech_admin.sms_gateway')}</CardDescription>
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
                  <span className="text-sm">{t('tech_admin.connection')}</span>
                  <span className={`text-sm font-medium ${stats?.system?.smppConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {stats?.system?.smppConnected ? t('tech_admin.connected') : t('tech_admin.disconnected')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('tech_admin.reconnect_attempts')}</span>
                  <span className="text-sm font-medium">{stats?.system?.smppReconnectAttempts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('tech_admin.sms_today')}</span>
                  <span className="text-sm font-medium">{stats?.sms?.today || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/users')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('tech_admin.user_management')}
            </CardTitle>
            <CardDescription>{t('tech_admin.user_management_desc')}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/sms-logs')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('tech_admin.sms_logs')}
            </CardTitle>
            <CardDescription>{t('tech_admin.sms_logs_desc')}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/email-logs')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('tech_admin.email_logs')}
            </CardTitle>
            <CardDescription>{t('tech_admin.email_logs_desc')}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/queue')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              {t('tech_admin.queue_management')}
            </CardTitle>
            <CardDescription>{t('tech_admin.queue_management_desc')}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/audit-logs')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('tech_admin.audit_logs')}
            </CardTitle>
            <CardDescription>{t('tech_admin.audit_logs_desc')}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/settings')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('tech_admin.settings')}
            </CardTitle>
            <CardDescription>{t('tech_admin.settings_desc')}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/dashboard/tech-admin/system')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {t('tech_admin.system_health')}
            </CardTitle>
            <CardDescription>{t('tech_admin.system_health_desc')}</CardDescription>
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
