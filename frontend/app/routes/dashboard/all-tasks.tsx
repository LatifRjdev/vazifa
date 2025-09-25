import {
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Users,
  Calendar,
  AlertCircle,
  Eye,
  CalendarDays,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { Loader } from "@/components/loader";
import { useLanguage } from "@/providers/language-context";
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
  DropdownMenuGroup,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateDetailedRussian, formatDueDateRussian } from "@/lib/date-utils";
import { getTaskStatusRussian, getPriorityRussian } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { useAuth } from "@/providers/auth-context";
import { useGetAllTasksQuery } from "@/hooks/use-task";
import { 
  type DateFilterPeriod, 
  getDateRangeForPeriod, 
  getPeriodLabel, 
  filterTasksByDateRange 
} from "@/lib/date-filters";

export function meta() {
  return [
    { title: "TaskHub | Все задачи" },
    { name: "description", content: "Управление всеми задачами в TaskHub!" },
  ];
}

const AllTasksPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Проверка прав доступа
  const canViewAllTasks = user?.role && ["admin", "super_admin", "manager"].includes(user.role);

  // Состояние фильтров
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  );
  
  // Фильтры по времени создания
  const [dateFilter, setDateFilter] = useState<DateFilterPeriod | "all">(
    (searchParams.get("dateFilter") as DateFilterPeriod) || "all"
  );
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(
    searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined
  );
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(
    searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined
  );

  // Загрузка данных
  const { data: allTasks, isPending: tasksLoading } = useGetAllTasksQuery(canViewAllTasks);

  // Синхронизация с URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (statusFilter !== "all") params.status = statusFilter;
    if (priorityFilter !== "all") params.priority = priorityFilter;
    if (sortBy !== "createdAt") params.sortBy = sortBy;
    if (sortOrder !== "desc") params.sortOrder = sortOrder;
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, statusFilter, priorityFilter, sortBy, sortOrder, setSearchParams]);

  if (!canViewAllTasks) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('all_tasks.access_denied')}</h2>
          <p className="text-muted-foreground">
            {t('all_tasks.no_access_message')}
          </p>
        </div>
      </div>
    );
  }

  if (tasksLoading) {
    return <Loader message={t('all_tasks.loading')} />;
  }

  const tasks: Task[] = Array.isArray((allTasks as any)?.tasks) ? (allTasks as any).tasks : [];

  // Фильтрация задач
  let filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Применяем фильтр по времени создания
  if (dateFilter !== "all") {
    if (dateFilter === "custom") {
      if (customDateFrom || customDateTo) {
        const dateRange = getDateRangeForPeriod("custom", {
          from: customDateFrom,
          to: customDateTo
        });
        filteredTasks = filterTasksByDateRange(filteredTasks, dateRange, "createdAt");
      }
    } else {
      const dateRange = getDateRangeForPeriod(dateFilter);
      filteredTasks = filterTasksByDateRange(filteredTasks, dateRange, "createdAt");
    }
  }

  // Сортировка задач
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "priority":
        const priorityOrder = { "High": 3, "Medium": 2, "Low": 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        break;
      case "dueDate":
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        break;
      case "createdAt":
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Статистика
  const stats = {
    total: tasks.length,
    filtered: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === "To Do").length,
    inProgress: filteredTasks.filter(t => t.status === "In Progress").length,
    done: filteredTasks.filter(t => t.status === "Done").length,
    highPriority: filteredTasks.filter(t => t.priority === "High").length,
  };

  // Получаем название периода для отображения
  const periodLabel = dateFilter !== "all" ? getPeriodLabel(dateFilter) : "Все время";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('all_tasks.title')}</h1>
          <p className="text-muted-foreground">
            {t('all_tasks.description')}
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="space-y-4">
        {dateFilter !== "all" && (
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              <CalendarDays className="h-4 w-4 mr-1" />
              {t('all_tasks.statistics_period')}: {periodLabel}
            </Badge>
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {dateFilter !== "all" ? t('all_tasks.for_period') : t('all_tasks.total_tasks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dateFilter !== "all" ? stats.filtered : stats.total}</div>
              {dateFilter !== "all" && (
                <p className="text-xs text-muted-foreground">{t('all_tasks.from_total').replace('{total}', stats.total.toString())}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('status.todo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.todo}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('status.in_progress')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('status.done')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('all_tasks.high_priority')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>{t('all_tasks.filters_search')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('all_tasks.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('tasks.task_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_tasks.all_statuses')}</SelectItem>
                <SelectItem value="To Do">{t('status.todo')}</SelectItem>
                <SelectItem value="In Progress">{t('status.in_progress')}</SelectItem>
                <SelectItem value="Done">{t('status.done')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('tasks.task_priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_tasks.all_priorities')}</SelectItem>
                <SelectItem value="High">{t('priority.high')}</SelectItem>
                <SelectItem value="Medium">{t('priority.medium')}</SelectItem>
                <SelectItem value="Low">{t('priority.low')}</SelectItem>
              </SelectContent>
            </Select>

          </div>

          {/* Фильтры по времени создания */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('all_tasks.time_filter')}</span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilterPeriod | "all")}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t('all_tasks.period')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_tasks.all_time')}</SelectItem>
                  <SelectItem value="today">{t('all_tasks.today')}</SelectItem>
                  <SelectItem value="week">{t('all_tasks.week')}</SelectItem>
                  <SelectItem value="month">{t('all_tasks.month')}</SelectItem>
                  <SelectItem value="6months">{t('all_tasks.six_months')}</SelectItem>
                  <SelectItem value="year">{t('all_tasks.year')}</SelectItem>
                  <SelectItem value="custom">{t('all_tasks.custom_period')}</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === "custom" && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full md:w-48 justify-start text-left font-normal",
                          !customDateFrom && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customDateFrom ? format(customDateFrom, "dd.MM.yyyy", { locale: ru }) : t('all_tasks.date_from')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customDateFrom}
                        onSelect={setCustomDateFrom}
                        initialFocus
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full md:w-48 justify-start text-left font-normal",
                          !customDateTo && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customDateTo ? format(customDateTo, "dd.MM.yyyy", { locale: ru }) : t('all_tasks.date_to')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customDateTo}
                        onSelect={setCustomDateTo}
                        initialFocus
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setDateFilter("all");
                  setCustomDateFrom(undefined);
                  setCustomDateTo(undefined);
                }}
                className="w-full md:w-auto"
              >
                {t('all_tasks.reset_period')}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('all_tasks.sort_by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">{t('all_tasks.sort_created')}</SelectItem>
                <SelectItem value="title">{t('all_tasks.sort_title')}</SelectItem>
                <SelectItem value="status">{t('all_tasks.sort_status')}</SelectItem>
                <SelectItem value="priority">{t('all_tasks.sort_priority')}</SelectItem>
                <SelectItem value="dueDate">{t('all_tasks.sort_due_date')}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Таблица задач */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('all_tasks.tasks_count').replace('{filtered}', sortedTasks.length.toString()).replace('{total}', tasks.length.toString())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t('all_tasks.table_number')}</TableHead>
                  <TableHead>{t('all_tasks.table_title')}</TableHead>
                  <TableHead>{t('all_tasks.table_status')}</TableHead>
                  <TableHead>{t('all_tasks.table_priority')}</TableHead>
                  <TableHead>{t('all_tasks.table_assigned')}</TableHead>
                  <TableHead>{t('all_tasks.table_due_date')}</TableHead>
                  <TableHead>{t('all_tasks.table_created')}</TableHead>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <TableHead className="w-20">{t('all_tasks.table_actions')}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task, index) => (
                  <TableRow key={task._id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.status.toLowerCase() as any}>
                        {getTaskStatusRussian(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          task.priority === "High"
                            ? "destructive"
                            : task.priority === "Medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {getPriorityRussian(task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {task.assignees?.slice(0, 3).map((assignee, index) => (
                          assignee ? (
                            <Avatar key={assignee._id} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={assignee.profilePicture || undefined} />
                              <AvatarFallback className="text-xs">
                                {assignee.name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                          ) : null
                        ))}
                        {task.assignees && task.assignees.length > 3 && (
                          <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs">+{task.assignees.length - 3}</span>
                          </div>
                        )}
                        {(!task.assignees || task.assignees.length === 0) && (
                          <span className="text-sm text-muted-foreground">{t('all_tasks.not_assigned')}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? (
                        <span className={cn(
                          "text-sm",
                          new Date(task.dueDate) < new Date() && task.status !== "Done"
                            ? "text-red-600 font-medium"
                            : "text-muted-foreground"
                        )}>
                          {formatDueDateRussian(task.dueDate)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{t('all_tasks.not_specified')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDateDetailedRussian(task.createdAt)}
                      </span>
                    </TableCell>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <TableCell>
                        <Link to={`/dashboard/task/${task._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {sortedTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={(user?.role === 'admin' || user?.role === 'manager') ? 8 : 7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {t('all_tasks.no_tasks_found')}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllTasksPage;
