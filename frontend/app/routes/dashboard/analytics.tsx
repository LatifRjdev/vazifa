import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AlertCircle, TrendingUp, Users, CheckCircle, Clock, Printer, Download } from "lucide-react";
import { useState } from "react";

import { Loader } from "@/components/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, User } from "@/types";
import { useAuth } from "@/providers/auth-context";
import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/lib/fetch-utils";
import { getTaskStatusRussian, getPriorityRussian } from "@/lib/translations";
import { useLanguage } from "@/providers/language-context";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Аналитика" },
    { name: "description", content: "Аналитика задач в TaskHub!" },
  ];
}

// Цвета для диаграмм
const STATUS_COLORS = {
  "To Do": "#3b82f6",
  "In Progress": "#f59e0b", 
  "Done": "#10b981",
};

const PRIORITY_COLORS = {
  "High": "#ef4444",
  "Medium": "#f59e0b",
  "Low": "#10b981",
};

const AnalyticsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState("7days");
  const [selectedMember, setSelectedMember] = useState("all");

  // Проверка прав доступа
  const canViewAnalytics = user?.role && ["admin", "manager", "super_admin"].includes(user.role);

  // Загрузка данных
  const { data: allTasks, isPending: tasksLoading } = useQuery({
    queryKey: ["all-tasks-analytics"],
    queryFn: () => fetchData("/tasks/all-tasks"),
    enabled: canViewAnalytics,
  });

  // Загрузка всех пользователей
  const { data: usersData, isPending: usersLoading } = useQuery({
    queryKey: ["all-users-analytics"],
    queryFn: () => fetchData("/users/all"),
    enabled: canViewAnalytics,
  });

  if (!canViewAnalytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('analytics.access_denied')}</h2>
          <p className="text-muted-foreground">
            {t('analytics.no_access_message')}
          </p>
        </div>
      </div>
    );
  }

  if (tasksLoading || usersLoading) {
    return <Loader message={t('analytics.loading')} />;
  }

  const tasks: Task[] = Array.isArray(allTasks) ? allTasks : 
                       (allTasks && (allTasks as any).tasks && Array.isArray((allTasks as any).tasks)) ? (allTasks as any).tasks : [];
  
  const users: User[] = (usersData && typeof usersData === 'object' && 'users' in usersData && Array.isArray(usersData.users)) ? usersData.users : [];

  // Функция для фильтрации задач по времени
  const getFilteredTasksByTime = (tasks: Task[]) => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (timeFilter) {
      case "1day":
        filterDate.setDate(now.getDate() - 1);
        break;
      case "7days":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "1month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "6months":
        filterDate.setMonth(now.getMonth() - 6);
        break;
      case "1year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return tasks;
    }
    
    return tasks.filter(task => new Date(task.createdAt) >= filterDate);
  };

  // Функция печати диаграммы
  const printChart = (chartId: string) => {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Диаграмма - Vazifa</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .chart-container { text-align: center; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              <div class="chart-container">
                <h2>Аналитика Vazifa</h2>
                ${chartElement.outerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const filteredTasks = getFilteredTasksByTime(tasks);

  // Подготовка данных для общих диаграмм
  const statusData = [
    {
      name: t('status.todo'),
      value: filteredTasks.filter(t => t.status === "To Do").length,
      color: STATUS_COLORS["To Do"],
    },
    {
      name: t('status.in_progress'), 
      value: filteredTasks.filter(t => t.status === "In Progress").length,
      color: STATUS_COLORS["In Progress"],
    },
    {
      name: t('status.done'),
      value: filteredTasks.filter(t => t.status === "Done").length,
      color: STATUS_COLORS["Done"],
    },
  ];

  const priorityData = [
    {
      name: t('priority.high'),
      value: filteredTasks.filter(t => t.priority === "High").length,
      color: PRIORITY_COLORS["High"],
    },
    {
      name: t('priority.medium'),
      value: filteredTasks.filter(t => t.priority === "Medium").length,
      color: PRIORITY_COLORS["Medium"],
    },
    {
      name: t('priority.low'),
      value: filteredTasks.filter(t => t.priority === "Low").length,
      color: PRIORITY_COLORS["Low"],
    },
  ];

  // Подготовка данных для диаграмм по участникам
  const memberTasksData = users.map(member => {
    const memberTasks = filteredTasks.filter(task => 
      task.assignees?.some(assignee => assignee._id === member._id)
    );
    
    const total = memberTasks.length;
    const todo = memberTasks.filter(t => t.status === "To Do").length;
    const inProgress = memberTasks.filter(t => t.status === "In Progress").length;
    const done = memberTasks.filter(t => t.status === "Done").length;
    
    return {
      name: member.name,
      total,
      todo,
      inProgress,
      done,
      todoPercent: total > 0 ? Math.round((todo / total) * 100) : 0,
      inProgressPercent: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      donePercent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }).filter(data => data.total > 0);

  // Данные для выбранного участника
  const selectedMemberData = selectedMember === "all" ? null : 
    memberTasksData.find(data => data.name === selectedMember);

  // Общая статистика
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === "Done").length;
  const inProgressTasks = filteredTasks.filter(t => t.status === "In Progress").length;
  const todoTasks = filteredTasks.filter(t => t.status === "To Do").length;
  const highPriorityTasks = filteredTasks.filter(t => t.priority === "High").length;
  const overdueTasks = filteredTasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done"
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Данные для временной диаграммы
  const getTimelineData = () => {
    const periods = [];
    const now = new Date();
    
    if (timeFilter === "1day") {
      // Последние 24 часа по часам
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(date.getHours() - i);
        periods.push(date);
      }
    } else if (timeFilter === "7days") {
      // Последние 7 дней
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        periods.push(date);
      }
    } else if (timeFilter === "1month") {
      // Последние 30 дней
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        periods.push(date);
      }
    } else if (timeFilter === "6months") {
      // Последние 6 месяцев
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        periods.push(date);
      }
    } else if (timeFilter === "1year") {
      // Последние 12 месяцев
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        periods.push(date);
      }
    }

    return periods.map(date => {
      const periodTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        if (timeFilter === "1day") {
          return taskDate.getDate() === date.getDate() && 
                 taskDate.getHours() === date.getHours();
        } else if (timeFilter === "7days" || timeFilter === "1month") {
          return taskDate.toDateString() === date.toDateString();
        } else {
          return taskDate.getMonth() === date.getMonth() && 
                 taskDate.getFullYear() === date.getFullYear();
        }
      });

      const formatLabel = () => {
        if (timeFilter === "1day") {
          return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (timeFilter === "7days" || timeFilter === "1month") {
          return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
        } else {
          return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
        }
      };

      return {
        date: formatLabel(),
        created: periodTasks.length,
        completed: periodTasks.filter(t => t.status === "Done").length,
      };
    });
  };

  const timelineData = getTimelineData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('analytics.title')}</h1>
          <p className="text-muted-foreground">
            {t('analytics.description')}
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.filters')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('analytics.time_period')}</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">{t('analytics.last_day')}</SelectItem>
                  <SelectItem value="7days">{t('analytics.last_7_days')}</SelectItem>
                  <SelectItem value="1month">{t('analytics.last_month')}</SelectItem>
                  <SelectItem value="6months">{t('analytics.last_6_months')}</SelectItem>
                  <SelectItem value="1year">{t('analytics.last_year')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('analytics.member')}</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('analytics.all_members')}</SelectItem>
                  {memberTasksData.map(member => (
                    <SelectItem key={member.name} value={member.name}>
                      {member.name} ({member.total} {t('analytics.tasks_count_suffix')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Общая статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.total_tasks')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.for_selected_period')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.completed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.completion_rate').replace('{rate}', completionRate.toString())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.in_progress')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.active_tasks')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.overdue')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.require_attention')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Диаграммы по участникам или общие */}
      {selectedMember === "all" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Общая диаграмма по статусам */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('analytics.status_distribution')}</CardTitle>
                <CardDescription>
                  {t('analytics.status_distribution_desc')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => printChart("status-chart")}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div id="status-chart" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Общая диаграмма по приоритетам */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('analytics.priority_distribution')}</CardTitle>
                <CardDescription>
                  {t('analytics.priority_distribution_desc')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => printChart("priority-chart")}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div id="priority-chart" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        selectedMemberData && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Диаграмма задач участника */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('analytics.member_tasks').replace('{name}', selectedMemberData.name)}</CardTitle>
                  <CardDescription>
                    {t('analytics.total_tasks_count').replace('{count}', selectedMemberData.total.toString())}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printChart("member-chart")}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div id="member-chart" className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('status.todo'), value: selectedMemberData.todo, color: STATUS_COLORS["To Do"] },
                          { name: t('status.in_progress'), value: selectedMemberData.inProgress, color: STATUS_COLORS["In Progress"] },
                          { name: t('status.done'), value: selectedMemberData.done, color: STATUS_COLORS["Done"] },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: t('status.todo'), value: selectedMemberData.todo, color: STATUS_COLORS["To Do"] },
                          { name: t('status.in_progress'), value: selectedMemberData.inProgress, color: STATUS_COLORS["In Progress"] },
                          { name: t('status.done'), value: selectedMemberData.done, color: STATUS_COLORS["Done"] },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Статистика участника */}
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.detailed_stats')}</CardTitle>
                <CardDescription>
                  {t('analytics.percentage_ratio')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('status.todo')}</span>
                    <span className="text-sm font-medium">{selectedMemberData.todo} ({selectedMemberData.todoPercent}%)</span>
                  </div>
                  <Progress value={selectedMemberData.todoPercent} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('status.in_progress')}</span>
                    <span className="text-sm font-medium">{selectedMemberData.inProgress} ({selectedMemberData.inProgressPercent}%)</span>
                  </div>
                  <Progress value={selectedMemberData.inProgressPercent} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('status.done')}</span>
                    <span className="text-sm font-medium">{selectedMemberData.done} ({selectedMemberData.donePercent}%)</span>
                  </div>
                  <Progress value={selectedMemberData.donePercent} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* Диаграмма статистики по участникам */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('analytics.member_stats')}</CardTitle>
            <CardDescription>
              {t('analytics.member_stats_desc')}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => printChart("members-chart")}
          >
            <Printer className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div id="members-chart" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberTasksData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="done" fill={STATUS_COLORS["Done"]} name={t('status.done')} />
                <Bar dataKey="inProgress" fill={STATUS_COLORS["In Progress"]} name={t('status.in_progress')} />
                <Bar dataKey="todo" fill={STATUS_COLORS["To Do"]} name={t('status.todo')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Временная диаграмма */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('analytics.activity_timeline')}</CardTitle>
            <CardDescription>
              {t('analytics.activity_timeline_desc')}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => printChart("timeline-chart")}
          >
            <Printer className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div id="timeline-chart" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" fill="#3b82f6" name={t('analytics.created')} />
                <Bar dataKey="completed" fill="#10b981" name={t('analytics.completed_tasks')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default AnalyticsPage;
