import {
  Users,
  UserPlus,
  Settings,
  Shield,
  Crown,
  User,
  AlertCircle,
  Search,
  MoreHorizontal,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Loader } from "@/components/loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateDetailedRussian } from "@/lib/date-utils";
import type { User as UserType, Task } from "@/types";
import { useAuth } from "@/providers/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchData, updateData } from "@/lib/fetch-utils";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Участники" },
    { name: "description", content: "Управление участниками в TaskHub!" },
  ];
}

const MembersPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "manager" | "member">("member");

  // Проверка прав доступа
  const canManageMembers = user?.role && ["admin", "super_admin", "manager"].includes(user.role);
  const canChangeRoles = user?.role === "admin" || user?.role === "super_admin";

  // Загрузка всех пользователей
  const { data: usersData, isPending: usersLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => fetchData("/users/all"),
    enabled: canManageMembers,
  });

  // Загрузка всех задач для подсчета статистики
  const { data: allTasks, isPending: tasksLoading } = useQuery({
    queryKey: ["all-tasks-for-stats"],
    queryFn: () => fetchData("/tasks/all-tasks"),
    enabled: canManageMembers,
  });

  // Мутация для изменения роли
  const changeRoleMutation = useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      updateData(`/admin/users/${data.userId}/role`, { role: data.role }),
    onSuccess: () => {
      toast.success("Роль пользователя успешно изменена");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Ошибка изменения роли");
    },
  });

  if (!canManageMembers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Доступ запрещен</h2>
          <p className="text-muted-foreground">
            У вас нет прав для просмотра участников. Обратитесь к администратору.
          </p>
        </div>
      </div>
    );
  }

  if (usersLoading || tasksLoading) {
    return <Loader message="Загрузка участников..." />;
  }

  const users: UserType[] = (usersData && typeof usersData === 'object' && 'users' in usersData && Array.isArray(usersData.users)) ? usersData.users : [];
  const tasks: Task[] = Array.isArray(allTasks) ? allTasks : 
                       (allTasks && (allTasks as any).tasks && Array.isArray((allTasks as any).tasks)) ? (allTasks as any).tasks : [];

  // Подсчет задач для каждого пользователя
  const memberTaskCounts = new Map<string, {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
  }>();

  tasks.forEach(task => {
    if (task.assignees) {
      task.assignees.forEach(assignee => {
        const existing = memberTaskCounts.get(assignee._id) || {
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
        };
        
        existing.total++;
        if (task.status === "Done") existing.completed++;
        else if (task.status === "In Progress") existing.inProgress++;
        else if (task.status === "To Do") existing.todo++;
        
        memberTaskCounts.set(assignee._id, existing);
      });
    }
  });

  // Фильтрация участников
  const filteredMembers = users.filter(member => {
    const matchesSearch = 
      (member.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "manager":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "manager":
        return "Менеджер";
      default:
        return "Участник";
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive" as const;
      case "manager":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  const handleChangeRole = (member: UserType) => {
    setSelectedUser(member);
    setNewRole(member.role as "admin" | "manager" | "member");
    setIsRoleDialogOpen(true);
  };

  const confirmRoleChange = () => {
    if (selectedUser) {
      changeRoleMutation.mutate({
        userId: selectedUser._id,
        role: newRole,
      });
    }
  };

  // Статистика
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    managers: users.filter(u => u.role === "manager").length,
    members: users.filter(u => u.role === "member").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Участники</h1>
          <p className="text-muted-foreground">
            Управление участниками и их ролями
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего участников</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Администраторы</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Менеджеры</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.managers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Участники</CardTitle>
            <User className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.members}</div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>Поиск и фильтры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                <SelectItem value="admin">Администраторы</SelectItem>
                <SelectItem value="manager">Менеджеры</SelectItem>
                <SelectItem value="member">Участники</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Таблица участников */}
      <Card>
        <CardHeader>
          <CardTitle>
            Участники ({filteredMembers.length} из {users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Задачи</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                  {canChangeRoles && <TableHead>Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const taskStats = memberTaskCounts.get(member._id) || {
                    total: 0,
                    completed: 0,
                    inProgress: 0,
                    todo: 0,
                  };

                  return (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.profilePicture} />
                            <AvatarFallback>
                              {(member.name || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name || 'Без имени'}</div>
                            <div className="text-sm text-muted-foreground">
                              {member.email || 'Без email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role || 'member')}
                          <Badge variant={getRoleBadgeVariant(member.role || 'member')}>
                            {getRoleLabel(member.role || 'member')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            Всего: {taskStats.total}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                              {taskStats.todo}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-yellow-600" />
                              {taskStats.inProgress}
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {taskStats.completed}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {member.createdAt ? formatDateDetailedRussian(member.createdAt) : 'Дата не указана'}
                        </span>
                      </TableCell>
                      {canChangeRoles && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Действия</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member)}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Изменить роль
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canChangeRoles ? 5 : 4} className="text-center py-8">
                      <div className="text-muted-foreground">
                        Участников, соответствующих критериям, не найдено
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог изменения роли */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить роль пользователя</DialogTitle>
            <DialogDescription>
              Изменение роли пользователя {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Новая роль</label>
              <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      Администратор
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Менеджер
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      Участник
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={confirmRoleChange}
              disabled={changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending ? "Изменение..." : "Изменить роль"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersPage;
