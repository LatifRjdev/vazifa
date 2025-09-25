import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sortDirection, searchQuery]);

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

      <Input
        placeholder={t('search.find_tasks')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">{t('tabs.list')}</TabsTrigger>
          <TabsTrigger value="board">{t('tabs.board')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('nav.my_tasks')}</CardTitle>
              <CardDescription>
                {sortedTasks.length} {t('tasks.assigned_to_you')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {sortedTasks.map((task) => (
                  <div key={task._id} className="p-4 hover:bg-muted/50">
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
