import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Activity,
  LogIn,
  Shield,
  Crown,
} from "lucide-react";

import { useAuth } from "@/providers/auth-context";
import { fetchData } from "@/lib/fetch-utils";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Профиль пользователя" },
    { name: "description", content: "Просмотр профиля и активности пользователя" },
  ];
}

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Check permissions
  const canViewProfile = currentUser?.role &&
    ["admin", "super_admin", "chief_manager", "manager"].includes(currentUser.role);

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => fetchData(`/users/${userId}/profile`),
    enabled: !!userId && canViewProfile,
  });

  // Fetch user activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["user-activity", userId],
    queryFn: () => fetchData(`/users/${userId}/activity?limit=50`),
    enabled: !!userId && canViewProfile && activeTab === "activity",
  });

  // Fetch login history
  const { data: loginData, isLoading: loginLoading } = useQuery({
    queryKey: ["user-logins", userId],
    queryFn: () => fetchData(`/users/${userId}/logins?limit=20`),
    enabled: !!userId && canViewProfile && activeTab === "logins",
  });

  // Fetch task views
  const { data: taskViewsData, isLoading: taskViewsLoading } = useQuery({
    queryKey: ["user-task-views", userId],
    queryFn: () => fetchData(`/users/${userId}/task-views`),
    enabled: !!userId && canViewProfile && activeTab === "tasks",
  });

  if (!canViewProfile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Доступ запрещен</h2>
          <p className="text-muted-foreground">
            У вас нет прав для просмотра профиля пользователя.
          </p>
          <Button className="mt-4" onClick={() => navigate("/dashboard/members")}>
            Назад к участникам
          </Button>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return <Loader message="Загрузка профиля..." />;
  }

  if (profileError || !profileData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ошибка загрузки</h2>
          <p className="text-muted-foreground">
            Не удалось загрузить профиль пользователя.
          </p>
          <Button className="mt-4" onClick={() => navigate("/dashboard/members")}>
            Назад к участникам
          </Button>
        </div>
      </div>
    );
  }

  const { user: profileUser, taskStats, viewedTasksCount, unviewedTasksCount } = profileData;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
      case "super_admin":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "chief_manager":
        return <Shield className="h-4 w-4 text-purple-600" />;
      case "manager":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Супер Администратор";
      case "admin":
        return "Администратор";
      case "chief_manager":
        return "Главный Менеджер";
      case "manager":
        return "Менеджер";
      default:
        return "Участник";
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      logged_in: "Вошел в систему",
      viewed_task: "Просмотрел задачу",
      created_task: "Создал задачу",
      updated_task: "Обновил задачу",
      completed_task: "Завершил задачу",
      added_comment: "Добавил комментарий",
      added_response: "Добавил ответ",
      added_attachment: "Добавил вложение",
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/members")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Профиль пользователя</h1>
          <p className="text-muted-foreground">
            Просмотр информации и активности
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileUser.profilePicture} />
              <AvatarFallback className="text-2xl">
                {(profileUser.name || "U").charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{profileUser.name || "Без имени"}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleIcon(profileUser.role)}
                  <Badge variant="outline">{getRoleLabel(profileUser.role)}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {profileUser.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{profileUser.email}</span>
                  </div>
                )}
                {profileUser.phoneNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{profileUser.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Регистрация: {profileUser.createdAt ? format(new Date(profileUser.createdAt), "dd MMM yyyy", { locale: ru }) : "Неизвестно"}</span>
                </div>
                {profileUser.lastLogin && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LogIn className="h-4 w-4" />
                    <span>Последний вход: {formatDistanceToNow(new Date(profileUser.lastLogin), { addSuffix: true, locale: ru })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.assigned?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Назначено пользователю</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполнено</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStats?.assigned?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Завершенных задач</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просмотрено</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{viewedTasksCount || 0}</div>
            <p className="text-xs text-muted-foreground">Задач просмотрено</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Не просмотрено</CardTitle>
            <EyeOff className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unviewedTasksCount || 0}</div>
            <p className="text-xs text-muted-foreground">Задач не открыто</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed info */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="tasks">Задачи</TabsTrigger>
              <TabsTrigger value="activity">Активность</TabsTrigger>
              <TabsTrigger value="logins">История входов</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="overview" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3">Статистика задач</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      <span>К выполнению</span>
                      <Badge variant="secondary">{taskStats?.assigned?.todo || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                      <span>В процессе</span>
                      <Badge variant="secondary">{taskStats?.assigned?.inProgress || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950 rounded">
                      <span>Выполнено</span>
                      <Badge variant="secondary">{taskStats?.assigned?.completed || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-950 rounded">
                      <span>Создано пользователем</span>
                      <Badge variant="secondary">{taskStats?.created || 0}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Активность просмотров</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-green-600" />
                        Просмотренные задачи
                      </span>
                      <Badge variant="outline">{viewedTasksCount || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4 text-orange-600" />
                        Непросмотренные задачи
                      </span>
                      <Badge variant="outline">{unviewedTasksCount || 0}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              {taskViewsLoading ? (
                <Loader message="Загрузка задач..." />
              ) : (
                <div>
                  <div className="flex gap-2 mb-4">
                    <Badge variant="secondary">
                      Всего: {taskViewsData?.summary?.total || 0}
                    </Badge>
                    <Badge variant="outline" className="text-green-600">
                      Просмотрено: {taskViewsData?.summary?.viewed || 0}
                    </Badge>
                    <Badge variant="outline" className="text-orange-600">
                      Не просмотрено: {taskViewsData?.summary?.unviewed || 0}
                    </Badge>
                  </div>

                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Задача</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Просмотрено</TableHead>
                          <TableHead>Последний просмотр</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taskViewsData?.tasks?.map((task: any) => (
                          <TableRow key={task._id}>
                            <TableCell>
                              <Link
                                to={`/dashboard/task/${task._id}`}
                                className="hover:underline text-primary"
                              >
                                {task.title}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                task.status === "Done" ? "default" :
                                task.status === "In Progress" ? "secondary" : "outline"
                              }>
                                {task.status === "Done" ? "Выполнено" :
                                 task.status === "In Progress" ? "В процессе" : "К выполнению"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {task.viewed ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-orange-600" />
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {task.lastViewedAt
                                ? formatDistanceToNow(new Date(task.lastViewedAt), { addSuffix: true, locale: ru })
                                : "Не просматривалось"}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!taskViewsData?.tasks || taskViewsData.tasks.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              Нет назначенных задач
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              {activityLoading ? (
                <Loader message="Загрузка активности..." />
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {activityData?.activities?.map((activity: any) => (
                      <div
                        key={activity._id}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {getActionLabel(activity.action)}
                          </p>
                          {activity.details?.taskTitle && (
                            <p className="text-sm text-muted-foreground">
                              {activity.details.taskTitle}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ru })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!activityData?.activities || activityData.activities.length === 0) && (
                      <div className="text-center text-muted-foreground py-8">
                        Нет записей активности
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="logins" className="mt-0">
              {loginLoading ? (
                <Loader message="Загрузка истории входов..." />
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата и время</TableHead>
                        <TableHead>Метод</TableHead>
                        <TableHead>IP адрес</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginData?.logins?.map((login: any) => (
                        <TableRow key={login._id}>
                          <TableCell>
                            {format(new Date(login.createdAt), "dd MMM yyyy, HH:mm", { locale: ru })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {login.details?.method === 'google' ? 'Google' :
                               login.details?.method === '2fa' ? '2FA' :
                               login.details?.method === 'phone' ? 'Телефон' : 'Email'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {login.details?.ip || "Неизвестно"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!loginData?.logins || loginData.logins.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Нет записей о входах
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default UserProfilePage;
