import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  SortAsc,
  SortDesc,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";

import { Loader } from "@/components/loader";
import { ResponseSection } from "@/components/tasks/response-section";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useGetMyTasksQuery } from "@/hooks/use-task";
import { getProjectDueDateColor } from "@/lib";
import { formatDateDetailedRussian, formatDueDateRussian } from "@/lib/date-utils";
import { getTaskStatusRussian, getPriorityRussian } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Мои задачи" },
    { name: "description", content: "Мои задачи в TaskHub!" },
  ];
}

const MyTasksPage = () => {
  const { t } = useLanguage();
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
  const [groupByTitle, setGroupByTitle] = useState(searchParams.get("grouped") !== "false");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());

  // Функция переключения панели ответов
  const toggleResponsePanel = (taskId: string) => {
    setExpandedResponses(prev => {
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
    setExpandedResponses(prev => {
      const next = new Set(prev);
      taskIds.forEach(id => next.add(id));
      return next;
    });
  };

  // Keep state and URL in sync
  useEffect(() => {
    const params: Record<string, string> = {};
    // Preserve existing params (like organizationId)
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

  const { data: myTasks, isPending } = useGetMyTasksQuery() as {
    data: Task[];
    isPending: boolean;
  };

  // Filter tasks
  const filteredTasks =
    myTasks?.length > 0
      ? myTasks
          .filter((task) => {
            if (filter === "all") return true;
            if (filter === "todo") return task.status === "To Do";
            if (filter === "inprogress") return task.status === "In Progress";
            if (filter === "done") return task.status === "Done";
            if (filter === "achieved") return task.isArchived === true;
            if (filter === "high") return task.priority === "High";
            return true;
          })
          .filter(
            (task) =>
              task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.description
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase())
          )
      : [];

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return sortDirection === "asc"
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    return 0;
  });

  // Группировка задач по названию
  const groupedTasks = useMemo(() => {
    if (!groupByTitle) return null;

    const groups = new Map<string, Task[]>();
    sortedTasks.forEach(task => {
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
        todoCount: tasks.filter(t => t.status === "To Do").length,
        inProgressCount: tasks.filter(t => t.status === "In Progress").length,
        doneCount: tasks.filter(t => t.status === "Done").length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [sortedTasks, groupByTitle]);

  // Функция для переключения состояния группы
  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
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
        setExpandedGroups(new Set(groupedTasks.map(g => g.title)));
      }
    }
  };

  // Group tasks by status for board view
  const todoTasks = sortedTasks.filter((task) => task.status === "To Do");
  const inProgressTasks = sortedTasks.filter(
    (task) => task.status === "In Progress"
  );
  const doneTasks = sortedTasks.filter((task) => task.status === "Done");

  if (isPending) return <Loader message={t('common.loading_data')} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between">
        <h1 className="text-xl md:text-3xl font-bold">{t('nav.my_tasks')}</h1>
        <div className="flex flex-col items-start md:items-center md:flex-row gap-2">
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
            {sortDirection === "asc" ? t('sort.oldest_first') : t('sort.newest_first')}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="h-4 w-4 mr-1" />
                {t('filter.filter')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>{t('filter.filter_tasks')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  {t('filter.all_tasks')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("todo")}>
                  {t('status.todo')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("inprogress")}>
                  {t('status.in_progress')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("done")}>
                  {t('status.done')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("achieved")}>
                  {t('filter.archived')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("high")}>
                  {t('filter.high_priority')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <Input
          placeholder={t('search.find_tasks')}
        value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />

        <div className="flex items-center gap-2">
          <Switch
            id="group-by-title-my"
            checked={groupByTitle}
            onCheckedChange={setGroupByTitle}
          />
          <Label htmlFor="group-by-title-my" className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <Layers className="h-4 w-4" />
            {t('all_tasks.group_by_title')}
          </Label>
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">{t('tabs.list')}</TabsTrigger>
          <TabsTrigger value="board">{t('tabs.board')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {groupByTitle && groupedTasks
                    ? t('all_tasks.groups_count').replace('{groups}', groupedTasks.length.toString()).replace('{tasks}', sortedTasks.length.toString())
                    : t('nav.my_tasks')}
                </CardTitle>
                <CardDescription>
                  {sortedTasks.length} {t('tasks.assigned_to_you')}
                </CardDescription>
              </div>
              {groupByTitle && groupedTasks && groupedTasks.length > 0 && (
                <Button variant="outline" size="sm" onClick={toggleAllGroups}>
                  {expandedGroups.size === groupedTasks.length ? t('all_tasks.collapse_all') : t('all_tasks.expand_all')}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {/* Групповой вид */}
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
                                {t('all_tasks.tasks_in_group').replace('{count}', group.count.toString())}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {group.todoCount > 0 && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                {t('status.todo')}: {group.todoCount}
                              </Badge>
                            )}
                            {group.inProgressCount > 0 && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                                {t('status.in_progress')}: {group.inProgressCount}
                              </Badge>
                            )}
                            {group.doneCount > 0 && (
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                {t('status.done')}: {group.doneCount}
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                expandAllResponses(group.tasks.map(t => t._id));
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Ответить на все ({group.count})
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t bg-muted/20">
                          {group.tasks.map((task) => (
                            <div key={task._id} className={cn(
                              "p-4 hover:bg-muted/50 border-b last:border-b-0 ml-8",
                              task.awaitingStatusChange && "bg-green-50 border-l-4 border-green-500 dark:bg-green-900/20"
                            )}>
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
                                    <div className="flex items-center space-x-2">
                                      <Badge variant={task.status.toLowerCase() as any}>
                                        {getTaskStatusRussian(task.status)}
                                      </Badge>
                                      {task.priority && (
                                        <Badge
                                          variant={
                                            task.priority === "High"
                                              ? "destructive"
                                              : "secondary"
                                          }
                                        >
                                          {getPriorityRussian(task.priority)}
                                        </Badge>
                                      )}
                                      {task.isArchived && (
                                        <Badge variant="outline">{t('filter.archived')}</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-sm text-muted-foreground">
                                    {task.dueDate && (
                                      <span className={cn(getProjectDueDateColor(task.dueDate))}>
                                        {formatDueDateRussian(task.dueDate)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Link to={`/dashboard/task/${task._id}`}>
                                      <Button variant="ghost" size="sm" title={t('all_tasks.view_task')}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Button
                                      variant={expandedResponses.has(task._id) ? "default" : "ghost"}
                                      size="sm"
                                      title={t('all_tasks.view_responses')}
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
                      {t('tasks.no_matching_tasks')}
                    </div>
                  )}
                </div>
              ) : (
                /* Обычный вид */
                <div className="divide-y">
                  {sortedTasks.map((task) => (
                    <div key={task._id} className={cn(
                      "p-4 hover:bg-muted/50",
                      task.awaitingStatusChange && "bg-green-50 border-l-4 border-green-500 dark:bg-green-900/20"
                    )}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-3">
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
                              className="font-medium hover:text-primary hover:underline transition-colors flex items-center"
                            >
                              {task.title}
                              <ArrowUpRight className="h-3 w-3 ml-1" />
                            </Link>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={task.status.toLowerCase() as any}>
                                {getTaskStatusRussian(task.status)}
                              </Badge>
                              {task.priority && (
                                <Badge
                                  variant={
                                    task.priority === "High"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {getPriorityRussian(task.priority)}
                                </Badge>
                              )}
                              {task.isArchived && (
                                <Badge variant="outline">{t('filter.archived')}</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          {task.dueDate && (
                            <div
                              className={cn(getProjectDueDateColor(task.dueDate))}
                            >
                              {t('tasks.due_date_short')}: {formatDueDateRussian(task.dueDate)}
                            </div>
                          )}
                          <div>{t('tasks.modified')}: {formatDateDetailedRussian(task.updatedAt)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sortedTasks.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      {t('tasks.no_matching_tasks')}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TO DO */}
            <Card>
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle className="text-lg flex items-center">
                  {t('status.todo')}
                  <Badge variant="outline" className="ml-2">
                    {todoTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                {todoTasks.map((task) => (
                  <Card
                    key={task._id}
                    className="p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="block">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2">
                        {task.priority && (
                          <Badge
                            variant={
                              task.priority === "High"
                                ? "destructive"
                                : "secondary"
                            }
                            className="mr-1"
                          >
                            {getPriorityRussian(task.priority)}
                          </Badge>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {formatDueDateRussian(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {todoTasks.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    {t('tasks.no_tasks')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* IN PROGRESS */}
            <Card>
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle className="text-lg flex items-center">
                  {t('status.in_progress')}
                  <Badge variant="outline" className="ml-2">
                    {inProgressTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                {inProgressTasks.map((task) => (
                  <Card
                    key={task._id}
                    className="p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="block">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {task.priority && (
                            <Badge
                              variant={
                                task.priority === "High"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="mr-1"
                            >
                            {getPriorityRussian(task.priority)}
                          </Badge>
                        )}
                        </div>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {formatDueDateRussian(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {inProgressTasks.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    {t('tasks.no_tasks_in_progress')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DONE */}
            <Card>
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle className="text-lg flex items-center">
                  {t('status.done')}
                  <Badge variant="outline" className="ml-2">
                    {doneTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                {doneTasks.map((task) => (
                  <Card
                    key={task._id}
                    className="p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="block">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2">
                        <Badge variant="done" className="mr-1">
                          {t('tasks.completed_badge')}
                        </Badge>
                        {task.isArchived && (
                          <Badge variant="outline">{t('filter.archived')}</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {doneTasks.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    {t('tasks.no_completed_tasks')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyTasksPage;
