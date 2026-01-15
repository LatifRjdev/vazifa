import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/providers/language-context";
import {
  Mail,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MailOpen,
  MousePointer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib";

interface EmailLog {
  _id: string;
  recipient?: {
    _id: string;
    name: string;
    email: string;
  };
  email: string;
  subject: string;
  body?: string;
  htmlBody?: string;
  type: string;
  status: string;
  messageId?: string;
  smtpResponse?: string;
  errorMessage?: string;
  attempts: number;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailStatistics {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  byType: Array<{ _id: string; count: number }>;
  byStatus: Array<{ _id: string; count: number }>;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "sent":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "bounced":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "queued":
    case "sending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "opened":
      return <MailOpen className="h-4 w-4 text-blue-500" />;
    case "clicked":
      return <MousePointer className="h-4 w-4 text-purple-500" />;
    default:
      return <Mail className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    sent: "default",
    delivered: "default",
    failed: "destructive",
    bounced: "destructive",
    queued: "secondary",
    sending: "secondary",
    opened: "outline",
    clicked: "outline",
  };

  return (
    <Badge variant={variants[status] || "secondary"} className="flex items-center gap-1">
      {getStatusIcon(status)}
      {status}
    </Badge>
  );
};

const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    verification: "bg-blue-100 text-blue-800",
    password_reset: "bg-purple-100 text-purple-800",
    task_notification: "bg-green-100 text-green-800",
    workspace_invite: "bg-yellow-100 text-yellow-800",
    otp: "bg-orange-100 text-orange-800",
    welcome: "bg-pink-100 text-pink-800",
    general: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.general}`}>
      {type.replace(/_/g, " ")}
    </span>
  );
};

export default function EmailLogsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch email logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["email-logs", page, search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await api.get(`/tech-admin/email-logs?${params}`);
      return response.data;
    },
  });

  // Fetch email statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["email-statistics"],
    queryFn: async () => {
      const response = await api.get("/tech-admin/email-logs/statistics");
      return response.data as EmailStatistics;
    },
  });

  // Resend email mutation
  const resendMutation = useMutation({
    mutationFn: async (logId: string) => {
      const response = await api.post(`/tech-admin/email-logs/${logId}/resend`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Email queued",
        description: "The email has been queued for resending.",
      });
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      queryClient.invalidateQueries({ queryKey: ["email-statistics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Resend failed",
        description: error.response?.data?.message || "Failed to resend email",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (log: EmailLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const logs = logsData?.logs || [];
  const pagination = logsData?.pagination || { total: 0, pages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('tech_admin.email.title')}</h1>
          <p className="text-muted-foreground">{t('tech_admin.email.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["email-logs"] });
            queryClient.invalidateQueries({ queryKey: ["email-statistics"] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('tech_admin.refresh')}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{statsData?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {statsData?.deliveryRate?.toFixed(1) || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {statsData?.sent || 0} sent, {statsData?.delivered || 0} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <MailOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {statsData?.openRate?.toFixed(1) || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {statsData?.opened || 0} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{statsData?.failed || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Click Rate: {statsData?.clickRate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or subject..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="verification">Verification</SelectItem>
                <SelectItem value="password_reset">Password Reset</SelectItem>
                <SelectItem value="task_notification">Task Notification</SelectItem>
                <SelectItem value="workspace_invite">Workspace Invite</SelectItem>
                <SelectItem value="otp">OTP</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
          <CardDescription>
            {pagination.total} total emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email logs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: EmailLog) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {log.recipient?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {log.subject}
                      </TableCell>
                      <TableCell>{getTypeBadge(log.type)}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{log.attempts}</TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(log.status === "failed" || log.status === "bounced") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => resendMutation.mutate(log._id)}
                              disabled={resendMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Email Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              Full details of the email log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Recipient
                  </label>
                  <p className="font-medium">{selectedLog.recipient?.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <div className="mt-1">{getTypeBadge(selectedLog.type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Attempts
                  </label>
                  <p className="font-medium">{selectedLog.attempts}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Subject
                </label>
                <p className="font-medium">{selectedLog.subject}</p>
              </div>

              {selectedLog.body && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Message
                  </label>
                  <p className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">
                    {selectedLog.body}
                  </p>
                </div>
              )}

              {selectedLog.messageId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Message ID
                  </label>
                  <p className="font-mono text-sm">{selectedLog.messageId}</p>
                </div>
              )}

              {selectedLog.smtpResponse && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    SMTP Response
                  </label>
                  <p className="font-mono text-sm bg-muted p-2 rounded">
                    {selectedLog.smtpResponse}
                  </p>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Error Message
                  </label>
                  <p className="text-red-600 bg-red-50 p-3 rounded-md text-sm">
                    {selectedLog.errorMessage}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created
                  </label>
                  <p className="text-sm">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedLog.sentAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Sent
                    </label>
                    <p className="text-sm">
                      {new Date(selectedLog.sentAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedLog.deliveredAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Delivered
                    </label>
                    <p className="text-sm">
                      {new Date(selectedLog.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedLog.openedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Opened
                    </label>
                    <p className="text-sm">
                      {new Date(selectedLog.openedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedLog.clickedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Clicked
                    </label>
                    <p className="text-sm">
                      {new Date(selectedLog.clickedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {(selectedLog.status === "failed" || selectedLog.status === "bounced") && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      resendMutation.mutate(selectedLog._id);
                      setDetailsOpen(false);
                    }}
                    disabled={resendMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Resend Email
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
