import { useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Activity,
  Wifi,
  Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth, isTechAdmin } from "@/providers/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SystemHealth {
  timestamp: string;
  server: {
    uptime: number;
    uptimeFormatted: string;
    version: string;
    environment: string;
    platform: string;
    arch: string;
  };
  resources: {
    cpu: {
      cores: number;
      model: string;
      loadAverage: number[];
    };
    memory: {
      total: number;
      totalFormatted: string;
      free: number;
      freeFormatted: string;
      used: number;
      usedFormatted: string;
      percentage: number;
    };
    process: {
      memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        external: number;
      };
      pid: number;
    };
  };
  database: {
    connected: boolean;
    responseTime: number;
  };
  smpp: {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
    config: {
      host: string;
      port: number;
      systemId: string;
    };
  };
}

interface DatabaseStats {
  database: string;
  collections: {
    name: string;
    count: number;
    size: number;
    sizeFormatted: string;
    avgObjSize: number;
    indexes: number;
    indexSize: number;
    error?: string;
  }[];
  summary: {
    totalCollections: number;
    totalDocuments: number;
    totalSize: number;
    totalSizeFormatted: string;
  };
}

const API_URL = '/api-v1';

// API Functions
async function fetchSystemHealth(): Promise<SystemHealth> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/system/health`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch system health");
  return response.json();
}

async function fetchDatabaseStats(): Promise<DatabaseStats> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/system/database`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch database stats");
  return response.json();
}

async function reconnectSMPP() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/system/smpp/reconnect`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reconnect SMPP");
  }
  return response.json();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function SystemHealth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect if not tech admin
  useEffect(() => {
    if (user && !isTechAdmin(user)) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Fetch system health
  const { data: health, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useQuery({
    queryKey: ["tech-admin", "system-health"],
    queryFn: fetchSystemHealth,
    enabled: isTechAdmin(user),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch database stats
  const { data: dbStats, isLoading: dbLoading, error: dbError, refetch: refetchDb } = useQuery({
    queryKey: ["tech-admin", "database-stats"],
    queryFn: fetchDatabaseStats,
    enabled: isTechAdmin(user),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Reconnect SMPP mutation
  const reconnectMutation = useMutation({
    mutationFn: reconnectSMPP,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["tech-admin", "system-health"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isTechAdmin(user)) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/tech-admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
            <p className="text-muted-foreground">Server metrics and monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchHealth();
              refetchDb();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error States */}
      {(healthError || dbError) && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load system data. Please try refreshing.</AlertDescription>
        </Alert>
      )}

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Server Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {health?.server?.uptimeFormatted || "N/A"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {health?.database?.connected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-lg font-bold text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-lg font-bold text-red-600">Disconnected</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Response: {health?.database?.responseTime || 0}ms
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* SMPP Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMPP Gateway</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {health?.smpp?.connected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-lg font-bold text-green-600">Connected</span>
                    </>
                  ) : health?.smpp?.connecting ? (
                    <>
                      <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                      <span className="text-lg font-bold text-yellow-600">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-lg font-bold text-red-600">Disconnected</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reconnects: {health?.smpp?.reconnectAttempts || 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {health?.resources?.memory?.percentage?.toFixed(1) || 0}%
                </div>
                <Progress
                  value={health?.resources?.memory?.percentage || 0}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {health?.resources?.memory?.usedFormatted} / {health?.resources?.memory?.totalFormatted}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Server Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Environment</span>
                  <Badge variant="outline">{health?.server?.environment || "N/A"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Node Version</span>
                  <span className="text-sm font-medium">{health?.server?.version || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Platform</span>
                  <span className="text-sm font-medium">{health?.server?.platform || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Architecture</span>
                  <span className="text-sm font-medium">{health?.server?.arch || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-medium">{health?.server?.uptimeFormatted || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Process ID</span>
                  <span className="text-sm font-medium">{health?.resources?.process?.pid || "N/A"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMPP Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                SMPP Gateway
              </span>
              {!health?.smpp?.connected && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reconnectMutation.mutate()}
                  disabled={reconnectMutation.isPending || health?.smpp?.connecting}
                >
                  {reconnectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Reconnect</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {health?.smpp?.connected ? (
                    <Badge className="bg-green-500">Connected</Badge>
                  ) : health?.smpp?.connecting ? (
                    <Badge variant="outline" className="text-yellow-600">Connecting</Badge>
                  ) : (
                    <Badge variant="destructive">Disconnected</Badge>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Host</span>
                  <span className="text-sm font-medium">{health?.smpp?.config?.host || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Port</span>
                  <span className="text-sm font-medium">{health?.smpp?.config?.port || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">System ID</span>
                  <span className="text-sm font-medium">{health?.smpp?.config?.systemId || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reconnect Attempts</span>
                  <span className="text-sm font-medium">{health?.smpp?.reconnectAttempts || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CPU Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              CPU Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="text-sm font-medium truncate max-w-[200px]" title={health?.resources?.cpu?.model}>
                    {health?.resources?.cpu?.model || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cores</span>
                  <span className="text-sm font-medium">{health?.resources?.cpu?.cores || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Load Average (1m, 5m, 15m)</span>
                  <span className="text-sm font-medium font-mono">
                    {health?.resources?.cpu?.loadAverage?.map(l => l.toFixed(2)).join(", ") || "N/A"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Memory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Process Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Heap Used</span>
                  <span className="text-sm font-medium">
                    {formatBytes(health?.resources?.process?.memory?.heapUsed || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Heap Total</span>
                  <span className="text-sm font-medium">
                    {formatBytes(health?.resources?.process?.memory?.heapTotal || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">RSS</span>
                  <span className="text-sm font-medium">
                    {formatBytes(health?.resources?.process?.memory?.rss || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">External</span>
                  <span className="text-sm font-medium">
                    {formatBytes(health?.resources?.process?.memory?.external || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Collections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Collections
          </CardTitle>
          <CardDescription>
            Database: {dbStats?.database || "N/A"} |
            Total: {dbStats?.summary?.totalDocuments?.toLocaleString() || 0} documents |
            Size: {dbStats?.summary?.totalSizeFormatted || "0 B"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collection</TableHead>
                <TableHead className="text-right">Documents</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Avg Doc Size</TableHead>
                <TableHead className="text-right">Indexes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dbLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : dbStats?.collections?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No collections found
                  </TableCell>
                </TableRow>
              ) : (
                dbStats?.collections?.map((col) => (
                  <TableRow key={col.name}>
                    <TableCell className="font-medium">{col.name}</TableCell>
                    <TableCell className="text-right">{col.count?.toLocaleString() || "-"}</TableCell>
                    <TableCell className="text-right">{col.sizeFormatted || "-"}</TableCell>
                    <TableCell className="text-right">
                      {col.avgObjSize ? formatBytes(col.avgObjSize) : "-"}
                    </TableCell>
                    <TableCell className="text-right">{col.indexes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
