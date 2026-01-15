import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  MessageSquare,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth, isTechAdmin } from "@/providers/auth-context";
import { useLanguage } from "@/providers/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SMSLog {
  _id: string;
  phoneNumber: string;
  message: string;
  type: string;
  status: string;
  errorMessage?: string;
  parts?: number;
  recipient?: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
  };
  createdAt: string;
  sentAt?: string;
}

interface SMSLogsResponse {
  logs: SMSLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface SMSStatistics {
  total: number;
  deliveryRate: number;
  byStatus: Record<string, { count: number; parts: number }>;
  byType: Record<string, number>;
  recentFailures: SMSLog[];
  deliveryTrend: { _id: { date: string }; total: number; sent: number; failed: number }[];
}

const API_URL = '/api-v1';

// API Functions
async function fetchSMSLogs(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<SMSLogsResponse> {
  const token = localStorage.getItem("token");
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && params.status !== "all" && { status: params.status }),
    ...(params.type && params.type !== "all" && { type: params.type }),
    ...(params.dateFrom && { dateFrom: params.dateFrom }),
    ...(params.dateTo && { dateTo: params.dateTo }),
  });

  const response = await fetch(`${API_URL}/tech-admin/sms-logs?${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch SMS logs");
  return response.json();
}

async function fetchSMSStatistics(): Promise<SMSStatistics> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/sms-logs/statistics`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch SMS statistics");
  return response.json();
}

async function resendSMS(id: string) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/sms-logs/${id}/resend`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to resend SMS");
  }
  return response.json();
}

export default function SMSLogs() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<SMSLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Redirect if not tech admin
  useEffect(() => {
    if (user && !isTechAdmin(user)) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Fetch SMS logs
  const { data, isLoading, error } = useQuery({
    queryKey: ["tech-admin", "sms-logs", page, search, statusFilter, typeFilter],
    queryFn: () => fetchSMSLogs({ page, limit: 20, search, status: statusFilter, type: typeFilter }),
    enabled: isTechAdmin(user),
  });

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["tech-admin", "sms-statistics"],
    queryFn: fetchSMSStatistics,
    enabled: isTechAdmin(user),
    refetchInterval: 60000, // Refresh every minute
  });

  // Resend mutation
  const resendMutation = useMutation({
    mutationFn: resendSMS,
    onSuccess: () => {
      toast.success("SMS queued for resend");
      queryClient.invalidateQueries({ queryKey: ["tech-admin", "sms-logs"] });
      queryClient.invalidateQueries({ queryKey: ["tech-admin", "sms-statistics"] });
      setIsDetailOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "pending":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "queued":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Queued</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      otp: "bg-purple-500",
      password_reset: "bg-orange-500",
      task_notification: "bg-blue-500",
      workspace_invite: "bg-green-500",
      general_notification: "bg-gray-500",
    };
    return (
      <Badge className={colors[type] || "bg-gray-500"}>
        {type.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (!isTechAdmin(user)) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/tech-admin")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('tech_admin.sms.title')}</h1>
          <p className="text-muted-foreground">{t('tech_admin.sms.subtitle')}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SMS</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats?.deliveryRate || 0}%</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.byStatus?.sent?.count || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats?.byStatus?.failed?.count || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SMS by Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SMS by Type</CardTitle>
            <CardDescription>Distribution of SMS notification types</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats?.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type.replace(/_/g, " ")}</span>
                    <span className="text-sm font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Failures</CardTitle>
            <CardDescription>Last 10 failed SMS attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : stats?.recentFailures?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent failures</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-auto">
                {stats?.recentFailures?.map((log) => (
                  <div key={log._id} className="text-sm border-b pb-2">
                    <div className="font-medium">{log.phoneNumber}</div>
                    <div className="text-xs text-red-600 truncate">{log.errorMessage || "Unknown error"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by phone number or message..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="otp">OTP</SelectItem>
                <SelectItem value="password_reset">Password Reset</SelectItem>
                <SelectItem value="task_notification">Task Notification</SelectItem>
                <SelectItem value="workspace_invite">Workspace Invite</SelectItem>
                <SelectItem value="general_notification">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load SMS logs. Please try refreshing.</AlertDescription>
        </Alert>
      )}

      {/* SMS Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : data?.logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No SMS logs found
                  </TableCell>
                </TableRow>
              ) : (
                data?.logs?.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <div className="font-medium">{log.recipient?.name || "-"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.phoneNumber}</TableCell>
                    <TableCell>{getTypeBadge(log.type)}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm" title={log.message}>
                        {log.message}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailOpen(true);
                          }}
                        >
                          View
                        </Button>
                        {log.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => resendMutation.mutate(log._id)}
                            disabled={resendMutation.isPending}
                            title="Resend SMS"
                          >
                            <RefreshCw className={`h-4 w-4 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Page {page} of {data.pagination.pages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* SMS Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>SMS Details</DialogTitle>
            <DialogDescription>Full SMS log information</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Recipient</div>
                  <div className="font-medium">{selectedLog.recipient?.name || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone Number</div>
                  <div className="font-mono">{selectedLog.phoneNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div>{getTypeBadge(selectedLog.type)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Parts</div>
                  <div>{selectedLog.parts || 1}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="text-sm">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Message</div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {selectedLog.message}
                </div>
              </div>
              {selectedLog.errorMessage && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Error</div>
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            {selectedLog?.status === "failed" && (
              <Button
                onClick={() => resendMutation.mutate(selectedLog._id)}
                disabled={resendMutation.isPending}
              >
                {resendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Resend SMS
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
