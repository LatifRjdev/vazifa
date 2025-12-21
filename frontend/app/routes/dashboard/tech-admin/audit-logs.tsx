import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  RefreshCw,
  Search,
  Filter,
  Eye,
  User,
  Settings,
  MessageSquare,
  Mail,
  ListTodo,
  Server,
  CheckCircle,
  XCircle,
  Clock,
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
import { api } from "@/lib";

interface AuditLog {
  _id: string;
  actor: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  description: string;
  details?: Record<string, unknown>;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

interface AuditStatistics {
  total: number;
  byCategory: Array<{ _id: string; count: number }>;
  byAction: Array<{ _id: string; count: number }>;
  byStatus: Array<{ _id: string; count: number }>;
  recentActivity: Array<{ _id: string; count: number }>;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "user":
      return <User className="h-4 w-4" />;
    case "task":
      return <ListTodo className="h-4 w-4" />;
    case "sms":
      return <MessageSquare className="h-4 w-4" />;
    case "email":
      return <Mail className="h-4 w-4" />;
    case "queue":
      return <ListTodo className="h-4 w-4" />;
    case "system":
      return <Server className="h-4 w-4" />;
    case "auth":
      return <Shield className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const getCategoryBadge = (category: string) => {
  const colors: Record<string, string> = {
    user: "bg-blue-100 text-blue-800",
    task: "bg-green-100 text-green-800",
    sms: "bg-purple-100 text-purple-800",
    email: "bg-orange-100 text-orange-800",
    queue: "bg-yellow-100 text-yellow-800",
    system: "bg-red-100 text-red-800",
    auth: "bg-indigo-100 text-indigo-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${colors[category] || "bg-gray-100 text-gray-800"}`}>
      {getCategoryIcon(category)}
      {category}
    </span>
  );
};

const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    success: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
    failed: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  };

  const { variant, icon } = config[status] || config.pending;

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {icon}
      {status}
    </Badge>
  );
};

const formatAction = (action: string) => {
  return action
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch audit logs
  const { data: logsData, isLoading: logsLoading, refetch } = useQuery({
    queryKey: ["audit-logs", page, search, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await api.get(`/tech-admin/audit-logs?${params}`);
      return response.data.data;
    },
  });

  // Fetch audit statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["audit-statistics"],
    queryFn: async () => {
      const response = await api.get("/tech-admin/audit-logs/statistics");
      return response.data.data as AuditStatistics;
    },
  });

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const logs = logsData?.logs || [];
  const pagination = logsData?.pagination || { total: 0, pages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track all administrative actions</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{statsData?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        {statsData?.byCategory?.slice(0, 3).map((cat) => (
          <Card key={cat._id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">{cat._id} Actions</CardTitle>
              {getCategoryIcon(cat._id)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cat.count}</div>
            </CardContent>
          </Card>
        ))}
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
                  placeholder="Search by description, actor..."
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
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="queue">Queue</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>
            {pagination.total} total audit entries
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
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: AuditLog) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.actorName}</div>
                          <div className="text-sm text-muted-foreground">
                            {log.actorEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatAction(log.action)}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {log.description}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(log.category)}</TableCell>
                      <TableCell>
                        {log.targetName || log.targetType || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* Audit Log Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Full details of the audit entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Actor
                  </label>
                  <p className="font-medium">{selectedLog.actorName}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.actorEmail}</p>
                  <p className="text-xs text-muted-foreground capitalize">Role: {selectedLog.actorRole}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Action
                  </label>
                  <p className="font-medium">{formatAction(selectedLog.action)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <div className="mt-1">{getCategoryBadge(selectedLog.category)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="font-medium">{selectedLog.description}</p>
              </div>

              {selectedLog.targetName && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Target
                  </label>
                  <p className="font-medium">
                    {selectedLog.targetType}: {selectedLog.targetName}
                  </p>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Details
                  </label>
                  <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.previousValues && Object.keys(selectedLog.previousValues).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Previous Values
                  </label>
                  <pre className="bg-red-50 p-3 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.previousValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    New Values
                  </label>
                  <pre className="bg-green-50 p-3 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
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
                    IP Address
                  </label>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Timestamp
                  </label>
                  <p className="text-sm">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User Agent
                  </label>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
