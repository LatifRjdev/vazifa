import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListTodo,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib";

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

interface QueueJob {
  id: string;
  name: string;
  data: {
    phoneNumber?: string;
    message?: string;
    type?: string;
  };
  progress: number;
  attemptsMade: number;
  failedReason?: string;
  processedOn?: number;
  finishedOn?: number;
  timestamp: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "waiting":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "active":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "delayed":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    default:
      return <ListTodo className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    waiting: "secondary",
    active: "default",
    completed: "outline",
    failed: "destructive",
    delayed: "secondary",
  };

  return (
    <Badge variant={variants[status] || "secondary"} className="flex items-center gap-1">
      {getStatusIcon(status)}
      {status}
    </Badge>
  );
};

export default function QueueManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("waiting");
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<QueueJob | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cleanDialogOpen, setCleanDialogOpen] = useState(false);
  const [cleanStatus, setCleanStatus] = useState<"completed" | "failed">("completed");

  // Fetch queue stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["queue-stats"],
    queryFn: async () => {
      const response = await api.get("/tech-admin/queue/stats");
      return response.data.data as QueueStats;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch queue jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["queue-jobs", statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: "20",
      });
      const response = await api.get(`/tech-admin/queue/jobs?${params}`);
      return response.data;
    },
    refetchInterval: 5000,
  });

  // Pause queue mutation
  const pauseMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/tech-admin/queue/pause");
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Queue paused",
        description: "The SMS queue has been paused.",
      });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to pause queue",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Resume queue mutation
  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/tech-admin/queue/resume");
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Queue resumed",
        description: "The SMS queue has been resumed.",
      });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to resume queue",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Retry job mutation
  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/tech-admin/queue/jobs/${id}/retry`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Job retried",
        description: "The job has been added back to the queue.",
      });
      queryClient.invalidateQueries({ queryKey: ["queue-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to retry job",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Remove job mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tech-admin/queue/jobs/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Job removed",
        description: "The job has been removed from the queue.",
      });
      queryClient.invalidateQueries({ queryKey: ["queue-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove job",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Clean queue mutation
  const cleanMutation = useMutation({
    mutationFn: async ({ status, olderThan }: { status: string; olderThan: number }) => {
      const response = await api.post("/tech-admin/queue/clean", { status, olderThan });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Queue cleaned",
        description: `Removed ${data.cleaned || 0} jobs from the queue.`,
      });
      queryClient.invalidateQueries({ queryKey: ["queue-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      setCleanDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to clean queue",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (job: QueueJob) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const jobs = jobsData?.jobs || [];
  const pagination = jobsData?.pagination || { total: 0, pages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Queue Management</h1>
          <p className="text-muted-foreground">Monitor and manage the SMS queue</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
              queryClient.invalidateQueries({ queryKey: ["queue-jobs"] });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {statsData?.paused ? (
            <Button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume Queue
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause Queue
            </Button>
          )}
        </div>
      </div>

      {/* Queue Status Banner */}
      {statsData?.paused && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">Queue is Paused</p>
            <p className="text-sm text-yellow-700">
              No new SMS messages will be processed until the queue is resumed.
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "waiting" ? "ring-2 ring-primary" : ""}`}
          onClick={() => {
            setStatusFilter("waiting");
            setPage(1);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{statsData?.waiting || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "active" ? "ring-2 ring-primary" : ""}`}
          onClick={() => {
            setStatusFilter("active");
            setPage(1);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{statsData?.active || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "completed" ? "ring-2 ring-primary" : ""}`}
          onClick={() => {
            setStatusFilter("completed");
            setPage(1);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {statsData?.completed || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "failed" ? "ring-2 ring-primary" : ""}`}
          onClick={() => {
            setStatusFilter("failed");
            setPage(1);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {statsData?.failed || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "delayed" ? "ring-2 ring-primary" : ""}`}
          onClick={() => {
            setStatusFilter("delayed");
            setPage(1);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {statsData?.delayed || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Queue Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Actions</CardTitle>
          <CardDescription>Manage queue jobs and cleanup old entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setCleanStatus("completed");
                setCleanDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Completed Jobs
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCleanStatus("failed");
                setCleanDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Failed Jobs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(statusFilter)}
                {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Jobs
              </CardTitle>
              <CardDescription>
                {pagination.total} total jobs
              </CardDescription>
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
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {statusFilter} jobs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job: QueueJob) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">
                        {job.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{job.data?.phoneNumber || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.data?.type || job.name}</Badge>
                      </TableCell>
                      <TableCell>{job.attemptsMade}</TableCell>
                      <TableCell>
                        {new Date(job.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(job)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {statusFilter === "failed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => retryMutation.mutate(job.id)}
                              disabled={retryMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {(statusFilter === "waiting" || statusFilter === "failed") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMutation.mutate(job.id)}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Job Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>
              Full details of the queue job
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Job ID
                  </label>
                  <p className="font-mono text-sm">{selectedJob.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">{getStatusBadge(statusFilter)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="font-medium">{selectedJob.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Attempts
                  </label>
                  <p className="font-medium">{selectedJob.attemptsMade}</p>
                </div>
              </div>

              {selectedJob.data?.phoneNumber && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </label>
                  <p className="font-medium">{selectedJob.data.phoneNumber}</p>
                </div>
              )}

              {selectedJob.data?.message && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Message
                  </label>
                  <p className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">
                    {selectedJob.data.message}
                  </p>
                </div>
              )}

              {selectedJob.failedReason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Failed Reason
                  </label>
                  <p className="text-red-600 bg-red-50 p-3 rounded-md text-sm">
                    {selectedJob.failedReason}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created
                  </label>
                  <p className="text-sm">
                    {new Date(selectedJob.timestamp).toLocaleString()}
                  </p>
                </div>
                {selectedJob.processedOn && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Processed
                    </label>
                    <p className="text-sm">
                      {new Date(selectedJob.processedOn).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedJob.finishedOn && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Finished
                    </label>
                    <p className="text-sm">
                      {new Date(selectedJob.finishedOn).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {statusFilter === "failed" && (
                <div className="pt-4 border-t flex gap-2">
                  <Button
                    onClick={() => {
                      retryMutation.mutate(selectedJob.id);
                      setDetailsOpen(false);
                    }}
                    disabled={retryMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Job
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      removeMutation.mutate(selectedJob.id);
                      setDetailsOpen(false);
                    }}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Job
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clean Queue Dialog */}
      <AlertDialog open={cleanDialogOpen} onOpenChange={setCleanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clean {cleanStatus} jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {cleanStatus} jobs older than 24 hours from the queue.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                cleanMutation.mutate({
                  status: cleanStatus,
                  olderThan: 24 * 60 * 60 * 1000, // 24 hours
                })
              }
            >
              Clean Jobs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
