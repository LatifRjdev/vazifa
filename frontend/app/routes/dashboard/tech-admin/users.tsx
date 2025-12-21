import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Key,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth, isTechAdmin } from "@/providers/auth-context";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  disabled?: boolean;
  disabledAt?: string;
  disabledBy?: { name: string; email: string };
  disabledReason?: string;
  createdAt: string;
  lastLogin?: string;
  authProvider?: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const API_URL = '/api-v1';

// API Functions
async function fetchUsers(params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<UsersResponse> {
  const token = localStorage.getItem("token");
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    ...(params.search && { search: params.search }),
    ...(params.role && params.role !== "all" && { role: params.role }),
    ...(params.status && params.status !== "all" && { status: params.status }),
  });

  const response = await fetch(`${API_URL}/tech-admin/users?${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

async function createUser(data: {
  name: string;
  email?: string;
  phoneNumber?: string;
  password: string;
  role: string;
}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create user");
  }
  return response.json();
}

async function updateUser(id: string, data: Partial<User>) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/users/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update user");
  }
  return response.json();
}

async function deleteUser(id: string, reason: string) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete user");
  }
  return response.json();
}

async function toggleUserStatus(id: string, disabled: boolean, reason: string) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/users/${id}/toggle-status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ disabled, reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to toggle user status");
  }
  return response.json();
}

async function resetPassword(id: string, newPassword: string, sendNotification: boolean) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/tech-admin/users/${id}/reset-password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newPassword, sendNotification }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reset password");
  }
  return response.json();
}

export default function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isToggleStatusOpen, setIsToggleStatusOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "member",
  });
  const [actionReason, setActionReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sendNotification, setSendNotification] = useState(true);

  // Redirect if not tech admin
  useEffect(() => {
    if (user && !isTechAdmin(user)) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Fetch users
  const { data, isLoading, error } = useQuery({
    queryKey: ["tech-admin", "users", page, search, roleFilter, statusFilter],
    queryFn: () => fetchUsers({ page, limit: 20, search, role: roleFilter, status: statusFilter }),
    enabled: isTechAdmin(user),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["tech-admin", "users"] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => updateUser(id, data),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tech-admin", "users"] });
      setIsEditOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteUser(id, reason),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tech-admin", "users"] });
      setIsDeleteOpen(false);
      setSelectedUser(null);
      setActionReason("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, disabled, reason }: { id: string; disabled: boolean; reason: string }) =>
      toggleUserStatus(id, disabled, reason),
    onSuccess: (_, variables) => {
      toast.success(variables.disabled ? "User disabled successfully" : "User enabled successfully");
      queryClient.invalidateQueries({ queryKey: ["tech-admin", "users"] });
      setIsToggleStatusOpen(false);
      setSelectedUser(null);
      setActionReason("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password, notify }: { id: string; password: string; notify: boolean }) =>
      resetPassword(id, password, notify),
    onSuccess: () => {
      toast.success("Password reset successfully");
      setIsResetPasswordOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", phoneNumber: "", password: "", role: "member" });
  };

  const openEditDialog = (u: User) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email || "",
      phoneNumber: u.phoneNumber || "",
      password: "",
      role: u.role,
    });
    setIsEditOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "tech_admin": return "bg-purple-500";
      case "super_admin": return "bg-red-500";
      case "admin": return "bg-blue-500";
      case "manager": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage all system users</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="tech_admin">Tech Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load users. Please try refreshing.</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : data?.users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                data?.users?.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.authProvider || "local"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{u.email || "-"}</div>
                      <div className="text-xs text-muted-foreground">{u.phoneNumber || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(u.role)}>
                        {u.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.disabled ? (
                        <Badge variant="destructive">Disabled</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(u)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedUser(u); setIsResetPasswordOpen(true); }}>
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setSelectedUser(u); setIsToggleStatusOpen(true); }}
                            disabled={["tech_admin", "super_admin"].includes(u.role)}
                          >
                            {u.disabled ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Enable User
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Disable User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setSelectedUser(u); setIsDeleteOpen(true); }}
                            disabled={["tech_admin", "super_admin"].includes(u.role)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="First Last"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+992901234567"
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="tech_admin">Tech Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.name || !formData.password}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="tech_admin">Tech Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedUser && updateMutation.mutate({
                id: selectedUser._id,
                data: { name: formData.name, email: formData.email, phoneNumber: formData.phoneNumber, role: formData.role }
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Reason for deletion</Label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setActionReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && deleteMutation.mutate({ id: selectedUser._id, reason: actionReason })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Dialog */}
      <Dialog open={isToggleStatusOpen} onOpenChange={setIsToggleStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser?.disabled ? "Enable" : "Disable"} User</DialogTitle>
            <DialogDescription>
              {selectedUser?.disabled
                ? `Re-enable ${selectedUser?.name}'s account?`
                : `Disable ${selectedUser?.name}'s account? They won't be able to log in.`}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Reason</Label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsToggleStatusOpen(false); setActionReason(""); }}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.disabled ? "default" : "destructive"}
              onClick={() => selectedUser && toggleStatusMutation.mutate({
                id: selectedUser._id,
                disabled: !selectedUser.disabled,
                reason: actionReason
              })}
              disabled={toggleStatusMutation.isPending}
            >
              {toggleStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedUser?.disabled ? "Enable" : "Disable"} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendNotification"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="sendNotification" className="text-sm font-normal">
                Send SMS notification with new password
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsResetPasswordOpen(false); setNewPassword(""); }}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && resetPasswordMutation.mutate({
                id: selectedUser._id,
                password: newPassword,
                notify: sendNotification
              })}
              disabled={resetPasswordMutation.isPending || newPassword.length < 8}
            >
              {resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
