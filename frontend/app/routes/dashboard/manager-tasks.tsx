import { useQuery } from "@tanstack/react-query";
import {
  Star,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Filter,
  SortAsc,
  SortDesc,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  MessageSquare,
  CheckCircle2,
  Search,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router";

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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ResponseSection } from "@/components/tasks/response-section";
import { fetchData } from "@/lib/fetch-utils";
import type { Task } from "@/types";
import { useAuth } from "@/providers/auth-context";
import { useLanguage } from "@/providers/language-context";
import {
  formatDueDateRussian,
  formatDateDetailedRussian,
} from "@/lib/date-utils";
import { getTaskStatusRussian, getPriorityRussian } from "@/lib/translations";
import { getProjectDueDateColor } from "@/lib";
import { cn } from "@/lib/utils";

export default function ManagerTasksPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL or use defaults
  const initialFilter = searchParams.get("filter") || "all";
  const initialSort = searchParams.get("sort") || "desc";
  const initialSearch = searchParams.get("search") || "";

  const [filter, setFilter] = useState<string>(initialFilter);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    initialSort === "asc" ? "asc" : "desc"
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Группировка по названию (включена по умолчанию)
  const [groupByTitle, setGroupByTitle] = useState(
    searchParams.get("grouped") !== "false"
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(
    new Set()
  );

  // Функция переключения панели ответов
  const toggleResponsePanel = (taskId: string) => {
    setExpandedResponses((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Открыть все ответы в группе
  const expandAllResponses = (taskIds: string[]) => {
    setExpandedResponses((prev) => {
      const next = new Set(prev);
      taskIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // Keep state and URL in sync
  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    params.filter = filter;
    params.sort = sortDirection;
    params.search = searchQuery;
    if (groupByTitle) {
      params.grouped = "true";
    } else {
      delete params.grouped;
    }
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sortDirection, searchQuery, groupByTitle]);

  // If the URL changes externally, update state
  useEffect(() => {
    const urlFilter = searchParams.get("filter") || "all";
    const urlSort = searchParams.get("sort") || "desc";
    const urlSearch = searchParams.get("search") || "";
    if (urlFilter !== filter) setFilter(urlFilter);
    if (urlSort !== sortDirection)
      setSortDirection(urlSort === "asc" ? "asc" : "desc");
    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { data: managerTasks, isLoading } = useQuery({
    queryKey: ["manager-tasks"],
    queryFn: async () => {
      const data = await fetchData<{ myManagerTasks: Task[] }>(
        "/tasks/my-manager-tasks/"
      );
      return data.myManagerTasks;
    },
    enabled:
      !!user &&
      ["admin", "manager", "super_admin", "chief_manager"].includes(
        user.role || ""
      ),
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!managerTasks || managerTasks.length === 0) return [];

    return managerTasks
      .filter((task) => {
        if (filter === "all") return true;
        if (filter === "todo") return task.status === "To Do";
        if (filter === "inprogress") return task.status === "In Progress";
        if (filter === "done") return task.status === "Done";
        if (filter === "review") return task.status === "Review";
        if (filter === "awaiting") return task.awaitingStatusChange === true;
        if (filter === "high") return task.priority === "High";
        return true;
      })
      .filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [managerTasks, filter, searchQuery]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return sortDirection === "asc"
          ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      // Tasks without dueDate go to the end
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return 0;
    });
  }, [filteredTasks, sortDirection]);

  // Группировка задач по названию
  const groupedTasks = useMemo(() => {
    if (!groupByTitle) return null;

    const groups = new Map<string, Task[]>();
    sortedTasks.forEach((task) => {
      const title = task.title.trim();
      if (!groups.has(title)) {
        groups.set(title, []);
      }
      groups.get(title)!.push(task);
    });

    // Преобразуем в массив и сортируем группы по количеству задач
    return Array.from(groups.entries())
      .map(([title, tasks]) => ({
        title,
        tasks,
        count: tasks.length,
        todoCount: tasks.filter((t) => t.status === "To Do").length,
        inProgressCount: tasks.filter((t) => t.status === "In Progress").length,
        reviewCount: tasks.filter((t) => t.status === "Review").length,
        doneCount: tasks.filter((t) => t.status === "Done").length,
        awaitingCount: tasks.filter((t) => t.awaitingStatusChange).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [sortedTasks, groupByTitle]);

  // Функция для переключения состояния группы
  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  // Развернуть/свернуть все группы
  const toggleAllGroups = () => {
    if (groupedTasks) {
      if (expandedGroups.size === groupedTasks.length) {
        setExpandedGroups(new Set());
      } else {
        setExpandedGroups(new Set(groupedTasks.map((g) => g.title)));
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-800 border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (
    !user ||
    !["admin", "manager", "super_admin", "chief_manager"].includes(
      user.role || ""
    )
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("manager_tasks.no_access")}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">
            {t("manager_tasks.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("manager_tasks.description")}
          </p>
        </div>

        {/* Sort and Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setSortDirection(sortDirection === "asc" ? "desc" : "asc")
            }
          >
            {sortDirection === "asc" ? (
              <SortAsc className="h-4 w-4 mr-1" />
            ) : (
              <SortDesc className="h-4 w-4 mr-1" />
            )}
            {sortDirection === "asc" ? "Сначала старые" : "Сначала новые"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="h-4 w-4 mr-1" />
                Фильтр
                {filter !== "all" && (
                  <Badge variant="secondary" className="ml-2">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Фильтровать задачи</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  <span className={filter === "all" ? "font-bold" : ""}>
                    Все задачи
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("awaiting")}>
                  <AlertCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span className={filter === "awaiting" ? "font-bold" : ""}>
                    Жду изменения статуса
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter("todo")}>
                  <span className={filter === "todo" ? "font-bold" : ""}>
                    К выполнению
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("inprogress")}>
                  <span className={filter === "inprogress" ? "font-bold" : ""}>
                    В процессе
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("review")}>
                  <span className={filter === "review" ? "font-bold" : ""}>
                    На проверке
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("done")}>
                  <span className={filter === "done" ? "font-bold" : ""}>
                    Выполнено
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter("high")}>
                  <span className={filter === "high" ? "font-bold" : ""}>
                    Высокий приоритет
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Group toggle */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию или описанию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="group-by-title-manager"
            checked={groupByTitle}
            onCheckedChange={setGroupByTitle}
          />
          <Label
            htmlFor="group-by-title-manager"
            className="flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Layers className="h-4 w-4" />
            Группировать по названию
          </Label>
        </div>
      </div>

      {/* Active filter badge */}
      {filter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Активный фильтр:</span>
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={() => setFilter("all")}
          >
            {filter === "awaiting" && "Жду изменения статуса"}
            {filter === "todo" && "К выполнению"}
            {filter === "inprogress" && "В процессе"}
            {filter === "review" && "На проверке"}
            {filter === "done" && "Выполнено"}
            {filter === "high" && "Высокий приоритет"}
            <span className="ml-1">×</span>
          </Badge>
        </div>
      )}

      {/* Tasks content */}
      {!sortedTasks || sortedTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || filter !== "all"
                ? "Задачи не найдены"
                : t("manager_tasks.no_tasks_title")}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || filter !== "all"
                ? "Попробуйте изменить параметры поиска или фильтра"
                : t("manager_tasks.no_tasks_description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {groupByTitle && groupedTasks
                  ? `${groupedTasks.length} групп (${sortedTasks.length} задач)`
                  : t("manager_tasks.title")}
              </CardTitle>
              <CardDescription>
                {sortedTasks.length} задач под вашим управлением
              </CardDescription>
            </div>
            {groupByTitle && groupedTasks && groupedTasks.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleAllGroups}>
                {expandedGroups.size === groupedTasks.length
                  ? "Свернуть все"
                  : "Развернуть все"}
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {/* Grouped view */}
            {groupByTitle && groupedTasks ? (
              <div className="divide-y">
                {groupedTasks.map((group) => (
                  <Collapsible
                    key={group.title}
                    open={expandedGroups.has(group.title)}
                    onOpenChange={() => toggleGroup(group.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {expandedGroups.has(group.title) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium">{group.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {group.count} задач в группе
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {group.awaitingCount > 0 && (
                            <Badge className="bg-green-500 text-white">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Ожидает: {group.awaitingCount}
                            </Badge>
                          )}
                          {group.todoCount > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-600 border-blue-200"
                            >
                              К выполнению: {group.todoCount}
                            </Badge>
                          )}
                          {group.inProgressCount > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-600 border-yellow-200"
                            >
                              В процессе: {group.inProgressCount}
                            </Badge>
                          )}
                          {group.reviewCount > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-600 border-purple-200"
                            >
                              На проверке: {group.reviewCount}
                            </Badge>
                          )}
                          {group.doneCount > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-600 border-green-200"
                            >
                              Выполнено: {group.doneCount}
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              expandAllResponses(group.tasks.map((t) => t._id));
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Ответить ({group.count})
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t bg-muted/20">
                        {group.tasks.map((task) => (
                          <div
                            key={task._id}
                            className={cn(
                              "p-4 hover:bg-muted/50 border-b last:border-b-0 ml-8",
                              task.awaitingStatusChange &&
                                "bg-green-50 border-l-4 border-green-500 dark:bg-green-900/20"
                            )}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex">
                                <div
                                  className={`mr-3 rounded-full p-1 ${
                                    task.status === "Done"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                      : task.priority === "High"
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  }`}
                                >
                                  {task.status === "Done" ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <Clock className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    {task.awaitingStatusChange && (
                                      <Badge className="bg-green-500 text-white">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Ожидает
                                      </Badge>
                                    )}
                                    <Badge
                                      variant="outline"
                                      className={getStatusColor(task.status)}
                                    >
                                      {getTaskStatusRussian(task.status)}
                                    </Badge>
                                    {task.priority && (
                                      <Badge
                                        variant="outline"
                                        className={getPriorityColor(
                                          task.priority
                                        )}
                                      >
                                        {getPriorityRussian(task.priority)}
                                      </Badge>
                                    )}
                                    {task.isImportant && (
                                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                    )}
                                  </div>
                                  {/* Описание задачи */}
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  {/* Исполнители */}
                                  {task.assignees && task.assignees.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      <span>
                                        {task.assignees.length === 1
                                          ? task.assignees[0].name
                                          : `${task.assignees.length} исполнителей`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground space-y-1">
                                  {task.dueDate && (
                                    <div
                                      className={cn(
                                        getProjectDueDateColor(task.dueDate)
                                      )}
                                    >
                                      <Calendar className="h-3 w-3 inline mr-1" />
                                      {formatDueDateRussian(task.dueDate)}
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {formatDateDetailedRussian(task.createdAt)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Link to={`/dashboard/task/${task._id}`}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Просмотреть задачу"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant={
                                      expandedResponses.has(task._id)
                                        ? "default"
                                        : "ghost"
                                    }
                                    size="sm"
                                    title="Показать ответы"
                                    onClick={() => toggleResponsePanel(task._id)}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {/* Inline панель ответов */}
                            {expandedResponses.has(task._id) && (
                              <div className="mt-3 pt-3 border-t">
                                <ResponseSection taskId={task._id} task={task} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
                {groupedTasks.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Задачи не найдены
                  </div>
                )}
              </div>
            ) : (
              /* Regular list view (no grouping) */
              <div className="divide-y">
                {sortedTasks.map((task) => (
                  <div
                    key={task._id}
                    className={cn(
                      "p-4 hover:bg-muted/50",
                      task.awaitingStatusChange &&
                        "bg-green-50 border-l-4 border-green-500 dark:bg-green-900/20"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex">
                        <div
                          className={`mr-3 rounded-full p-1 ${
                            task.status === "Done"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : task.priority === "High"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                        >
                          {task.status === "Done" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/dashboard/task/${task._id}`}
                            className="font-medium hover:text-primary hover:underline transition-colors"
                          >
                            {task.title}
                            {task.isImportant && (
                              <Star className="inline-block ml-2 h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </Link>
                          <div className="flex items-center space-x-2 mt-1 flex-wrap">
                            {task.awaitingStatusChange && (
                              <Badge className="bg-green-500 text-white">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Ожидает изменения
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={getStatusColor(task.status)}
                            >
                              {getTaskStatusRussian(task.status)}
                            </Badge>
                            {task.priority && (
                              <Badge
                                variant="outline"
                                className={getPriorityColor(task.priority)}
                              >
                                {getPriorityRussian(task.priority)}
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>
                                {task.assignees.length === 1
                                  ? task.assignees[0].name
                                  : `${task.assignees.length} исполнителей`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground space-y-1">
                          {task.dueDate && (
                            <div
                              className={cn(
                                getProjectDueDateColor(task.dueDate)
                              )}
                            >
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {formatDueDateRussian(task.dueDate)}
                            </div>
                          )}
                          <div className="text-xs">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDateDetailedRussian(task.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link to={`/dashboard/task/${task._id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Просмотреть задачу"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant={
                              expandedResponses.has(task._id)
                                ? "default"
                                : "ghost"
                            }
                            size="sm"
                            title="Показать ответы"
                            onClick={() => toggleResponsePanel(task._id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Inline панель ответов */}
                    {expandedResponses.has(task._id) && (
                      <div className="mt-3 pt-3 border-t">
                        <ResponseSection taskId={task._id} task={task} />
                      </div>
                    )}
                  </div>
                ))}
                {sortedTasks.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Задачи не найдены
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
