import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, Search, Filter, Eye, Archive, CheckCircle, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGetCompletedTasksQuery } from "@/hooks/use-task";
import { formatDateDetailedRussian } from "@/lib/date-utils";
import { getPriorityRussian } from "@/lib/translations";
import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/shared/no-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Task } from "@/types";
import { 
  type DateFilterPeriod, 
  getDateRangeForPeriod, 
  getPeriodLabel, 
  filterTasksByDateRange 
} from "@/lib/date-filters";

export function meta() {
  return [
    { title: "Vazifa | Выполненные задачи" },
    { name: "description", content: "Просмотр выполненных задач в Vazifa!" },
  ];
}

// Компонент для сворачиваемого описания
const ExpandableDescription = ({ description, maxLength = 100 }: { description: string; maxLength?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!description) return null;
  
  const isLong = description.length > maxLength;
  const displayText = isExpanded || !isLong 
    ? description 
    : description.slice(0, maxLength) + "...";
  
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
        {displayText}
      </p>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Скрыть
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Подробнее
            </>
          )}
        </button>
      )}
    </div>
  );
};

const AchievedPage = () => {
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Фильтры по времени создания
  const [dateFilter, setDateFilter] = useState<DateFilterPeriod | "all">("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);

  const { data, isLoading, error } = useGetCompletedTasksQuery({
    search: search || undefined,
    assignee: assignee || undefined,
    priority: priority && priority !== "all" ? priority : undefined,
    dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
    dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
  }) as {
    data: { completedTasks: (Task & { completedOnTime?: boolean })[] } | undefined;
    isLoading: boolean;
    error: any;
  };

  let completedTasks = data?.completedTasks || [];

  // Применяем фильтр по времени создания
  if (dateFilter !== "all") {
    if (dateFilter === "custom") {
      if (customDateFrom || customDateTo) {
        const dateRange = getDateRangeForPeriod("custom", {
          from: customDateFrom,
          to: customDateTo
        });
        completedTasks = filterTasksByDateRange(completedTasks, dateRange, "createdAt");
      }
    } else {
      const dateRange = getDateRangeForPeriod(dateFilter);
      completedTasks = filterTasksByDateRange(completedTasks, dateRange, "createdAt");
    }
  }

  if (isLoading) {
    return <Loader message="Загрузка выполненных задач..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-semibold">Ошибка загрузки</h2>
        <p className="text-muted-foreground">
          Не удалось загрузить выполненные задачи
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Выполненные задачи</h1>
          <p className="text-muted-foreground">
            Просмотр и управление выполненными задачами
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            <CheckCircle className="h-4 w-4 mr-1" />
            {completedTasks.length} выполнено
          </Badge>
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или описанию..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Приоритет</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Все приоритеты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приоритеты</SelectItem>
                  <SelectItem value="Low">Низкий</SelectItem>
                  <SelectItem value="Medium">Средний</SelectItem>
                  <SelectItem value="High">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Исполнитель</label>
              <Input
                placeholder="ID исполнителя"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Дата выполнения (от)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Дата выполнения (до)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setAssignee("");
                  setPriority("");
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setDateFilter("all");
                  setCustomDateFrom(undefined);
                  setCustomDateTo(undefined);
                }}
              >
                Сбросить фильтры
              </Button>
            </div>
          </div>

          {/* Фильтры по времени создания */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Фильтр по времени создания</span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilterPeriod | "all")}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все время</SelectItem>
                  <SelectItem value="today">За сегодня</SelectItem>
                  <SelectItem value="week">За неделю</SelectItem>
                  <SelectItem value="month">За месяц</SelectItem>
                  <SelectItem value="6months">За 6 месяцев</SelectItem>
                  <SelectItem value="year">За год</SelectItem>
                  <SelectItem value="custom">Произвольный период</SelectItem>
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
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateFrom ? format(customDateFrom, "dd.MM.yyyy", { locale: ru }) : "Дата от"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
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
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateTo ? format(customDateTo, "dd.MM.yyyy", { locale: ru }) : "Дата до"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
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
                Сбросить период
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица задач */}
      <Card>
        <CardHeader>
          <CardTitle>Список выполненных задач</CardTitle>
        </CardHeader>
        <CardContent>
          {completedTasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№</TableHead>
                  <TableHead>Название задачи</TableHead>
                  <TableHead>Исполнители</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>Дата выполнения</TableHead>
                  <TableHead>В срок</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedTasks.map((task, index) => (
                  <TableRow key={task._id}>
                    <TableCell className="font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <Link
                          to={`/dashboard/task/${task._id}`}
                          className="font-medium hover:underline"
                        >
                          {task.title}
                        </Link>
                        {task.description && (
                          <ExpandableDescription description={task.description} maxLength={80} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {task.assignees?.map((assignee) => (
                          <Badge key={assignee._id} variant="secondary" className="text-xs">
                            {assignee.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          task.priority === "High" ? "destructive" :
                          task.priority === "Medium" ? "default" : "secondary"
                        }
                      >
                        {getPriorityRussian(task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.completedAt ? formatDateDetailedRussian(task.completedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      {task.completedOnTime !== null ? (
                        <Badge variant={task.completedOnTime ? "default" : "destructive"}>
                          {task.completedOnTime ? "В срок" : "Просрочено"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link to={`/dashboard/task/${task._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <NoDataFound
              title="Нет выполненных задач"
              description="Выполненные задачи будут отображаться здесь"
              buttonText="Назад"
              buttonOnClick={() => window.history.back()}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievedPage;
