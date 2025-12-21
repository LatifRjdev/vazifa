import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, useMatches, useActionData, useLoaderData, useParams, useRouteError, useNavigate, useLocation, Outlet, Meta, Links, ScrollRestoration, Scripts, isRouteErrorResponse, Navigate, Link, useSearchParams, useRevalidator } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import * as React from "react";
import { createElement, createContext, useContext, useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { differenceInDays, format, endOfDay, startOfDay, subDays, endOfYear, startOfYear, subMonths, endOfMonth, startOfMonth, endOfWeek, startOfWeek, formatDistanceToNow } from "date-fns";
import { useMutation, QueryClient, QueryClientProvider, useQueryClient, useQuery, keepPreviousData } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, ArrowLeft, CheckCircle2, XCircle, CheckCircle, CheckIcon, XIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon, X, Languages, Check, Plus, Bell, Wrench, ChevronsRight, ChevronsLeft, User, LogOut, Star, ClipboardList, BarChart3, Users, LayoutDashboard, ListCheck, UserCheck, Settings, MessageCircle, Send, SortAsc, SortDesc, Filter, Clock, ArrowUpRight, LayoutGrid, CirclePlus, Search, Calendar as Calendar$1, CalendarDays, Eye, AlertTriangle, TrendingUp, Printer, Crown, Shield, MoreHorizontal, Database, Palette, Edit, Paperclip, UploadCloud, Link2, Download, Smile, Mic, Upload, LogIn, UserMinus, UserPlus, MessageSquare, Building2, FolderEdit, FolderPlus, FileEdit, CheckSquare, EyeOff, Flag, Archive } from "lucide-react";
import { FormProvider, Controller, useFormContext, useFormState, useForm } from "react-hook-form";
import z, { z as z$1 } from "zod";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ru } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { Drawer as Drawer$1 } from "vaul";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
function withComponentProps(Component) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
      matches: useMatches()
    };
    return createElement(Component, props);
  };
}
function withErrorBoundaryProps(ErrorBoundary3) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
      error: useRouteError()
    };
    return createElement(ErrorBoundary3, props);
  };
}
const BASE_URL = "/api-v1";
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  withCredentials: true,
  timeout: 3e4
  // 30 seconds timeout
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token ?? ""}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new Event("force-logout"));
    }
    return Promise.reject(error);
  }
);
const postData = async (url, data) => {
  const response = await api.post(url, data);
  return response.data;
};
const updateData = async (url, data) => {
  const response = await api.put(url, data);
  return response.data;
};
const fetchData = async (url) => {
  const response = await api.get(url);
  return response.data;
};
const useVerifyEmailMutation = () => {
  return useMutation({
    mutationFn: (data) => postData("/auth/verify-email", data),
    onSuccess: () => {
      toast.success("Email verified successfully");
    },
    onError: () => {
      toast.error("Failed to verify email");
    }
  });
};
const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (data) => postData("/auth/reset-password", data)
  });
};
const useRequestResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (data) => postData("/auth/request-reset-password", data)
  });
};
const useVerify2FALoginMutation = () => {
  return useMutation({
    mutationFn: (data) => postData("/auth/verify-2fa-login", data)
  });
};
const getUserAvatar = (name) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
const checkNumberOfDaysLeftToOverdue = (dueDate) => {
  const today = /* @__PURE__ */ new Date();
  const days = differenceInDays(dueDate, today);
  return days;
};
const getProjectDueDateColor = (dueDate) => {
  const days = checkNumberOfDaysLeftToOverdue(dueDate);
  if (days < 0) {
    return "text-red-600 dark:bg-red-900/30 dark:text-red-300";
  }
  if (days < 3) {
    return "text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300";
  }
  return "text-muted-foreground";
};
const publicRoutes = [
  "/",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "*"
];
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Отключаем HTTP кэширование для более надежного обновления данных
      staleTime: 0,
      gcTime: 1e3 * 60 * 5,
      // 5 минут
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1
    }
  }
});
const ReactQueryProvider = ({
  children
}) => {
  return /* @__PURE__ */ jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsx(AuthProvider, { children }),
    /* @__PURE__ */ jsx(Toaster, { position: "top-right", richColors: true })
  ] });
};
const AuthContext = createContext(void 0);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const currentPath = useLocation().pathname;
  const isPublicRoute = publicRoutes.includes(currentPath);
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          if (!isPublicRoute) {
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [currentPath, isPublicRoute, navigate]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    let timeout;
    if (token) {
      try {
        const { exp } = jwtDecode(token);
        const expiry = exp * 1e3 - Date.now();
        if (expiry <= 0) {
          logout();
          navigate("/");
        } else {
          timeout = setTimeout(() => {
            logout();
            navigate("/");
          }, expiry);
        }
      } catch (e) {
        if (isAuthenticated) {
          logout();
          navigate("/");
        }
      }
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isAuthenticated]);
  useEffect(() => {
    const handleForceLogout = () => {
      logout();
      navigate("/");
    };
    window.addEventListener("force-logout", handleForceLogout);
    return () => {
      window.removeEventListener("force-logout", handleForceLogout);
    };
  }, []);
  const login = async (data) => {
    var _a, _b;
    localStorage.setItem("user", JSON.stringify(data == null ? void 0 : data.user));
    localStorage.setItem("token", data == null ? void 0 : data.token);
    setUser((data == null ? void 0 : data.user) || null);
    setIsAuthenticated(true);
    setIsLoading(false);
    if (((_a = data == null ? void 0 : data.user) == null ? void 0 : _a.role) === "tech_admin") {
      navigate("/dashboard/tech-admin");
    } else if (((_b = data == null ? void 0 : data.user) == null ? void 0 : _b.role) === "super_admin") {
      navigate("/important-tasks");
    } else {
      navigate("/dashboard");
    }
  };
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
  };
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value, children });
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
const LanguageContext = createContext(void 0);
const translations = {
  ru: {
    // Общие
    "app.name": "Протокол",
    "app.tagline": "Система управления задачами",
    "common.loading": "Загрузка...",
    "common.save": "Сохранить",
    "common.cancel": "Отмена",
    "common.delete": "Удалить",
    "common.edit": "Редактировать",
    "common.create": "Создать",
    "common.search": "Поиск",
    "common.filter": "Фильтр",
    "common.all": "Все",
    "common.yes": "Да",
    "common.no": "Нет",
    // Навигация
    "nav.dashboard": "Панель управления",
    "nav.tasks": "Задачи",
    "nav.my_tasks": "Мои задачи",
    "nav.all_tasks": "Все задачи",
    "nav.manager_tasks": "Задачи менеджера",
    "nav.important_tasks": "Важные задачи",
    "nav.completed_tasks": "Выполненные задачи",
    "nav.analytics": "Аналитика",
    "nav.members": "Участники",
    "nav.admin_chat": "Админ чат",
    "nav.profile": "Профиль",
    "nav.settings": "Настройки",
    "nav.logout": "Выйти",
    // Задачи
    "tasks.create_task": "Создать задачу",
    "tasks.task_title": "Название задачи",
    "tasks.task_description": "Описание задачи",
    "tasks.task_status": "Статус",
    "tasks.task_priority": "Приоритет",
    "tasks.task_assignees": "Исполнители",
    "tasks.task_manager": "Ответственный менеджер",
    "tasks.due_date": "Срок выполнения",
    "tasks.no_tasks": "Нет задач",
    "tasks.task_created": "Задача создана",
    "tasks.task_updated": "Задача обновлена",
    "tasks.task_deleted": "Задача удалена",
    "tasks.create_new_task": "Создать новую задачу",
    "tasks.task_name": "Название",
    "tasks.task_desc": "Описание",
    "tasks.enter_task_name": "Введите название задачи",
    "tasks.enter_task_desc": "Введите описание задачи",
    "tasks.select_status": "Выберите статус",
    "tasks.select_priority": "Выберите приоритет",
    "tasks.select_date": "Выберите дату",
    "tasks.select_manager": "Выберите ответственного менеджера",
    "tasks.not_assigned": "Не назначен",
    "tasks.assign_to": "Назначить участникам",
    "tasks.select_members": "Выберите участников",
    "tasks.selected_count": "Выбрано участников: {count}",
    "tasks.creating": "Создание...",
    "tasks.create": "Создать задачу",
    "tasks.cancel": "Отмена",
    "tasks.admin": "Админ",
    "tasks.manager": "Менеджер",
    "tasks.member": "Участник",
    "tasks.multi_task": "Создать несколько задач",
    "tasks.multi_task_desc": "Создайте несколько задач с одним названием",
    "tasks.task_number": "Задача #{number}",
    "tasks.add_task": "Добавить еще задачу",
    "tasks.remove_task": "Удалить",
    "tasks.min_tasks_required": "Необходимо минимум 2 задачи",
    // Статусы
    "status.todo": "К выполнению",
    "status.in_progress": "В процессе",
    "status.review": "На проверке",
    "status.done": "Выполнено",
    // Приоритеты
    "priority.low": "Низкий",
    "priority.medium": "Средний",
    "priority.high": "Высокий",
    // Роли
    "role.admin": "Админ",
    "role.manager": "Менеджер",
    "role.member": "Участник",
    "role.super_admin": "Супер админ",
    // Ответы и комментарии
    "responses.title": "Ответы",
    "responses.add_response": "Добавить ответ",
    "responses.send_response": "Отправить ответ",
    "responses.no_responses": "Нет ответов",
    "responses.attach_file": "Прикрепить файл",
    "responses.voice_message": "Голосовое сообщение",
    "comments.title": "Комментарии",
    "comments.add_comment": "Добавить комментарий",
    "comments.send_comment": "Отправить комментарий",
    "comments.no_comments": "Нет комментариев",
    // Файлы
    "files.download": "Скачать",
    "files.preview": "Просмотр",
    "files.upload": "Загрузить файл",
    "files.uploading": "Загрузка...",
    // Уведомления
    "notifications.task_assigned": "Вам назначена новая задача",
    "notifications.task_completed": "Задача выполнена",
    "notifications.new_comment": "Новый комментарий",
    "notifications.new_response": "Новый ответ",
    // Общие фразы
    "common.created": "Создано",
    "tasks.no_tasks_yet": "У вас пока нет задач",
    "common.loading_data": "Загрузка данных...",
    // Статистика и панель управления
    "dashboard.total_tasks": "Всего задач",
    "dashboard.in_progress": "В процессе",
    "dashboard.completed": "Выполнено",
    "dashboard.overdue": "Просрочено",
    "dashboard.recent_tasks": "Последние задачи",
    "dashboard.statistics": "Статистика",
    "dashboard.overview": "Обзор",
    // Действия с задачами
    "tasks.mark_important": "Отметить как важное",
    "tasks.unmark_important": "Убрать из важных",
    "tasks.edit_assignees": "Редактировать исполнителей",
    "tasks.watch": "Следить",
    "tasks.unwatch": "Не следить",
    "tasks.important_tasks": "Важные задачи",
    // Важные задачи страница
    "important_tasks.title": "Важные задачи",
    "important_tasks.description": "Задачи, отмеченные администраторами как важные",
    "important_tasks.no_access": "У вас нет доступа к этой странице. Только супер админы могут просматривать важные задачи.",
    "important_tasks.no_tasks_title": "Нет важных задач",
    "important_tasks.no_tasks_description": "Пока нет задач, отмеченных как важные",
    "important_tasks.marked_important": "Отмечено как важное",
    "important_tasks.by_admin": "администратором",
    "important_tasks.assignees": "исполнителей",
    "important_tasks.assignee": "исполнитель",
    "important_tasks.manager": "Менеджер:",
    "important_tasks.not_specified": "Не указан",
    // Участники
    "members.remove_member": "Удалить участника",
    "members.confirm_remove": "Вы уверены, что хотите удалить этого участника?",
    "members.member_removed": "Участник удален",
    // Сортировка и фильтрация
    "sort.oldest_first": "Сначала старые",
    "sort.newest_first": "Сначала новые",
    "filter.filter": "Фильтр",
    "filter.filter_tasks": "Фильтровать задачи",
    "filter.all_tasks": "Все задачи",
    "filter.high_priority": "Высокий приоритет",
    "filter.archived": "В архиве",
    "search.find_tasks": "Найти задачи...",
    "tabs.list": "Список",
    "tabs.board": "Доска",
    "tasks.assigned_to_you": "назначенных вам задач",
    "tasks.no_matching_tasks": "Задач, соответствующих вашим критериям, не найдено.",
    "tasks.due_date_short": "Срок",
    "tasks.modified": "Изменено",
    "tasks.completed_badge": "Завершено",
    "tasks.no_tasks_in_progress": "Нет задач в процессе",
    "tasks.no_completed_tasks": "Нет выполненных задач",
    // Все задачи страница
    "all_tasks.title": "Все задачи",
    "all_tasks.description": "Управление всеми задачами в организациях",
    "all_tasks.access_denied": "Доступ запрещен",
    "all_tasks.no_access_message": "У вас нет прав для просмотра всех задач. Обратитесь к администратору.",
    "all_tasks.loading": "Загрузка задач...",
    "all_tasks.filters_search": "Фильтры и поиск",
    "all_tasks.search_placeholder": "Поиск по названию или описанию...",
    "all_tasks.all_statuses": "Все статусы",
    "all_tasks.all_priorities": "Все приоритеты",
    "all_tasks.time_filter": "Фильтр по времени создания",
    "all_tasks.period": "Период",
    "all_tasks.all_time": "Все время",
    "all_tasks.today": "За сегодня",
    "all_tasks.week": "За неделю",
    "all_tasks.month": "За месяц",
    "all_tasks.six_months": "За 6 месяцев",
    "all_tasks.year": "За год",
    "all_tasks.custom_period": "Произвольный период",
    "all_tasks.date_from": "Дата от",
    "all_tasks.date_to": "Дата до",
    "all_tasks.reset_period": "Сбросить период",
    "all_tasks.sort_by": "Сортировать по",
    "all_tasks.sort_created": "Дате создания",
    "all_tasks.sort_title": "Названию",
    "all_tasks.sort_status": "Статусу",
    "all_tasks.sort_priority": "Приоритету",
    "all_tasks.sort_due_date": "Сроку выполнения",
    "all_tasks.statistics_period": "Статистика",
    "all_tasks.for_period": "За период",
    "all_tasks.total_tasks": "Всего задач",
    "all_tasks.from_total": "из {total} всего",
    "all_tasks.high_priority": "Высокий приоритет",
    "all_tasks.table_number": "#",
    "all_tasks.table_title": "Название",
    "all_tasks.table_status": "Статус",
    "all_tasks.table_priority": "Приоритет",
    "all_tasks.table_assigned": "Назначено",
    "all_tasks.table_due_date": "Срок",
    "all_tasks.table_created": "Создано",
    "all_tasks.table_actions": "Действия",
    "all_tasks.not_assigned": "Не назначено",
    "all_tasks.not_specified": "Не указан",
    "all_tasks.tasks_count": "Задачи ({filtered} из {total})",
    "all_tasks.no_tasks_found": "Задач, соответствующих критериям, не найдено",
    // Менеджерские задачи
    "manager_tasks.title": "Мои задачи как ответственного менеджера",
    "manager_tasks.description": "Задачи, где вы назначены ответственным менеджером",
    "manager_tasks.no_access": "У вас нет доступа к этой странице",
    "manager_tasks.no_tasks_title": "Нет задач как ответственного менеджера",
    "manager_tasks.no_tasks_description": "У вас пока нет задач, где вы назначены ответственным менеджером",
    "manager_tasks.assignees_count": "{count} исполнителей",
    // Аналитика
    "analytics.title": "Аналитика",
    "analytics.description": "Статистика и аналитика по задачам",
    "analytics.access_denied": "Доступ запрещен",
    "analytics.no_access_message": "У вас нет прав для просмотра аналитики. Обратитесь к администратору.",
    "analytics.loading": "Загрузка аналитики...",
    "analytics.filters": "Фильтры",
    "analytics.time_period": "Период времени",
    "analytics.member": "Участник",
    "analytics.all_members": "Все участники",
    "analytics.last_day": "Последний день",
    "analytics.last_7_days": "Последние 7 дней",
    "analytics.last_month": "Последний месяц",
    "analytics.last_6_months": "Последние 6 месяцев",
    "analytics.last_year": "Последний год",
    "analytics.total_tasks": "Всего задач",
    "analytics.completed": "Выполнено",
    "analytics.in_progress": "В процессе",
    "analytics.overdue": "Просрочено",
    "analytics.for_selected_period": "За выбранный период",
    "analytics.completion_rate": "Процент выполнения: {rate}%",
    "analytics.active_tasks": "Активные задачи",
    "analytics.require_attention": "Требуют внимания",
    "analytics.status_distribution": "Распределение по статусам",
    "analytics.status_distribution_desc": "Общее количество задач по статусам",
    "analytics.priority_distribution": "Распределение по приоритетам",
    "analytics.priority_distribution_desc": "Общее количество задач по приоритетам",
    "analytics.member_tasks": "Задачи участника: {name}",
    "analytics.total_tasks_count": "Всего задач: {count}",
    "analytics.detailed_stats": "Детальная статистика",
    "analytics.percentage_ratio": "Процентное соотношение задач",
    "analytics.member_stats": "Статистика по участникам",
    "analytics.member_stats_desc": "Количество задач на каждого участника",
    "analytics.activity_timeline": "Активность за период",
    "analytics.activity_timeline_desc": "Создание и выполнение задач по времени",
    "analytics.created": "Создано",
    "analytics.completed_tasks": "Выполнено",
    "analytics.tasks_count_suffix": "задач",
    "analytics.chart_title": "Диаграмма - Vazifa",
    "analytics.chart_analytics": "Аналитика Vazifa",
    // Ошибки
    "errors.generic": "Произошла ошибка",
    "errors.network": "Ошибка сети",
    "errors.unauthorized": "Нет доступа",
    "errors.not_found": "Не найдено"
  },
  tj: {
    // Общие
    "app.name": "Протокол",
    "app.tagline": "Системаи идоракунии вазифаҳо",
    "common.loading": "Бор шуда истодааст...",
    "common.save": "Захира кардан",
    "common.cancel": "Бекор кардан",
    "common.delete": "Нест кардан",
    "common.edit": "Таҳрир кардан",
    "common.create": "Эҷод кардан",
    "common.search": "Ҷустуҷӯ",
    "common.filter": "Филтр",
    "common.all": "Ҳама",
    "common.yes": "Ҳа",
    "common.no": "Не",
    // Навигация
    "nav.dashboard": "Лавҳаи идоракунӣ",
    "nav.tasks": "Вазифаҳо",
    "nav.my_tasks": "Вазифаҳои ман",
    "nav.all_tasks": "Ҳамаи вазифаҳо",
    "nav.manager_tasks": "Вазифаҳои менеҷер",
    "nav.important_tasks": "Вазифаҳои муҳим",
    "nav.completed_tasks": "Вазифаҳои иҷрошуда",
    "nav.analytics": "Таҳлилот",
    "nav.members": "Иштирокчиён",
    "nav.admin_chat": "Чати маъмур",
    "nav.profile": "Профил",
    "nav.settings": "Танзимот",
    "nav.logout": "Баромадан",
    // Задачи
    "tasks.create_task": "Вазифа эҷод кардан",
    "tasks.task_title": "Номи вазифа",
    "tasks.task_description": "Тавсифи вазифа",
    "tasks.task_status": "Ҳолат",
    "tasks.task_priority": "Аввалият",
    "tasks.task_assignees": "Иҷрокунандагон",
    "tasks.task_manager": "Менеҷери масъул",
    "tasks.due_date": "Мӯҳлати иҷро",
    "tasks.no_tasks": "Вазифаҳо нестанд",
    "tasks.task_created": "Вазифа эҷод шуд",
    "tasks.task_updated": "Вазифа навсозӣ шуд",
    "tasks.task_deleted": "Вазифа нест шуд",
    "tasks.create_new_task": "Вазифаи нав эҷод кардан",
    "tasks.task_name": "Ном",
    "tasks.task_desc": "Тавсиф",
    "tasks.enter_task_name": "Номи вазифаро ворид кунед",
    "tasks.enter_task_desc": "Тавсифи вазифаро ворид кунед",
    "tasks.select_status": "Ҳолатро интихоб кунед",
    "tasks.select_priority": "Аввалиятро интихоб кунед",
    "tasks.select_date": "Санаро интихоб кунед",
    "tasks.select_manager": "Менеҷери масъулро интихоб кунед",
    "tasks.not_assigned": "Таъин нашуда",
    "tasks.assign_to": "Ба иштирокчиён таъин кардан",
    "tasks.select_members": "Иштирокчиёнро интихоб кунед",
    "tasks.selected_count": "Интихобшуда: {count}",
    "tasks.creating": "Эҷод шуда истодааст...",
    "tasks.create": "Вазифа эҷод кардан",
    "tasks.cancel": "Бекор кардан",
    "tasks.admin": "Админ",
    "tasks.manager": "Менеҷер",
    "tasks.member": "Иштирокчӣ",
    "tasks.multi_task": "Як қатор вазифаҳо эҷод кардан",
    "tasks.multi_task_desc": "Бо як номи умумӣ як қатор вазифаҳо эҷод кунед",
    "tasks.task_number": "Вазифа №{number}",
    "tasks.add_task": "Вазифаи навро илова кунед",
    "tasks.remove_task": "Нест кардан",
    "tasks.min_tasks_required": "Ҳадди ақал 2 вазифа зарур аст",
    // Статусы
    "status.todo": "Барои иҷро",
    "status.in_progress": "Дар ҷараён",
    "status.review": "Дар баррасӣ",
    "status.done": "Иҷрошуда",
    // Приоритеты
    "priority.low": "Паст",
    "priority.medium": "Миёна",
    "priority.high": "Баланд",
    // Роли
    "role.admin": "Админ",
    "role.manager": "Менеҷер",
    "role.member": "Иштирокчӣ",
    "role.super_admin": "Супер админ",
    // Ответы и комментарии
    "responses.title": "Ҷавобҳо",
    "responses.add_response": "Ҷавоб илова кардан",
    "responses.send_response": "Ҷавоб фиристодан",
    "responses.no_responses": "Ҷавобҳо нестанд",
    "responses.attach_file": "Файл замима кардан",
    "responses.voice_message": "Паёми овозӣ",
    "comments.title": "Шарҳҳо",
    "comments.add_comment": "Шарҳ илова кардан",
    "comments.send_comment": "Шарҳ фиристодан",
    "comments.no_comments": "Шарҳҳо нестанд",
    // Файлы
    "files.download": "Боргирӣ кардан",
    "files.preview": "Пешнамоиш",
    "files.upload": "Файл боркардан",
    "files.uploading": "Бор шуда истодааст...",
    // Уведомления
    "notifications.task_assigned": "Ба шумо вазифаи нав таъин шуд",
    "notifications.task_completed": "Вазифа иҷро шуд",
    "notifications.new_comment": "Шарҳи нав",
    "notifications.new_response": "Ҷавоби нав",
    // Общие фразы
    "common.created": "Эҷодшуда",
    "tasks.no_tasks_yet": "Шумо то ҳол вазифаҳо надоред",
    "common.loading_data": "Маълумот бор шуда истодааст...",
    // Статистика и панель управления
    "dashboard.total_tasks": "Ҳамаи вазифаҳо",
    "dashboard.in_progress": "Дар ҷараён",
    "dashboard.completed": "Иҷрошуда",
    "dashboard.overdue": "Мӯҳлат гузашта",
    "dashboard.recent_tasks": "Вазифаҳои охирин",
    "dashboard.statistics": "Омор",
    "dashboard.overview": "Умумӣ",
    // Действия с задачами
    "tasks.mark_important": "Ҳамчун муҳим қайд кардан",
    "tasks.unmark_important": "Аз муҳимҳо хориҷ кардан",
    "tasks.edit_assignees": "Иҷрокунандагонро таҳрир кардан",
    "tasks.watch": "Назорат кардан",
    "tasks.unwatch": "Назорат накардан",
    "tasks.important_tasks": "Вазифаҳои муҳим",
    // Важные задачи страница
    "important_tasks.title": "Вазифаҳои муҳим",
    "important_tasks.description": "Вазифаҳое, ки маъмурон ҳамчун муҳим қайд кардаанд",
    "important_tasks.no_access": "Шумо ба ин саҳифа дастрасӣ надоред. Танҳо супер маъмурон метавонанд вазифаҳои муҳимро бубинанд.",
    "important_tasks.no_tasks_title": "Вазифаҳои муҳим нестанд",
    "important_tasks.no_tasks_description": "То ҳол вазифаҳое, ки ҳамчун муҳим қайд шуда бошанд, нестанд",
    "important_tasks.marked_important": "Ҳамчун муҳим қайд шуда",
    "important_tasks.by_admin": "маъмур",
    "important_tasks.assignees": "иҷрокунандагон",
    "important_tasks.assignee": "иҷрокунанда",
    "important_tasks.manager": "Менеҷер:",
    "important_tasks.not_specified": "Муайян нашуда",
    // Участники
    "members.remove_member": "Иштирокчиро хориҷ кардан",
    "members.confirm_remove": "Шумо мутмаин ҳастед, ки мехоҳед ин иштирокчиро хориҷ кунед?",
    "members.member_removed": "Иштирокчӣ хориҷ карда шуд",
    // Сортировка и фильтрация
    "sort.oldest_first": "Аввал кӯҳнаҳо",
    "sort.newest_first": "Аввал навҳо",
    "filter.filter": "Филтр",
    "filter.filter_tasks": "Вазифаҳоро филтр кардан",
    "filter.all_tasks": "Ҳамаи вазифаҳо",
    "filter.high_priority": "Аввалияти баланд",
    "filter.archived": "Дар бойгонӣ",
    "search.find_tasks": "Вазифаҳоро ёфтан...",
    "tabs.list": "Рӯйхат",
    "tabs.board": "Тахта",
    "tasks.assigned_to_you": "ба шумо таъин шудаанд",
    "tasks.no_matching_tasks": "Вазифаҳое, ки ба меъёрҳои шумо мувофиқ мебошанд, ёфт нашуданд.",
    "tasks.due_date_short": "Мӯҳлат",
    "tasks.modified": "Тағйир ёфта",
    "tasks.completed_badge": "Анҷомёфта",
    "tasks.no_tasks_in_progress": "Вазифаҳо дар ҷараён нестанд",
    "tasks.no_completed_tasks": "Вазифаҳои анҷомёфта нестанд",
    // Все задачи страница
    "all_tasks.title": "Ҳамаи вазифаҳо",
    "all_tasks.description": "Идоракунии ҳамаи вазифаҳо дар ташкилотҳо",
    "all_tasks.access_denied": "Дастрасӣ манъ аст",
    "all_tasks.no_access_message": "Шумо ҳуқуқи дидани ҳамаи вазифаҳоро надоред. Ба маъмур муроҷиат кунед.",
    "all_tasks.loading": "Вазифаҳо бор шуда истодаанд...",
    "all_tasks.filters_search": "Филтрҳо ва ҷустуҷӯ",
    "all_tasks.search_placeholder": "Ҷустуҷӯ аз рӯи ном ё тавсиф...",
    "all_tasks.all_statuses": "Ҳамаи ҳолатҳо",
    "all_tasks.all_priorities": "Ҳамаи аввалиятҳо",
    "all_tasks.time_filter": "Филтр аз рӯи вақти эҷод",
    "all_tasks.period": "Давра",
    "all_tasks.all_time": "Ҳамаи вақт",
    "all_tasks.today": "Барои имрӯз",
    "all_tasks.week": "Барои ҳафта",
    "all_tasks.month": "Барои моҳ",
    "all_tasks.six_months": "Барои 6 моҳ",
    "all_tasks.year": "Барои сол",
    "all_tasks.custom_period": "Давраи дилхоҳ",
    "all_tasks.date_from": "Аз сана",
    "all_tasks.date_to": "То сана",
    "all_tasks.reset_period": "Давраро бекор кардан",
    "all_tasks.sort_by": "Мураттаб кардан аз рӯи",
    "all_tasks.sort_created": "Санаи эҷод",
    "all_tasks.sort_title": "Ном",
    "all_tasks.sort_status": "Ҳолат",
    "all_tasks.sort_priority": "Аввалият",
    "all_tasks.sort_due_date": "Мӯҳлати иҷро",
    "all_tasks.statistics_period": "Омор",
    "all_tasks.for_period": "Барои давра",
    "all_tasks.total_tasks": "Ҳамаи вазифаҳо",
    "all_tasks.from_total": "аз {total} умуман",
    "all_tasks.high_priority": "Аввалияти баланд",
    "all_tasks.table_number": "№",
    "all_tasks.table_title": "Ном",
    "all_tasks.table_status": "Ҳолат",
    "all_tasks.table_priority": "Аввалият",
    "all_tasks.table_assigned": "Таъин шуда",
    "all_tasks.table_due_date": "Мӯҳлат",
    "all_tasks.table_created": "Эҷодшуда",
    "all_tasks.table_actions": "Амалҳо",
    "all_tasks.not_assigned": "Таъин нашуда",
    "all_tasks.not_specified": "Муайян нашуда",
    "all_tasks.tasks_count": "Вазифаҳо ({filtered} аз {total})",
    "all_tasks.no_tasks_found": "Вазифаҳое, ки ба меъёрҳо мувофиқ мебошанд, ёфт нашуданд",
    // Менеджерские задачи
    "manager_tasks.title": "Вазифаҳои ман ҳамчун менеҷери масъул",
    "manager_tasks.description": "Вазифаҳое, ки шумо ҳамчун менеҷери масъул таъин шудаед",
    "manager_tasks.no_access": "Шумо ба ин саҳифа дастрасӣ надоред",
    "manager_tasks.no_tasks_title": "Вазифаҳо ҳамчун менеҷери масъул нестанд",
    "manager_tasks.no_tasks_description": "Шумо то ҳол вазифаҳое надоред, ки дар онҳо ҳамчун менеҷери масъул таъин шуда бошед",
    "manager_tasks.assignees_count": "{count} иҷрокунанда",
    // Аналитика
    "analytics.title": "Таҳлилот",
    "analytics.description": "Омор ва таҳлилоти вазифаҳо",
    "analytics.access_denied": "Дастрасӣ манъ аст",
    "analytics.no_access_message": "Шумо ҳуқуқи дидани таҳлилотро надоред. Ба маъмур муроҷиат кунед.",
    "analytics.loading": "Таҳлилот бор шуда истодааст...",
    "analytics.filters": "Филтрҳо",
    "analytics.time_period": "Давраи вақт",
    "analytics.member": "Иштирокчӣ",
    "analytics.all_members": "Ҳамаи иштирокчиён",
    "analytics.last_day": "Рӯзи охирин",
    "analytics.last_7_days": "Охирин 7 рӯз",
    "analytics.last_month": "Моҳи охирин",
    "analytics.last_6_months": "Охирин 6 моҳ",
    "analytics.last_year": "Соли охирин",
    "analytics.total_tasks": "Ҳамаи вазифаҳо",
    "analytics.completed": "Иҷрошуда",
    "analytics.in_progress": "Дар ҷараён",
    "analytics.overdue": "Мӯҳлат гузашта",
    "analytics.for_selected_period": "Барои давраи интихобшуда",
    "analytics.completion_rate": "Фоизи иҷро: {rate}%",
    "analytics.active_tasks": "Вазифаҳои фаъол",
    "analytics.require_attention": "Диққат талаб мекунанд",
    "analytics.status_distribution": "Тақсимот аз рӯи ҳолат",
    "analytics.status_distribution_desc": "Миқдори умумии вазифаҳо аз рӯи ҳолат",
    "analytics.priority_distribution": "Тақсимот аз рӯи аввалият",
    "analytics.priority_distribution_desc": "Миқдори умумии вазифаҳо аз рӯи аввалият",
    "analytics.member_tasks": "Вазифаҳои иштирокчӣ: {name}",
    "analytics.total_tasks_count": "Ҳамаи вазифаҳо: {count}",
    "analytics.detailed_stats": "Омори муфассал",
    "analytics.percentage_ratio": "Нисбати фоизии вазифаҳо",
    "analytics.member_stats": "Омор аз рӯи иштирокчиён",
    "analytics.member_stats_desc": "Миқдори вазифаҳо барои ҳар иштирокчӣ",
    "analytics.activity_timeline": "Фаъолият дар давра",
    "analytics.activity_timeline_desc": "Эҷод ва иҷрои вазифаҳо аз рӯи вақт",
    "analytics.created": "Эҷодшуда",
    "analytics.completed_tasks": "Иҷрошуда",
    "analytics.tasks_count_suffix": "вазифа",
    "analytics.chart_title": "Диаграмма - Vazifa",
    "analytics.chart_analytics": "Таҳлилоти Vazifa",
    // Ошибки
    "errors.generic": "Хатогӣ рух дод",
    "errors.network": "Хатогии шабака",
    "errors.unauthorized": "Дастрасӣ нест",
    "errors.not_found": "Ёфт нашуд"
  }
};
const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("ru");
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && (savedLanguage === "ru" || savedLanguage === "tj")) {
      setLanguageState(savedLanguage);
    }
  }, []);
  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };
  const t = (key) => {
    return translations[language][key] || key;
  };
  return /* @__PURE__ */ jsx(LanguageContext.Provider, { value: { language, setLanguage, t }, children });
};
const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === void 0) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function LayoutContent({
  children
}) {
  const {
    language
  } = useLanguage();
  return /* @__PURE__ */ jsxs("html", {
    lang: language === "tj" ? "tg" : "ru",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
function Layout({
  children
}) {
  return /* @__PURE__ */ jsx(LanguageProvider, {
    children: /* @__PURE__ */ jsx(LayoutContent, {
      children
    })
  });
}
const root = withComponentProps(function App() {
  return /* @__PURE__ */ jsx(ReactQueryProvider, {
    children: /* @__PURE__ */ jsx(AuthProvider, {
      children: /* @__PURE__ */ jsx(Outlet, {})
    })
  });
});
const ErrorBoundary = withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const Loader = ({ message }) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full w-full items-center justify-center", children: [
    /* @__PURE__ */ jsx("div", { className: "h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-gray-900 dark:border-white" }),
    message && /* @__PURE__ */ jsx("div", { className: "ml-3 mt-2 text-base font-medium text-gray-900 dark:text-white", children: message })
  ] });
};
const AuthLayout = () => {
  const {
    isAuthenticated,
    isLoading
  } = useAuth();
  if (isLoading) return /* @__PURE__ */ jsx("div", {
    className: "w-full h-screen flex items-center justify-center",
    children: /* @__PURE__ */ jsx(Loader, {
      message: "Loading..."
    })
  });
  if (isAuthenticated) return /* @__PURE__ */ jsx(Navigate, {
    to: "/dashboard"
  });
  return /* @__PURE__ */ jsx(Outlet, {});
};
const authLayout = withComponentProps(AuthLayout);
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: authLayout
}, Symbol.toStringTag, { value: "Module" }));
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
        success: "text-emerald-600 bg-emerald-500/10 [&>svg]:text-current *:data-[slot=alert-description]:text-emerald-600/90"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Alert({
  className,
  variant,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert",
      role: "alert",
      className: cn(alertVariants({ variant }), className),
      ...props
    }
  );
}
function AlertDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert-description",
      className: cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      ),
      ...props
    }
  );
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    LabelPrimitive.Root,
    {
      "data-slot": "label",
      className: cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
const Form = FormProvider;
const FormFieldContext = React.createContext(
  {}
);
const FormField = ({
  ...props
}) => {
  return /* @__PURE__ */ jsx(FormFieldContext.Provider, { value: { name: props.name }, children: /* @__PURE__ */ jsx(Controller, { ...props }) });
};
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  const { id } = itemContext;
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState
  };
};
const FormItemContext = React.createContext(
  {}
);
function FormItem({ className, ...props }) {
  const id = React.useId();
  return /* @__PURE__ */ jsx(FormItemContext.Provider, { value: { id }, children: /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "form-item",
      className: cn("grid gap-2", className),
      ...props
    }
  ) });
}
function FormLabel({
  className,
  ...props
}) {
  const { error, formItemId } = useFormField();
  return /* @__PURE__ */ jsx(
    Label,
    {
      "data-slot": "form-label",
      "data-error": !!error,
      className: cn("data-[error=true]:text-destructive", className),
      htmlFor: formItemId,
      ...props
    }
  );
}
function FormControl({ ...props }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return /* @__PURE__ */ jsx(
    Slot,
    {
      "data-slot": "form-control",
      id: formItemId,
      "aria-describedby": !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`,
      "aria-invalid": !!error,
      ...props
    }
  );
}
function FormMessage({ className, ...props }) {
  const { error, formMessageId } = useFormField();
  const body = error ? String((error == null ? void 0 : error.message) ?? "") : props.children;
  if (!body) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "p",
    {
      "data-slot": "form-message",
      id: formMessageId,
      className: cn("text-destructive text-sm", className),
      ...props,
      children: body
    }
  );
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-11 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}
const verify2FASchema = z.object({
  code: z.string().min(6).max(6)
});
const VerifyLogin2FAForm = ({
  emailFor2FA,
  setTwoFARequired,
  setEmailFor2FA
}) => {
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const form = useForm({
    resolver: zodResolver(verify2FASchema),
    defaultValues: {
      code: ""
    }
  });
  const { mutate: verify2FALogin, isPending: isVerifying2FA } = useVerify2FALoginMutation();
  const handleVerify2FA = async (values) => {
    setError(null);
    verify2FALogin(
      { email: emailFor2FA, code: values.code },
      {
        onSuccess: (data) => {
          login(data);
          toast.success("Login successful");
        },
        onError: (error2) => {
          var _a, _b;
          setError(((_b = (_a = error2.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || "Invalid code");
          toast.error("Login failed");
          console.log(error2);
        }
      }
    );
  };
  return /* @__PURE__ */ jsx(Form, { ...form, children: /* @__PURE__ */ jsxs("form", { onSubmit: form.handleSubmit(handleVerify2FA), className: "space-y-4", children: [
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    /* @__PURE__ */ jsx(
      FormField,
      {
        control: form.control,
        name: "code",
        render: ({ field }) => /* @__PURE__ */ jsxs(FormItem, { children: [
          /* @__PURE__ */ jsx(FormLabel, { children: "Введите код отправленный на почту" }),
          /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx(Input, { type: "number", placeholder: "6-digit code", ...field }) }),
          /* @__PURE__ */ jsx(FormMessage, {})
        ] })
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "submit",
        size: "lg",
        className: "w-full",
        disabled: isVerifying2FA,
        children: isVerifying2FA ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Verifying..."
        ] }) : "Verify & Sign In"
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "ghost",
        className: "w-full",
        onClick: () => {
          setTwoFARequired(false);
          setEmailFor2FA("");
        },
        disabled: isVerifying2FA,
        children: "Отмена"
      }
    )
  ] }) });
};
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-title",
      className: cn("leading-none font-semibold", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-6", className),
      ...props
    }
  );
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-footer",
      className: cn("flex items-center px-6 [.border-t]:pt-6", className),
      ...props
    }
  );
}
z$1.object({
  name: z$1.string().min(2, { message: "Имя должно содержать минимум 2 символа" }),
  email: z$1.string().email({ message: "Введите корректный адрес электронной почты" }),
  password: z$1.string().min(8, { message: "Пароль должен содержать минимум 8 символов" }),
  confirmPassword: z$1.string().min(8, { message: "Подтвердите пароль (минимум 8 символов)" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"]
});
z$1.object({
  email: z$1.string().email({ message: "Введите корректный адрес электронной почты" }),
  password: z$1.string().min(1, { message: "Введите пароль" })
});
const workspaceSchema = z$1.object({
  name: z$1.string().min(1, "Требуется имя рабочего пространства"),
  color: z$1.string().min(1, "Требуется цвет рабочего пространства"),
  description: z$1.string().optional()
});
z$1.object({
  title: z$1.string().min(2, "Название проекта должно содержать не менее 2 символов."),
  description: z$1.string().optional(),
  status: z$1.enum([
    "Planning",
    "In Progress",
    "On Hold",
    "Completed",
    "Cancelled"
  ]),
  startDate: z$1.string().min(1, "Укажите дату начала."),
  dueDate: z$1.string().min(1, "Укажите дату сдачи."),
  tags: z$1.string().trim().optional(),
  members: z$1.array(
    z$1.object({
      user: z$1.string(),
      role: z$1.enum(["manager", "contributor", "viewer"])
    })
  ).optional()
});
z$1.object({
  email: z$1.string().email(),
  role: z$1.enum(["admin", "member", "viewer"])
});
z$1.object({
  title: z$1.string().min(1, "Укажите название задачи."),
  description: z$1.string().optional(),
  status: z$1.enum(["To Do", "In Progress", "Done"]),
  priority: z$1.enum(["Low", "Medium", "High"]),
  dueDate: z$1.string().min(1, "Укажите дату сдачи."),
  assignees: z$1.array(z$1.string()).min(1, "Требуется по крайней мере один уполномоченный")
});
const resetPasswordSchema = z$1.object({
  password: z$1.string().min(6, { message: "Пароль должен быть не менее 6 символов." }),
  confirmPassword: z$1.string().min(6, { message: "Требуется подтверждение пароля" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"]
});
const phoneSignUpSchema = z$1.object({
  name: z$1.string().min(1, { message: "Имя обязательно" }).refine(
    (val) => val.trim().split(/\s+/).length >= 2,
    { message: "Введите Имя и Фамилию через пробел" }
  ),
  phoneNumber: z$1.string().regex(/^\+992\d{9}$/, { message: "Формат: +992XXXXXXXXX (9 цифр после +992)" }),
  email: z$1.string().min(1, { message: "Email обязателен" }).email({ message: "Неверный формат email" }),
  password: z$1.string().min(8, { message: "Пароль должен содержать минимум 8 символов" }),
  confirmPassword: z$1.string().min(8, { message: "Подтвердите пароль (минимум 8 символов)" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"]
});
const universalLoginSchema = z$1.object({
  emailOrPhone: z$1.string().min(1, { message: "Email или телефон обязателен" }),
  password: z$1.string().min(1, { message: "Введите пароль" })
});
z$1.object({
  phoneNumber: z$1.string().regex(/^\+992\d{9}$/, { message: "Неверный формат телефона" }),
  code: z$1.string().length(6, { message: "Код должен содержать 6 цифр" }).regex(/^\d+$/, { message: "Код должен содержать только цифры" })
});
z$1.object({
  phoneNumber: z$1.string().regex(/^\+992\d{9}$/, { message: "Неверный формат телефона" })
});
const toastMessages = {
  // Authentication messages
  auth: {
    signUpSuccess: "Пользователь успешно зарегистрирован",
    signUpSuccessDescription: "Пожалуйста, проверьте свою электронную почту для подтверждения",
    signUpFailed: "Ошибка регистрации",
    loginSuccess: "Успешный вход в систему",
    loginFailed: "Ошибка входа",
    logoutSuccess: "Вы успешно вышли из системы",
    emailVerificationSent: "Код подтверждения отправлен на вашу электронную почту",
    emailVerified: "Электронная почта успешно подтверждена",
    passwordResetSent: "Ссылка для сброса пароля отправлена на вашу электронную почту",
    passwordResetSuccess: "Пароль успешно изменен",
    invalidCredentials: "Неверные учетные данные",
    accountNotVerified: "Пожалуйста, подтвердите свою электронную почту",
    twoFARequired: "Требуется двухфакторная аутентификация",
    twoFAEnabled: "Двухфакторная аутентификация успешно включена",
    twoFADisabled: "Двухфакторная аутентификация отключена",
    invalidCode: "Неверный код подтверждения",
    oauthSuccess: "Успешный вход через OAuth",
    oauthError: "Ошибка аутентификации. Попробуйте снова",
    appleComingSoon: "Аутентификация Apple будет добавлена в следующем обновлении",
    tokenNotFound: "Токен аутентификации не найден",
    invalidToken: "Неверный токен аутентификации"
  },
  // Profile messages
  profile: {
    updateSuccess: "Профиль успешно обновлен",
    updateFailed: "Не удалось обновить профиль",
    passwordUpdateSuccess: "Пароль успешно обновлен. Вы будете перенаправлены на страницу входа",
    passwordUpdateFailed: "Не удалось обновить пароль",
    avatarUploadSuccess: "Аватар успешно загружен",
    avatarUploadFailed: "Не удалось загрузить аватар. Попробуйте снова",
    fileSizeError: "Размер файла должен быть менее 1 МБ"
  },
  // Task messages
  tasks: {
    createSuccess: "Задача успешно создана",
    createFailed: "Ошибка создания задачи",
    updateSuccess: "Задача успешно обновлена",
    updateFailed: "Не удалось обновить задачу",
    deleteSuccess: "Задача успешно удалена",
    deleteFailed: "Не удалось удалить задачу",
    statusUpdated: "Статус задачи обновлен",
    statusUpdateFailed: "Не удалось обновить статус задачи",
    priorityUpdated: "Приоритет задачи обновлен",
    priorityUpdateFailed: "Не удалось обновить приоритет задачи",
    titleUpdated: "Название задачи успешно обновлено",
    titleUpdateFailed: "Не удалось обновить название задачи",
    descriptionUpdated: "Описание задачи успешно обновлено",
    descriptionUpdateFailed: "Не удалось обновить описание задачи",
    assigneesUpdated: "Исполнители задачи обновлены",
    assigneesUpdateFailed: "Не удалось обновить исполнителей задачи",
    watchStatusUpdated: "Статус отслеживания обновлен",
    watchStatusUpdateFailed: "Не удалось обновить статус отслеживания",
    archived: "Задача заархивирована",
    unarchived: "Задача разархивирована",
    archiveUpdateFailed: "Не удалось обновить статус архива",
    addedToWatchers: "Добавлено в наблюдатели",
    removedFromWatchers: "Удалено из наблюдателей"
  },
  // Subtask messages
  subtasks: {
    createSuccess: "Подзадача успешно создана",
    createFailed: "Не удалось создать подзадачу",
    updateSuccess: "Подзадача успешно обновлена",
    updateFailed: "Не удалось обновить подзадачу"
  },
  // Comment and Response messages
  comments: {
    addSuccess: "Комментарий успешно добавлен",
    addFailed: "Не удалось добавить комментарий",
    responseAddSuccess: "Ответ успешно добавлен",
    responseAddFailed: "Не удалось добавить ответ",
    reactionAddSuccess: "Реакция успешно добавлена",
    reactionAddFailed: "Не удалось добавить реакцию",
    contentRequired: "Добавьте текст или прикрепите файл",
    voiceMessageAdded: "Голосовое сообщение добавлено",
    voiceMessageFailed: "Не удалось загрузить голосовое сообщение"
  },
  // File upload messages
  files: {
    uploadSuccess: "Файл успешно загружен",
    uploadFailed: "Не удалось загрузить файл",
    fileSizeError: "Файл превышает лимит в 50 МБ",
    fileTypeError: "Неподдерживаемый тип файла"
  },
  // Audio recording messages
  audio: {
    recordingStarted: "Запись началась...",
    recordingStopped: "Запись остановлена",
    recordingFailed: "Не удалось начать запись. Проверьте подключение микрофона",
    microphoneAccessDenied: "Доступ к микрофону запрещен. Разрешите доступ к микрофону в настройках браузера",
    microphoneNotFound: "Микрофон не найден. Подключите микрофон и попробуйте снова",
    microphoneBusy: "Микрофон занят другим приложением. Закройте другие приложения и попробуйте снова",
    microphoneNotSupported: "Микрофон не поддерживает требуемые настройки",
    securityError: "Запись аудио заблокирована по соображениям безопасности. Используйте HTTPS соединение",
    browserNotSupported: "Ваш браузер не поддерживает запись аудио"
  },
  // Project messages
  projects: {
    createSuccess: "Проект успешно создан",
    createFailed: "Не удалось создать проект",
    updateSuccess: "Проект успешно обновлен",
    updateFailed: "Не удалось обновить проект",
    deleteSuccess: "Проект успешно удален",
    deleteFailed: "Не удалось удалить проект",
    archived: "Проект заархивирован",
    unarchived: "Проект разархивирован",
    archiveUpdateFailed: "Не удалось обновить статус архива проекта",
    membersAddSuccess: "Участники успешно добавлены",
    membersAddFailed: "Не удалось добавить участников",
    memberRemoveSuccess: "Участник успешно удален",
    memberRemoveFailed: "Не удалось удалить участника"
  },
  // Workspace messages
  workspaces: {
    createSuccess: "Рабочая область успешно создана",
    createFailed: "Не удалось создать рабочую область",
    updateSuccess: "Рабочая область успешно обновлена",
    updateFailed: "Не удалось обновить рабочую область",
    deleteSuccess: "Рабочая область успешно удалена",
    deleteFailed: "Не удалось удалить рабочую область",
    joinSuccess: "Вы успешно присоединились к рабочей области",
    joinFailed: "Не удалось присоединиться к рабочей области",
    inviteSuccess: "Приглашение успешно отправлено",
    inviteFailed: "Не удалось отправить приглашение",
    inviteLinkCopied: "Ссылка приглашения скопирована в буфер обмена",
    inviteDeclined: "Приглашение отклонено",
    ownershipTransferred: "Владение рабочей областью успешно передано",
    ownershipTransferFailed: "Не удалось передать владение рабочей областью",
    selectMemberError: "Пожалуйста, выберите участника для передачи владения",
    workspaceNotSelected: "Рабочая область не выбрана"
  },
  // Member management messages
  members: {
    roleUpdateSuccess: "Роль пользователя успешно изменена",
    roleUpdateFailed: "Ошибка изменения роли",
    removeSuccess: "Участник успешно удален",
    removeFailed: "Не удалось удалить участника"
  },
  // Notification messages
  notifications: {
    markAllReadSuccess: "Все уведомления отмечены как прочитанные",
    markAllReadFailed: "Произошла ошибка при отметке уведомлений",
    markReadSuccess: "Уведомление отмечено как прочитанное",
    markReadFailed: "Произошла ошибка при отметке уведомления"
  },
  // Settings messages
  settings: {
    saveSuccess: "Настройки успешно сохранены",
    saveFailed: "Не удалось сохранить настройки"
  },
  // General error messages
  errors: {
    networkError: "Ошибка сети. Проверьте подключение к интернету",
    serverError: "Ошибка сервера. Попробуйте позже",
    unknownError: "Произошла неизвестная ошибка",
    unauthorized: "Нет доступа",
    notFound: "Не найдено",
    validationError: "Ошибка валидации данных"
  },
  // Success messages
  success: {
    operationCompleted: "Операция успешно выполнена",
    changesSaved: "Изменения сохранены",
    actionCompleted: "Действие выполнено"
  }
};
function meta$g({}) {
  return [{
    title: "TaskHub | Sign In"
  }, {
    name: "description",
    content: "Sign In to TaskHub!"
  }];
}
const SignIn = () => {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const {
    login
  } = useAuth();
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [emailFor2FA, setEmailFor2FA] = useState("");
  const form = useForm({
    resolver: zodResolver(universalLoginSchema),
    defaultValues: {
      emailOrPhone: "",
      password: ""
    }
  });
  const onSubmit = async (values) => {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api-v1/auth/login-universal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      if (response.ok) {
        if (data.twoFARequired) {
          setTwoFARequired(true);
          setEmailFor2FA(values.emailOrPhone);
          toast.info("Требуется двухфакторная аутентификация");
        } else {
          login(data);
          toast.success("Вход выполнен успешно!");
        }
      } else {
        throw new Error(data.message || "Ошибка входа");
      }
    } catch (err) {
      const message = err.message || toastMessages.auth.loginFailed;
      setError(message);
      toast.error("Ошибка входа", {
        description: message
      });
    } finally {
      setIsPending(false);
    }
  };
  const handleGoogleLogin = () => {
    window.location.href = `${"https://ptapi.oci.tj"}/api-v1/auth/google`;
  };
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4",
    children: /* @__PURE__ */ jsxs(Card, {
      className: "border-border/50 shadow-xl w-full max-w-md",
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        className: "mb-6 text-center",
        children: [/* @__PURE__ */ jsx(CardTitle, {
          className: "text-3xl",
          children: "Добро пожаловать"
        }), /* @__PURE__ */ jsx(CardDescription, {
          children: "Войдите используя email или номер телефона"
        })]
      }), /* @__PURE__ */ jsx(CardContent, {
        children: twoFARequired ? /* @__PURE__ */ jsx(VerifyLogin2FAForm, {
          emailFor2FA,
          setEmailFor2FA,
          setTwoFARequired
        }) : /* @__PURE__ */ jsx(Form, {
          ...form,
          children: /* @__PURE__ */ jsxs("form", {
            onSubmit: form.handleSubmit(onSubmit),
            className: "space-y-4",
            children: [error && /* @__PURE__ */ jsxs(Alert, {
              variant: "destructive",
              children: [/* @__PURE__ */ jsx(AlertCircle, {
                className: "h-4 w-4"
              }), /* @__PURE__ */ jsx(AlertDescription, {
                children: error
              })]
            }), /* @__PURE__ */ jsx(FormField, {
              control: form.control,
              name: "emailOrPhone",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsx(FormLabel, {
                  children: "Email или телефон"
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    placeholder: "email@example.com или +992901234567",
                    ...field
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsx(FormField, {
              control: form.control,
              name: "password",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [/* @__PURE__ */ jsx(FormLabel, {
                    children: "Пароль"
                  }), /* @__PURE__ */ jsx(Link, {
                    to: "/forgot-password",
                    className: "text-sm text-blue-600 hover:underline",
                    children: "Забыли пароль?"
                  })]
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    type: "password",
                    placeholder: "••••••••",
                    ...field
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsx(Button, {
              type: "submit",
              size: "lg",
              className: "w-full",
              disabled: isPending,
              children: isPending ? /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(Loader2, {
                  className: "mr-2 h-4 w-4 animate-spin"
                }), "Вход в систему..."]
              }) : "Войти"
            }), /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx("div", {
                className: "absolute inset-0 flex items-center",
                children: /* @__PURE__ */ jsx("span", {
                  className: "w-full border-t"
                })
              }), /* @__PURE__ */ jsx("div", {
                className: "relative flex justify-center text-xs uppercase",
                children: /* @__PURE__ */ jsx("span", {
                  className: "bg-background px-2 text-muted-foreground",
                  children: "Или продолжить с"
                })
              })]
            }), /* @__PURE__ */ jsxs(Button, {
              variant: "outline",
              type: "button",
              disabled: isPending,
              onClick: handleGoogleLogin,
              className: "w-full",
              children: [/* @__PURE__ */ jsxs("svg", {
                className: "mr-2 h-4 w-4",
                viewBox: "0 0 24 24",
                children: [/* @__PURE__ */ jsx("path", {
                  d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
                  fill: "#4285F4"
                }), /* @__PURE__ */ jsx("path", {
                  d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
                  fill: "#34A853"
                }), /* @__PURE__ */ jsx("path", {
                  d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
                  fill: "#FBBC05"
                }), /* @__PURE__ */ jsx("path", {
                  d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
                  fill: "#EA4335"
                })]
              }), "Войти через Google"]
            })]
          })
        })
      }), /* @__PURE__ */ jsx(CardFooter, {
        children: /* @__PURE__ */ jsxs("div", {
          className: "text-center text-sm w-full",
          children: ["У вас нет учетной записи?", " ", /* @__PURE__ */ jsx(Link, {
            to: "/sign-up",
            className: "text-blue-600 font-semibold hover:underline",
            children: "Зарегистрироваться"
          })]
        })
      })]
    })
  });
};
const signIn = withComponentProps(SignIn);
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: signIn,
  meta: meta$g
}, Symbol.toStringTag, { value: "Module" }));
const SMSVerification = ({ phoneNumber, onSuccess }) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [waitMinutes, setWaitMinutes] = useState(0);
  const inputRefs = useRef([]);
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1e3);
    return () => clearInterval(timer);
  }, [timeLeft]);
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const handleChange = (index2, value) => {
    var _a;
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index2] = value;
    setCode(newCode);
    if (value && index2 < 5) {
      (_a = inputRefs.current[index2 + 1]) == null ? void 0 : _a.focus();
    }
    if (newCode.every((digit) => digit !== "") && value) {
      handleVerify(newCode.join(""));
    }
  };
  const handleKeyDown = (index2, e) => {
    var _a;
    if (e.key === "Backspace" && !code[index2] && index2 > 0) {
      (_a = inputRefs.current[index2 - 1]) == null ? void 0 : _a.focus();
    }
  };
  const handleVerify = async (codeStr) => {
    var _a;
    setIsVerifying(true);
    try {
      const response = await fetch(
        `${"https://ptapi.oci.tj"}/api-v1/auth/verify-phone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber,
            code: codeStr
          })
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Телефон успешно подтвержден!");
        onSuccess(data.token);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Неверный код");
      setCode(["", "", "", "", "", ""]);
      (_a = inputRefs.current[0]) == null ? void 0 : _a.focus();
    } finally {
      setIsVerifying(false);
    }
  };
  const handleResend = async () => {
    var _a;
    setIsResending(true);
    try {
      const response = await fetch(
        `${"https://ptapi.oci.tj"}/api-v1/auth/resend-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber })
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Код отправлен повторно");
        setTimeLeft(300);
        setCanResend(false);
        setWaitMinutes(0);
        setCode(["", "", "", "", "", ""]);
        (_a = inputRefs.current[0]) == null ? void 0 : _a.focus();
      } else if (response.status === 429) {
        setWaitMinutes(data.waitMinutes || 1);
        toast.error(data.message || "Слишком много попыток");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Ошибка отправки SMS");
    } finally {
      setIsResending(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 p-6 border border-border rounded-lg bg-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: "Введите код из SMS" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Код отправлен на номер ",
        phoneNumber
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2 justify-center", children: code.map((digit, index2) => /* @__PURE__ */ jsx(
      Input,
      {
        ref: (el) => {
          inputRefs.current[index2] = el;
        },
        type: "text",
        inputMode: "numeric",
        maxLength: 1,
        value: digit,
        onChange: (e) => handleChange(index2, e.target.value),
        onKeyDown: (e) => handleKeyDown(index2, e),
        className: "w-12 h-12 text-center text-lg font-semibold",
        autoFocus: index2 === 0,
        disabled: isVerifying
      },
      index2
    )) }),
    isVerifying && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      /* @__PURE__ */ jsx("span", { children: "Проверка кода..." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
      "Код действителен:",
      " ",
      /* @__PURE__ */ jsx("span", { className: `font-semibold ${timeLeft < 60 ? "text-destructive" : ""}`, children: formatTime(timeLeft) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(
      Button,
      {
        variant: "ghost",
        onClick: handleResend,
        disabled: !canResend || isResending || waitMinutes > 0,
        className: "text-sm",
        children: isResending ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Отправка..."
        ] }) : waitMinutes > 0 ? `Следующая попытка через ${waitMinutes} мин` : canResend ? "Отправить код снова" : "Отправить снова"
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "text-center text-xs text-muted-foreground", children: /* @__PURE__ */ jsx("p", { children: "Не получили код? Проверьте правильность номера телефона" }) })
  ] });
};
function meta$f({}) {
  return [{
    title: "TaskHub | Sign Up"
  }, {
    name: "description",
    content: "Sign Up to TaskHub!"
  }];
}
const SignUp = () => {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationType, setVerificationType] = useState("link");
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(phoneSignUpSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });
  const onSubmit = async (values) => {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch(`${"https://ptapi.oci.tj"}/api-v1/auth/register-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      if (response.ok) {
        if (data.requiresVerification) {
          setPhoneNumber(data.phoneNumber);
          setVerificationType(data.verificationType || "link");
          setShowVerification(true);
          if (data.verificationType === "link") {
            toast.success("Ссылка отправлена на ваш телефон", {
              description: `Проверьте SMS на номере ${data.phoneNumber} и нажмите на ссылку`
            });
          } else {
            toast.success("Код отправлен на ваш телефон", {
              description: `Проверьте SMS на номере ${data.phoneNumber}`
            });
          }
          setError(null);
        } else {
          if (data.token && data.user) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            toast.success("Регистрация завершена!", {
              description: "Добро пожаловать в TaskHub"
            });
            setTimeout(() => {
              navigate("/dashboard");
            }, 500);
          } else {
            throw new Error("Токен не получен");
          }
        }
      } else {
        throw new Error(data.message || "Ошибка регистрации");
      }
    } catch (err) {
      const message = err.message || toastMessages.errors.unknownError;
      setError(message);
      toast.error("Ошибка регистрации", {
        description: message
      });
    } finally {
      setIsPending(false);
    }
  };
  const handleVerificationSuccess = (token) => {
    localStorage.setItem("token", token);
    toast.success("Регистрация завершена!", {
      description: "Добро пожаловать в TaskHub"
    });
    setTimeout(() => {
      navigate("/dashboard");
    }, 500);
  };
  if (showVerification) {
    if (verificationType === "link") {
      return /* @__PURE__ */ jsx("div", {
        className: "min-h-screen flex flex-col items-center justify-center bg-muted p-4",
        children: /* @__PURE__ */ jsxs(Card, {
          className: "border-border/50 w-full max-w-md shadow-xl",
          children: [/* @__PURE__ */ jsxs(CardHeader, {
            className: "text-center",
            children: [/* @__PURE__ */ jsx(CardTitle, {
              className: "text-2xl",
              children: "Проверьте SMS"
            }), /* @__PURE__ */ jsx(CardDescription, {
              children: "Ссылка для подтверждения отправлена на ваш телефон"
            })]
          }), /* @__PURE__ */ jsxs(CardContent, {
            className: "space-y-4",
            children: [/* @__PURE__ */ jsxs(Alert, {
              children: [/* @__PURE__ */ jsx(AlertCircle, {
                className: "h-4 w-4"
              }), /* @__PURE__ */ jsx(AlertDescription, {
                children: /* @__PURE__ */ jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */ jsx("p", {
                    className: "font-medium",
                    children: "Следующие шаги:"
                  }), /* @__PURE__ */ jsxs("ol", {
                    className: "list-decimal list-inside space-y-1 text-sm",
                    children: [/* @__PURE__ */ jsxs("li", {
                      children: ["Откройте SMS на номере ", phoneNumber]
                    }), /* @__PURE__ */ jsx("li", {
                      children: "Нажмите на ссылку подтверждения"
                    }), /* @__PURE__ */ jsx("li", {
                      children: "Вы будете автоматически перенаправлены"
                    })]
                  }), /* @__PURE__ */ jsx("p", {
                    className: "text-sm text-muted-foreground mt-3",
                    children: "Ссылка действительна 10 минут"
                  })]
                })
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "text-center text-sm text-muted-foreground",
              children: "Не получили SMS?"
            })]
          }), /* @__PURE__ */ jsx(CardFooter, {
            className: "flex justify-center gap-2",
            children: /* @__PURE__ */ jsx(Button, {
              variant: "ghost",
              size: "sm",
              onClick: () => {
                setShowVerification(false);
                setPhoneNumber("");
              },
              children: "Изменить данные регистрации"
            })
          })]
        })
      });
    }
    return /* @__PURE__ */ jsx("div", {
      className: "min-h-screen flex flex-col items-center justify-center bg-muted p-4",
      children: /* @__PURE__ */ jsxs(Card, {
        className: "border-border/50 w-full max-w-md shadow-xl",
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "text-center",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-2xl",
            children: "Подтверждение телефона"
          }), /* @__PURE__ */ jsx(CardDescription, {
            children: "Введите код из SMS для завершения регистрации"
          })]
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsx(SMSVerification, {
            phoneNumber,
            onSuccess: handleVerificationSuccess
          })
        }), /* @__PURE__ */ jsx(CardFooter, {
          className: "flex justify-center",
          children: /* @__PURE__ */ jsx(Button, {
            variant: "ghost",
            size: "sm",
            onClick: () => {
              setShowVerification(false);
              setPhoneNumber("");
            },
            children: "Изменить данные регистрации"
          })
        })]
      })
    });
  }
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex flex-col items-center justify-center bg-muted p-4",
    children: /* @__PURE__ */ jsxs(Card, {
      className: "border-border/50 w-full max-w-md shadow-xl",
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        className: "mb-6 text-center",
        children: [/* @__PURE__ */ jsx(CardTitle, {
          className: "text-3xl",
          children: "Создать аккаунт"
        }), /* @__PURE__ */ jsx(CardDescription, {
          children: "Введите ваши данные для создания учетной записи"
        })]
      }), /* @__PURE__ */ jsx(CardContent, {
        children: /* @__PURE__ */ jsx(Form, {
          ...form,
          children: /* @__PURE__ */ jsxs("form", {
            onSubmit: form.handleSubmit(onSubmit),
            className: "space-y-4",
            children: [error && /* @__PURE__ */ jsxs(Alert, {
              variant: "destructive",
              children: [/* @__PURE__ */ jsx(AlertCircle, {
                className: "h-4 w-4"
              }), /* @__PURE__ */ jsx(AlertDescription, {
                children: error
              })]
            }), /* @__PURE__ */ jsx(FormField, {
              control: form.control,
              name: "name",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsx(FormLabel, {
                  children: "Полное имя *"
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    placeholder: "Имя Фамилия",
                    ...field
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsx(FormField, {
              control: form.control,
              name: "phoneNumber",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsx(FormLabel, {
                  children: "Номер телефона *"
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    placeholder: "+992901234567",
                    ...field
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsx(FormField, {
              control: form.control,
              name: "email",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsx(FormLabel, {
                  children: "Email *"
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    type: "email",
                    placeholder: "email@example.com",
                    ...field
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsx(FormField, {
              control: form.control,
              name: "password",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsx(FormLabel, {
                  children: "Пароль *"
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    type: "password",
                    placeholder: "Минимум 8 символов",
                    ...field
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsx(FormField, {
              control: form.control,
              name: "confirmPassword",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsx(FormLabel, {
                  children: "Подтвердите пароль *"
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    type: "password",
                    placeholder: "Повторите пароль",
                    ...field
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsx(Button, {
              type: "submit",
              size: "lg",
              className: "w-full",
              disabled: isPending,
              children: isPending ? /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(Loader2, {
                  className: "mr-2 h-4 w-4 animate-spin"
                }), "Создание учетной записи..."]
              }) : "Создать аккаунт"
            })]
          })
        })
      }), /* @__PURE__ */ jsx(CardFooter, {
        children: /* @__PURE__ */ jsxs("div", {
          className: "text-center text-sm w-full",
          children: ["У вас уже есть аккаунт?", " ", /* @__PURE__ */ jsx(Link, {
            to: "/",
            className: "text-blue-600 font-semibold hover:underline",
            children: "Войти"
          })]
        })
      })]
    })
  });
};
const signUp = withComponentProps(SignUp);
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: signUp,
  meta: meta$f
}, Symbol.toStringTag, { value: "Module" }));
function meta$e({}) {
  return [{
    title: "TaskHub | Forgot Password"
  }, {
    name: "description",
    content: "Forgot Password to TaskHub!"
  }];
}
const forgotPasswordSchema = z$1.object({
  emailOrPhone: z$1.string().min(1, {
    message: "Введите email или номер телефона"
  }).refine((val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+992\d{9}$/;
    return emailRegex.test(val) || phoneRegex.test(val);
  }, {
    message: "Введите корректный email или номер телефона (+992XXXXXXXXX)"
  })
});
const forgotPassword = withComponentProps(function ForgotPasswordPage() {
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetMethod, setResetMethod] = useState("email");
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrPhone: ""
    }
  });
  const {
    mutate,
    isPending
  } = useRequestResetPasswordMutation();
  const onSubmit = async (values) => {
    setError(null);
    const isPhone = values.emailOrPhone.startsWith("+992");
    setResetMethod(isPhone ? "phone" : "email");
    try {
      mutate({
        emailOrPhone: values.emailOrPhone
      }, {
        onSuccess: () => {
          setIsSuccess(true);
          form.reset();
        },
        onError: (error2) => {
          var _a, _b;
          setError(((_b = (_a = error2 == null ? void 0 : error2.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || error2.message || "Не удалось отправить ссылку для сброса пароля");
          console.log(error2);
        }
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Произошла неизвестная ошибка");
      }
    }
  };
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4",
    children: /* @__PURE__ */ jsxs("div", {
      className: "w-full max-w-md space-y-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex flex-col items-center space-y-2 text-center",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-bold",
          children: "Забыли Пароль"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: "Введите свой email или номер телефона для сброса пароля"
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        className: "border-border/50",
        children: [/* @__PURE__ */ jsx(CardHeader, {
          children: /* @__PURE__ */ jsxs(Link, {
            to: "/",
            className: "flex items-center text-sm text-muted-foreground hover:text-foreground",
            children: [/* @__PURE__ */ jsx(ArrowLeft, {
              className: "mr-2 h-4 w-4"
            }), "Вернуться к входу"]
          })
        }), /* @__PURE__ */ jsx(CardContent, {
          children: isSuccess ? /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col items-center space-y-4 py-6",
            children: [/* @__PURE__ */ jsx("div", {
              className: "rounded-full bg-primary/10 p-3",
              children: /* @__PURE__ */ jsx(CheckCircle2, {
                className: "h-8 w-8 text-primary"
              })
            }), /* @__PURE__ */ jsx("h3", {
              className: "text-xl font-semibold",
              children: resetMethod === "email" ? "Проверьте почту" : "Проверьте SMS"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-center text-muted-foreground",
              children: resetMethod === "email" ? "Мы отправили ссылку для сброса пароля на ваш адрес электронной почты. Пожалуйста, проверьте ваш почтовый ящик." : "Мы отправили ссылку для сброса пароля на ваш номер телефона. Пожалуйста, проверьте SMS сообщения."
            }), /* @__PURE__ */ jsx(Button, {
              variant: "outline",
              asChild: true,
              className: "mt-4",
              children: /* @__PURE__ */ jsx(Link, {
                to: "/",
                children: "Вернуться к входу"
              })
            })]
          }) : /* @__PURE__ */ jsx(Form, {
            ...form,
            children: /* @__PURE__ */ jsxs("form", {
              onSubmit: form.handleSubmit(onSubmit),
              className: "space-y-4",
              children: [error && /* @__PURE__ */ jsxs(Alert, {
                variant: "destructive",
                children: [/* @__PURE__ */ jsx(AlertCircle, {
                  className: "h-4 w-4"
                }), /* @__PURE__ */ jsx(AlertDescription, {
                  children: error
                })]
              }), /* @__PURE__ */ jsx(FormField, {
                control: form.control,
                name: "emailOrPhone",
                render: ({
                  field
                }) => /* @__PURE__ */ jsxs(FormItem, {
                  children: [/* @__PURE__ */ jsx(FormLabel, {
                    children: "Email или Телефон"
                  }), /* @__PURE__ */ jsx(FormControl, {
                    children: /* @__PURE__ */ jsx(Input, {
                      type: "text",
                      placeholder: "email@example.com или +992XXXXXXXXX",
                      ...field
                    })
                  }), /* @__PURE__ */ jsx(FormMessage, {})]
                })
              }), /* @__PURE__ */ jsx(Button, {
                type: "submit",
                size: "lg",
                className: "w-full",
                disabled: isPending,
                children: isPending ? /* @__PURE__ */ jsxs(Fragment, {
                  children: [/* @__PURE__ */ jsx(Loader2, {
                    className: "mr-2 h-4 w-4 animate-spin"
                  }), "Отправка..."]
                }) : "Отправить ссылку для сброса"
              })]
            })
          })
        }), /* @__PURE__ */ jsx(CardFooter, {
          children: /* @__PURE__ */ jsxs("div", {
            className: "text-center text-sm w-full",
            children: ["Помните свой пароль?", " ", /* @__PURE__ */ jsx(Link, {
              to: "/",
              className: "text-blue-600 font-semibold hover:underline",
              children: "Войти"
            })]
          })
        })]
      })]
    })
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: forgotPassword,
  meta: meta$e
}, Symbol.toStringTag, { value: "Module" }));
function meta$d({}) {
  return [{
    title: "TaskHub | Verify Email"
  }, {
    name: "description",
    content: "Verify Email to TaskHub!"
  }];
}
const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    mutate: verifyEmail2,
    isPending: isVerifying
  } = useVerifyEmailMutation();
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      verifyEmail2({
        token
      }, {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: () => {
          setIsSuccess(false);
        }
      });
    }
  }, [searchParams]);
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex flex-col items-center justify-center bg-muted p-4",
    children: /* @__PURE__ */ jsxs("div", {
      className: "w-full max-w-md space-y-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex flex-col items-center space-y-2 text-center",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-bold",
          children: "Верификация электронной почты"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: "Проверка адреса электронной почты"
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        className: "border-border/50 shadow-xl",
        children: [/* @__PURE__ */ jsx(CardHeader, {
          children: /* @__PURE__ */ jsxs(Link, {
            to: "/",
            className: "flex items-center text-sm text-muted-foreground hover:text-foreground",
            children: [/* @__PURE__ */ jsx(ArrowLeft, {
              className: "mr-2 h-4 w-4"
            }), "Вернуться к входу"]
          })
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsx("div", {
            className: "flex flex-col items-center space-y-4 py-6",
            children: isVerifying ? /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx(Loader2, {
                className: "h-12 w-12 animate-spin text-primary"
              }), /* @__PURE__ */ jsx("h3", {
                className: "text-xl font-semibold",
                children: "Проверка..."
              }), /* @__PURE__ */ jsx("p", {
                className: "text-center text-muted-foreground",
                children: "Пожалуйста, подождите, пока мы проверим ваш адрес электронной почты."
              })]
            }) : isSuccess ? /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx("div", {
                className: "rounded-full bg-emerald-600/10 p-3",
                children: /* @__PURE__ */ jsx(CheckCircle2, {
                  className: "h-8 w-8 text-emerald-600"
                })
              }), /* @__PURE__ */ jsx("h3", {
                className: "text-xl font-semibold",
                children: "Электронная почта проверена"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-center text-muted-foreground",
                children: "Ваш адрес электронной почты успешно подтверждён. Теперь вы можете войти в свою учётную запись."
              }), /* @__PURE__ */ jsx(Button, {
                asChild: true,
                className: "mt-4",
                children: /* @__PURE__ */ jsx(Link, {
                  to: "/",
                  children: "Перейти к входу"
                })
              })]
            }) : /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx("div", {
                className: "rounded-full bg-destructive/10 p-3",
                children: /* @__PURE__ */ jsx(XCircle, {
                  className: "h-8 w-8 text-destructive"
                })
              }), /* @__PURE__ */ jsx("h3", {
                className: "text-xl font-semibold",
                children: "Проверка не удалась"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-center text-muted-foreground",
                children: "Не удалось подтвердить ваш адрес электронной почты. Возможно, ссылка для подтверждения устарела или недействительна."
              }), /* @__PURE__ */ jsx(Button, {
                variant: "outline",
                asChild: true,
                className: "mt-4",
                children: /* @__PURE__ */ jsx(Link, {
                  to: "/",
                  children: "Вернуться к входу"
                })
              })]
            })
          })
        }), /* @__PURE__ */ jsx(CardFooter, {
          children: /* @__PURE__ */ jsxs("div", {
            className: "text-center text-sm w-full",
            children: ["Нужна помощь?", " ", /* @__PURE__ */ jsx("a", {
              href: "mailto:support@taskhub.com",
              className: "text-primary font-semibold hover:underline",
              children: "Обратиться в службу поддержки"
            })]
          })
        })]
      })]
    })
  });
};
const verifyEmail = withComponentProps(VerifyEmailPage);
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: verifyEmail,
  meta: meta$d
}, Symbol.toStringTag, { value: "Module" }));
const verify_$token = withComponentProps(function VerifyPhoneToken() {
  const {
    token
  } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Токен верификации отсутствует");
        return;
      }
      try {
        const response = await fetch(`${"https://ptapi.oci.tj"}/api-v1/auth/verify-phone-link/${token}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Телефон успешно подтвержден!");
          setPhoneNumber(data.phoneNumber || "");
          setTimeout(() => {
            navigate("/", {
              state: {
                message: "Телефон подтвержден! Теперь вы можете войти в систему.",
                phoneNumber: data.phoneNumber
              }
            });
          }, 3e3);
        } else {
          setStatus("error");
          setMessage(data.message || "Ошибка верификации");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Ошибка подключения к серверу");
      }
    };
    verifyToken();
  }, [token, navigate]);
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4",
    children: /* @__PURE__ */ jsxs("div", {
      className: "w-full max-w-md",
      children: [/* @__PURE__ */ jsx("div", {
        className: "bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8",
        children: /* @__PURE__ */ jsxs("div", {
          className: "text-center",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "mb-6",
            children: [/* @__PURE__ */ jsx("h1", {
              className: "text-3xl font-bold text-gray-900 dark:text-white",
              children: "Protocol"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-sm text-gray-600 dark:text-gray-400 mt-2",
              children: "Подтверждение телефона"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "mb-6",
            children: [status === "loading" && /* @__PURE__ */ jsx("div", {
              className: "flex justify-center",
              children: /* @__PURE__ */ jsx(Loader2, {
                className: "h-16 w-16 text-blue-600 animate-spin"
              })
            }), status === "success" && /* @__PURE__ */ jsx("div", {
              className: "flex justify-center",
              children: /* @__PURE__ */ jsx(CheckCircle, {
                className: "h-16 w-16 text-green-600"
              })
            }), status === "error" && /* @__PURE__ */ jsx("div", {
              className: "flex justify-center",
              children: /* @__PURE__ */ jsx(XCircle, {
                className: "h-16 w-16 text-red-600"
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "mb-6",
            children: [status === "loading" && /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h2", {
                className: "text-xl font-semibold text-gray-900 dark:text-white mb-2",
                children: "Проверка..."
              }), /* @__PURE__ */ jsx("p", {
                className: "text-gray-600 dark:text-gray-400",
                children: "Подтверждаем ваш номер телефона"
              })]
            }), status === "success" && /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h2", {
                className: "text-xl font-semibold text-green-600 mb-2",
                children: "Успешно!"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-gray-700 dark:text-gray-300 mb-2",
                children: message
              }), phoneNumber && /* @__PURE__ */ jsxs("p", {
                className: "text-sm text-gray-600 dark:text-gray-400",
                children: ["Телефон: ", phoneNumber]
              }), /* @__PURE__ */ jsx("p", {
                className: "text-sm text-gray-500 dark:text-gray-400 mt-4",
                children: "Перенаправление на страницу входа..."
              })]
            }), status === "error" && /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h2", {
                className: "text-xl font-semibold text-red-600 mb-2",
                children: "Ошибка"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-gray-700 dark:text-gray-300 mb-4",
                children: message
              }), /* @__PURE__ */ jsx("p", {
                className: "text-sm text-gray-600 dark:text-gray-400",
                children: "Возможно, ссылка устарела или уже использована"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-3",
            children: [status === "error" && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx(Link, {
                to: "/sign-up",
                className: "block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors",
                children: "Повторить регистрацию"
              }), /* @__PURE__ */ jsx(Link, {
                to: "/",
                className: "block w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors",
                children: "Войти в систему"
              })]
            }), status === "success" && /* @__PURE__ */ jsx(Link, {
              to: "/",
              className: "block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors",
              children: "Перейти к входу"
            })]
          })]
        })
      }), /* @__PURE__ */ jsx("p", {
        className: "text-center text-sm text-gray-600 dark:text-gray-400 mt-6",
        children: "© 2024 Protocol. Все права защищены."
      })]
    })
  });
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: verify_$token
}, Symbol.toStringTag, { value: "Module" }));
function meta$c() {
  return [{
    title: "Vazifa | OAuth Callback"
  }, {
    name: "description",
    content: "Processing OAuth authentication..."
  }];
}
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    login
  } = useAuth();
  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    if (error) {
      toast.error(toastMessages.auth.oauthError);
      navigate("/");
      return;
    }
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        fetch(`${"https://ptapi.oci.tj"}/users/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }).then((response) => response.json()).then((data) => {
          if (data.user) {
            login({
              user: data.user,
              token
            });
            toast.success(toastMessages.auth.oauthSuccess);
            navigate("/dashboard");
          } else {
            throw new Error("Invalid user data");
          }
        }).catch((error2) => {
          console.error("OAuth callback error:", error2);
          toast.error(toastMessages.errors.serverError);
          navigate("/");
        });
      } catch (error2) {
        console.error("Token parsing error:", error2);
        toast.error(toastMessages.auth.invalidToken);
        navigate("/");
      }
    } else {
      toast.error(toastMessages.auth.tokenNotFound);
      navigate("/");
    }
  }, [searchParams, navigate, login]);
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4",
    children: [/* @__PURE__ */ jsx(Loader, {
      message: "Обработка аутентификации..."
    }), /* @__PURE__ */ jsx("p", {
      className: "mt-4 text-muted-foreground text-center",
      children: "Пожалуйста, подождите, пока мы завершаем процесс входа..."
    })]
  });
};
const callback = withComponentProps(AuthCallback);
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: callback,
  meta: meta$c
}, Symbol.toStringTag, { value: "Module" }));
function Avatar({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AvatarPrimitive.Root,
    {
      "data-slot": "avatar",
      className: cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      ),
      ...props
    }
  );
}
function AvatarImage({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AvatarPrimitive.Image,
    {
      "data-slot": "avatar-image",
      className: cn("aspect-square size-full", className),
      ...props
    }
  );
}
function AvatarFallback({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AvatarPrimitive.Fallback,
    {
      "data-slot": "avatar-fallback",
      className: cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      ),
      ...props
    }
  );
}
function DropdownMenu({
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Root, { "data-slot": "dropdown-menu", ...props });
}
function DropdownMenuTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Trigger,
    {
      "data-slot": "dropdown-menu-trigger",
      ...props
    }
  );
}
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Content,
    {
      "data-slot": "dropdown-menu-content",
      sideOffset,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className
      ),
      ...props
    }
  ) });
}
function DropdownMenuGroup({
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Group, { "data-slot": "dropdown-menu-group", ...props });
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Item,
    {
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Label,
    {
      "data-slot": "dropdown-menu-label",
      "data-inset": inset,
      className: cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Separator,
    {
      "data-slot": "dropdown-menu-separator",
      className: cn("bg-border -mx-1 my-1 h-px", className),
      ...props
    }
  );
}
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive: "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        done: "bg-emerald-500 text-white"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "badge",
      className: cn(badgeVariants({ variant }), className),
      ...props
    }
  );
}
const russianMonths = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь"
];
const russianDaysShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const tajikMonths = [
  "Январ",
  "Феврал",
  "Март",
  "Апрел",
  "Май",
  "Июн",
  "Июл",
  "Август",
  "Сентябр",
  "Октябр",
  "Ноябр",
  "Декабр"
];
const tajikDaysShort = ["Дш", "Сш", "Чш", "Пш", "Ҷм", "Шн", "Як"];
function RussianCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  const { language } = useLanguage();
  const today = /* @__PURE__ */ new Date();
  const monthNames = language === "ru" ? russianMonths : tajikMonths;
  const dayNames = language === "ru" ? russianDaysShort : tajikDaysShort;
  const formatters = {
    formatCaption: (date) => {
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${month} ${year}`;
    },
    formatWeekdayName: (date) => {
      const dayIndex = (date.getDay() + 6) % 7;
      return dayNames[dayIndex];
    }
  };
  return /* @__PURE__ */ jsx(
    DayPicker,
    {
      locale: ru,
      showOutsideDays,
      className: cn("p-3", className),
      formatters,
      modifiers: {
        today
      },
      modifiersStyles: {
        today: {
          backgroundColor: "hsl(var(--accent))",
          color: "hsl(var(--accent-foreground))",
          fontWeight: "bold",
          border: "2px solid hsl(var(--primary))",
          borderRadius: "6px"
        }
      },
      classNames: {
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:rounded-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end: "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-bold border-2 border-primary",
        day_outside: "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames
      },
      ...props
    }
  );
}
function Checkbox({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    CheckboxPrimitive.Root,
    {
      "data-slot": "checkbox",
      className: cn(
        "peer border-gray-400 dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        CheckboxPrimitive.Indicator,
        {
          "data-slot": "checkbox-indicator",
          className: "flex items-center justify-center text-current transition-none",
          children: /* @__PURE__ */ jsx(CheckIcon, { className: "size-3.5" })
        }
      )
    }
  );
}
function Dialog({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Root, { "data-slot": "dialog", ...props });
}
function DialogTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Trigger, { "data-slot": "dialog-trigger", ...props });
}
function DialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Portal, { "data-slot": "dialog-portal", ...props });
}
function DialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Overlay,
    {
      "data-slot": "dialog-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      ),
      ...props
    }
  );
}
function DialogContent({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(DialogPortal, { "data-slot": "dialog-portal", children: [
    /* @__PURE__ */ jsx(DialogOverlay, {}),
    /* @__PURE__ */ jsxs(
      DialogPrimitive.Content,
      {
        "data-slot": "dialog-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        ),
        ...props,
        children: [
          children,
          /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", children: [
            /* @__PURE__ */ jsx(XIcon, {}),
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Закрыть" })
          ] })
        ]
      }
    )
  ] });
}
function DialogHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function DialogFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props
    }
  );
}
function DialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Title,
    {
      "data-slot": "dialog-title",
      className: cn("text-lg leading-none font-semibold", className),
      ...props
    }
  );
}
function DialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Description,
    {
      "data-slot": "dialog-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function Popover({
  ...props
}) {
  return /* @__PURE__ */ jsx(PopoverPrimitive.Root, { "data-slot": "popover", ...props });
}
function PopoverTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(PopoverPrimitive.Trigger, { "data-slot": "popover-trigger", ...props });
}
function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(
    PopoverPrimitive.Content,
    {
      "data-slot": "popover-content",
      align,
      sideOffset,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
        className
      ),
      ...props
    }
  ) });
}
function Select({
  ...props
}) {
  return /* @__PURE__ */ jsx(SelectPrimitive.Root, { "data-slot": "select", ...props });
}
function SelectValue({
  ...props
}) {
  return /* @__PURE__ */ jsx(SelectPrimitive.Value, { "data-slot": "select-value", ...props });
}
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    SelectPrimitive.Trigger,
    {
      "data-slot": "select-trigger",
      "data-size": size,
      className: cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDownIcon, { className: "size-4 opacity-50" }) })
      ]
    }
  );
}
function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}) {
  return /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
    SelectPrimitive.Content,
    {
      "data-slot": "select-content",
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      ),
      position,
      ...props,
      children: [
        /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
        /* @__PURE__ */ jsx(
          SelectPrimitive.Viewport,
          {
            className: cn(
              "p-1",
              position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
            ),
            children
          }
        ),
        /* @__PURE__ */ jsx(SelectScrollDownButton, {})
      ]
    }
  ) });
}
function SelectItem({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    SelectPrimitive.Item,
    {
      "data-slot": "select-item",
      className: cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx("span", { className: "absolute right-2 flex size-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, { className: "size-4" }) }) }),
        /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
      ]
    }
  );
}
function SelectScrollUpButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SelectPrimitive.ScrollUpButton,
    {
      "data-slot": "select-scroll-up-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(ChevronUpIcon, { className: "size-4" })
    }
  );
}
function SelectScrollDownButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SelectPrimitive.ScrollDownButton,
    {
      "data-slot": "select-scroll-down-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(ChevronDownIcon, { className: "size-4" })
    }
  );
}
function Textarea({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      "data-slot": "textarea",
      className: cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      ),
      ...props
    }
  );
}
const useCreateTaskMutation = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => postData(`/tasks`, data.taskData),
    onSuccess: async (data) => {
      await queryClient2.invalidateQueries({
        queryKey: ["my-tasks", "user"]
      });
      await queryClient2.invalidateQueries({
        queryKey: ["all-tasks"]
      });
      await queryClient2.invalidateQueries({
        queryKey: ["tasks-analytics"]
      });
      queryClient2.refetchQueries({
        queryKey: ["my-tasks", "user"],
        type: "active"
      });
      queryClient2.refetchQueries({
        queryKey: ["all-tasks"],
        type: "active"
      });
      queryClient2.refetchQueries({
        queryKey: ["tasks-analytics"],
        type: "active"
      });
    }
  });
};
const useUpdateTaskStatusMutation = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateData(`/tasks/${data.taskId}/status`, data),
    onSuccess: (data) => {
      queryClient2.invalidateQueries({ queryKey: ["task", data == null ? void 0 : data._id] });
      queryClient2.invalidateQueries({ queryKey: ["project", data == null ? void 0 : data.project] });
      queryClient2.invalidateQueries({
        queryKey: ["activities", data == null ? void 0 : data._id, 1]
      });
    }
  });
};
const useUpdateTaskTitleMutation = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateData(`/tasks/${data.taskId}/title`, data),
    onSuccess: (data) => {
      queryClient2.invalidateQueries({ queryKey: ["task", data == null ? void 0 : data._id] });
      queryClient2.invalidateQueries({
        queryKey: ["activities", data == null ? void 0 : data._id, 1]
      });
    }
  });
};
const useUpdateTaskDescriptionMutation = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateData(`/tasks/${data.taskId}/description`, data),
    onSuccess: (data) => {
      queryClient2.invalidateQueries({ queryKey: ["task", data == null ? void 0 : data._id] });
      queryClient2.invalidateQueries({
        queryKey: ["activities", data == null ? void 0 : data._id, 1]
      });
    }
  });
};
const useCreateCommentMutation = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => postData(`/tasks/${data.taskId}/comments`, data),
    onSuccess: (data) => {
      queryClient2.invalidateQueries({ queryKey: ["comments", data == null ? void 0 : data.task] });
      queryClient2.invalidateQueries({
        queryKey: ["activities", data == null ? void 0 : data.task, 1]
      });
    }
  });
};
const useToggleCommentReactionMutation = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => postData(`/tasks/${data.commentId}/reaction`, data),
    onSuccess: (data) => {
      queryClient2.invalidateQueries({ queryKey: ["comments", data == null ? void 0 : data.task] });
    }
  });
};
const useAddTaskAttachmentMutation = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => postData(`/tasks/${data.taskId}/attachments`, data.attachment),
    onSuccess: (data) => {
      queryClient2.invalidateQueries({ queryKey: ["task", data == null ? void 0 : data._id] });
      queryClient2.invalidateQueries({
        queryKey: ["activities", data == null ? void 0 : data._id, 1]
      });
    }
  });
};
const useGetTaskCommentsByIdQuery = (taskId) => {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => fetchData(`/tasks/${taskId}/comments`)
  });
};
const useGetMyTasksQuery = () => {
  return useQuery({
    queryKey: ["my-tasks", "user"],
    queryFn: () => fetchData("/tasks/my-tasks")
  });
};
const useGetAllTasksQuery = (enabled = true) => {
  return useQuery({
    queryKey: ["all-tasks"],
    queryFn: () => fetchData("/tasks/all-tasks"),
    enabled
  });
};
const useCreateResponseMutation = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => postData(`/tasks/${data.taskId}/responses`, data),
    onSuccess: (data) => {
      queryClient2.invalidateQueries({ queryKey: ["responses", data == null ? void 0 : data.task] });
      queryClient2.invalidateQueries({
        queryKey: ["activities", data == null ? void 0 : data.task, 1]
      });
    }
  });
};
const useGetTaskResponsesByIdQuery = (taskId) => {
  return useQuery({
    queryKey: ["responses", taskId],
    queryFn: () => fetchData(`/tasks/${taskId}/responses`),
    enabled: !!taskId
  });
};
const useGetCompletedTasksQuery = (params) => {
  const queryString = params ? new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== void 0 && value !== "").map(([key, value]) => [key, String(value)])
  ).toString() : "";
  return useQuery({
    queryKey: ["completed-tasks", params],
    queryFn: () => fetchData(`/tasks/completed${queryString ? `?${queryString}` : ""}`)
  });
};
const createTaskSchema = z$1.object({
  title: z$1.string().min(1, "Название обязательно"),
  description: z$1.string().optional(),
  status: z$1.enum(["To Do", "In Progress", "Done"]),
  priority: z$1.enum(["Low", "Medium", "High"]),
  dueDate: z$1.string().optional(),
  assignees: z$1.array(z$1.string()),
  responsibleManager: z$1.string().optional()
});
const CreateTaskDialog = ({
  open,
  onOpenChange,
  organizations
}) => {
  const { t } = useLanguage();
  const form = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "To Do",
      priority: "Medium",
      dueDate: "",
      assignees: []
    }
  });
  const [isMultiTask, setIsMultiTask] = useState(false);
  const [multipleTasks, setMultipleTasks] = useState([
    { description: "", dueDate: "" },
    { description: "", dueDate: "" }
  ]);
  const { data: usersData } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => fetchData("/users/all"),
    enabled: open
  });
  const { mutate, isPending } = useCreateTaskMutation();
  const allUsers = (usersData == null ? void 0 : usersData.users) || [];
  const onSubmit = async (data) => {
    if (isMultiTask) {
      if (multipleTasks.length < 2) {
        toast.error(t("tasks.min_tasks_required"));
        return;
      }
      if (multipleTasks.some((t2) => !t2.description.trim())) {
        toast.error("Все описания задач обязательны");
        return;
      }
      try {
        const apiUrl = "https://ptapi.oci.tj";
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/tasks/create-multiple`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title: data.title,
            tasks: multipleTasks,
            status: data.status,
            priority: data.priority,
            assignees: data.assignees,
            responsibleManager: data.responsibleManager
          })
        });
        const result = await response.json();
        if (result.tasks && Array.isArray(result.tasks) && result.tasks.length > 0) {
          toast.success(`Успешно создано ${result.tasks.length} задач`);
          onOpenChange(false);
          form.reset();
          setIsMultiTask(false);
          setMultipleTasks([
            { description: "", dueDate: "" },
            { description: "", dueDate: "" }
          ]);
        } else if (!response.ok) {
          throw new Error(result.message || "Ошибка создания мультизадач");
        }
      } catch (error) {
        console.error("Ошибка создания мультизадач:", error);
        toast.error(error.message || "Ошибка создания мультизадач");
      }
    } else {
      mutate(
        { taskData: data },
        {
          onSuccess: () => {
            toast.success("Задача успешно создана");
            onOpenChange(false);
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message || "Ошибка создания задачи");
          }
        }
      );
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[540px] max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: t("tasks.create_new_task") }) }),
    /* @__PURE__ */ jsx(Form, { ...form, children: /* @__PURE__ */ jsxs("form", { onSubmit: form.handleSubmit(onSubmit), children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 py-4", children: [
        /* @__PURE__ */ jsx(
          FormField,
          {
            control: form.control,
            name: "title",
            render: ({ field }) => /* @__PURE__ */ jsxs(FormItem, { children: [
              /* @__PURE__ */ jsx(FormLabel, { children: t("tasks.task_name") }),
              /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx(Input, { ...field, placeholder: t("tasks.enter_task_name") }) }),
              /* @__PURE__ */ jsx(FormMessage, {})
            ] })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 p-3 bg-muted/50 rounded-lg", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              id: "multi-task",
              checked: isMultiTask,
              onCheckedChange: (checked) => {
                setIsMultiTask(!!checked);
                if (checked && multipleTasks.length < 2) {
                  setMultipleTasks([
                    { description: "", dueDate: "" },
                    { description: "", dueDate: "" }
                  ]);
                }
              }
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsx(
              "label",
              {
                htmlFor: "multi-task",
                className: "text-sm font-medium leading-none cursor-pointer",
                children: t("tasks.multi_task")
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("tasks.multi_task_desc") })
          ] })
        ] }),
        !isMultiTask ? (
          // Обычный режим - одна задача
          /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              FormField,
              {
                control: form.control,
                name: "description",
                render: ({ field }) => /* @__PURE__ */ jsxs(FormItem, { children: [
                  /* @__PURE__ */ jsx(FormLabel, { children: t("tasks.task_desc") }),
                  /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx(
                    Textarea,
                    {
                      ...field,
                      placeholder: t("tasks.enter_task_desc")
                    }
                  ) }),
                  /* @__PURE__ */ jsx(FormMessage, {})
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              FormField,
              {
                control: form.control,
                name: "dueDate",
                render: ({ field }) => /* @__PURE__ */ jsxs(FormItem, { children: [
                  /* @__PURE__ */ jsx(FormLabel, { children: t("tasks.due_date") }),
                  /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs(Popover, { children: [
                    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
                      Button,
                      {
                        variant: "outline",
                        className: "w-full justify-start text-left font-normal " + (!field.value ? "text-muted-foreground" : ""),
                        children: [
                          /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }),
                          field.value ? format(new Date(field.value), "PPP", { locale: ru }) : /* @__PURE__ */ jsx("span", { children: t("tasks.select_date") })
                        ]
                      }
                    ) }),
                    /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", children: /* @__PURE__ */ jsx(
                      RussianCalendar,
                      {
                        mode: "single",
                        selected: field.value ? new Date(field.value) : void 0,
                        onSelect: (date) => field.onChange(
                          date ? date.toISOString() : void 0
                        ),
                        initialFocus: true
                      }
                    ) })
                  ] }) }),
                  /* @__PURE__ */ jsx(FormMessage, {})
                ] })
              }
            )
          ] })
        ) : (
          // Режим мультизадач
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            multipleTasks.map((task, index2) => /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold flex-1", children: t("tasks.task_number").replace("{number}", (index2 + 1).toString()) }),
                multipleTasks.length > 2 && /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    className: "shrink-0 -mt-1",
                    onClick: () => {
                      setMultipleTasks(multipleTasks.filter((_, i) => i !== index2));
                    },
                    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: t("tasks.task_desc") }),
                  /* @__PURE__ */ jsx(
                    Textarea,
                    {
                      value: task.description,
                      onChange: (e) => {
                        const newTasks = [...multipleTasks];
                        newTasks[index2].description = e.target.value;
                        setMultipleTasks(newTasks);
                      },
                      placeholder: t("tasks.enter_task_desc"),
                      className: "mt-1"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: t("tasks.due_date") }),
                  /* @__PURE__ */ jsxs(Popover, { children: [
                    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full justify-start mt-1", children: [
                      /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }),
                      task.dueDate ? format(new Date(task.dueDate), "PPP", { locale: ru }) : t("tasks.select_date")
                    ] }) }),
                    /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", children: /* @__PURE__ */ jsx(
                      RussianCalendar,
                      {
                        mode: "single",
                        selected: task.dueDate ? new Date(task.dueDate) : void 0,
                        onSelect: (date) => {
                          const newTasks = [...multipleTasks];
                          newTasks[index2].dueDate = date ? date.toISOString() : "";
                          setMultipleTasks(newTasks);
                        },
                        initialFocus: true
                      }
                    ) })
                  ] })
                ] })
              ] })
            ] }, index2)),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => {
                  setMultipleTasks([...multipleTasks, { description: "", dueDate: "" }]);
                },
                className: "w-full",
                children: [
                  "+ ",
                  t("tasks.add_task")
                ]
              }
            )
          ] })
        ),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsx(
            FormField,
            {
              control: form.control,
              name: "status",
              render: ({ field }) => /* @__PURE__ */ jsxs(FormItem, { children: [
                /* @__PURE__ */ jsx(FormLabel, { children: t("tasks.task_status") }),
                /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: field.value,
                    onValueChange: field.onChange,
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("tasks.select_status") }) }),
                      /* @__PURE__ */ jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsx(SelectItem, { value: "To Do", children: t("status.todo") }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "In Progress", children: t("status.in_progress") }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "Done", children: t("status.done") })
                      ] })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsx(FormMessage, {})
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            FormField,
            {
              control: form.control,
              name: "priority",
              render: ({ field }) => /* @__PURE__ */ jsxs(FormItem, { children: [
                /* @__PURE__ */ jsx(FormLabel, { children: t("tasks.task_priority") }),
                /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: field.value,
                    onValueChange: field.onChange,
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("tasks.select_priority") }) }),
                      /* @__PURE__ */ jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsx(SelectItem, { value: "Low", children: t("priority.low") }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "Medium", children: t("priority.medium") }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "High", children: t("priority.high") })
                      ] })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsx(FormMessage, {})
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          FormField,
          {
            control: form.control,
            name: "responsibleManager",
            render: ({ field }) => {
              const managers = allUsers.filter((user) => user && ["admin", "manager", "super_admin"].includes(user.role));
              return /* @__PURE__ */ jsxs(FormItem, { children: [
                /* @__PURE__ */ jsx(FormLabel, { children: t("tasks.task_manager") }),
                /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: field.value || "none",
                    onValueChange: (value) => {
                      field.onChange(value === "none" ? void 0 : value);
                    },
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("tasks.select_manager") }) }),
                      /* @__PURE__ */ jsxs(SelectContent, { className: "max-h-60 overflow-y-auto", children: [
                        /* @__PURE__ */ jsx(SelectItem, { value: "none", children: t("tasks.not_assigned") }),
                        managers.filter((m) => m._id).map((manager) => /* @__PURE__ */ jsxs(SelectItem, { value: manager._id || "", children: [
                          manager.name,
                          " (",
                          manager.role === "admin" ? t("tasks.admin") : manager.role === "super_admin" ? "Супер админ" : t("tasks.manager"),
                          ")"
                        ] }, manager._id))
                      ] })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsx(FormMessage, {})
              ] });
            }
          }
        ),
        /* @__PURE__ */ jsx(
          FormField,
          {
            control: form.control,
            name: "assignees",
            render: ({ field }) => {
              const selectedMembers = field.value || [];
              return /* @__PURE__ */ jsxs(FormItem, { children: [
                /* @__PURE__ */ jsx(FormLabel, { children: t("tasks.assign_to") }),
                /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs(Popover, { children: [
                  /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "outline",
                      className: "w-full justify-start text-left font-normal min-h-11",
                      children: selectedMembers.length === 0 ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("tasks.select_members") }) : selectedMembers.length <= 2 ? selectedMembers.map((m) => {
                        const user = allUsers.find(
                          (u) => u && u._id === m
                        );
                        return (user == null ? void 0 : user.name) || "Неизвестный";
                      }).join(", ") : t("tasks.selected_count").replace("{count}", selectedMembers.length.toString())
                    }
                  ) }),
                  /* @__PURE__ */ jsx(
                    PopoverContent,
                    {
                      className: "w-sm max-h-60 overflow-y-auto p-2",
                      align: "start",
                      children: /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: allUsers.filter((user) => user && user._id).map((user) => {
                        const isSelected = selectedMembers.includes(user._id);
                        return /* @__PURE__ */ jsxs(
                          "div",
                          {
                            className: "flex items-center gap-2 p-2 border rounded",
                            children: [
                              /* @__PURE__ */ jsx(
                                Checkbox,
                                {
                                  checked: isSelected,
                                  onCheckedChange: (checked) => {
                                    if (checked) {
                                      field.onChange([
                                        ...selectedMembers,
                                        user._id
                                      ]);
                                    } else {
                                      field.onChange(
                                        selectedMembers.filter(
                                          (m) => m !== user._id
                                        )
                                      );
                                    }
                                  },
                                  id: `user-${user._id}`
                                }
                              ),
                              /* @__PURE__ */ jsx("span", { className: "truncate flex-1", children: user.name }),
                              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: user.role === "admin" ? t("tasks.admin") : user.role === "manager" ? t("tasks.manager") : t("tasks.member") })
                            ]
                          },
                          user._id
                        );
                      }) })
                    }
                  )
                ] }) }),
                /* @__PURE__ */ jsx(FormMessage, {})
              ] });
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => onOpenChange(false),
            children: t("tasks.cancel")
          }
        ),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isPending, children: isPending ? t("tasks.creating") : t("tasks.create") })
      ] })
    ] }) })
  ] }) });
};
const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const languages = [
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "tj", name: "Тоҷикӣ", flag: "🇹🇯" }
  ];
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: [
      /* @__PURE__ */ jsx(Languages, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Переключить язык" })
    ] }) }),
    /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", className: "w-40", children: languages.map((lang) => /* @__PURE__ */ jsxs(
      DropdownMenuItem,
      {
        onClick: () => setLanguage(lang.code),
        className: "flex items-center justify-between cursor-pointer",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { children: lang.flag }),
            /* @__PURE__ */ jsx("span", { children: lang.name })
          ] }),
          language === lang.code && /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" })
        ]
      },
      lang.code
    )) })
  ] });
};
const Header = ({
  onOrganizationSelect,
  selectedOrganization,
  onCreateOrganization
}) => {
  var _a;
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const { organizations, unreadNotificationsCount } = useLoaderData();
  const canCreateTasks = (user == null ? void 0 : user.role) && ["admin", "manager", "super_admin"].includes(user.role);
  return /* @__PURE__ */ jsxs("header", { className: "bg-background sticky top-0 z-40 border-b", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 py-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold", children: t("app.name") }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(LanguageSwitcher, {}),
        canCreateTasks && /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => setIsCreateTaskOpen(true),
            className: "p-2",
            children: /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            className: "relative",
            onClick: () => navigate("/user/notifications"),
            children: [
              /* @__PURE__ */ jsx(Bell, { className: "w-4 h-4" }),
              unreadNotificationsCount > 0 && /* @__PURE__ */ jsx("div", { className: "absolute -top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-xs", children: unreadNotificationsCount }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx("button", { className: "rounded-full border p-1", children: /* @__PURE__ */ jsxs(Avatar, { className: "h-8 w-8", children: [
            /* @__PURE__ */ jsx(
              AvatarImage,
              {
                src: (user == null ? void 0 : user.profilePicture) || void 0,
                alt: (user == null ? void 0 : user.name) || "User"
              }
            ),
            /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-primary text-primary-foreground", children: ((_a = user == null ? void 0 : user.name) == null ? void 0 : _a.charAt(0)) || "U" })
          ] }) }) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
            /* @__PURE__ */ jsx(DropdownMenuLabel, { children: t("nav.profile") }),
            /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
            /* @__PURE__ */ jsx(DropdownMenuItem, { children: /* @__PURE__ */ jsx(Link, { to: "/user/profile", children: t("nav.profile") }) }),
            /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
            /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => {
              logout();
              navigate("/");
            }, children: t("nav.logout") })
          ] })
        ] })
      ] })
    ] }),
    canCreateTasks && /* @__PURE__ */ jsx(
      CreateTaskDialog,
      {
        open: isCreateTaskOpen,
        onOpenChange: setIsCreateTaskOpen,
        organizations: []
      }
    )
  ] });
};
function ScrollArea({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    ScrollAreaPrimitive.Root,
    {
      "data-slot": "scroll-area",
      className: cn("relative", className),
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          ScrollAreaPrimitive.Viewport,
          {
            "data-slot": "scroll-area-viewport",
            className: "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
            children
          }
        ),
        /* @__PURE__ */ jsx(ScrollBar, {}),
        /* @__PURE__ */ jsx(ScrollAreaPrimitive.Corner, {})
      ]
    }
  );
}
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    ScrollAreaPrimitive.ScrollAreaScrollbar,
    {
      "data-slot": "scroll-area-scrollbar",
      orientation,
      className: cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        ScrollAreaPrimitive.ScrollAreaThumb,
        {
          "data-slot": "scroll-area-thumb",
          className: "bg-border relative flex-1 rounded-full"
        }
      )
    }
  );
}
const SidebarNav = ({
  className,
  items,
  isCollapsed,
  userRole,
  ...props
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const filteredItems = items.filter((item) => {
    if (!item.requiresRole) return true;
    return userRole && item.requiresRole.includes(userRole);
  });
  return /* @__PURE__ */ jsx("nav", { className: cn("flex flex-col space-y-2", className), ...props, children: filteredItems.map((item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    const handleClick = () => {
      navigate(item.href);
    };
    return /* @__PURE__ */ jsxs(
      Button,
      {
        variant: isActive ? "outline" : "ghost",
        className: cn(
          "justify-start",
          isActive && "bg-blue-800/20 text-blue-600 font-medium"
        ),
        onClick: handleClick,
        children: [
          Icon && /* @__PURE__ */ jsx(Icon, { className: "mr-2 h-4 w-4" }),
          isCollapsed ? /* @__PURE__ */ jsx("span", { className: "sr-only", children: item.title }) : item.title
        ]
      },
      item.href
    );
  }) });
};
const SidebarComponent = ({
  className
}) => {
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const getNavItems = () => {
    if ((user == null ? void 0 : user.role) === "super_admin") {
      return [
        {
          title: t("nav.important_tasks"),
          href: "/dashboard/important-tasks",
          icon: Star
        },
        {
          title: t("nav.all_tasks"),
          href: "/dashboard/all-tasks",
          icon: ClipboardList
        },
        {
          title: t("nav.analytics"),
          href: "/dashboard/analytics",
          icon: BarChart3
        },
        {
          title: t("nav.members"),
          href: "/dashboard/members",
          icon: Users
        },
        {
          title: t("nav.completed_tasks"),
          href: "/dashboard/achieved",
          icon: CheckCircle2
        }
      ];
    }
    return [
      {
        title: t("nav.dashboard"),
        href: "/dashboard",
        icon: LayoutDashboard
      },
      {
        title: t("nav.my_tasks"),
        href: "/dashboard/my-tasks",
        icon: ListCheck
      },
      {
        title: t("nav.all_tasks"),
        href: "/dashboard/all-tasks",
        icon: ClipboardList,
        requiresRole: ["admin", "manager", "super_admin"]
      },
      {
        title: t("nav.manager_tasks"),
        href: "/dashboard/manager-tasks",
        icon: UserCheck,
        requiresRole: ["admin", "manager", "super_admin"]
      },
      {
        title: t("nav.important_tasks"),
        href: "/dashboard/important-tasks",
        icon: Star,
        requiresRole: ["super_admin"]
      },
      {
        title: t("nav.analytics"),
        href: "/dashboard/analytics",
        icon: BarChart3,
        requiresRole: ["admin", "manager", "super_admin"]
      },
      {
        title: t("nav.members"),
        href: "/dashboard/members",
        icon: Users,
        requiresRole: ["admin", "manager", "super_admin"]
      },
      {
        title: t("nav.completed_tasks"),
        href: "/dashboard/achieved",
        icon: CheckCircle2
      },
      {
        title: t("nav.settings"),
        href: "/dashboard/settings",
        icon: Settings
      }
    ];
  };
  const navItems = getNavItems();
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16 md:w-[80px]" : "w-16 md:w-[240px]",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex h-14 items-center border-b px-4 mb-4", children: [
          /* @__PURE__ */ jsxs(Link, { to: "/dashboard", className: "flex items-center", children: [
            !isCollapsed && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Wrench, { className: "size-6 text-blue-600" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-lg hidden md:block", children: "Vazifa" })
            ] }),
            isCollapsed && /* @__PURE__ */ jsx(Wrench, { className: "size-6 text-blue-600" })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "ml-auto hidden md:block",
              onClick: () => setIsCollapsed(!isCollapsed),
              children: isCollapsed ? /* @__PURE__ */ jsx(ChevronsRight, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronsLeft, { className: "h-4 w-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 px-3 py-2", children: /* @__PURE__ */ jsx(
          SidebarNav,
          {
            items: navItems,
            isCollapsed,
            className: cn(isCollapsed && "items-center space-y-2"),
            userRole: user == null ? void 0 : user.role
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "border-t p-4 flex flex-col gap-2", children: [
          /* @__PURE__ */ jsx(Link, { to: "/user/profile", children: /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: isCollapsed ? "icon" : "default",
              className: "justify-start w-full",
              children: [
                /* @__PURE__ */ jsx(User, { className: cn("h-4 w-4", isCollapsed ? "" : "mr-2") }),
                /* @__PURE__ */ jsx("span", { className: "hidden md:block", children: !isCollapsed && t("nav.profile") })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: isCollapsed ? "icon" : "default",
              className: "justify-start",
              onClick: () => {
                logout();
                navigate("/");
              },
              children: [
                /* @__PURE__ */ jsx(LogOut, { className: cn("h-4 w-4", isCollapsed ? "" : "mr-2") }),
                /* @__PURE__ */ jsx("span", { className: "hidden md:block", children: !isCollapsed && t("nav.logout") })
              ]
            }
          )
        ] })
      ]
    }
  );
};
function Drawer({
  ...props
}) {
  return /* @__PURE__ */ jsx(Drawer$1.Root, { "data-slot": "drawer", ...props });
}
function DrawerPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(Drawer$1.Portal, { "data-slot": "drawer-portal", ...props });
}
function DrawerOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Drawer$1.Overlay,
    {
      "data-slot": "drawer-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      ),
      ...props
    }
  );
}
function DrawerContent({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(DrawerPortal, { "data-slot": "drawer-portal", children: [
    /* @__PURE__ */ jsx(DrawerOverlay, {}),
    /* @__PURE__ */ jsxs(
      Drawer$1.Content,
      {
        "data-slot": "drawer-content",
        className: cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className
        ),
        ...props,
        children: [
          /* @__PURE__ */ jsx("div", { className: "bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" }),
          children
        ]
      }
    )
  ] });
}
function DrawerHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "drawer-header",
      className: cn("flex flex-col gap-1.5 p-4", className),
      ...props
    }
  );
}
function DrawerTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Drawer$1.Title,
    {
      "data-slot": "drawer-title",
      className: cn("text-foreground font-semibold", className),
      ...props
    }
  );
}
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(void 0);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}
const ResponsiveDialog = ({
  open,
  onOpenChange,
  title,
  children
}) => {
  const isMobile = useIsMobile();
  if (!isMobile) {
    return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, modal: true, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-h-[80vh] overflow-y-auto hide-scrollbar", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: title }) }),
      children
    ] }) });
  }
  return /* @__PURE__ */ jsx(Drawer, { open, onOpenChange, modal: false, children: /* @__PURE__ */ jsxs(DrawerContent, { className: "px-2 py-6 max-h-[90vh]", children: [
    /* @__PURE__ */ jsx(DrawerHeader, { className: "px-4", children: /* @__PURE__ */ jsx(DrawerTitle, { className: "text-left", children: title }) }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "h-full overflow-y-auto hide-scrollbar", children })
  ] }) });
};
const queryKey$1 = ["workspaces"];
const useCreateWorkspaceMutation = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => postData("/workspaces", data),
    onSuccess: () => {
      queryClient2.invalidateQueries({ queryKey: queryKey$1 });
    }
  });
};
const colorOptions = [
  "#FF5733",
  // Red-Orange
  "#33C1FF",
  // Blue
  "#28A745",
  // Green
  "#FFC300",
  // Yellow
  "#8E44AD",
  // Purple
  "#E67E22",
  // Orange
  "#2ECC71",
  // Light Green
  "#34495E"
  // Navy
];
const CreateWorkspace = ({
  isCreateWorkspaceOpen,
  setIsCreateWorkspaceOpen
}) => {
  const form = useForm({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      color: colorOptions[0]
      // Default to first color
    }
  });
  const reValidator = useRevalidator();
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateWorkspaceMutation();
  const onSubmit = (values) => {
    mutate(values, {
      onSuccess: (data) => {
        reValidator.revalidate();
        toast.success("Рабочая область успешно создана");
        form.reset();
        setIsCreateWorkspaceOpen(false);
        navigate("/dashboard");
      },
      onError: () => {
        toast.error("Failed to create workspace");
      }
    });
  };
  return /* @__PURE__ */ jsx(
    ResponsiveDialog,
    {
      open: isCreateWorkspaceOpen,
      onOpenChange: setIsCreateWorkspaceOpen,
      title: "Создать новое рабочее пространство",
      children: /* @__PURE__ */ jsx(Form, { ...form, children: /* @__PURE__ */ jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "px-4 md:px-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 py-4", children: [
          /* @__PURE__ */ jsx(
            FormField,
            {
              control: form.control,
              name: "name",
              render: ({ field }) => /* @__PURE__ */ jsxs(FormItem, { children: [
                /* @__PURE__ */ jsx(FormLabel, { children: "Имя рабочей области" }),
                /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx(Input, { ...field, placeholder: "Название рабочего пространства" }) }),
                /* @__PURE__ */ jsx(FormMessage, {})
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            FormField,
            {
              control: form.control,
              name: "description",
              render: ({ field }) => /* @__PURE__ */ jsxs(FormItem, { children: [
                /* @__PURE__ */ jsx(FormLabel, { children: "Описание рабочей области" }),
                /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    ...field,
                    placeholder: "Описание рабочего пространства (необязательно)"
                  }
                ) }),
                /* @__PURE__ */ jsx(FormMessage, {})
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            FormField,
            {
              control: form.control,
              name: "color",
              render: ({ field }) => /* @__PURE__ */ jsxs(FormItem, { children: [
                /* @__PURE__ */ jsx(FormLabel, { children: "Цвет рабочей области" }),
                /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-wrap", children: colorOptions.map((color) => /* @__PURE__ */ jsxs(
                  "label",
                  {
                    className: "flex items-center cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "radio",
                          value: color,
                          checked: field.value === color,
                          onChange: () => field.onChange(color),
                          className: "hidden"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: `w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:shadow-lg ${field.value === color ? "ring-2 ring-offset-2 ring-blue-500 border-blue-500" : ""}`,
                          style: { backgroundColor: color },
                          children: field.value === color && /* @__PURE__ */ jsx("span", { className: "w-3 h-3 bg-white rounded-full block" })
                        }
                      )
                    ]
                  },
                  color
                )) }) }),
                /* @__PURE__ */ jsx(FormMessage, {})
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(DialogFooter, { className: "mt-6 md:mt-0", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              disabled: isPending,
              variant: "outline",
              onClick: () => setIsCreateWorkspaceOpen(false),
              children: "Отмена"
            }
          ),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isPending, children: isPending ? "Создание..." : "Создать" })
        ] })
      ] }) })
    }
  );
};
const AdminChatWidget = ({ className }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  if (!user || !user._id || !user.role || !["admin", "super_admin"].includes(user.role)) {
    return null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineAdmins, setOnlineAdmins] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    var _a;
    (_a = messagesEndRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      fetchOnlineAdmins();
      scrollToBottom();
    }
  }, [isOpen]);
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 3e4);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (isOpen) {
      const messageInterval = setInterval(() => {
        fetchMessages();
        fetchOnlineAdmins();
      }, 3e3);
      return () => clearInterval(messageInterval);
    }
  }, [isOpen]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const fetchMessages = async () => {
    try {
      const response = await fetch("/api-v1/admin-messages", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        console.warn(`Failed to fetch messages: HTTP ${response.status}`);
        return;
      }
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.warn("Error fetching messages:", error);
    }
  };
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api-v1/admin-messages/unread-count", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        console.warn(`Failed to fetch unread count: HTTP ${response.status}`);
        return;
      }
      const data = await response.json();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.warn("Error fetching unread count:", error);
    }
  };
  const fetchOnlineAdmins = async () => {
    try {
      const response = await fetch("/api-v1/admin-messages/online-admins", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        console.warn(`Failed to fetch online admins: HTTP ${response.status}`);
        return;
      }
      const data = await response.json();
      setOnlineAdmins(data.admins);
    } catch (error) {
      console.warn("Error fetching online admins:", error);
    }
  };
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsLoading(true);
    try {
      if (replyTo) {
        await postData(`/admin-messages/${replyTo._id}/reply`, {
          message: newMessage,
          priority: "normal",
          language: "ru"
        });
        setNewMessage("");
        setReplyTo(null);
        fetchMessages();
      } else {
        const messageData = {
          message: newMessage,
          messageType: selectedRecipient ? "direct" : "broadcast",
          recipient: selectedRecipient,
          priority: "normal",
          language: "ru"
        };
        await postData("/admin-messages", messageData);
        setNewMessage("");
        fetchMessages();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const markAsRead = async (messageId) => {
    try {
      await updateData(`/admin-messages/${messageId}/read`, {});
      fetchMessages();
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };
  const addReaction = async (messageId, emoji) => {
    try {
      await postData(`/admin-messages/${messageId}/reaction`, { emoji });
      fetchMessages();
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "normal":
        return "bg-blue-500";
      case "low":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };
  const getInitials = (name) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };
  return /* @__PURE__ */ jsxs("div", { className: cn("fixed bottom-4 right-4 z-50", className), children: [
    !isOpen && /* @__PURE__ */ jsxs(
      Button,
      {
        onClick: () => setIsOpen(true),
        className: "relative h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg",
        children: [
          /* @__PURE__ */ jsx(MessageCircle, { className: "h-5 w-5 sm:h-6 sm:w-6 text-white" }),
          unreadCount > 0 && /* @__PURE__ */ jsx(Badge, { className: "absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-red-500 text-xs text-white p-0 flex items-center justify-center", children: unreadCount > 99 ? "99+" : unreadCount })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxs(Card, { className: "w-[calc(100vw-2rem)] max-w-96 h-[calc(100vh-2rem)] max-h-[600px] shadow-2xl", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-lg font-semibold", children: "Админ чат" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => setIsOpen(false),
            children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "p-0 flex flex-col h-[calc(600px-80px)]", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-3 border-b", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium mb-2", children: "Онлайн админы" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 overflow-x-auto", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: selectedRecipient === null ? "default" : "outline",
                size: "sm",
                onClick: () => setSelectedRecipient(null),
                children: "Всем"
              }
            ),
            onlineAdmins.filter((admin) => admin._id !== (user == null ? void 0 : user._id)).map((admin) => /* @__PURE__ */ jsxs(
              Button,
              {
                variant: selectedRecipient === admin._id ? "default" : "outline",
                size: "sm",
                onClick: () => setSelectedRecipient(admin._id),
                className: "flex items-center gap-1 whitespace-nowrap",
                children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: cn(
                        "w-2 h-2 rounded-full",
                        admin.isOnline ? "bg-green-500" : "bg-gray-400"
                      )
                    }
                  ),
                  admin.name
                ]
              },
              admin._id
            ))
          ] })
        ] }),
        /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 p-3", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          messages.map((message) => {
            const isOwnMessage = message.sender._id === (user == null ? void 0 : user._id);
            const shouldMarkAsRead = !isOwnMessage && !message.isRead;
            if (shouldMarkAsRead) {
              markAsRead(message._id);
            }
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn(
                  "flex gap-2",
                  isOwnMessage ? "justify-end" : "justify-start"
                ),
                children: [
                  !isOwnMessage && /* @__PURE__ */ jsxs(Avatar, { className: "h-8 w-8", children: [
                    /* @__PURE__ */ jsx(AvatarImage, { src: message.sender.profilePicture }),
                    /* @__PURE__ */ jsx(AvatarFallback, { className: "text-xs", children: getInitials(message.sender.name) })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: cn(
                        "max-w-[70%] space-y-1",
                        isOwnMessage ? "items-end" : "items-start"
                      ),
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500", children: [
                          !isOwnMessage && /* @__PURE__ */ jsx("span", { className: "font-medium", children: message.sender.name }),
                          /* @__PURE__ */ jsx(
                            Badge,
                            {
                              variant: "secondary",
                              className: "text-xs px-1 py-0",
                              children: message.sender.role === "super_admin" ? "Супер админ" : "Админ"
                            }
                          ),
                          /* @__PURE__ */ jsx("span", { children: formatTime(message.createdAt) })
                        ] }),
                        message.replyTo && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 bg-gray-100 p-2 rounded border-l-2 border-blue-500", children: [
                          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                            message.replyTo.sender.name,
                            ":"
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "truncate", children: message.replyTo.message })
                        ] }),
                        /* @__PURE__ */ jsxs(
                          "div",
                          {
                            className: cn(
                              "rounded-lg px-3 py-2 text-sm relative group",
                              isOwnMessage ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                            ),
                            children: [
                              message.priority !== "normal" && /* @__PURE__ */ jsx(
                                "div",
                                {
                                  className: cn(
                                    "absolute -top-1 -left-1 w-3 h-3 rounded-full",
                                    getPriorityColor(message.priority)
                                  )
                                }
                              ),
                              /* @__PURE__ */ jsx("div", { className: "break-words", children: message.message }),
                              message.isEdited && /* @__PURE__ */ jsx("div", { className: "text-xs opacity-70 mt-1", children: "изменено" }),
                              /* @__PURE__ */ jsxs("div", { className: "absolute -top-8 right-0 hidden group-hover:flex bg-white border rounded shadow-sm", children: [
                                /* @__PURE__ */ jsx(
                                  Button,
                                  {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "h-6 w-6 p-0",
                                    onClick: () => setReplyTo(message),
                                    children: "↩️"
                                  }
                                ),
                                /* @__PURE__ */ jsx(
                                  Button,
                                  {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "h-6 w-6 p-0",
                                    onClick: () => addReaction(message._id, "👍"),
                                    children: "👍"
                                  }
                                ),
                                /* @__PURE__ */ jsx(
                                  Button,
                                  {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "h-6 w-6 p-0",
                                    onClick: () => addReaction(message._id, "❤️"),
                                    children: "❤️"
                                  }
                                )
                              ] })
                            ]
                          }
                        ),
                        message.reactions.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: message.reactions.map((reaction, index2) => /* @__PURE__ */ jsx(
                          Badge,
                          {
                            variant: "secondary",
                            className: "text-xs px-1 py-0 cursor-pointer",
                            onClick: () => addReaction(message._id, reaction.emoji),
                            children: reaction.emoji
                          },
                          index2
                        )) }),
                        message.messageType === "broadcast" && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: "Всем" })
                      ]
                    }
                  ),
                  isOwnMessage && /* @__PURE__ */ jsxs(Avatar, { className: "h-8 w-8", children: [
                    /* @__PURE__ */ jsx(AvatarImage, { src: message.sender.profilePicture }),
                    /* @__PURE__ */ jsx(AvatarFallback, { className: "text-xs", children: getInitials(message.sender.name) })
                  ] })
                ]
              },
              message._id
            );
          }),
          /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
        ] }) }),
        replyTo && /* @__PURE__ */ jsxs("div", { className: "p-2 bg-blue-50 border-t flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
              "Отвечаете ",
              replyTo.sender.name,
              ":"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-gray-600 truncate", children: replyTo.message })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => setReplyTo(null),
              children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-3 border-t", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: newMessage,
              onChange: (e) => setNewMessage(e.target.value),
              placeholder: selectedRecipient ? "Напишите личное сообщение..." : "Напишите сообщение всем...",
              className: "min-h-[40px] max-h-[120px] resize-none",
              onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1", children: /* @__PURE__ */ jsx(
            Button,
            {
              size: "sm",
              onClick: sendMessage,
              disabled: !newMessage.trim() || isLoading,
              className: "h-10 w-10 p-0",
              children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" })
            }
          ) })
        ] }) })
      ] })
    ] })
  ] });
};
const clientLoader = async () => {
  try {
    const [unreadNotificationsCount, myTasks2] = await Promise.all([fetchData("/users/notifications/unread-count"), fetchData("/tasks/my-tasks")]);
    return {
      organizations: [],
      unreadNotificationsCount,
      myTasks: myTasks2
    };
  } catch (error) {
    console.error("Dashboard loader error:", error);
    return {
      organizations: [],
      unreadNotificationsCount: 0,
      myTasks: []
    };
  }
};
const DashboardLayout = () => {
  const {
    isAuthenticated,
    isLoading
  } = useAuth();
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const {
    organizations
  } = useLoaderData();
  const [currentOrganization, setCurrentOrganization] = useState(null);
  useEffect(() => {
    if (!currentOrganization && organizations && organizations.length > 0) {
      setCurrentOrganization(organizations[0]);
    }
  }, [currentOrganization, organizations]);
  if (isLoading) return /* @__PURE__ */ jsx(Loader, {
    message: "Loading..."
  });
  if (!isAuthenticated) return /* @__PURE__ */ jsx(Navigate, {
    to: "/",
    replace: true
  });
  const handleOrganizationSelect = (organization) => {
    setCurrentOrganization(organization);
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "flex h-screen w-full overflow-hidden",
    children: [/* @__PURE__ */ jsx(SidebarComponent, {
      className: "flex-shrink-0"
    }), /* @__PURE__ */ jsxs("div", {
      className: "flex-1 flex flex-col h-screen min-w-0",
      children: [/* @__PURE__ */ jsx(Header, {
        onOrganizationSelect: handleOrganizationSelect,
        selectedOrganization: currentOrganization,
        onCreateOrganization: () => setIsCreateWorkspaceOpen(true)
      }), /* @__PURE__ */ jsx("main", {
        className: "flex-1 overflow-y-auto min-h-0",
        children: /* @__PURE__ */ jsx("div", {
          className: "container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-4 lg:py-6 xl:py-8 w-full",
          children: /* @__PURE__ */ jsx(Outlet, {})
        })
      })]
    }), /* @__PURE__ */ jsx(CreateWorkspace, {
      isCreateWorkspaceOpen,
      setIsCreateWorkspaceOpen
    }), /* @__PURE__ */ jsx(AdminChatWidget, {})]
  });
};
const dashboardLayout = withComponentProps(DashboardLayout);
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clientLoader,
  default: dashboardLayout
}, Symbol.toStringTag, { value: "Module" }));
const formatDateRussian = (date, formatType = "medium") => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return "Неверная дата";
  }
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  switch (formatType) {
    case "short":
      return `${day}.${month}`;
    case "medium":
      return `${day}.${month}.${year}`;
    case "long":
      return `${day}.${month}.${year}`;
    case "full":
      return `${day}.${month}.${year}`;
    default:
      return `${day}.${month}.${year}`;
  }
};
const formatDueDateRussian = (date) => {
  return formatDateRussian(date, "short");
};
const formatDateDetailedRussian = (date) => {
  return formatDateRussian(date, "full");
};
const getRelativeTimeRussian = (date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1e3 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1e3 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1e3 * 60));
  if (diffInDays > 0) {
    if (diffInDays === 1) return "вчера";
    if (diffInDays < 7) return `${diffInDays} дня назад`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} недели назад`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} месяца назад`;
    return `${Math.floor(diffInDays / 365)} года назад`;
  }
  if (diffInHours > 0) {
    if (diffInHours === 1) return "час назад";
    return `${diffInHours} часа назад`;
  }
  if (diffInMinutes > 0) {
    if (diffInMinutes === 1) return "минуту назад";
    return `${diffInMinutes} минут назад`;
  }
  return "только что";
};
const getRelativeTimeTajik = (date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1e3 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1e3 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1e3 * 60));
  if (diffInDays > 0) {
    if (diffInDays === 1) return "дирӯз";
    if (diffInDays < 7) return `${diffInDays} рӯз пеш`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} ҳафта пеш`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} моҳ пеш`;
    return `${Math.floor(diffInDays / 365)} сол пеш`;
  }
  if (diffInHours > 0) {
    if (diffInHours === 1) return "як соат пеш";
    return `${diffInHours} соат пеш`;
  }
  if (diffInMinutes > 0) {
    if (diffInMinutes === 1) return "як дақиқа пеш";
    return `${diffInMinutes} дақиқа пеш`;
  }
  return "ҳозир";
};
function meta$b({}) {
  return [{
    title: "Vazifa | Панель управления"
  }, {
    name: "description",
    content: "Панель управления Vazifa!"
  }];
}
const DashboardPage = () => {
  const {
    user
  } = useAuth();
  const {
    t
  } = useLanguage();
  const navigate = useNavigate();
  const {
    data: myTasks2,
    isPending: myTasksLoading
  } = useGetMyTasksQuery();
  const {
    data: allTasks2,
    isPending: allTasksLoading
  } = useQuery({
    queryKey: ["all-tasks-dashboard"],
    queryFn: () => fetchData("/tasks/all-tasks"),
    enabled: (user == null ? void 0 : user.role) && ["admin", "manager"].includes(user.role)
  });
  const isAdmin = (user == null ? void 0 : user.role) && ["admin", "manager"].includes(user.role);
  const tasksLoading = isAdmin ? allTasksLoading : myTasksLoading;
  const handleCardClick = (filter) => {
    if (isAdmin) {
      navigate(`/dashboard/all-tasks?status=${filter}`);
    } else {
      navigate(`/dashboard/my-tasks?filter=${filter}`);
    }
  };
  const handleOverdueClick = () => {
    if (isAdmin) {
      navigate(`/dashboard/all-tasks`);
    } else {
      navigate(`/dashboard/my-tasks?filter=all`);
    }
  };
  if (tasksLoading) {
    return /* @__PURE__ */ jsx(Loader, {
      message: t("common.loading_data")
    });
  }
  let tasks = [];
  if (isAdmin) {
    tasks = Array.isArray(allTasks2) ? allTasks2 : allTasks2 && allTasks2.tasks && Array.isArray(allTasks2.tasks) ? allTasks2.tasks : [];
  } else {
    tasks = Array.isArray(myTasks2) ? myTasks2 : [];
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-8 2xl:space-y-12",
    children: [/* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-between",
      children: /* @__PURE__ */ jsx("h2", {
        className: "text-3xl font-bold",
        children: t("nav.dashboard")
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "grid gap-6 md:grid-cols-2 lg:grid-cols-4",
      children: [/* @__PURE__ */ jsxs("div", {
        onClick: () => handleCardClick("all"),
        className: "rounded-lg border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:shadow-lg hover:border-primary transition-all",
        children: [/* @__PURE__ */ jsx("div", {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: /* @__PURE__ */ jsx("h3", {
            className: "tracking-tight text-sm font-medium",
            children: t("dashboard.total_tasks")
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "text-2xl font-bold",
          children: tasks.length
        })]
      }), /* @__PURE__ */ jsxs("div", {
        onClick: () => handleCardClick("In Progress"),
        className: "rounded-lg border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:shadow-lg hover:border-primary transition-all",
        children: [/* @__PURE__ */ jsx("div", {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: /* @__PURE__ */ jsx("h3", {
            className: "tracking-tight text-sm font-medium",
            children: t("dashboard.in_progress")
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "text-2xl font-bold",
          children: tasks.filter((task) => task.status === "In Progress").length
        })]
      }), /* @__PURE__ */ jsxs("div", {
        onClick: () => handleCardClick("Done"),
        className: "rounded-lg border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:shadow-lg hover:border-primary transition-all",
        children: [/* @__PURE__ */ jsx("div", {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: /* @__PURE__ */ jsx("h3", {
            className: "tracking-tight text-sm font-medium",
            children: t("dashboard.completed")
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "text-2xl font-bold",
          children: tasks.filter((task) => task.status === "Done").length
        })]
      }), /* @__PURE__ */ jsxs("div", {
        onClick: handleOverdueClick,
        className: "rounded-lg border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:shadow-lg hover:border-red-500 transition-all",
        children: [/* @__PURE__ */ jsx("div", {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: /* @__PURE__ */ jsx("h3", {
            className: "tracking-tight text-sm font-medium",
            children: t("dashboard.overdue")
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "text-2xl font-bold text-red-600",
          children: tasks.filter((task) => task.dueDate && new Date(task.dueDate) < /* @__PURE__ */ new Date() && task.status !== "Done").length
        })]
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "rounded-lg border bg-card text-card-foreground shadow-sm",
      children: /* @__PURE__ */ jsxs("div", {
        className: "p-6",
        children: [/* @__PURE__ */ jsx("h3", {
          className: "text-lg font-semibold mb-4",
          children: t("dashboard.recent_tasks")
        }), tasks && tasks.length > 0 ? /* @__PURE__ */ jsx("div", {
          className: "space-y-3",
          children: tasks.slice(0, 5).map((task) => /* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between p-3 border rounded-lg",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h4", {
                className: "font-medium",
                children: task.title
              }), /* @__PURE__ */ jsxs("p", {
                className: "text-sm text-muted-foreground",
                children: [t("common.created"), ": ", formatDateDetailedRussian(task.createdAt)]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: `px-2 py-1 rounded-full text-xs ${task.status === "Done" ? "bg-green-100 text-green-800" : task.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`,
                children: task.status === "Done" ? t("status.done") : task.status === "In Progress" ? t("status.in_progress") : task.status === "To Do" ? t("status.todo") : task.status
              }), /* @__PURE__ */ jsx("span", {
                className: `px-2 py-1 rounded-full text-xs ${task.priority === "High" ? "bg-red-100 text-red-800" : task.priority === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`,
                children: task.priority === "High" ? t("priority.high") : task.priority === "Medium" ? t("priority.medium") : t("priority.low")
              })]
            })]
          }, task._id))
        }) : /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: t("tasks.no_tasks_yet")
        })]
      })
    })]
  });
};
const index = withComponentProps(DashboardPage);
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index,
  meta: meta$b
}, Symbol.toStringTag, { value: "Module" }));
function Tabs({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Root,
    {
      "data-slot": "tabs",
      className: cn("flex flex-col gap-2", className),
      ...props
    }
  );
}
function TabsList({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.List,
    {
      "data-slot": "tabs-list",
      className: cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      ),
      ...props
    }
  );
}
function TabsTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Trigger,
    {
      "data-slot": "tabs-trigger",
      className: cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function TabsContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Content,
    {
      "data-slot": "tabs-content",
      className: cn("flex-1 outline-none", className),
      ...props
    }
  );
}
const taskStatusTranslations = {
  ru: {
    "To Do": "К выполнению",
    "In Progress": "В процессе",
    "Done": "Выполнено",
    "Completed": "Завершено",
    "Active": "Активный",
    "Inactive": "Неактивный",
    "Archived": "В архиве"
  },
  tj: {
    "To Do": "Барои иҷро",
    "In Progress": "Дар ҷараён",
    "Done": "Иҷрошуда",
    "Completed": "Анҷомёфта",
    "Active": "Фаъол",
    "Inactive": "Ғайрифаъол",
    "Archived": "Дар бойгонӣ"
  }
};
const priorityTranslations = {
  ru: {
    "Low": "Низкий",
    "Medium": "Средний",
    "High": "Высокий",
    "Critical": "Критический",
    "Urgent": "Срочный"
  },
  tj: {
    "Low": "Паст",
    "Medium": "Миёна",
    "High": "Баланд",
    "Critical": "Критикӣ",
    "Urgent": "Зудӣ"
  }
};
const getTaskStatus = (status, language = "ru") => {
  return taskStatusTranslations[language][status] || status;
};
const getPriority = (priority, language = "ru") => {
  return priorityTranslations[language][priority] || priority;
};
const getTaskStatusRussian = (status) => getTaskStatus(status, "ru");
const getPriorityRussian = (priority) => getPriority(priority, "ru");
function meta$a({}) {
  return [{
    title: "TaskHub | Мои задачи"
  }, {
    name: "description",
    content: "Мои задачи в TaskHub!"
  }];
}
const MyTasksPage = () => {
  const {
    t
  } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";
  const initialSort = searchParams.get("sort") || "desc";
  const initialSearch = searchParams.get("search") || "";
  const [filter, setFilter] = useState(initialFilter);
  const [sortDirection, setSortDirection] = useState(initialSort === "asc" ? "asc" : "desc");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  useEffect(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    params.filter = filter;
    params.sort = sortDirection;
    params.search = searchQuery;
    setSearchParams(params, {
      replace: true
    });
  }, [filter, sortDirection, searchQuery]);
  useEffect(() => {
    const urlFilter = searchParams.get("filter") || "all";
    const urlSort = searchParams.get("sort") || "desc";
    const urlSearch = searchParams.get("search") || "";
    if (urlFilter !== filter) setFilter(urlFilter);
    if (urlSort !== sortDirection) setSortDirection(urlSort === "asc" ? "asc" : "desc");
    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
  }, [searchParams]);
  const {
    data: myTasks2,
    isPending
  } = useGetMyTasksQuery();
  const filteredTasks = (myTasks2 == null ? void 0 : myTasks2.length) > 0 ? myTasks2.filter((task) => {
    if (filter === "all") return true;
    if (filter === "todo") return task.status === "To Do";
    if (filter === "inprogress") return task.status === "In Progress";
    if (filter === "done") return task.status === "Done";
    if (filter === "achieved") return task.isArchived === true;
    if (filter === "high") return task.priority === "High";
    return true;
  }).filter((task) => {
    var _a;
    return task.title.toLowerCase().includes(searchQuery.toLowerCase()) || ((_a = task.description) == null ? void 0 : _a.toLowerCase().includes(searchQuery.toLowerCase()));
  }) : [];
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return sortDirection === "asc" ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    return 0;
  });
  const todoTasks = sortedTasks.filter((task) => task.status === "To Do");
  const inProgressTasks = sortedTasks.filter((task) => task.status === "In Progress");
  const doneTasks = sortedTasks.filter((task) => task.status === "Done");
  if (isPending) return /* @__PURE__ */ jsx(Loader, {
    message: t("common.loading_data")
  });
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-6",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "flex items-start md:items-center justify-between",
      children: [/* @__PURE__ */ jsx("h1", {
        className: "text-xl md:text-3xl font-bold",
        children: t("nav.my_tasks")
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex flex-col items-start md:items-center md:flex-row gap-2",
        children: [/* @__PURE__ */ jsxs(Button, {
          size: "sm",
          variant: "outline",
          onClick: () => setSortDirection(sortDirection === "asc" ? "desc" : "asc"),
          children: [sortDirection === "asc" ? /* @__PURE__ */ jsx(SortAsc, {
            className: "h-4 w-4 mr-1"
          }) : /* @__PURE__ */ jsx(SortDesc, {
            className: "h-4 w-4 mr-1"
          }), sortDirection === "asc" ? t("sort.oldest_first") : t("sort.newest_first")]
        }), /* @__PURE__ */ jsxs(DropdownMenu, {
          children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
            asChild: true,
            children: /* @__PURE__ */ jsxs(Button, {
              size: "sm",
              variant: "outline",
              children: [/* @__PURE__ */ jsx(Filter, {
                className: "h-4 w-4 mr-1"
              }), t("filter.filter")]
            })
          }), /* @__PURE__ */ jsxs(DropdownMenuContent, {
            className: "w-56",
            align: "end",
            children: [/* @__PURE__ */ jsx(DropdownMenuLabel, {
              children: t("filter.filter_tasks")
            }), /* @__PURE__ */ jsx(DropdownMenuSeparator, {}), /* @__PURE__ */ jsxs(DropdownMenuGroup, {
              children: [/* @__PURE__ */ jsx(DropdownMenuItem, {
                onClick: () => setFilter("all"),
                children: t("filter.all_tasks")
              }), /* @__PURE__ */ jsx(DropdownMenuItem, {
                onClick: () => setFilter("todo"),
                children: t("status.todo")
              }), /* @__PURE__ */ jsx(DropdownMenuItem, {
                onClick: () => setFilter("inprogress"),
                children: t("status.in_progress")
              }), /* @__PURE__ */ jsx(DropdownMenuItem, {
                onClick: () => setFilter("done"),
                children: t("status.done")
              }), /* @__PURE__ */ jsx(DropdownMenuItem, {
                onClick: () => setFilter("achieved"),
                children: t("filter.archived")
              }), /* @__PURE__ */ jsx(DropdownMenuItem, {
                onClick: () => setFilter("high"),
                children: t("filter.high_priority")
              })]
            })]
          })]
        })]
      })]
    }), /* @__PURE__ */ jsx(Input, {
      placeholder: t("search.find_tasks"),
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      className: "max-w-md"
    }), /* @__PURE__ */ jsxs(Tabs, {
      defaultValue: "list",
      children: [/* @__PURE__ */ jsxs(TabsList, {
        children: [/* @__PURE__ */ jsx(TabsTrigger, {
          value: "list",
          children: t("tabs.list")
        }), /* @__PURE__ */ jsx(TabsTrigger, {
          value: "board",
          children: t("tabs.board")
        })]
      }), /* @__PURE__ */ jsx(TabsContent, {
        value: "list",
        className: "space-y-4",
        children: /* @__PURE__ */ jsxs(Card, {
          children: [/* @__PURE__ */ jsxs(CardHeader, {
            className: "pb-3",
            children: [/* @__PURE__ */ jsx(CardTitle, {
              children: t("nav.my_tasks")
            }), /* @__PURE__ */ jsxs(CardDescription, {
              children: [sortedTasks.length, " ", t("tasks.assigned_to_you")]
            })]
          }), /* @__PURE__ */ jsx(CardContent, {
            className: "p-0",
            children: /* @__PURE__ */ jsxs("div", {
              className: "divide-y",
              children: [sortedTasks.map((task) => /* @__PURE__ */ jsx("div", {
                className: "p-4 hover:bg-muted/50",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "flex flex-col md:flex-row md:items-center justify-between mb-2 gap-3",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "flex",
                    children: [/* @__PURE__ */ jsx("div", {
                      className: `mr-3 rounded-full p-1 ${task.status === "Done" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : task.priority === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"}`,
                      children: task.status === "Done" ? /* @__PURE__ */ jsx(CheckCircle2, {
                        className: "h-4 w-4"
                      }) : /* @__PURE__ */ jsx(Clock, {
                        className: "h-4 w-4"
                      })
                    }), /* @__PURE__ */ jsxs("div", {
                      children: [/* @__PURE__ */ jsxs(Link, {
                        to: `/dashboard/task/${task._id}`,
                        className: "font-medium hover:text-primary hover:underline transition-colors flex items-center",
                        children: [task.title, /* @__PURE__ */ jsx(ArrowUpRight, {
                          className: "h-3 w-3 ml-1"
                        })]
                      }), /* @__PURE__ */ jsxs("div", {
                        className: "flex items-center space-x-2 mt-1",
                        children: [/* @__PURE__ */ jsx(Badge, {
                          variant: task.status.toLowerCase(),
                          children: getTaskStatusRussian(task.status)
                        }), task.priority && /* @__PURE__ */ jsx(Badge, {
                          variant: task.priority === "High" ? "destructive" : "secondary",
                          children: getPriorityRussian(task.priority)
                        }), task.isArchived && /* @__PURE__ */ jsx(Badge, {
                          variant: "outline",
                          children: t("filter.archived")
                        })]
                      })]
                    })]
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "text-sm text-muted-foreground space-y-1",
                    children: [task.dueDate && /* @__PURE__ */ jsxs("div", {
                      className: cn(getProjectDueDateColor(task.dueDate)),
                      children: [t("tasks.due_date_short"), ": ", formatDueDateRussian(task.dueDate)]
                    }), /* @__PURE__ */ jsxs("div", {
                      children: [t("tasks.modified"), ": ", formatDateDetailedRussian(task.updatedAt)]
                    })]
                  })]
                })
              }, task._id)), sortedTasks.length === 0 && /* @__PURE__ */ jsx("div", {
                className: "p-8 text-center text-muted-foreground",
                children: t("tasks.no_matching_tasks")
              })]
            })
          })]
        })
      }), /* @__PURE__ */ jsx(TabsContent, {
        value: "board",
        children: /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-6",
          children: [/* @__PURE__ */ jsxs(Card, {
            children: [/* @__PURE__ */ jsx(CardHeader, {
              className: "bg-muted/50 pb-3",
              children: /* @__PURE__ */ jsxs(CardTitle, {
                className: "text-lg flex items-center",
                children: [t("status.todo"), /* @__PURE__ */ jsx(Badge, {
                  variant: "outline",
                  className: "ml-2",
                  children: todoTasks.length
                })]
              })
            }), /* @__PURE__ */ jsxs(CardContent, {
              className: "p-3 space-y-3 max-h-[600px] overflow-y-auto",
              children: [todoTasks.map((task) => /* @__PURE__ */ jsx(Card, {
                className: "p-3 hover:shadow-md transition-shadow",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "block",
                  children: [/* @__PURE__ */ jsx("h3", {
                    className: "font-medium",
                    children: task.title
                  }), task.description && /* @__PURE__ */ jsx("p", {
                    className: "text-sm text-muted-foreground mt-1 truncate",
                    children: task.description
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center mt-2",
                    children: [task.priority && /* @__PURE__ */ jsx(Badge, {
                      variant: task.priority === "High" ? "destructive" : "secondary",
                      className: "mr-1",
                      children: getPriorityRussian(task.priority)
                    }), task.dueDate && /* @__PURE__ */ jsx("span", {
                      className: "text-xs text-muted-foreground",
                      children: formatDueDateRussian(task.dueDate)
                    })]
                  })]
                })
              }, task._id)), todoTasks.length === 0 && /* @__PURE__ */ jsx("div", {
                className: "p-4 text-center text-muted-foreground",
                children: t("tasks.no_tasks")
              })]
            })]
          }), /* @__PURE__ */ jsxs(Card, {
            children: [/* @__PURE__ */ jsx(CardHeader, {
              className: "bg-muted/50 pb-3",
              children: /* @__PURE__ */ jsxs(CardTitle, {
                className: "text-lg flex items-center",
                children: [t("status.in_progress"), /* @__PURE__ */ jsx(Badge, {
                  variant: "outline",
                  className: "ml-2",
                  children: inProgressTasks.length
                })]
              })
            }), /* @__PURE__ */ jsxs(CardContent, {
              className: "p-3 space-y-3 max-h-[600px] overflow-y-auto",
              children: [inProgressTasks.map((task) => /* @__PURE__ */ jsx(Card, {
                className: "p-3 hover:shadow-md transition-shadow",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "block",
                  children: [/* @__PURE__ */ jsx("h3", {
                    className: "font-medium",
                    children: task.title
                  }), task.description && /* @__PURE__ */ jsx("p", {
                    className: "text-sm text-muted-foreground mt-1 truncate",
                    children: task.description
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center justify-between mt-2",
                    children: [/* @__PURE__ */ jsx("div", {
                      children: task.priority && /* @__PURE__ */ jsx(Badge, {
                        variant: task.priority === "High" ? "destructive" : "secondary",
                        className: "mr-1",
                        children: getPriorityRussian(task.priority)
                      })
                    }), task.dueDate && /* @__PURE__ */ jsx("span", {
                      className: "text-xs text-muted-foreground",
                      children: formatDueDateRussian(task.dueDate)
                    })]
                  })]
                })
              }, task._id)), inProgressTasks.length === 0 && /* @__PURE__ */ jsx("div", {
                className: "p-4 text-center text-muted-foreground",
                children: t("tasks.no_tasks_in_progress")
              })]
            })]
          }), /* @__PURE__ */ jsxs(Card, {
            children: [/* @__PURE__ */ jsx(CardHeader, {
              className: "bg-muted/50 pb-3",
              children: /* @__PURE__ */ jsxs(CardTitle, {
                className: "text-lg flex items-center",
                children: [t("status.done"), /* @__PURE__ */ jsx(Badge, {
                  variant: "outline",
                  className: "ml-2",
                  children: doneTasks.length
                })]
              })
            }), /* @__PURE__ */ jsxs(CardContent, {
              className: "p-3 space-y-3 max-h-[600px] overflow-y-auto",
              children: [doneTasks.map((task) => /* @__PURE__ */ jsx(Card, {
                className: "p-3 hover:shadow-md transition-shadow",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "block",
                  children: [/* @__PURE__ */ jsx("h3", {
                    className: "font-medium",
                    children: task.title
                  }), task.description && /* @__PURE__ */ jsx("p", {
                    className: "text-sm text-muted-foreground mt-1 truncate",
                    children: task.description
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center mt-2",
                    children: [/* @__PURE__ */ jsx(Badge, {
                      variant: "done",
                      className: "mr-1",
                      children: t("tasks.completed_badge")
                    }), task.isArchived && /* @__PURE__ */ jsx(Badge, {
                      variant: "outline",
                      children: t("filter.archived")
                    })]
                  })]
                })
              }, task._id)), doneTasks.length === 0 && /* @__PURE__ */ jsx("div", {
                className: "p-4 text-center text-muted-foreground",
                children: t("tasks.no_completed_tasks")
              })]
            })]
          })]
        })
      })]
    })]
  });
};
const myTasks = withComponentProps(MyTasksPage);
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: myTasks,
  meta: meta$a
}, Symbol.toStringTag, { value: "Module" }));
function Table({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "table-container",
      className: "relative w-full overflow-x-auto",
      children: /* @__PURE__ */ jsx(
        "table",
        {
          "data-slot": "table",
          className: cn("w-full caption-bottom text-sm", className),
          ...props
        }
      )
    }
  );
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "thead",
    {
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b", className),
      ...props
    }
  );
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      ),
      ...props
    }
  );
}
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DayPicker,
    {
      showOutsideDays,
      className: cn("p-3", className),
      classNames: {
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range" ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md" : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end: "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames
      },
      ...props
    }
  );
}
const NoDataFound = ({
  title,
  description,
  buttonText,
  buttonOnClick
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "col-span-full text-center py-12 2xl:py-24 bg-muted/40 rounded-lg", children: [
    /* @__PURE__ */ jsx(LayoutGrid, { className: "h-12 w-12 mx-auto text-muted-foreground" }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium", children: title }),
    /* @__PURE__ */ jsx("p", { className: "text-sm md:text-base text-muted-foreground mt-2 mb-4 max-w-sm mx-auto", children: description }),
    /* @__PURE__ */ jsxs(Button, { onClick: buttonOnClick, children: [
      /* @__PURE__ */ jsx(CirclePlus, { className: "mr-2 h-4 w-4" }),
      buttonText
    ] })
  ] });
};
function getDateRangeForPeriod(period, customRange) {
  const now = /* @__PURE__ */ new Date();
  switch (period) {
    case "today":
      return {
        from: startOfDay(now),
        to: endOfDay(now)
      };
    case "week":
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        // Понедельник как начало недели
        to: endOfWeek(now, { weekStartsOn: 1 })
      };
    case "month":
      return {
        from: startOfMonth(now),
        to: endOfMonth(now)
      };
    case "6months":
      return {
        from: startOfDay(subMonths(now, 6)),
        to: endOfDay(now)
      };
    case "year":
      return {
        from: startOfYear(now),
        to: endOfYear(now)
      };
    case "custom":
      return {
        from: (customRange == null ? void 0 : customRange.from) || startOfDay(subDays(now, 30)),
        to: (customRange == null ? void 0 : customRange.to) || endOfDay(now)
      };
    default:
      return {
        from: startOfDay(subDays(now, 30)),
        to: endOfDay(now)
      };
  }
}
function getPeriodLabel(period) {
  switch (period) {
    case "today":
      return "За сегодня";
    case "week":
      return "За неделю";
    case "month":
      return "За месяц";
    case "6months":
      return "За 6 месяцев";
    case "year":
      return "За год";
    case "custom":
      return "Произвольный период";
    default:
      return "Все время";
  }
}
function filterTasksByDateRange(tasks, dateRange, dateField = "createdAt") {
  return tasks.filter((task) => {
    const taskDate = new Date(task[dateField]);
    return taskDate >= dateRange.from && taskDate <= dateRange.to;
  });
}
function meta$9() {
  return [{
    title: "Vazifa | Выполненные задачи"
  }, {
    name: "description",
    content: "Просмотр выполненных задач в Vazifa!"
  }];
}
const AchievedPage = () => {
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("");
  const [dateFrom, setDateFrom] = useState(void 0);
  const [dateTo, setDateTo] = useState(void 0);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState(void 0);
  const [customDateTo, setCustomDateTo] = useState(void 0);
  const {
    data,
    isLoading,
    error
  } = useGetCompletedTasksQuery({
    search: search || void 0,
    assignee: assignee || void 0,
    priority: priority && priority !== "all" ? priority : void 0,
    dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : void 0,
    dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : void 0
  });
  let completedTasks = (data == null ? void 0 : data.completedTasks) || [];
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
    return /* @__PURE__ */ jsx(Loader, {
      message: "Загрузка выполненных задач..."
    });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", {
      className: "flex flex-col items-center justify-center min-h-[400px] space-y-4",
      children: [/* @__PURE__ */ jsx("h2", {
        className: "text-2xl font-semibold",
        children: "Ошибка загрузки"
      }), /* @__PURE__ */ jsx("p", {
        className: "text-muted-foreground",
        children: "Не удалось загрузить выполненные задачи"
      })]
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-6",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "flex items-center justify-between",
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-bold",
          children: "Выполненные задачи"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: "Просмотр и управление выполненными задачами"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "flex items-center space-x-2",
        children: /* @__PURE__ */ jsxs(Badge, {
          variant: "secondary",
          className: "text-sm",
          children: [/* @__PURE__ */ jsx(CheckCircle, {
            className: "h-4 w-4 mr-1"
          }), completedTasks.length, " выполнено"]
        })
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsx(CardHeader, {
        children: /* @__PURE__ */ jsxs(CardTitle, {
          className: "flex items-center",
          children: [/* @__PURE__ */ jsx(Filter, {
            className: "h-5 w-5 mr-2"
          }), "Фильтры"]
        })
      }), /* @__PURE__ */ jsxs(CardContent, {
        children: [/* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium",
              children: "Поиск"
            }), /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx(Search, {
                className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
              }), /* @__PURE__ */ jsx(Input, {
                placeholder: "Поиск по названию или описанию...",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                className: "pl-10"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium",
              children: "Приоритет"
            }), /* @__PURE__ */ jsxs(Select, {
              value: priority,
              onValueChange: setPriority,
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                children: /* @__PURE__ */ jsx(SelectValue, {
                  placeholder: "Все приоритеты"
                })
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "all",
                  children: "Все приоритеты"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "Low",
                  children: "Низкий"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "Medium",
                  children: "Средний"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "High",
                  children: "Высокий"
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium",
              children: "Исполнитель"
            }), /* @__PURE__ */ jsx(Input, {
              placeholder: "ID исполнителя",
              value: assignee,
              onChange: (e) => setAssignee(e.target.value)
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium",
              children: "Дата выполнения (от)"
            }), /* @__PURE__ */ jsxs(Popover, {
              children: [/* @__PURE__ */ jsx(PopoverTrigger, {
                asChild: true,
                children: /* @__PURE__ */ jsxs(Button, {
                  variant: "outline",
                  className: cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground"),
                  children: [/* @__PURE__ */ jsx(Calendar$1, {
                    className: "mr-2 h-4 w-4"
                  }), dateFrom ? format(dateFrom, "dd.MM.yyyy", {
                    locale: ru
                  }) : "Выберите дату"]
                })
              }), /* @__PURE__ */ jsx(PopoverContent, {
                className: "w-auto p-0",
                align: "start",
                children: /* @__PURE__ */ jsx(Calendar, {
                  mode: "single",
                  selected: dateFrom,
                  onSelect: setDateFrom,
                  initialFocus: true,
                  locale: ru
                })
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium",
              children: "Дата выполнения (до)"
            }), /* @__PURE__ */ jsxs(Popover, {
              children: [/* @__PURE__ */ jsx(PopoverTrigger, {
                asChild: true,
                children: /* @__PURE__ */ jsxs(Button, {
                  variant: "outline",
                  className: cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground"),
                  children: [/* @__PURE__ */ jsx(Calendar$1, {
                    className: "mr-2 h-4 w-4"
                  }), dateTo ? format(dateTo, "dd.MM.yyyy", {
                    locale: ru
                  }) : "Выберите дату"]
                })
              }), /* @__PURE__ */ jsx(PopoverContent, {
                className: "w-auto p-0",
                align: "start",
                children: /* @__PURE__ */ jsx(Calendar, {
                  mode: "single",
                  selected: dateTo,
                  onSelect: setDateTo,
                  initialFocus: true,
                  locale: ru
                })
              })]
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "flex items-end",
            children: /* @__PURE__ */ jsx(Button, {
              variant: "outline",
              onClick: () => {
                setSearch("");
                setAssignee("");
                setPriority("");
                setDateFrom(void 0);
                setDateTo(void 0);
                setDateFilter("all");
                setCustomDateFrom(void 0);
                setCustomDateTo(void 0);
              },
              children: "Сбросить фильтры"
            })
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "border-t pt-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-2 mb-3",
            children: [/* @__PURE__ */ jsx(CalendarDays, {
              className: "h-4 w-4 text-muted-foreground"
            }), /* @__PURE__ */ jsx("span", {
              className: "text-sm font-medium",
              children: "Фильтр по времени создания"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col md:flex-row gap-4",
            children: [/* @__PURE__ */ jsxs(Select, {
              value: dateFilter,
              onValueChange: (value) => setDateFilter(value),
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                className: "w-full md:w-48",
                children: /* @__PURE__ */ jsx(SelectValue, {
                  placeholder: "Период"
                })
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "all",
                  children: "Все время"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "today",
                  children: "За сегодня"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "week",
                  children: "За неделю"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "month",
                  children: "За месяц"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "6months",
                  children: "За 6 месяцев"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "year",
                  children: "За год"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "custom",
                  children: "Произвольный период"
                })]
              })]
            }), dateFilter === "custom" && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs(Popover, {
                children: [/* @__PURE__ */ jsx(PopoverTrigger, {
                  asChild: true,
                  children: /* @__PURE__ */ jsxs(Button, {
                    variant: "outline",
                    className: cn("w-full md:w-48 justify-start text-left font-normal", !customDateFrom && "text-muted-foreground"),
                    children: [/* @__PURE__ */ jsx(Calendar$1, {
                      className: "mr-2 h-4 w-4"
                    }), customDateFrom ? format(customDateFrom, "dd.MM.yyyy", {
                      locale: ru
                    }) : "Дата от"]
                  })
                }), /* @__PURE__ */ jsx(PopoverContent, {
                  className: "w-auto p-0",
                  align: "start",
                  children: /* @__PURE__ */ jsx(Calendar, {
                    mode: "single",
                    selected: customDateFrom,
                    onSelect: setCustomDateFrom,
                    initialFocus: true,
                    locale: ru
                  })
                })]
              }), /* @__PURE__ */ jsxs(Popover, {
                children: [/* @__PURE__ */ jsx(PopoverTrigger, {
                  asChild: true,
                  children: /* @__PURE__ */ jsxs(Button, {
                    variant: "outline",
                    className: cn("w-full md:w-48 justify-start text-left font-normal", !customDateTo && "text-muted-foreground"),
                    children: [/* @__PURE__ */ jsx(Calendar$1, {
                      className: "mr-2 h-4 w-4"
                    }), customDateTo ? format(customDateTo, "dd.MM.yyyy", {
                      locale: ru
                    }) : "Дата до"]
                  })
                }), /* @__PURE__ */ jsx(PopoverContent, {
                  className: "w-auto p-0",
                  align: "start",
                  children: /* @__PURE__ */ jsx(Calendar, {
                    mode: "single",
                    selected: customDateTo,
                    onSelect: setCustomDateTo,
                    initialFocus: true,
                    locale: ru
                  })
                })]
              })]
            }), /* @__PURE__ */ jsx(Button, {
              variant: "outline",
              onClick: () => {
                setDateFilter("all");
                setCustomDateFrom(void 0);
                setCustomDateTo(void 0);
              },
              className: "w-full md:w-auto",
              children: "Сбросить период"
            })]
          })]
        })]
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsx(CardHeader, {
        children: /* @__PURE__ */ jsx(CardTitle, {
          children: "Список выполненных задач"
        })
      }), /* @__PURE__ */ jsx(CardContent, {
        children: completedTasks.length > 0 ? /* @__PURE__ */ jsxs(Table, {
          children: [/* @__PURE__ */ jsx(TableHeader, {
            children: /* @__PURE__ */ jsxs(TableRow, {
              children: [/* @__PURE__ */ jsx(TableHead, {
                children: "№"
              }), /* @__PURE__ */ jsx(TableHead, {
                children: "Название задачи"
              }), /* @__PURE__ */ jsx(TableHead, {
                children: "Исполнители"
              }), /* @__PURE__ */ jsx(TableHead, {
                children: "Приоритет"
              }), /* @__PURE__ */ jsx(TableHead, {
                children: "Дата выполнения"
              }), /* @__PURE__ */ jsx(TableHead, {
                children: "В срок"
              }), /* @__PURE__ */ jsx(TableHead, {
                children: "Действия"
              })]
            })
          }), /* @__PURE__ */ jsx(TableBody, {
            children: completedTasks.map((task, index2) => {
              var _a;
              return /* @__PURE__ */ jsxs(TableRow, {
                children: [/* @__PURE__ */ jsx(TableCell, {
                  className: "font-medium",
                  children: index2 + 1
                }), /* @__PURE__ */ jsx(TableCell, {
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "space-y-1",
                    children: [/* @__PURE__ */ jsx(Link, {
                      to: `/dashboard/task/${task._id}`,
                      className: "font-medium hover:underline",
                      children: task.title
                    }), task.description && /* @__PURE__ */ jsx("p", {
                      className: "text-sm text-muted-foreground line-clamp-2",
                      children: task.description
                    })]
                  })
                }), /* @__PURE__ */ jsx(TableCell, {
                  children: /* @__PURE__ */ jsx("div", {
                    className: "flex flex-wrap gap-1",
                    children: (_a = task.assignees) == null ? void 0 : _a.map((assignee2) => /* @__PURE__ */ jsx(Badge, {
                      variant: "secondary",
                      className: "text-xs",
                      children: assignee2.name
                    }, assignee2._id))
                  })
                }), /* @__PURE__ */ jsx(TableCell, {
                  children: /* @__PURE__ */ jsx(Badge, {
                    variant: task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary",
                    children: getPriorityRussian(task.priority)
                  })
                }), /* @__PURE__ */ jsx(TableCell, {
                  children: task.completedAt ? formatDateDetailedRussian(task.completedAt) : "—"
                }), /* @__PURE__ */ jsx(TableCell, {
                  children: task.completedOnTime !== null ? /* @__PURE__ */ jsx(Badge, {
                    variant: task.completedOnTime ? "default" : "destructive",
                    children: task.completedOnTime ? "В срок" : "Просрочено"
                  }) : /* @__PURE__ */ jsx("span", {
                    className: "text-muted-foreground",
                    children: "—"
                  })
                }), /* @__PURE__ */ jsx(TableCell, {
                  children: /* @__PURE__ */ jsx("div", {
                    className: "flex items-center space-x-2",
                    children: /* @__PURE__ */ jsx(Link, {
                      to: `/dashboard/task/${task._id}`,
                      children: /* @__PURE__ */ jsx(Button, {
                        variant: "ghost",
                        size: "sm",
                        children: /* @__PURE__ */ jsx(Eye, {
                          className: "h-4 w-4"
                        })
                      })
                    })
                  })
                })]
              }, task._id);
            })
          })]
        }) : /* @__PURE__ */ jsx(NoDataFound, {
          title: "Нет выполненных задач",
          description: "Выполненные задачи будут отображаться здесь",
          buttonText: "Назад",
          buttonOnClick: () => window.history.back()
        })
      })]
    })]
  });
};
const achieved = withComponentProps(AchievedPage);
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: achieved,
  meta: meta$9
}, Symbol.toStringTag, { value: "Module" }));
function meta$8() {
  return [{
    title: "TaskHub | Все задачи"
  }, {
    name: "description",
    content: "Управление всеми задачами в TaskHub!"
  }];
}
const AllTasksPage = () => {
  const {
    t
  } = useLanguage();
  const {
    user
  } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canViewAllTasks = (user == null ? void 0 : user.role) && ["admin", "super_admin", "manager"].includes(user.role);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc");
  const [dateFilter, setDateFilter] = useState(searchParams.get("dateFilter") || "all");
  const [customDateFrom, setCustomDateFrom] = useState(searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")) : void 0);
  const [customDateTo, setCustomDateTo] = useState(searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")) : void 0);
  const {
    data: allTasks2,
    isPending: tasksLoading
  } = useGetAllTasksQuery(canViewAllTasks);
  useEffect(() => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (statusFilter !== "all") params.status = statusFilter;
    if (priorityFilter !== "all") params.priority = priorityFilter;
    if (sortBy !== "createdAt") params.sortBy = sortBy;
    if (sortOrder !== "desc") params.sortOrder = sortOrder;
    setSearchParams(params, {
      replace: true
    });
  }, [searchQuery, statusFilter, priorityFilter, sortBy, sortOrder, setSearchParams]);
  if (!canViewAllTasks) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-center h-96",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx(AlertCircle, {
          className: "h-12 w-12 text-muted-foreground mx-auto mb-4"
        }), /* @__PURE__ */ jsx("h2", {
          className: "text-xl font-semibold mb-2",
          children: t("all_tasks.access_denied")
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: t("all_tasks.no_access_message")
        })]
      })
    });
  }
  if (tasksLoading) {
    return /* @__PURE__ */ jsx(Loader, {
      message: t("all_tasks.loading")
    });
  }
  const tasks = Array.isArray(allTasks2 == null ? void 0 : allTasks2.tasks) ? allTasks2.tasks : [];
  let filteredTasks = tasks.filter((task) => {
    var _a;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || ((_a = task.description) == null ? void 0 : _a.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });
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
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue, bValue;
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
        const priorityOrder = {
          "High": 3,
          "Medium": 2,
          "Low": 1
        };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
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
  const stats = {
    total: tasks.length,
    filtered: filteredTasks.length,
    todo: filteredTasks.filter((t2) => t2.status === "To Do").length,
    inProgress: filteredTasks.filter((t2) => t2.status === "In Progress").length,
    done: filteredTasks.filter((t2) => t2.status === "Done").length,
    highPriority: filteredTasks.filter((t2) => t2.priority === "High").length
  };
  const periodLabel = dateFilter !== "all" ? getPeriodLabel(dateFilter) : "Все время";
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-6",
    children: [/* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-between",
      children: /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl md:text-3xl font-bold",
          children: t("all_tasks.title")
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: t("all_tasks.description")
        })]
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "space-y-4",
      children: [dateFilter !== "all" && /* @__PURE__ */ jsx("div", {
        className: "text-center",
        children: /* @__PURE__ */ jsxs(Badge, {
          variant: "outline",
          className: "text-sm",
          children: [/* @__PURE__ */ jsx(CalendarDays, {
            className: "h-4 w-4 mr-1"
          }), t("all_tasks.statistics_period"), ": ", periodLabel]
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid gap-4 md:grid-cols-5",
        children: [/* @__PURE__ */ jsxs(Card, {
          onClick: () => {
            setStatusFilter("all");
            setPriorityFilter("all");
          },
          className: "cursor-pointer hover:shadow-lg hover:border-primary transition-all",
          children: [/* @__PURE__ */ jsx(CardHeader, {
            className: "flex flex-row items-center justify-between space-y-0 pb-2",
            children: /* @__PURE__ */ jsx(CardTitle, {
              className: "text-sm font-medium",
              children: dateFilter !== "all" ? t("all_tasks.for_period") : t("all_tasks.total_tasks")
            })
          }), /* @__PURE__ */ jsxs(CardContent, {
            children: [/* @__PURE__ */ jsx("div", {
              className: "text-2xl font-bold",
              children: dateFilter !== "all" ? stats.filtered : stats.total
            }), dateFilter !== "all" && /* @__PURE__ */ jsx("p", {
              className: "text-xs text-muted-foreground",
              children: t("all_tasks.from_total").replace("{total}", stats.total.toString())
            })]
          })]
        }), /* @__PURE__ */ jsxs(Card, {
          onClick: () => {
            setStatusFilter("To Do");
            setPriorityFilter("all");
          },
          className: "cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all",
          children: [/* @__PURE__ */ jsx(CardHeader, {
            className: "flex flex-row items-center justify-between space-y-0 pb-2",
            children: /* @__PURE__ */ jsx(CardTitle, {
              className: "text-sm font-medium",
              children: t("status.todo")
            })
          }), /* @__PURE__ */ jsx(CardContent, {
            children: /* @__PURE__ */ jsx("div", {
              className: "text-2xl font-bold text-blue-600",
              children: stats.todo
            })
          })]
        }), /* @__PURE__ */ jsxs(Card, {
          onClick: () => {
            setStatusFilter("In Progress");
            setPriorityFilter("all");
          },
          className: "cursor-pointer hover:shadow-lg hover:border-yellow-500 transition-all",
          children: [/* @__PURE__ */ jsx(CardHeader, {
            className: "flex flex-row items-center justify-between space-y-0 pb-2",
            children: /* @__PURE__ */ jsx(CardTitle, {
              className: "text-sm font-medium",
              children: t("status.in_progress")
            })
          }), /* @__PURE__ */ jsx(CardContent, {
            children: /* @__PURE__ */ jsx("div", {
              className: "text-2xl font-bold text-yellow-600",
              children: stats.inProgress
            })
          })]
        }), /* @__PURE__ */ jsxs(Card, {
          onClick: () => {
            setStatusFilter("Done");
            setPriorityFilter("all");
          },
          className: "cursor-pointer hover:shadow-lg hover:border-green-500 transition-all",
          children: [/* @__PURE__ */ jsx(CardHeader, {
            className: "flex flex-row items-center justify-between space-y-0 pb-2",
            children: /* @__PURE__ */ jsx(CardTitle, {
              className: "text-sm font-medium",
              children: t("status.done")
            })
          }), /* @__PURE__ */ jsx(CardContent, {
            children: /* @__PURE__ */ jsx("div", {
              className: "text-2xl font-bold text-green-600",
              children: stats.done
            })
          })]
        }), /* @__PURE__ */ jsxs(Card, {
          onClick: () => {
            setStatusFilter("all");
            setPriorityFilter("High");
          },
          className: "cursor-pointer hover:shadow-lg hover:border-red-500 transition-all",
          children: [/* @__PURE__ */ jsx(CardHeader, {
            className: "flex flex-row items-center justify-between space-y-0 pb-2",
            children: /* @__PURE__ */ jsx(CardTitle, {
              className: "text-sm font-medium",
              children: t("all_tasks.high_priority")
            })
          }), /* @__PURE__ */ jsx(CardContent, {
            children: /* @__PURE__ */ jsx("div", {
              className: "text-2xl font-bold text-red-600",
              children: stats.highPriority
            })
          })]
        })]
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsx(CardHeader, {
        children: /* @__PURE__ */ jsx(CardTitle, {
          children: t("all_tasks.filters_search")
        })
      }), /* @__PURE__ */ jsxs(CardContent, {
        className: "space-y-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex flex-col md:flex-row gap-4",
          children: [/* @__PURE__ */ jsx("div", {
            className: "flex-1",
            children: /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx(Search, {
                className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              }), /* @__PURE__ */ jsx(Input, {
                placeholder: t("all_tasks.search_placeholder"),
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-10"
              })]
            })
          }), /* @__PURE__ */ jsxs(Select, {
            value: statusFilter,
            onValueChange: setStatusFilter,
            children: [/* @__PURE__ */ jsx(SelectTrigger, {
              className: "w-full md:w-48",
              children: /* @__PURE__ */ jsx(SelectValue, {
                placeholder: t("tasks.task_status")
              })
            }), /* @__PURE__ */ jsxs(SelectContent, {
              children: [/* @__PURE__ */ jsx(SelectItem, {
                value: "all",
                children: t("all_tasks.all_statuses")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "To Do",
                children: t("status.todo")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "In Progress",
                children: t("status.in_progress")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "Done",
                children: t("status.done")
              })]
            })]
          }), /* @__PURE__ */ jsxs(Select, {
            value: priorityFilter,
            onValueChange: setPriorityFilter,
            children: [/* @__PURE__ */ jsx(SelectTrigger, {
              className: "w-full md:w-48",
              children: /* @__PURE__ */ jsx(SelectValue, {
                placeholder: t("tasks.task_priority")
              })
            }), /* @__PURE__ */ jsxs(SelectContent, {
              children: [/* @__PURE__ */ jsx(SelectItem, {
                value: "all",
                children: t("all_tasks.all_priorities")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "High",
                children: t("priority.high")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "Medium",
                children: t("priority.medium")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "Low",
                children: t("priority.low")
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "border-t pt-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-2 mb-3",
            children: [/* @__PURE__ */ jsx(CalendarDays, {
              className: "h-4 w-4 text-muted-foreground"
            }), /* @__PURE__ */ jsx("span", {
              className: "text-sm font-medium",
              children: t("all_tasks.time_filter")
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col md:flex-row gap-4",
            children: [/* @__PURE__ */ jsxs(Select, {
              value: dateFilter,
              onValueChange: (value) => setDateFilter(value),
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                className: "w-full md:w-48",
                children: /* @__PURE__ */ jsx(SelectValue, {
                  placeholder: t("all_tasks.period")
                })
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "all",
                  children: t("all_tasks.all_time")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "today",
                  children: t("all_tasks.today")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "week",
                  children: t("all_tasks.week")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "month",
                  children: t("all_tasks.month")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "6months",
                  children: t("all_tasks.six_months")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "year",
                  children: t("all_tasks.year")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "custom",
                  children: t("all_tasks.custom_period")
                })]
              })]
            }), dateFilter === "custom" && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs(Popover, {
                children: [/* @__PURE__ */ jsx(PopoverTrigger, {
                  asChild: true,
                  children: /* @__PURE__ */ jsxs(Button, {
                    variant: "outline",
                    className: cn("w-full md:w-48 justify-start text-left font-normal", !customDateFrom && "text-muted-foreground"),
                    children: [/* @__PURE__ */ jsx(Calendar$1, {
                      className: "mr-2 h-4 w-4"
                    }), customDateFrom ? format(customDateFrom, "dd.MM.yyyy", {
                      locale: ru
                    }) : t("all_tasks.date_from")]
                  })
                }), /* @__PURE__ */ jsx(PopoverContent, {
                  className: "w-auto p-0",
                  align: "start",
                  children: /* @__PURE__ */ jsx(Calendar, {
                    mode: "single",
                    selected: customDateFrom,
                    onSelect: setCustomDateFrom,
                    initialFocus: true,
                    locale: ru
                  })
                })]
              }), /* @__PURE__ */ jsxs(Popover, {
                children: [/* @__PURE__ */ jsx(PopoverTrigger, {
                  asChild: true,
                  children: /* @__PURE__ */ jsxs(Button, {
                    variant: "outline",
                    className: cn("w-full md:w-48 justify-start text-left font-normal", !customDateTo && "text-muted-foreground"),
                    children: [/* @__PURE__ */ jsx(Calendar$1, {
                      className: "mr-2 h-4 w-4"
                    }), customDateTo ? format(customDateTo, "dd.MM.yyyy", {
                      locale: ru
                    }) : t("all_tasks.date_to")]
                  })
                }), /* @__PURE__ */ jsx(PopoverContent, {
                  className: "w-auto p-0",
                  align: "start",
                  children: /* @__PURE__ */ jsx(Calendar, {
                    mode: "single",
                    selected: customDateTo,
                    onSelect: setCustomDateTo,
                    initialFocus: true,
                    locale: ru
                  })
                })]
              })]
            }), /* @__PURE__ */ jsx(Button, {
              variant: "outline",
              onClick: () => {
                setDateFilter("all");
                setCustomDateFrom(void 0);
                setCustomDateTo(void 0);
              },
              className: "w-full md:w-auto",
              children: t("all_tasks.reset_period")
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex items-center gap-2",
          children: [/* @__PURE__ */ jsxs(Select, {
            value: sortBy,
            onValueChange: setSortBy,
            children: [/* @__PURE__ */ jsx(SelectTrigger, {
              className: "w-48",
              children: /* @__PURE__ */ jsx(SelectValue, {
                placeholder: t("all_tasks.sort_by")
              })
            }), /* @__PURE__ */ jsxs(SelectContent, {
              children: [/* @__PURE__ */ jsx(SelectItem, {
                value: "createdAt",
                children: t("all_tasks.sort_created")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "title",
                children: t("all_tasks.sort_title")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "status",
                children: t("all_tasks.sort_status")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "priority",
                children: t("all_tasks.sort_priority")
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "dueDate",
                children: t("all_tasks.sort_due_date")
              })]
            })]
          }), /* @__PURE__ */ jsx(Button, {
            variant: "outline",
            size: "sm",
            onClick: () => setSortOrder(sortOrder === "asc" ? "desc" : "asc"),
            children: sortOrder === "asc" ? /* @__PURE__ */ jsx(SortAsc, {
              className: "h-4 w-4"
            }) : /* @__PURE__ */ jsx(SortDesc, {
              className: "h-4 w-4"
            })
          })]
        })]
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsx(CardHeader, {
        children: /* @__PURE__ */ jsx(CardTitle, {
          children: t("all_tasks.tasks_count").replace("{filtered}", sortedTasks.length.toString()).replace("{total}", tasks.length.toString())
        })
      }), /* @__PURE__ */ jsx(CardContent, {
        children: /* @__PURE__ */ jsx("div", {
          className: "rounded-md border",
          children: /* @__PURE__ */ jsxs(Table, {
            children: [/* @__PURE__ */ jsx(TableHeader, {
              children: /* @__PURE__ */ jsxs(TableRow, {
                children: [/* @__PURE__ */ jsx(TableHead, {
                  className: "w-16",
                  children: t("all_tasks.table_number")
                }), /* @__PURE__ */ jsx(TableHead, {
                  children: t("all_tasks.table_title")
                }), /* @__PURE__ */ jsx(TableHead, {
                  children: t("all_tasks.table_status")
                }), /* @__PURE__ */ jsx(TableHead, {
                  children: t("all_tasks.table_priority")
                }), /* @__PURE__ */ jsx(TableHead, {
                  children: t("all_tasks.table_assigned")
                }), /* @__PURE__ */ jsx(TableHead, {
                  children: t("all_tasks.table_due_date")
                }), /* @__PURE__ */ jsx(TableHead, {
                  children: t("all_tasks.table_created")
                }), ((user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "manager") && /* @__PURE__ */ jsx(TableHead, {
                  className: "w-20",
                  children: t("all_tasks.table_actions")
                })]
              })
            }), /* @__PURE__ */ jsxs(TableBody, {
              children: [sortedTasks.map((task, index2) => {
                var _a;
                return /* @__PURE__ */ jsxs(TableRow, {
                  children: [/* @__PURE__ */ jsx(TableCell, {
                    className: "font-mono text-sm text-muted-foreground",
                    children: index2 + 1
                  }), /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsxs(Link, {
                      to: `/dashboard/task/${task._id}`,
                      className: "block hover:text-primary transition-colors",
                      children: [/* @__PURE__ */ jsx("div", {
                        className: "font-medium hover:underline",
                        children: task.title
                      }), task.description && /* @__PURE__ */ jsx("div", {
                        className: "text-sm text-muted-foreground truncate max-w-xs",
                        children: task.description
                      })]
                    })
                  }), /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsx(Badge, {
                      variant: task.status.toLowerCase(),
                      children: getTaskStatusRussian(task.status)
                    })
                  }), /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsx(Badge, {
                      variant: task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary",
                      children: getPriorityRussian(task.priority)
                    })
                  }), /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsxs("div", {
                      className: "flex -space-x-2",
                      children: [(_a = task.assignees) == null ? void 0 : _a.slice(0, 3).map((assignee, index22) => {
                        var _a2;
                        return assignee ? /* @__PURE__ */ jsxs(Avatar, {
                          className: "h-8 w-8 border-2 border-background",
                          children: [/* @__PURE__ */ jsx(AvatarImage, {
                            src: assignee.profilePicture || void 0
                          }), /* @__PURE__ */ jsx(AvatarFallback, {
                            className: "text-xs",
                            children: ((_a2 = assignee.name) == null ? void 0 : _a2.charAt(0)) || "?"
                          })]
                        }, assignee._id) : null;
                      }), task.assignees && task.assignees.length > 3 && /* @__PURE__ */ jsx("div", {
                        className: "h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center",
                        children: /* @__PURE__ */ jsxs("span", {
                          className: "text-xs",
                          children: ["+", task.assignees.length - 3]
                        })
                      }), (!task.assignees || task.assignees.length === 0) && /* @__PURE__ */ jsx("span", {
                        className: "text-sm text-muted-foreground",
                        children: t("all_tasks.not_assigned")
                      })]
                    })
                  }), /* @__PURE__ */ jsx(TableCell, {
                    children: task.dueDate ? /* @__PURE__ */ jsx("span", {
                      className: cn("text-sm", new Date(task.dueDate) < /* @__PURE__ */ new Date() && task.status !== "Done" ? "text-red-600 font-medium" : "text-muted-foreground"),
                      children: formatDueDateRussian(task.dueDate)
                    }) : /* @__PURE__ */ jsx("span", {
                      className: "text-sm text-muted-foreground",
                      children: t("all_tasks.not_specified")
                    })
                  }), /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsx("span", {
                      className: "text-sm text-muted-foreground",
                      children: formatDateDetailedRussian(task.createdAt)
                    })
                  }), ((user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "manager") && /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsx(Link, {
                      to: `/dashboard/task/${task._id}`,
                      children: /* @__PURE__ */ jsx(Button, {
                        variant: "ghost",
                        size: "sm",
                        children: /* @__PURE__ */ jsx(Eye, {
                          className: "h-4 w-4"
                        })
                      })
                    })
                  })]
                }, task._id);
              }), sortedTasks.length === 0 && /* @__PURE__ */ jsx(TableRow, {
                children: /* @__PURE__ */ jsx(TableCell, {
                  colSpan: (user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "manager" ? 8 : 7,
                  className: "text-center py-8",
                  children: /* @__PURE__ */ jsx("div", {
                    className: "text-muted-foreground",
                    children: t("all_tasks.no_tasks_found")
                  })
                })
              })]
            })]
          })
        })
      })]
    })]
  });
};
const allTasks = withComponentProps(AllTasksPage);
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: allTasks,
  meta: meta$8
}, Symbol.toStringTag, { value: "Module" }));
const managerTasks = withComponentProps(function ManagerTasksPage() {
  const {
    t
  } = useLanguage();
  const {
    user
  } = useAuth();
  const {
    data: managerTasks2,
    isLoading
  } = useQuery({
    queryKey: ["manager-tasks"],
    queryFn: async () => {
      const data = await fetchData("/tasks/my-manager-tasks/");
      return data.myManagerTasks;
    },
    enabled: !!user && ["admin", "manager", "super_admin"].includes(user.role || "")
  });
  if (!user || !["admin", "manager", "super_admin"].includes(user.role || "")) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-center h-64",
      children: /* @__PURE__ */ jsx("p", {
        className: "text-muted-foreground",
        children: t("manager_tasks.no_access")
      })
    });
  }
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-center h-64",
      children: /* @__PURE__ */ jsx("div", {
        className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
      })
    });
  }
  const getPriorityColor = (priority) => {
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
  const getStatusColor = (status) => {
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
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-6",
    children: [/* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-between",
      children: /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-bold tracking-tight",
          children: t("manager_tasks.title")
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: t("manager_tasks.description")
        })]
      })
    }), !managerTasks2 || managerTasks2.length === 0 ? /* @__PURE__ */ jsx(Card, {
      children: /* @__PURE__ */ jsxs(CardContent, {
        className: "flex flex-col items-center justify-center py-12",
        children: [/* @__PURE__ */ jsx(User, {
          className: "h-12 w-12 text-muted-foreground mb-4"
        }), /* @__PURE__ */ jsx("h3", {
          className: "text-lg font-semibold mb-2",
          children: t("manager_tasks.no_tasks_title")
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground text-center",
          children: t("manager_tasks.no_tasks_description")
        })]
      })
    }) : /* @__PURE__ */ jsx("div", {
      className: "grid gap-4",
      children: managerTasks2.map((task) => /* @__PURE__ */ jsxs(Card, {
        className: "hover:shadow-md transition-shadow",
        children: [/* @__PURE__ */ jsx(CardHeader, {
          className: "pb-3",
          children: /* @__PURE__ */ jsxs("div", {
            className: "flex items-start justify-between",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-1 flex-1",
              children: [/* @__PURE__ */ jsx(CardTitle, {
                className: "text-lg",
                children: /* @__PURE__ */ jsxs(Link, {
                  to: `/dashboard/task/${task._id}`,
                  className: "hover:text-primary transition-colors",
                  children: [task.title, task.isImportant && /* @__PURE__ */ jsx(Star, {
                    className: "inline-block ml-2 h-4 w-4 text-yellow-500 fill-current"
                  })]
                })
              }), task.description && /* @__PURE__ */ jsx("p", {
                className: "text-sm text-muted-foreground line-clamp-2",
                children: task.description
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex gap-2 ml-4",
              children: [/* @__PURE__ */ jsx(Badge, {
                variant: "outline",
                className: getPriorityColor(task.priority),
                children: task.priority === "High" ? t("priority.high") : task.priority === "Medium" ? t("priority.medium") : t("priority.low")
              }), /* @__PURE__ */ jsx(Badge, {
                variant: "outline",
                className: getStatusColor(task.status),
                children: task.status === "To Do" ? t("status.todo") : task.status === "In Progress" ? t("status.in_progress") : task.status === "Review" ? t("status.review") : t("status.done")
              })]
            })]
          })
        }), /* @__PURE__ */ jsx(CardContent, {
          className: "pt-0",
          children: /* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between text-sm text-muted-foreground",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-4",
              children: [task.assignees && task.assignees.length > 0 && /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-1",
                children: [/* @__PURE__ */ jsx(User, {
                  className: "h-4 w-4"
                }), /* @__PURE__ */ jsx("span", {
                  children: task.assignees.length === 1 ? task.assignees[0].name : t("manager_tasks.assignees_count").replace("{count}", task.assignees.length.toString())
                })]
              }), task.dueDate && /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-1",
                children: [/* @__PURE__ */ jsx(Calendar$1, {
                  className: "h-4 w-4"
                }), /* @__PURE__ */ jsx("span", {
                  children: formatDueDateRussian(task.dueDate)
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-1",
              children: [/* @__PURE__ */ jsx(Clock, {
                className: "h-4 w-4"
              }), /* @__PURE__ */ jsx("span", {
                children: formatDateDetailedRussian(task.createdAt)
              })]
            })]
          })
        })]
      }, task._id))
    })]
  });
});
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: managerTasks
}, Symbol.toStringTag, { value: "Module" }));
const importantTasks = withComponentProps(function ImportantTasksPage() {
  const {
    user
  } = useAuth();
  const {
    t,
    language
  } = useLanguage();
  const {
    data: importantTasks2,
    isLoading
  } = useQuery({
    queryKey: ["important-tasks"],
    queryFn: async () => {
      const data = await fetchData("/tasks/important/");
      return data.importantTasks;
    },
    enabled: !!user && user.role === "super_admin"
  });
  if (!user || user.role !== "super_admin") {
    return /* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-center h-64",
      children: /* @__PURE__ */ jsx("p", {
        className: "text-muted-foreground",
        children: t("important_tasks.no_access")
      })
    });
  }
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-center h-64",
      children: /* @__PURE__ */ jsx("div", {
        className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
      })
    });
  }
  const getPriorityColor = (priority) => {
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
  const getStatusColor = (status) => {
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
  const formatDate = (date) => {
    const d = new Date(date);
    if (language === "tj") {
      return d.toLocaleDateString("tg-TJ", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
    return d.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-6",
    children: [/* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-between",
      children: /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsxs("h1", {
          className: "text-3xl font-bold tracking-tight flex items-center gap-2",
          children: [/* @__PURE__ */ jsx(Star, {
            className: "h-8 w-8 text-yellow-500 fill-current"
          }), t("important_tasks.title")]
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: t("important_tasks.description")
        })]
      })
    }), !importantTasks2 || importantTasks2.length === 0 ? /* @__PURE__ */ jsx(Card, {
      children: /* @__PURE__ */ jsxs(CardContent, {
        className: "flex flex-col items-center justify-center py-12",
        children: [/* @__PURE__ */ jsx(AlertTriangle, {
          className: "h-12 w-12 text-muted-foreground mb-4"
        }), /* @__PURE__ */ jsx("h3", {
          className: "text-lg font-semibold mb-2",
          children: t("important_tasks.no_tasks_title")
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground text-center",
          children: t("important_tasks.no_tasks_description")
        })]
      })
    }) : /* @__PURE__ */ jsx("div", {
      className: "grid gap-4",
      children: importantTasks2.map((task) => /* @__PURE__ */ jsxs(Card, {
        className: "hover:shadow-md transition-shadow border-l-4 border-l-yellow-500",
        children: [/* @__PURE__ */ jsx(CardHeader, {
          className: "pb-3",
          children: /* @__PURE__ */ jsxs("div", {
            className: "flex items-start justify-between",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-1 flex-1",
              children: [/* @__PURE__ */ jsxs(CardTitle, {
                className: "text-lg flex items-center gap-2",
                children: [/* @__PURE__ */ jsx(Star, {
                  className: "h-5 w-5 text-yellow-500 fill-current"
                }), /* @__PURE__ */ jsx(Link, {
                  to: `/dashboard/task/${task._id}`,
                  className: "hover:text-primary transition-colors",
                  children: task.title
                })]
              }), task.description && /* @__PURE__ */ jsx("p", {
                className: "text-sm text-muted-foreground line-clamp-2",
                children: task.description
              }), task.markedImportantBy && task.markedImportantAt && /* @__PURE__ */ jsxs("p", {
                className: "text-xs text-muted-foreground",
                children: [t("important_tasks.marked_important"), " ", typeof task.markedImportantBy === "object" ? task.markedImportantBy.name : t("important_tasks.by_admin"), " ", formatDate(task.markedImportantAt)]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex gap-2 ml-4",
              children: [/* @__PURE__ */ jsx(Badge, {
                variant: "outline",
                className: getPriorityColor(task.priority),
                children: getPriority(task.priority, language)
              }), /* @__PURE__ */ jsx(Badge, {
                variant: "outline",
                className: getStatusColor(task.status),
                children: getTaskStatus(task.status, language)
              })]
            })]
          })
        }), /* @__PURE__ */ jsx(CardContent, {
          className: "pt-0",
          children: /* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between text-sm text-muted-foreground",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-4",
              children: [task.assignees && task.assignees.length > 0 && /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-1",
                children: [/* @__PURE__ */ jsx(User, {
                  className: "h-4 w-4"
                }), /* @__PURE__ */ jsx("span", {
                  children: task.assignees.length === 1 ? task.assignees[0].name : `${task.assignees.length} ${t("important_tasks.assignees")}`
                })]
              }), task.responsibleManager && /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-1",
                children: [/* @__PURE__ */ jsx(User, {
                  className: "h-4 w-4"
                }), /* @__PURE__ */ jsxs("span", {
                  children: [t("important_tasks.manager"), " ", typeof task.responsibleManager === "object" ? task.responsibleManager.name : t("important_tasks.not_specified")]
                })]
              }), task.dueDate && /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-1",
                children: [/* @__PURE__ */ jsx(Calendar$1, {
                  className: "h-4 w-4"
                }), /* @__PURE__ */ jsx("span", {
                  children: formatDueDateRussian(String(task.dueDate))
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-1",
              children: [/* @__PURE__ */ jsx(Clock, {
                className: "h-4 w-4"
              }), /* @__PURE__ */ jsx("span", {
                children: formatDateDetailedRussian(String(task.createdAt))
              })]
            })]
          })
        })]
      }, task._id))
    })]
  });
});
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: importantTasks
}, Symbol.toStringTag, { value: "Module" }));
function Progress({
  className,
  value,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    ProgressPrimitive.Root,
    {
      "data-slot": "progress",
      className: cn(
        "bg-blue-600/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        ProgressPrimitive.Indicator,
        {
          "data-slot": "progress-indicator",
          className: "bg-blue-600 h-full w-full flex-1 transition-all",
          style: { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      )
    }
  );
}
function meta$7({}) {
  return [{
    title: "TaskHub | Аналитика"
  }, {
    name: "description",
    content: "Аналитика задач в TaskHub!"
  }];
}
const STATUS_COLORS = {
  "To Do": "#3b82f6",
  "In Progress": "#f59e0b",
  "Done": "#10b981"
};
const PRIORITY_COLORS = {
  "High": "#ef4444",
  "Medium": "#f59e0b",
  "Low": "#10b981"
};
const AnalyticsPage = () => {
  const {
    t
  } = useLanguage();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("7days");
  const [selectedMember, setSelectedMember] = useState("all");
  const canViewAnalytics = (user == null ? void 0 : user.role) && ["admin", "manager", "super_admin"].includes(user.role);
  const {
    data: allTasks2,
    isPending: tasksLoading
  } = useQuery({
    queryKey: ["all-tasks-analytics"],
    queryFn: () => fetchData("/tasks/all-tasks"),
    enabled: canViewAnalytics
  });
  const {
    data: usersData,
    isPending: usersLoading
  } = useQuery({
    queryKey: ["all-users-analytics"],
    queryFn: () => fetchData("/users/all"),
    enabled: canViewAnalytics
  });
  if (!canViewAnalytics) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-center h-96",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx(AlertCircle, {
          className: "h-12 w-12 text-muted-foreground mx-auto mb-4"
        }), /* @__PURE__ */ jsx("h2", {
          className: "text-xl font-semibold mb-2",
          children: t("analytics.access_denied")
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: t("analytics.no_access_message")
        })]
      })
    });
  }
  if (tasksLoading || usersLoading) {
    return /* @__PURE__ */ jsx(Loader, {
      message: t("analytics.loading")
    });
  }
  const tasks = Array.isArray(allTasks2) ? allTasks2 : allTasks2 && allTasks2.tasks && Array.isArray(allTasks2.tasks) ? allTasks2.tasks : [];
  const users = usersData && typeof usersData === "object" && "users" in usersData && Array.isArray(usersData.users) ? usersData.users : [];
  const getFilteredTasksByTime = (tasks2) => {
    const now = /* @__PURE__ */ new Date();
    const filterDate = /* @__PURE__ */ new Date();
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
        return tasks2;
    }
    return tasks2.filter((task) => new Date(task.createdAt) >= filterDate);
  };
  const printChart = (chartId) => {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
      const printWindow = window.open("", "_blank");
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
  const statusData = [{
    name: t("status.todo"),
    value: filteredTasks.filter((t2) => t2.status === "To Do").length,
    color: STATUS_COLORS["To Do"]
  }, {
    name: t("status.in_progress"),
    value: filteredTasks.filter((t2) => t2.status === "In Progress").length,
    color: STATUS_COLORS["In Progress"]
  }, {
    name: t("status.done"),
    value: filteredTasks.filter((t2) => t2.status === "Done").length,
    color: STATUS_COLORS["Done"]
  }];
  const priorityData = [{
    name: t("priority.high"),
    value: filteredTasks.filter((t2) => t2.priority === "High").length,
    color: PRIORITY_COLORS["High"]
  }, {
    name: t("priority.medium"),
    value: filteredTasks.filter((t2) => t2.priority === "Medium").length,
    color: PRIORITY_COLORS["Medium"]
  }, {
    name: t("priority.low"),
    value: filteredTasks.filter((t2) => t2.priority === "Low").length,
    color: PRIORITY_COLORS["Low"]
  }];
  const memberTasksData = users.map((member) => {
    const memberTasks = filteredTasks.filter((task) => {
      var _a;
      return (_a = task.assignees) == null ? void 0 : _a.some((assignee) => assignee._id === member._id);
    });
    const total = memberTasks.length;
    const todo = memberTasks.filter((t2) => t2.status === "To Do").length;
    const inProgress = memberTasks.filter((t2) => t2.status === "In Progress").length;
    const done = memberTasks.filter((t2) => t2.status === "Done").length;
    return {
      name: member.name,
      total,
      todo,
      inProgress,
      done,
      todoPercent: total > 0 ? Math.round(todo / total * 100) : 0,
      inProgressPercent: total > 0 ? Math.round(inProgress / total * 100) : 0,
      donePercent: total > 0 ? Math.round(done / total * 100) : 0
    };
  }).filter((data) => data.total > 0);
  const selectedMemberData = selectedMember === "all" ? null : memberTasksData.find((data) => data.name === selectedMember);
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t2) => t2.status === "Done").length;
  const inProgressTasks = filteredTasks.filter((t2) => t2.status === "In Progress").length;
  const todoTasks = filteredTasks.filter((t2) => t2.status === "To Do").length;
  filteredTasks.filter((t2) => t2.priority === "High").length;
  const overdueTasks = filteredTasks.filter((t2) => t2.dueDate && new Date(t2.dueDate) < /* @__PURE__ */ new Date() && t2.status !== "Done").length;
  const completionRate = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  const getTimelineData = () => {
    const periods = [];
    const now = /* @__PURE__ */ new Date();
    if (timeFilter === "1day") {
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(date.getHours() - i);
        periods.push(date);
      }
    } else if (timeFilter === "7days") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        periods.push(date);
      }
    } else if (timeFilter === "1month") {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        periods.push(date);
      }
    } else if (timeFilter === "6months") {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        periods.push(date);
      }
    } else if (timeFilter === "1year") {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        periods.push(date);
      }
    }
    return periods.map((date) => {
      const periodTasks = tasks.filter((task) => {
        const taskDate = new Date(task.createdAt);
        if (timeFilter === "1day") {
          return taskDate.getDate() === date.getDate() && taskDate.getHours() === date.getHours();
        } else if (timeFilter === "7days" || timeFilter === "1month") {
          return taskDate.toDateString() === date.toDateString();
        } else {
          return taskDate.getMonth() === date.getMonth() && taskDate.getFullYear() === date.getFullYear();
        }
      });
      const formatLabel = () => {
        if (timeFilter === "1day") {
          return date.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit"
          });
        } else if (timeFilter === "7days" || timeFilter === "1month") {
          return date.toLocaleDateString("ru-RU", {
            month: "short",
            day: "numeric"
          });
        } else {
          return date.toLocaleDateString("ru-RU", {
            month: "short",
            year: "numeric"
          });
        }
      };
      return {
        date: formatLabel(),
        created: periodTasks.length,
        completed: periodTasks.filter((t2) => t2.status === "Done").length
      };
    });
  };
  const timelineData = getTimelineData();
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-6",
    children: [/* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-between",
      children: /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl md:text-3xl font-bold",
          children: t("analytics.title")
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: t("analytics.description")
        })]
      })
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsx(CardHeader, {
        children: /* @__PURE__ */ jsx(CardTitle, {
          children: t("analytics.filters")
        })
      }), /* @__PURE__ */ jsx(CardContent, {
        className: "space-y-4",
        children: /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col md:flex-row gap-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex-1",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium mb-2 block",
              children: t("analytics.time_period")
            }), /* @__PURE__ */ jsxs(Select, {
              value: timeFilter,
              onValueChange: setTimeFilter,
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                children: /* @__PURE__ */ jsx(SelectValue, {})
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "1day",
                  children: t("analytics.last_day")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "7days",
                  children: t("analytics.last_7_days")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "1month",
                  children: t("analytics.last_month")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "6months",
                  children: t("analytics.last_6_months")
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "1year",
                  children: t("analytics.last_year")
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex-1",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium mb-2 block",
              children: t("analytics.member")
            }), /* @__PURE__ */ jsxs(Select, {
              value: selectedMember,
              onValueChange: setSelectedMember,
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                children: /* @__PURE__ */ jsx(SelectValue, {})
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "all",
                  children: t("analytics.all_members")
                }), memberTasksData.map((member) => /* @__PURE__ */ jsxs(SelectItem, {
                  value: member.name,
                  children: [member.name, " (", member.total, " ", t("analytics.tasks_count_suffix"), ")"]
                }, member.name))]
              })]
            })]
          })]
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "grid gap-4 md:grid-cols-2 lg:grid-cols-5",
      children: [/* @__PURE__ */ jsxs(Card, {
        onClick: () => navigate("/dashboard/all-tasks"),
        className: "cursor-pointer hover:shadow-lg hover:border-primary transition-all",
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-sm font-medium",
            children: t("analytics.total_tasks")
          }), /* @__PURE__ */ jsx(TrendingUp, {
            className: "h-4 w-4 text-muted-foreground"
          })]
        }), /* @__PURE__ */ jsxs(CardContent, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "text-2xl font-bold",
            children: totalTasks
          }), /* @__PURE__ */ jsx("p", {
            className: "text-xs text-muted-foreground",
            children: t("analytics.for_selected_period")
          })]
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        onClick: () => navigate("/dashboard/all-tasks?status=To Do"),
        className: "cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all",
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-sm font-medium",
            children: "К выполнению"
          }), /* @__PURE__ */ jsx(ClipboardList, {
            className: "h-4 w-4 text-blue-600"
          })]
        }), /* @__PURE__ */ jsxs(CardContent, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "text-2xl font-bold text-blue-600",
            children: todoTasks
          }), /* @__PURE__ */ jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "Ожидают начала"
          })]
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        onClick: () => navigate("/dashboard/all-tasks?status=In Progress"),
        className: "cursor-pointer hover:shadow-lg hover:border-yellow-500 transition-all",
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-sm font-medium",
            children: t("analytics.in_progress")
          }), /* @__PURE__ */ jsx(Clock, {
            className: "h-4 w-4 text-yellow-600"
          })]
        }), /* @__PURE__ */ jsxs(CardContent, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "text-2xl font-bold text-yellow-600",
            children: inProgressTasks
          }), /* @__PURE__ */ jsx("p", {
            className: "text-xs text-muted-foreground",
            children: t("analytics.active_tasks")
          })]
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        onClick: () => navigate("/dashboard/all-tasks?status=Done"),
        className: "cursor-pointer hover:shadow-lg hover:border-green-500 transition-all",
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-sm font-medium",
            children: t("analytics.completed")
          }), /* @__PURE__ */ jsx(CheckCircle, {
            className: "h-4 w-4 text-green-600"
          })]
        }), /* @__PURE__ */ jsxs(CardContent, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "text-2xl font-bold text-green-600",
            children: completedTasks
          }), /* @__PURE__ */ jsx("p", {
            className: "text-xs text-muted-foreground",
            children: t("analytics.completion_rate").replace("{rate}", completionRate.toString())
          })]
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        onClick: () => navigate("/dashboard/all-tasks"),
        className: "cursor-pointer hover:shadow-lg hover:border-red-500 transition-all",
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-sm font-medium",
            children: t("analytics.overdue")
          }), /* @__PURE__ */ jsx(AlertCircle, {
            className: "h-4 w-4 text-red-600"
          })]
        }), /* @__PURE__ */ jsxs(CardContent, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "text-2xl font-bold text-red-600",
            children: overdueTasks
          }), /* @__PURE__ */ jsx("p", {
            className: "text-xs text-muted-foreground",
            children: t("analytics.require_attention")
          })]
        })]
      })]
    }), selectedMember === "all" ? /* @__PURE__ */ jsxs("div", {
      className: "grid gap-6 md:grid-cols-2",
      children: [/* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between",
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx(CardTitle, {
              children: t("analytics.status_distribution")
            }), /* @__PURE__ */ jsx(CardDescription, {
              children: t("analytics.status_distribution_desc")
            })]
          }), /* @__PURE__ */ jsx(Button, {
            variant: "outline",
            size: "sm",
            onClick: () => printChart("status-chart"),
            children: /* @__PURE__ */ jsx(Printer, {
              className: "h-4 w-4"
            })
          })]
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsx("div", {
            id: "status-chart",
            className: "h-80",
            children: /* @__PURE__ */ jsx(ResponsiveContainer, {
              width: "100%",
              height: "100%",
              children: /* @__PURE__ */ jsxs(PieChart, {
                children: [/* @__PURE__ */ jsx(Pie, {
                  data: statusData,
                  cx: "50%",
                  cy: "50%",
                  labelLine: false,
                  label: ({
                    name,
                    value,
                    percent
                  }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`,
                  outerRadius: 80,
                  fill: "#8884d8",
                  dataKey: "value",
                  children: statusData.map((entry2, index2) => /* @__PURE__ */ jsx(Cell, {
                    fill: entry2.color
                  }, `cell-${index2}`))
                }), /* @__PURE__ */ jsx(Tooltip, {}), /* @__PURE__ */ jsx(Legend, {})]
              })
            })
          })
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between",
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx(CardTitle, {
              children: t("analytics.priority_distribution")
            }), /* @__PURE__ */ jsx(CardDescription, {
              children: t("analytics.priority_distribution_desc")
            })]
          }), /* @__PURE__ */ jsx(Button, {
            variant: "outline",
            size: "sm",
            onClick: () => printChart("priority-chart"),
            children: /* @__PURE__ */ jsx(Printer, {
              className: "h-4 w-4"
            })
          })]
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsx("div", {
            id: "priority-chart",
            className: "h-80",
            children: /* @__PURE__ */ jsx(ResponsiveContainer, {
              width: "100%",
              height: "100%",
              children: /* @__PURE__ */ jsxs(PieChart, {
                children: [/* @__PURE__ */ jsx(Pie, {
                  data: priorityData,
                  cx: "50%",
                  cy: "50%",
                  labelLine: false,
                  label: ({
                    name,
                    value,
                    percent
                  }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`,
                  outerRadius: 80,
                  fill: "#8884d8",
                  dataKey: "value",
                  children: priorityData.map((entry2, index2) => /* @__PURE__ */ jsx(Cell, {
                    fill: entry2.color
                  }, `cell-${index2}`))
                }), /* @__PURE__ */ jsx(Tooltip, {}), /* @__PURE__ */ jsx(Legend, {})]
              })
            })
          })
        })]
      })]
    }) : selectedMemberData && /* @__PURE__ */ jsxs("div", {
      className: "grid gap-6 md:grid-cols-2",
      children: [/* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between",
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx(CardTitle, {
              children: t("analytics.member_tasks").replace("{name}", selectedMemberData.name)
            }), /* @__PURE__ */ jsx(CardDescription, {
              children: t("analytics.total_tasks_count").replace("{count}", selectedMemberData.total.toString())
            })]
          }), /* @__PURE__ */ jsx(Button, {
            variant: "outline",
            size: "sm",
            onClick: () => printChart("member-chart"),
            children: /* @__PURE__ */ jsx(Printer, {
              className: "h-4 w-4"
            })
          })]
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsx("div", {
            id: "member-chart",
            className: "h-80",
            children: /* @__PURE__ */ jsx(ResponsiveContainer, {
              width: "100%",
              height: "100%",
              children: /* @__PURE__ */ jsxs(PieChart, {
                children: [/* @__PURE__ */ jsx(Pie, {
                  data: [{
                    name: t("status.todo"),
                    value: selectedMemberData.todo,
                    color: STATUS_COLORS["To Do"]
                  }, {
                    name: t("status.in_progress"),
                    value: selectedMemberData.inProgress,
                    color: STATUS_COLORS["In Progress"]
                  }, {
                    name: t("status.done"),
                    value: selectedMemberData.done,
                    color: STATUS_COLORS["Done"]
                  }],
                  cx: "50%",
                  cy: "50%",
                  labelLine: false,
                  label: ({
                    name,
                    value,
                    percent
                  }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`,
                  outerRadius: 80,
                  fill: "#8884d8",
                  dataKey: "value",
                  children: [{
                    name: t("status.todo"),
                    value: selectedMemberData.todo,
                    color: STATUS_COLORS["To Do"]
                  }, {
                    name: t("status.in_progress"),
                    value: selectedMemberData.inProgress,
                    color: STATUS_COLORS["In Progress"]
                  }, {
                    name: t("status.done"),
                    value: selectedMemberData.done,
                    color: STATUS_COLORS["Done"]
                  }].map((entry2, index2) => /* @__PURE__ */ jsx(Cell, {
                    fill: entry2.color
                  }, `cell-${index2}`))
                }), /* @__PURE__ */ jsx(Tooltip, {}), /* @__PURE__ */ jsx(Legend, {})]
              })
            })
          })
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          children: [/* @__PURE__ */ jsx(CardTitle, {
            children: t("analytics.detailed_stats")
          }), /* @__PURE__ */ jsx(CardDescription, {
            children: t("analytics.percentage_ratio")
          })]
        }), /* @__PURE__ */ jsxs(CardContent, {
          className: "space-y-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-sm",
                children: t("status.todo")
              }), /* @__PURE__ */ jsxs("span", {
                className: "text-sm font-medium",
                children: [selectedMemberData.todo, " (", selectedMemberData.todoPercent, "%)"]
              })]
            }), /* @__PURE__ */ jsx(Progress, {
              value: selectedMemberData.todoPercent,
              className: "h-2"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-sm",
                children: t("status.in_progress")
              }), /* @__PURE__ */ jsxs("span", {
                className: "text-sm font-medium",
                children: [selectedMemberData.inProgress, " (", selectedMemberData.inProgressPercent, "%)"]
              })]
            }), /* @__PURE__ */ jsx(Progress, {
              value: selectedMemberData.inProgressPercent,
              className: "h-2"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-sm",
                children: t("status.done")
              }), /* @__PURE__ */ jsxs("span", {
                className: "text-sm font-medium",
                children: [selectedMemberData.done, " (", selectedMemberData.donePercent, "%)"]
              })]
            }), /* @__PURE__ */ jsx(Progress, {
              value: selectedMemberData.donePercent,
              className: "h-2"
            })]
          })]
        })]
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        className: "flex flex-row items-center justify-between",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx(CardTitle, {
            children: t("analytics.member_stats")
          }), /* @__PURE__ */ jsx(CardDescription, {
            children: t("analytics.member_stats_desc")
          })]
        }), /* @__PURE__ */ jsx(Button, {
          variant: "outline",
          size: "sm",
          onClick: () => printChart("members-chart"),
          children: /* @__PURE__ */ jsx(Printer, {
            className: "h-4 w-4"
          })
        })]
      }), /* @__PURE__ */ jsx(CardContent, {
        children: /* @__PURE__ */ jsx("div", {
          id: "members-chart",
          className: "h-80",
          children: /* @__PURE__ */ jsx(ResponsiveContainer, {
            width: "100%",
            height: "100%",
            children: /* @__PURE__ */ jsxs(BarChart, {
              data: memberTasksData,
              children: [/* @__PURE__ */ jsx(CartesianGrid, {
                strokeDasharray: "3 3"
              }), /* @__PURE__ */ jsx(XAxis, {
                dataKey: "name"
              }), /* @__PURE__ */ jsx(YAxis, {}), /* @__PURE__ */ jsx(Tooltip, {}), /* @__PURE__ */ jsx(Legend, {}), /* @__PURE__ */ jsx(Bar, {
                dataKey: "done",
                fill: STATUS_COLORS["Done"],
                name: t("status.done")
              }), /* @__PURE__ */ jsx(Bar, {
                dataKey: "inProgress",
                fill: STATUS_COLORS["In Progress"],
                name: t("status.in_progress")
              }), /* @__PURE__ */ jsx(Bar, {
                dataKey: "todo",
                fill: STATUS_COLORS["To Do"],
                name: t("status.todo")
              })]
            })
          })
        })
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        className: "flex flex-row items-center justify-between",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx(CardTitle, {
            children: t("analytics.activity_timeline")
          }), /* @__PURE__ */ jsx(CardDescription, {
            children: t("analytics.activity_timeline_desc")
          })]
        }), /* @__PURE__ */ jsx(Button, {
          variant: "outline",
          size: "sm",
          onClick: () => printChart("timeline-chart"),
          children: /* @__PURE__ */ jsx(Printer, {
            className: "h-4 w-4"
          })
        })]
      }), /* @__PURE__ */ jsx(CardContent, {
        children: /* @__PURE__ */ jsx("div", {
          id: "timeline-chart",
          className: "h-80",
          children: /* @__PURE__ */ jsx(ResponsiveContainer, {
            width: "100%",
            height: "100%",
            children: /* @__PURE__ */ jsxs(BarChart, {
              data: timelineData,
              children: [/* @__PURE__ */ jsx(CartesianGrid, {
                strokeDasharray: "3 3"
              }), /* @__PURE__ */ jsx(XAxis, {
                dataKey: "date"
              }), /* @__PURE__ */ jsx(YAxis, {}), /* @__PURE__ */ jsx(Tooltip, {}), /* @__PURE__ */ jsx(Legend, {}), /* @__PURE__ */ jsx(Bar, {
                dataKey: "created",
                fill: "#3b82f6",
                name: t("analytics.created")
              }), /* @__PURE__ */ jsx(Bar, {
                dataKey: "completed",
                fill: "#10b981",
                name: t("analytics.completed_tasks")
              })]
            })
          })
        })
      })]
    })]
  });
};
const analytics = withComponentProps(AnalyticsPage);
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: analytics,
  meta: meta$7
}, Symbol.toStringTag, { value: "Module" }));
function meta$6({}) {
  return [{
    title: "TaskHub | Участники"
  }, {
    name: "description",
    content: "Управление участниками в TaskHub!"
  }];
}
const MembersPage = () => {
  const {
    user
  } = useAuth();
  const queryClient2 = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("member");
  const canManageMembers = (user == null ? void 0 : user.role) && ["admin", "super_admin", "manager"].includes(user.role);
  const canChangeRoles = (user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "super_admin";
  const {
    data: usersData,
    isPending: usersLoading
  } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => fetchData("/users/all"),
    enabled: canManageMembers
  });
  const {
    data: allTasks2,
    isPending: tasksLoading
  } = useQuery({
    queryKey: ["all-tasks-for-stats"],
    queryFn: () => fetchData("/tasks/all-tasks"),
    enabled: canManageMembers
  });
  const changeRoleMutation = useMutation({
    mutationFn: (data) => updateData(`/admin/users/${data.userId}/role`, {
      role: data.role
    }),
    onSuccess: () => {
      toast.success("Роль пользователя успешно изменена");
      queryClient2.invalidateQueries({
        queryKey: ["all-users"]
      });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка изменения роли");
    }
  });
  if (!canManageMembers) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-center h-96",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx(AlertCircle, {
          className: "h-12 w-12 text-muted-foreground mx-auto mb-4"
        }), /* @__PURE__ */ jsx("h2", {
          className: "text-xl font-semibold mb-2",
          children: "Доступ запрещен"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: "У вас нет прав для просмотра участников. Обратитесь к администратору."
        })]
      })
    });
  }
  if (usersLoading || tasksLoading) {
    return /* @__PURE__ */ jsx(Loader, {
      message: "Загрузка участников..."
    });
  }
  const users = usersData && typeof usersData === "object" && "users" in usersData && Array.isArray(usersData.users) ? usersData.users : [];
  const tasks = Array.isArray(allTasks2) ? allTasks2 : allTasks2 && allTasks2.tasks && Array.isArray(allTasks2.tasks) ? allTasks2.tasks : [];
  const memberTaskCounts = /* @__PURE__ */ new Map();
  tasks.forEach((task) => {
    if (task.assignees) {
      task.assignees.forEach((assignee) => {
        const existing = memberTaskCounts.get(assignee._id) || {
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0
        };
        existing.total++;
        if (task.status === "Done") existing.completed++;
        else if (task.status === "In Progress") existing.inProgress++;
        else if (task.status === "To Do") existing.todo++;
        memberTaskCounts.set(assignee._id, existing);
      });
    }
  });
  const filteredMembers = users.filter((member) => {
    const matchesSearch = (member.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (member.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return /* @__PURE__ */ jsx(Crown, {
          className: "h-4 w-4 text-yellow-600"
        });
      case "manager":
        return /* @__PURE__ */ jsx(Shield, {
          className: "h-4 w-4 text-blue-600"
        });
      default:
        return /* @__PURE__ */ jsx(User, {
          className: "h-4 w-4 text-gray-600"
        });
    }
  };
  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "manager":
        return "Менеджер";
      default:
        return "Участник";
    }
  };
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };
  const handleChangeRole = (member) => {
    setSelectedUser(member);
    setNewRole(member.role);
    setIsRoleDialogOpen(true);
  };
  const confirmRoleChange = () => {
    if (selectedUser) {
      changeRoleMutation.mutate({
        userId: selectedUser._id,
        role: newRole
      });
    }
  };
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    managers: users.filter((u) => u.role === "manager").length,
    members: users.filter((u) => u.role === "member").length
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-6",
    children: [/* @__PURE__ */ jsx("div", {
      className: "flex items-center justify-between",
      children: /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl md:text-3xl font-bold",
          children: "Участники"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: "Управление участниками и их ролями"
        })]
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "grid gap-4 md:grid-cols-4",
      children: [/* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-sm font-medium",
            children: "Всего участников"
          }), /* @__PURE__ */ jsx(Users, {
            className: "h-4 w-4 text-muted-foreground"
          })]
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsx("div", {
            className: "text-2xl font-bold",
            children: stats.total
          })
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-sm font-medium",
            children: "Администраторы"
          }), /* @__PURE__ */ jsx(Crown, {
            className: "h-4 w-4 text-yellow-600"
          })]
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsx("div", {
            className: "text-2xl font-bold text-yellow-600",
            children: stats.admins
          })
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-sm font-medium",
            children: "Менеджеры"
          }), /* @__PURE__ */ jsx(Shield, {
            className: "h-4 w-4 text-blue-600"
          })]
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsx("div", {
            className: "text-2xl font-bold text-blue-600",
            children: stats.managers
          })
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between space-y-0 pb-2",
          children: [/* @__PURE__ */ jsx(CardTitle, {
            className: "text-sm font-medium",
            children: "Участники"
          }), /* @__PURE__ */ jsx(User, {
            className: "h-4 w-4 text-gray-600"
          })]
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsx("div", {
            className: "text-2xl font-bold text-gray-600",
            children: stats.members
          })
        })]
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsx(CardHeader, {
        children: /* @__PURE__ */ jsx(CardTitle, {
          children: "Поиск и фильтры"
        })
      }), /* @__PURE__ */ jsx(CardContent, {
        className: "space-y-4",
        children: /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col md:flex-row gap-4",
          children: [/* @__PURE__ */ jsx("div", {
            className: "flex-1",
            children: /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx(Search, {
                className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              }), /* @__PURE__ */ jsx(Input, {
                placeholder: "Поиск по имени или email...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-10"
              })]
            })
          }), /* @__PURE__ */ jsxs(Select, {
            value: roleFilter,
            onValueChange: setRoleFilter,
            children: [/* @__PURE__ */ jsx(SelectTrigger, {
              className: "w-full md:w-48",
              children: /* @__PURE__ */ jsx(SelectValue, {
                placeholder: "Роль"
              })
            }), /* @__PURE__ */ jsxs(SelectContent, {
              children: [/* @__PURE__ */ jsx(SelectItem, {
                value: "all",
                children: "Все роли"
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "admin",
                children: "Администраторы"
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "manager",
                children: "Менеджеры"
              }), /* @__PURE__ */ jsx(SelectItem, {
                value: "member",
                children: "Участники"
              })]
            })]
          })]
        })
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsx(CardHeader, {
        children: /* @__PURE__ */ jsxs(CardTitle, {
          children: ["Участники (", filteredMembers.length, " из ", users.length, ")"]
        })
      }), /* @__PURE__ */ jsx(CardContent, {
        children: /* @__PURE__ */ jsx("div", {
          className: "rounded-md border",
          children: /* @__PURE__ */ jsxs(Table, {
            children: [/* @__PURE__ */ jsx(TableHeader, {
              children: /* @__PURE__ */ jsxs(TableRow, {
                children: [/* @__PURE__ */ jsx(TableHead, {
                  children: "Пользователь"
                }), /* @__PURE__ */ jsx(TableHead, {
                  children: "Роль"
                }), /* @__PURE__ */ jsx(TableHead, {
                  children: "Задачи"
                }), /* @__PURE__ */ jsx(TableHead, {
                  children: "Дата регистрации"
                }), canChangeRoles && /* @__PURE__ */ jsx(TableHead, {
                  children: "Действия"
                })]
              })
            }), /* @__PURE__ */ jsxs(TableBody, {
              children: [filteredMembers.map((member) => {
                const taskStats = memberTaskCounts.get(member._id) || {
                  total: 0,
                  completed: 0,
                  inProgress: 0,
                  todo: 0
                };
                return /* @__PURE__ */ jsxs(TableRow, {
                  children: [/* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsxs("div", {
                      className: "flex items-center gap-3",
                      children: [/* @__PURE__ */ jsxs(Avatar, {
                        className: "h-10 w-10",
                        children: [/* @__PURE__ */ jsx(AvatarImage, {
                          src: member.profilePicture
                        }), /* @__PURE__ */ jsx(AvatarFallback, {
                          children: (member.name || "U").charAt(0)
                        })]
                      }), /* @__PURE__ */ jsxs("div", {
                        children: [/* @__PURE__ */ jsx("div", {
                          className: "font-medium",
                          children: member.name || "Без имени"
                        }), /* @__PURE__ */ jsx("div", {
                          className: "text-sm text-muted-foreground",
                          children: member.email || "Без email"
                        })]
                      })]
                    })
                  }), /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [getRoleIcon(member.role || "member"), /* @__PURE__ */ jsx(Badge, {
                        variant: getRoleBadgeVariant(member.role || "member"),
                        children: getRoleLabel(member.role || "member")
                      })]
                    })
                  }), /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsxs("div", {
                      className: "space-y-1",
                      children: [/* @__PURE__ */ jsxs("div", {
                        className: "text-sm font-medium",
                        children: ["Всего: ", taskStats.total]
                      }), /* @__PURE__ */ jsxs("div", {
                        className: "flex items-center gap-4 text-xs text-muted-foreground",
                        children: [/* @__PURE__ */ jsxs("div", {
                          className: "flex items-center gap-1",
                          children: [/* @__PURE__ */ jsx("div", {
                            className: "h-3 w-3 rounded-full bg-blue-600"
                          }), taskStats.todo]
                        }), /* @__PURE__ */ jsxs("div", {
                          className: "flex items-center gap-1",
                          children: [/* @__PURE__ */ jsx(Clock, {
                            className: "h-3 w-3 text-yellow-600"
                          }), taskStats.inProgress]
                        }), /* @__PURE__ */ jsxs("div", {
                          className: "flex items-center gap-1",
                          children: [/* @__PURE__ */ jsx(CheckCircle, {
                            className: "h-3 w-3 text-green-600"
                          }), taskStats.completed]
                        })]
                      })]
                    })
                  }), /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsx("span", {
                      className: "text-sm text-muted-foreground",
                      children: member.createdAt ? formatDateDetailedRussian(member.createdAt) : "Дата не указана"
                    })
                  }), canChangeRoles && /* @__PURE__ */ jsx(TableCell, {
                    children: /* @__PURE__ */ jsxs(DropdownMenu, {
                      children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
                        asChild: true,
                        children: /* @__PURE__ */ jsx(Button, {
                          variant: "ghost",
                          size: "sm",
                          children: /* @__PURE__ */ jsx(MoreHorizontal, {
                            className: "h-4 w-4"
                          })
                        })
                      }), /* @__PURE__ */ jsxs(DropdownMenuContent, {
                        align: "end",
                        children: [/* @__PURE__ */ jsx(DropdownMenuLabel, {
                          children: "Действия"
                        }), /* @__PURE__ */ jsx(DropdownMenuSeparator, {}), /* @__PURE__ */ jsxs(DropdownMenuItem, {
                          onClick: () => handleChangeRole(member),
                          children: [/* @__PURE__ */ jsx(Settings, {
                            className: "h-4 w-4 mr-2"
                          }), "Изменить роль"]
                        })]
                      })]
                    })
                  })]
                }, member._id);
              }), filteredMembers.length === 0 && /* @__PURE__ */ jsx(TableRow, {
                children: /* @__PURE__ */ jsx(TableCell, {
                  colSpan: canChangeRoles ? 5 : 4,
                  className: "text-center py-8",
                  children: /* @__PURE__ */ jsx("div", {
                    className: "text-muted-foreground",
                    children: "Участников, соответствующих критериям, не найдено"
                  })
                })
              })]
            })]
          })
        })
      })]
    }), /* @__PURE__ */ jsx(Dialog, {
      open: isRoleDialogOpen,
      onOpenChange: setIsRoleDialogOpen,
      children: /* @__PURE__ */ jsxs(DialogContent, {
        children: [/* @__PURE__ */ jsxs(DialogHeader, {
          children: [/* @__PURE__ */ jsx(DialogTitle, {
            children: "Изменить роль пользователя"
          }), /* @__PURE__ */ jsxs(DialogDescription, {
            children: ["Изменение роли пользователя ", selectedUser == null ? void 0 : selectedUser.name]
          })]
        }), /* @__PURE__ */ jsx("div", {
          className: "space-y-4",
          children: /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium",
              children: "Новая роль"
            }), /* @__PURE__ */ jsxs(Select, {
              value: newRole,
              onValueChange: (value) => setNewRole(value),
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                className: "w-full",
                children: /* @__PURE__ */ jsx(SelectValue, {})
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "admin",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */ jsx(Crown, {
                      className: "h-4 w-4 text-yellow-600"
                    }), "Администратор"]
                  })
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "manager",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */ jsx(Shield, {
                      className: "h-4 w-4 text-blue-600"
                    }), "Менеджер"]
                  })
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "member",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */ jsx(User, {
                      className: "h-4 w-4 text-gray-600"
                    }), "Участник"]
                  })
                })]
              })]
            })]
          })
        }), /* @__PURE__ */ jsxs(DialogFooter, {
          children: [/* @__PURE__ */ jsx(Button, {
            variant: "outline",
            onClick: () => setIsRoleDialogOpen(false),
            children: "Отмена"
          }), /* @__PURE__ */ jsx(Button, {
            onClick: confirmRoleChange,
            disabled: changeRoleMutation.isPending,
            children: changeRoleMutation.isPending ? "Изменение..." : "Изменить роль"
          })]
        })]
      })
    })]
  });
};
const members = withComponentProps(MembersPage);
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: members,
  meta: meta$6
}, Symbol.toStringTag, { value: "Module" }));
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SeparatorPrimitive.Root,
    {
      "data-slot": "separator-root",
      decorative,
      orientation,
      className: cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      ),
      ...props
    }
  );
}
function meta$5({}) {
  return [{
    title: "Vazifa | Настройки системы"
  }, {
    name: "description",
    content: "Настройки системы в Vazifa!"
  }];
}
const WorkspaceSetting = () => {
  const {
    user
  } = useAuth();
  const [settings, setSettings] = useState({
    systemName: "Vazifa Task Management",
    systemDescription: "Система управления задачами",
    maxTasksPerUser: 100,
    defaultTaskPriority: "Medium",
    emailNotifications: true,
    taskReminders: true
  });
  const handleSaveSettings = () => {
    toast.success("Настройки сохранены успешно!");
  };
  const isAdmin = (user == null ? void 0 : user.role) === "admin";
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-6",
    children: [/* @__PURE__ */ jsxs("div", {
      children: [/* @__PURE__ */ jsxs("h2", {
        className: "text-2xl font-bold flex items-center gap-2",
        children: [/* @__PURE__ */ jsx(Settings, {
          className: "h-6 w-6"
        }), "Настройки системы"]
      }), /* @__PURE__ */ jsx("p", {
        className: "text-muted-foreground",
        children: "Управляйте настройками системы управления задачами"
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        children: [/* @__PURE__ */ jsxs(CardTitle, {
          className: "flex items-center gap-2",
          children: [/* @__PURE__ */ jsx(Database, {
            className: "h-5 w-5"
          }), "Информация о системе"]
        }), /* @__PURE__ */ jsx(CardDescription, {
          children: "Основная информация о системе"
        })]
      }), /* @__PURE__ */ jsxs(CardContent, {
        className: "space-y-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-2 gap-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Название системы"
            }), /* @__PURE__ */ jsx("div", {
              className: "text-sm font-medium",
              children: settings.systemName
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Версия"
            }), /* @__PURE__ */ jsx("div", {
              className: "text-sm font-medium",
              children: "1.0.0"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsx(Label, {
            children: "Описание"
          }), /* @__PURE__ */ jsx("div", {
            className: "text-sm text-muted-foreground",
            children: settings.systemDescription
          })]
        })]
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        children: [/* @__PURE__ */ jsxs(CardTitle, {
          className: "flex items-center gap-2",
          children: [/* @__PURE__ */ jsx(User, {
            className: "h-5 w-5"
          }), "Профиль пользователя"]
        }), /* @__PURE__ */ jsx(CardDescription, {
          children: "Информация о текущем пользователе"
        })]
      }), /* @__PURE__ */ jsxs(CardContent, {
        className: "space-y-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-2 gap-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Имя"
            }), /* @__PURE__ */ jsx(Input, {
              value: (user == null ? void 0 : user.name) || "",
              readOnly: true,
              className: "bg-muted"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Email"
            }), /* @__PURE__ */ jsx(Input, {
              value: (user == null ? void 0 : user.email) || "",
              readOnly: true,
              className: "bg-muted"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-2 gap-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Роль"
            }), /* @__PURE__ */ jsx(Input, {
              value: (user == null ? void 0 : user.role) === "admin" ? "Администратор" : (user == null ? void 0 : user.role) === "manager" ? "Менеджер" : "Участник",
              readOnly: true,
              className: "bg-muted"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Статус email"
            }), /* @__PURE__ */ jsx(Input, {
              value: (user == null ? void 0 : user.isEmailVerified) ? "Подтвержден" : "Не подтвержден",
              readOnly: true,
              className: "bg-muted"
            })]
          })]
        })]
      })]
    }), isAdmin && /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        children: [/* @__PURE__ */ jsxs(CardTitle, {
          className: "flex items-center gap-2",
          children: [/* @__PURE__ */ jsx(Shield, {
            className: "h-5 w-5"
          }), "Настройки задач"]
        }), /* @__PURE__ */ jsx(CardDescription, {
          children: "Системные настройки для управления задачами (только для администраторов)"
        })]
      }), /* @__PURE__ */ jsxs(CardContent, {
        className: "space-y-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-2 gap-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx(Label, {
              htmlFor: "maxTasks",
              children: "Максимум задач на пользователя"
            }), /* @__PURE__ */ jsx(Input, {
              id: "maxTasks",
              type: "number",
              value: settings.maxTasksPerUser,
              onChange: (e) => setSettings((prev) => ({
                ...prev,
                maxTasksPerUser: parseInt(e.target.value) || 100
              }))
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx(Label, {
              htmlFor: "defaultPriority",
              children: "Приоритет по умолчанию"
            }), /* @__PURE__ */ jsxs("select", {
              id: "defaultPriority",
              className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
              value: settings.defaultTaskPriority,
              onChange: (e) => setSettings((prev) => ({
                ...prev,
                defaultTaskPriority: e.target.value
              })),
              children: [/* @__PURE__ */ jsx("option", {
                value: "Low",
                children: "Низкий"
              }), /* @__PURE__ */ jsx("option", {
                value: "Medium",
                children: "Средний"
              }), /* @__PURE__ */ jsx("option", {
                value: "High",
                children: "Высокий"
              })]
            })]
          })]
        }), /* @__PURE__ */ jsx(Separator, {}), /* @__PURE__ */ jsx("div", {
          className: "flex justify-end",
          children: /* @__PURE__ */ jsx(Button, {
            onClick: handleSaveSettings,
            children: "Сохранить настройки"
          })
        })]
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        children: [/* @__PURE__ */ jsxs(CardTitle, {
          className: "flex items-center gap-2",
          children: [/* @__PURE__ */ jsx(Bell, {
            className: "h-5 w-5"
          }), "Уведомления"]
        }), /* @__PURE__ */ jsx(CardDescription, {
          children: "Настройки уведомлений"
        })]
      }), /* @__PURE__ */ jsxs(CardContent, {
        className: "space-y-4",
        children: [/* @__PURE__ */ jsx("div", {
          className: "text-sm text-muted-foreground",
          children: "Настройки уведомлений будут добавлены в следующих обновлениях."
        }), /* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Email уведомления"
            }), /* @__PURE__ */ jsx("div", {
              className: "text-sm text-muted-foreground",
              children: "Скоро"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Напоминания о задачах"
            }), /* @__PURE__ */ jsx("div", {
              className: "text-sm text-muted-foreground",
              children: "Скоро"
            })]
          })]
        })]
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        children: [/* @__PURE__ */ jsxs(CardTitle, {
          className: "flex items-center gap-2",
          children: [/* @__PURE__ */ jsx(Palette, {
            className: "h-5 w-5"
          }), "Внешний вид"]
        }), /* @__PURE__ */ jsx(CardDescription, {
          children: "Настройки темы и внешнего вида"
        })]
      }), /* @__PURE__ */ jsxs(CardContent, {
        className: "space-y-4",
        children: [/* @__PURE__ */ jsx("div", {
          className: "text-sm text-muted-foreground",
          children: "Настройки темы будут добавлены в следующих обновлениях."
        }), /* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Темная тема"
            }), /* @__PURE__ */ jsx("div", {
              className: "text-sm text-muted-foreground",
              children: "Скоро"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between",
            children: [/* @__PURE__ */ jsx(Label, {
              children: "Цветовая схема"
            }), /* @__PURE__ */ jsx("div", {
              className: "text-sm text-muted-foreground",
              children: "Скоро"
            })]
          })]
        })]
      })]
    })]
  });
};
const workspaceSetting = withComponentProps(WorkspaceSetting);
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: workspaceSetting,
  meta: meta$5
}, Symbol.toStringTag, { value: "Module" }));
const TaskTitle = ({
  title,
  taskId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const { mutate, isPending } = useUpdateTaskTitleMutation();
  const updateTaskTitle = async () => {
    mutate(
      { taskId, title: newTitle },
      {
        onSuccess: () => {
          toast.success("Task title updated successfully");
          setIsEditing(false);
        },
        onError: (error) => {
          toast.error("Failed to update task title");
          console.error(error);
        }
      }
    );
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    isEditing ? /* @__PURE__ */ jsx(
      Input,
      {
        className: "text-xl font-semibold w-full min-w-3xl",
        value: newTitle,
        onChange: (e) => setNewTitle(e.target.value),
        disabled: isPending
      }
    ) : /* @__PURE__ */ jsx("h2", { className: "text-xl flex-1 font-semibold", children: title }),
    isEditing ? /* @__PURE__ */ jsx(
      Button,
      {
        className: "py-0",
        size: "sm",
        disabled: isPending,
        onClick: updateTaskTitle,
        children: isPending ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : "Save"
      }
    ) : /* @__PURE__ */ jsx(
      Edit,
      {
        className: "w-3 h-3 cursor-pointer",
        onClick: () => setIsEditing(true)
      }
    )
  ] });
};
const TaskDescription = ({
  description,
  taskId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newDescription, setNewDescription] = useState(description);
  const { mutate, isPending } = useUpdateTaskDescriptionMutation();
  const updateTaskDescription = async () => {
    mutate(
      { taskId, description: newDescription },
      {
        onSuccess: () => {
          toast.success("Task description updated successfully");
          setIsEditing(false);
        },
        onError: (error) => {
          toast.error("Failed to update task description");
          console.error(error);
        }
      }
    );
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
    isEditing ? /* @__PURE__ */ jsx(
      Textarea,
      {
        className: "w-full min-w-3xl",
        value: newDescription,
        onChange: (e) => setNewDescription(e.target.value),
        disabled: isPending
      }
    ) : /* @__PURE__ */ jsx("div", { className: "bg-muted/50 p-4 rounded-md text-sm md:text-base text-pretty text-muted-foreground", children: description }),
    isEditing ? /* @__PURE__ */ jsx(
      Button,
      {
        className: "py-0",
        size: "sm",
        disabled: isPending,
        onClick: updateTaskDescription,
        children: isPending ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : "Save"
      }
    ) : /* @__PURE__ */ jsx(
      Edit,
      {
        className: "min-w-4 min-h-4 w=4 h-4 cursor-pointer",
        onClick: () => setIsEditing(true)
      }
    )
  ] });
};
const TaskAttachments = ({
  attachments,
  taskId
}) => {
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { mutate: addTaskAttachment, isPending: isAddingAttachment } = useAddTaskAttachmentMutation();
  const resetForm = () => {
    setAttachmentName("");
    setAttachmentUrl("");
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setError("");
    setSuccess("");
  };
  const handleAddAttachment = async () => {
    setError("");
    setSuccess("");
    if (activeTab === "upload") {
      if (!file) {
        setError("Please select a file to upload.");
        return;
      }
      if (file.size > 1024 * 1024) {
        setError("File size must be less than 1MB.");
        return;
      }
      setUploading(true);
      setUploadProgress(0);
      try {
        const url = `${"https://ptapi.oci.tj"}/upload`;
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("token");
        const response = await axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setUploadProgress(
                Math.round(progressEvent.loaded * 100 / progressEvent.total)
              );
            }
          }
        });
        const uploadedUrl = response.data.data.secure_url;
        const fileType = response.data.data.mimetype || response.data.data.resource_type;
        const fileSize = response.data.data.bytes;
        const fileName = response.data.data.original_filename;
        addTaskAttachment(
          {
            taskId,
            attachment: {
              fileName,
              fileUrl: uploadedUrl,
              fileType,
              fileSize
            }
          },
          {
            onSuccess: () => {
              setSuccess("File uploaded successfully!");
              setTimeout(() => {
                resetForm();
                setShowAttachmentForm(false);
              }, 3e3);
            },
            onError: (error2) => {
              setError("Upload failed. Please try again.");
              console.error(error2);
            }
          }
        );
      } catch (err) {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    } else {
      if (!attachmentName || !attachmentUrl) {
        setError("Please provide both file name and URL.");
        return;
      }
      addTaskAttachment(
        {
          taskId,
          attachment: {
            fileName: attachmentName,
            fileUrl: attachmentUrl,
            fileType: "URL",
            fileSize: 0
          }
        },
        {
          onSuccess: () => {
            setSuccess("Attachment added by URL!");
            setTimeout(() => {
              resetForm();
              setShowAttachmentForm(false);
            }, 3e3);
          },
          onError: (error2) => {
            setError("Upload failed. Please try again.");
            console.error(error2);
          }
        }
      );
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-medium text-muted-foreground flex items-center", children: [
        /* @__PURE__ */ jsx(Paperclip, { className: "h-4 w-4 mr-2" }),
        " Вложения"
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => setShowAttachmentForm(!showAttachmentForm),
          children: [
            /* @__PURE__ */ jsx(Paperclip, { className: "h-4 w-4 mr-1" }),
            "Добавить"
          ]
        }
      )
    ] }),
    showAttachmentForm && /* @__PURE__ */ jsxs("div", { className: "bg-muted/30 p-6 rounded-xl mb-4 shadow-lg border border-muted/50", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex mb-4 border-b border-muted/40", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: `flex-1 py-2 px-4 text-sm font-medium rounded-t-lg transition-colors duration-150 ${activeTab === "upload" ? "bg-background text-primary" : "text-muted-foreground hover:text-primary"}`,
            onClick: () => setActiveTab("upload"),
            type: "button",
            children: [
              /* @__PURE__ */ jsx(UploadCloud, { className: "inline h-4 w-4 mr-1" }),
              " Загрузить"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: `flex-1 py-2 px-4 text-sm font-medium rounded-t-lg transition-colors duration-150 ${activeTab === "url" ? "bg-background text-primary" : "text-muted-foreground hover:text-primary"}`,
            onClick: () => setActiveTab("url"),
            type: "button",
            children: [
              /* @__PURE__ */ jsx(Link2, { className: "inline h-4 w-4 mr-1" }),
              " По URL-адресу"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4", children: [
        activeTab === "upload" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "file",
              accept: "*",
              onChange: (e) => {
                var _a;
                return setFile(((_a = e.target.files) == null ? void 0 : _a[0]) || null);
              },
              disabled: uploading || isAddingAttachment
            }
          ),
          file && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
            "Выбрано: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: file.name }),
            " (",
            Math.round(file.size / 1024),
            " KB)"
          ] }),
          uploading && /* @__PURE__ */ jsx("div", { className: "w-full bg-muted rounded h-2 mt-2 overflow-hidden", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "bg-blue-600 h-2 rounded",
              style: { width: `${uploadProgress}%` }
            }
          ) })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "File name",
              value: attachmentName,
              onChange: (e) => setAttachmentName(e.target.value),
              disabled: uploading || isAddingAttachment
            }
          ),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "File URL",
              value: attachmentUrl,
              onChange: (e) => setAttachmentUrl(e.target.value),
              disabled: uploading || isAddingAttachment
            }
          )
        ] }),
        error && /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600", children: error }),
        success && /* @__PURE__ */ jsx("div", { className: "text-sm text-green-600", children: success }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-2 mt-2", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => {
                setShowAttachmentForm(false);
                resetForm();
              },
              disabled: uploading || isAddingAttachment,
              children: "Отмена"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              size: "sm",
              onClick: handleAddAttachment,
              disabled: uploading || isAddingAttachment || (activeTab === "upload" ? !file : !attachmentName || !attachmentUrl),
              children: uploading || isAddingAttachment ? "Uploading..." : "Добавить вложение"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: attachments && attachments.length > 0 ? attachments.map((attachment, index2) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors duration-150",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-blue-600/10 p-2 rounded mr-2", children: /* @__PURE__ */ jsx(Paperclip, { className: "h-4 w-4 text-blue-600" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: attachment.fileName }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                attachment.fileType,
                " •",
                " ",
                attachment.fileSize > 0 ? Math.round(attachment.fileSize / 1024) + " KB" : "Unknown file size"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: attachment.fileUrl,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-blue-600 hover:text-blue-800 text-xs font-medium",
                children: "Открыть"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: attachment.fileUrl,
                download: attachment.fileName,
                className: "text-green-600 hover:text-green-800 text-xs font-medium",
                children: "Скачать"
              }
            )
          ] })
        ]
      },
      attachment._id || index2
    )) : /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground px-2", children: "Без вложений" }) })
  ] });
};
const commonEmojis = [
  "👍",
  "👎",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🎉",
  "🚀",
  "🔥",
  "🔔"
];
const CommentSection = ({
  taskId,
  members: members2
}) => {
  const { user } = useAuth();
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const { data: comments, isPending: isLoadingComments } = useGetTaskCommentsByIdQuery(taskId);
  const { mutate: createComment, isPending: isCreatingComment } = useCreateCommentMutation();
  const { mutate: addReaction, isPending: isAddingReaction } = useToggleCommentReactionMutation();
  const filteredMembers = members2.filter(
    (member) => {
      var _a;
      return (_a = member == null ? void 0 : member.name) == null ? void 0 : _a.toLowerCase().includes(mentionQuery.toLowerCase());
    }
  );
  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setNewComment(value);
    const curPos = e.target.selectionStart || 0;
    setCursorPosition(curPos);
    const textBeforeCursor = value.slice(0, curPos);
    const atSignIndex = textBeforeCursor.lastIndexOf("@");
    if (atSignIndex !== -1 && (atSignIndex === 0 || value[atSignIndex - 1] === " ")) {
      const query = textBeforeCursor.slice(atSignIndex + 1);
      setMentionQuery(query);
      setMentionMenuOpen(true);
      if (textareaRef.current) {
        const cursorCoords = getCaretCoordinates(textareaRef.current, curPos);
        setMentionPosition({
          top: cursorCoords.top + 20,
          left: cursorCoords.left
        });
      }
    } else {
      setMentionMenuOpen(false);
    }
  };
  const handleSelectMention = (user2) => {
    if (textareaRef.current) {
      const text = newComment;
      const curPos = cursorPosition;
      const textBeforeCursor = text.slice(0, curPos);
      const atSignIndex = textBeforeCursor.lastIndexOf("@");
      if (atSignIndex !== -1) {
        const newText = text.slice(0, atSignIndex) + `@${user2.name} ` + text.slice(curPos);
        setNewComment(newText);
        setMentionMenuOpen(false);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPos = atSignIndex + user2.name.length + 2;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    }
  };
  const getCaretCoordinates = (element, position) => {
    const { offsetLeft, offsetTop } = element;
    return {
      top: offsetTop + 20,
      // Approximate line height
      left: offsetLeft + position * 8
      // Approximate character width
    };
  };
  const handleAddComment = () => {
    if (!newComment.trim() && attachments.length === 0) {
      toast.error("Добавьте текст или прикрепите файл");
      return;
    }
    createComment(
      { taskId, text: newComment, attachments },
      {
        onSuccess: () => {
          setNewComment("");
          setAttachments([]);
          toast.success("Ответ добавлен успешно");
        },
        onError: (error) => {
          toast.error("Не удалось добавить ответ");
          console.error(error);
        }
      }
    );
  };
  const handleFileUpload = async (files) => {
    if (files.length === 0) return;
    setIsUploading(true);
    const uploadedFiles = [];
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Файл ${file.name} превышает лимит в 50MB`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${"https://ptapi.oci.tj"}/upload`, {
          method: "POST",
          body: formData,
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (!response.ok) {
          throw new Error("Upload failed");
        }
        const result = await response.json();
        uploadedFiles.push({
          fileName: file.name,
          fileUrl: result.data.secure_url,
          fileType: file.type,
          fileSize: file.size
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Не удалось загрузить файл ${file.name}`);
      }
    }
    setAttachments((prev) => [...prev, ...uploadedFiles]);
    setIsUploading(false);
  };
  const handleFileInputChange = (e) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };
  const removeAttachment = (index2) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index2));
  };
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Ваш браузер не поддерживает запись аудио");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", file);
        try {
          setIsUploading(true);
          const response = await fetch(`${"https://ptapi.oci.tj"}/upload`, {
            method: "POST",
            body: formData,
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
          });
          if (!response.ok) {
            throw new Error("Upload failed");
          }
          const result = await response.json();
          setAttachments((prev) => [...prev, {
            fileName: `Голосовое сообщение`,
            fileUrl: result.data.secure_url,
            fileType: "audio/webm",
            fileSize: file.size
          }]);
          toast.success("Голосовое сообщение добавлено");
        } catch (error) {
          console.error("Voice upload error:", error);
          toast.error("Не удалось загрузить голосовое сообщение");
        } finally {
          setIsUploading(false);
        }
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Запись началась...");
    } catch (error) {
      console.error("Recording error:", error);
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          toast.error("Доступ к микрофону запрещен. Разрешите доступ к микрофону в настройках браузера.");
        } else if (error.name === "NotFoundError") {
          toast.error("Микрофон не найден. Подключите микрофон и попробуйте снова.");
        } else if (error.name === "NotReadableError") {
          toast.error("Микрофон занят другим приложением. Закройте другие приложения и попробуйте снова.");
        } else if (error.name === "OverconstrainedError") {
          toast.error("Микрофон не поддерживает требуемые настройки.");
        } else if (error.name === "SecurityError") {
          toast.error("Запись аудио заблокирована по соображениям безопасности. Используйте HTTPS соединение.");
        } else {
          toast.error("Не удалось начать запись. Проверьте подключение микрофона.");
        }
      } else {
        toast.error("Не удалось начать запись. Проверьте подключение микрофона.");
      }
    }
  };
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      toast.success("Запись остановлена");
    }
  };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType.startsWith("audio/")) return "🎵";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
    return "📎";
  };
  useEffect(() => {
    const handleClickOutside = () => setMentionMenuOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  const handleKeyDown = (e) => {
    if (mentionMenuOpen) {
      if (e.key === "Escape") {
        setMentionMenuOpen(false);
        e.preventDefault();
      }
    }
  };
  const formatCommentText = (text) => {
    const parts = text.split(/(@[\w\s]+)/g);
    return parts.map((part, index2) => {
      if (part.startsWith("@")) {
        const mentionName = part.slice(1).trim();
        const isMember = members2.some((m) => m.name === mentionName);
        if (isMember) {
          return /* @__PURE__ */ jsx(
            "span",
            {
              className: "bg-blue-600/10 text-blue-600 px-1 rounded",
              children: part
            },
            index2
          );
        }
      }
      return part;
    });
  };
  const handleAddReaction = (commentId, emoji) => {
    addReaction(
      { commentId, emoji },
      {
        onSuccess: () => {
          toast.success("Reaction added successfully");
        },
        onError: (error) => {
          toast.error("Failed to add reaction");
          console.error(error);
        }
      }
    );
  };
  const getReactionCounts = (reactions = []) => {
    const counts = {};
    reactions.forEach((reaction) => {
      if (!counts[reaction.emoji]) {
        counts[reaction.emoji] = 0;
      }
      counts[reaction.emoji]++;
    });
    return counts;
  };
  const hasUserReacted = (reactions = [], emoji) => {
    const currentUserId = user == null ? void 0 : user._id;
    return reactions.some(
      (r) => r.user._id === currentUserId && r.emoji === emoji
    );
  };
  if (isLoadingComments) {
    return /* @__PURE__ */ jsx(Loader, { message: "Loading comments..." });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-lg p-6 shadow-sm", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4", children: "Комментарии" }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "h-[300px] mb-4", children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: comments.length > 0 ? comments.map((comment) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
      /* @__PURE__ */ jsxs(Avatar, { className: "h-8 w-8", children: [
        /* @__PURE__ */ jsx(
          AvatarImage,
          {
            src: comment.author.profilePicture || getUserAvatar(comment.author.name)
          }
        ),
        /* @__PURE__ */ jsx(AvatarFallback, { children: comment.author.name ? comment.author.name.charAt(0) : "?" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: comment.author.name }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(comment.createdAt), {
            addSuffix: true
          }) })
        ] }),
        comment.text && /* @__PURE__ */ jsx("p", { className: "text-sm", children: formatCommentText(comment.text) }),
        comment.attachments && comment.attachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-2", children: comment.attachments.map((attachment, index2) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 bg-muted/50 rounded", children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg", children: getFileIcon(attachment.fileType) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: attachment.fileName }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: formatFileSize(attachment.fileSize) })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => window.open(attachment.fileUrl, "_blank"),
              children: /* @__PURE__ */ jsx(Download, { size: 14 })
            }
          )
        ] }, index2)) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mt-2", children: [
          comment.reactions && // This line converts the reaction counts object into an array of [emoji, count] pairs
          // and maps over them to render reaction buttons
          Object.entries(getReactionCounts(comment.reactions)).map(
            ([emoji, count]) => /* @__PURE__ */ jsxs(
              "button",
              {
                className: `inline-flex items-center text-xs rounded-full px-2 py-1 border cursor-pointer ${hasUserReacted(comment.reactions, emoji) ? "bg-primary/10 border-primary/20" : "bg-muted hover:bg-muted/80 border-muted/50"}`,
                onClick: () => handleAddReaction(comment._id, emoji),
                children: [
                  /* @__PURE__ */ jsx("span", { className: "mr-1", children: emoji }),
                  /* @__PURE__ */ jsx("span", { children: count })
                ]
              },
              emoji
            )
          ),
          /* @__PURE__ */ jsxs(Popover, { children: [
            /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "inline-flex items-center text-xs rounded-full px-2 py-1 border border-dashed border-muted-foreground/30 hover:bg-muted/80 cursor-pointer", children: [
              /* @__PURE__ */ jsx(Smile, { size: 12, className: "mr-1" }),
              /* @__PURE__ */ jsx("span", { children: "Добавить" })
            ] }) }),
            /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-2", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 max-w-[200px]", children: commonEmojis.map((emoji) => /* @__PURE__ */ jsx(
              "button",
              {
                className: "hover:bg-muted p-1 rounded text-lg cursor-pointer",
                onClick: () => {
                  handleAddReaction(comment._id, emoji);
                },
                children: emoji
              },
              emoji
            )) }) })
          ] })
        ] })
      ] })
    ] }, comment._id)) : /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Нет комментариев" }) }) }) }),
    /* @__PURE__ */ jsx(Separator, { className: "my-4" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 relative", children: [
      /* @__PURE__ */ jsx(
        Textarea,
        {
          ref: textareaRef,
          placeholder: "Добавить комментарий... (используйте @, чтобы упомянуть людей)",
          value: newComment,
          onChange: handleTextareaChange,
          onKeyDown: handleKeyDown,
          className: "mb-2"
        }
      ),
      mentionMenuOpen && filteredMembers.length > 0 && /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute z-50 bg-popover border rounded-md shadow-md p-1 w-64",
          style: {
            top: mentionPosition.top,
            left: mentionPosition.left,
            maxHeight: "200px",
            overflowY: "auto"
          },
          onClick: (e) => e.stopPropagation(),
          children: filteredMembers.map((member) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center gap-2 p-2 hover:bg-accent cursor-pointer rounded",
              onClick: () => handleSelectMention(member),
              children: [
                /* @__PURE__ */ jsxs(Avatar, { className: "h-6 w-6", children: [
                  /* @__PURE__ */ jsx(AvatarImage, { src: member.profilePicture }),
                  /* @__PURE__ */ jsx(AvatarFallback, { children: member.name ? member.name.charAt(0) : "?" })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: member.name })
              ]
            },
            member._id
          ))
        }
      ),
      attachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "mb-3 space-y-2", children: attachments.map((attachment, index2) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-muted p-2 rounded", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg", children: getFileIcon(attachment.fileType) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: attachment.fileName }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: formatFileSize(attachment.fileSize) })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => removeAttachment(index2),
            children: /* @__PURE__ */ jsx(X, { size: 16 })
          }
        )
      ] }, index2)) }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          multiple: true,
          className: "hidden",
          onChange: handleFileInputChange
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => {
                var _a;
                return (_a = fileInputRef.current) == null ? void 0 : _a.click();
              },
              disabled: isUploading,
              children: [
                /* @__PURE__ */ jsx(Paperclip, { size: 16, className: "mr-1" }),
                "Файл"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: isRecording ? stopRecording : startRecording,
              disabled: isUploading,
              className: isRecording ? "text-red-500" : "",
              children: [
                /* @__PURE__ */ jsx(Mic, { size: 16, className: "mr-1" }),
                isRecording ? "Стоп" : "Голос"
              ]
            }
          ),
          isUploading && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Загрузка..." })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleAddComment,
            disabled: isCreatingComment || !newComment.trim() && attachments.length === 0,
            children: isCreatingComment ? "Публикуется..." : "Опубликовать комментарий"
          }
        )
      ] })
    ] })
  ] });
};
const FileViewer = ({ fileName, fileUrl, fileType, fileSize }) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const getFileIcon = (fileType2) => {
    if (fileType2.startsWith("image/")) return "🖼️";
    if (fileType2.startsWith("video/")) return "🎥";
    if (fileType2.startsWith("audio/")) return "🎵";
    if (fileType2.includes("pdf")) return "📄";
    if (fileType2.includes("word")) return "📝";
    if (fileType2.includes("excel") || fileType2.includes("spreadsheet")) return "📊";
    return "📎";
  };
  const canPreview = (fileType2) => {
    return fileType2.startsWith("image/") || fileType2.startsWith("video/") || fileType2.startsWith("audio/") || fileType2.includes("pdf");
  };
  const renderFilePreview = () => {
    if (fileType.startsWith("image/")) {
      return /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: fileUrl,
          alt: fileName,
          className: "max-w-full max-h-[70vh] object-contain"
        }
      ) });
    }
    if (fileType.startsWith("video/")) {
      return /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
        "video",
        {
          src: fileUrl,
          controls: true,
          className: "max-w-full max-h-[70vh]",
          children: "Ваш браузер не поддерживает воспроизведение видео."
        }
      ) });
    }
    if (fileType.startsWith("audio/")) {
      return /* @__PURE__ */ jsx("div", { className: "flex justify-center p-8", children: /* @__PURE__ */ jsx("audio", { src: fileUrl, controls: true, className: "w-full max-w-md", children: "Ваш браузер не поддерживает воспроизведение аудио." }) });
    }
    if (fileType.includes("pdf")) {
      return /* @__PURE__ */ jsx("div", { className: "w-full h-[70vh]", children: /* @__PURE__ */ jsx(
        "iframe",
        {
          src: fileUrl,
          className: "w-full h-full border-0",
          title: fileName,
          children: /* @__PURE__ */ jsxs("p", { children: [
            "Ваш браузер не поддерживает просмотр PDF файлов.",
            " ",
            /* @__PURE__ */ jsx("a", { href: fileUrl, target: "_blank", rel: "noopener noreferrer", children: "Скачать файл" })
          ] })
        }
      ) });
    }
    return /* @__PURE__ */ jsx("div", { className: "text-center p-8", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Предварительный просмотр недоступен для этого типа файла" }) });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 bg-muted/50 rounded", children: [
      /* @__PURE__ */ jsx("span", { className: "text-lg", children: getFileIcon(fileType) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: fileName }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: formatFileSize(fileSize) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
        canPreview(fileType) && /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => setIsViewerOpen(true),
            title: "Просмотр",
            children: /* @__PURE__ */ jsx(Eye, { size: 14 })
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => window.open(fileUrl, "_blank"),
            title: "Скачать",
            children: /* @__PURE__ */ jsx(Download, { size: 14 })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: isViewerOpen, onOpenChange: setIsViewerOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "truncate", children: fileName }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => window.open(fileUrl, "_blank"),
              children: [
                /* @__PURE__ */ jsx(Download, { size: 16, className: "mr-1" }),
                "Скачать"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => setIsViewerOpen(false),
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-auto", children: renderFilePreview() })
    ] }) })
  ] });
};
const ResponseSection = ({
  taskId,
  task
}) => {
  var _a;
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [newResponse, setNewResponse] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const { data: responses = [], isLoading } = useGetTaskResponsesByIdQuery(taskId);
  const createResponseMutation = useCreateResponseMutation();
  const typedResponses = responses;
  const canCreateResponse = ((_a = task == null ? void 0 : task.assignees) == null ? void 0 : _a.some((assignee) => {
    const assigneeId = typeof assignee === "string" ? assignee : assignee._id;
    return assigneeId === (user == null ? void 0 : user._id);
  })) || (user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "manager";
  const handleAddResponse = async () => {
    if (!newResponse.trim() && attachments.length === 0) {
      toast.error("Добавьте текст или прикрепите файл");
      return;
    }
    try {
      await createResponseMutation.mutateAsync({
        taskId,
        text: newResponse.trim() || void 0,
        attachments: attachments.length > 0 ? attachments : void 0
      });
      setNewResponse("");
      setAttachments([]);
      toast.success("Ответ добавлен");
    } catch (error) {
      console.error("Error creating response:", error);
      toast.error("Не удалось добавить ответ");
    }
  };
  const handleFileUpload = async (files) => {
    if (files.length === 0) return;
    setIsUploading(true);
    const uploadedFiles = [];
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Файл ${file.name} превышает лимит в 50MB`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${"https://ptapi.oci.tj"}/upload`, {
          method: "POST",
          body: formData,
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (!response.ok) {
          throw new Error("Upload failed");
        }
        const result = await response.json();
        uploadedFiles.push({
          fileName: file.name,
          fileUrl: result.data.secure_url,
          fileType: file.type,
          fileSize: file.size
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Не удалось загрузить файл ${file.name}`);
      }
    }
    setAttachments((prev) => [...prev, ...uploadedFiles]);
    setIsUploading(false);
  };
  const handleFileInputChange = (e) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };
  const removeAttachment = (index2) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index2));
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", file);
        try {
          setIsUploading(true);
          const response = await fetch(`${"https://ptapi.oci.tj"}/upload`, {
            method: "POST",
            body: formData,
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
          });
          if (!response.ok) {
            throw new Error("Upload failed");
          }
          const result = await response.json();
          setAttachments((prev) => [...prev, {
            fileName: `Голосовое сообщение`,
            fileUrl: result.data.secure_url,
            fileType: "audio/webm",
            fileSize: file.size
          }]);
          toast.success("Голосовое сообщение добавлено");
        } catch (error) {
          console.error("Voice upload error:", error);
          toast.error("Не удалось загрузить голосовое сообщение");
        } finally {
          setIsUploading(false);
        }
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Запись началась...");
    } catch (error) {
      console.error("Recording error:", error);
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          toast.error("Доступ к микрофону запрещен. Разрешите доступ к микрофону в настройках браузера.");
        } else if (error.name === "NotFoundError") {
          toast.error("Микрофон не найден. Подключите микрофон и попробуйте снова.");
        } else if (error.name === "NotReadableError") {
          toast.error("Микрофон занят другим приложением. Закройте другие приложения и попробуйте снова.");
        } else if (error.name === "OverconstrainedError") {
          toast.error("Микрофон не поддерживает требуемые настройки.");
        } else if (error.name === "SecurityError") {
          toast.error("Запись аудио заблокирована по соображениям безопасности. Используйте HTTPS соединение.");
        } else {
          toast.error("Не удалось начать запись. Проверьте подключение микрофона.");
        }
      } else {
        toast.error("Не удалось начать запись. Проверьте подключение микрофона.");
      }
    }
  };
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      toast.success("Запись остановлена");
    }
  };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType.startsWith("audio/")) return "🎵";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
    return "📎";
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx(Loader, { message: "Загрузка ответов..." });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-lg p-6 shadow-sm", children: [
    /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold mb-4", children: [
      "Ответы (",
      typedResponses.length,
      ")"
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "h-[300px] mb-4", children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: typedResponses.length > 0 ? typedResponses.map((response) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
      /* @__PURE__ */ jsxs(Avatar, { className: "h-8 w-8", children: [
        /* @__PURE__ */ jsx(
          AvatarImage,
          {
            src: response.author.profilePicture || getUserAvatar(response.author.name)
          }
        ),
        /* @__PURE__ */ jsx(AvatarFallback, { children: response.author.name ? response.author.name.charAt(0) : "?" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: response.author.name }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(response.createdAt), {
            addSuffix: true,
            locale: ru
          }) })
        ] }),
        response.text && /* @__PURE__ */ jsx("p", { className: "text-sm", children: response.text }),
        response.attachments && response.attachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-2", children: response.attachments.map((attachment, index2) => /* @__PURE__ */ jsx(
          FileViewer,
          {
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType || "",
            fileSize: attachment.fileSize || 0
          },
          index2
        )) })
      ] })
    ] }, response._id)) : /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Нет ответов" }) }) }) }),
    canCreateResponse && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Separator, { className: "my-4" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx(
          Textarea,
          {
            placeholder: "Добавить ответ...",
            value: newResponse,
            onChange: (e) => setNewResponse(e.target.value),
            className: "mb-2"
          }
        ),
        attachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "mb-3 space-y-2", children: attachments.map((attachment, index2) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-muted p-2 rounded", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg", children: getFileIcon(attachment.fileType) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: attachment.fileName }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: formatFileSize(attachment.fileSize) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => removeAttachment(index2),
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          )
        ] }, index2)) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            multiple: true,
            className: "hidden",
            onChange: handleFileInputChange
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => {
                  var _a2;
                  return (_a2 = fileInputRef.current) == null ? void 0 : _a2.click();
                },
                disabled: isUploading,
                children: [
                  /* @__PURE__ */ jsx(Paperclip, { size: 16, className: "mr-1" }),
                  "Файл"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: isRecording ? stopRecording : startRecording,
                disabled: isUploading,
                className: isRecording ? "text-red-500" : "",
                children: [
                  /* @__PURE__ */ jsx(Mic, { size: 16, className: "mr-1" }),
                  isRecording ? "Стоп" : "Голос"
                ]
              }
            ),
            isUploading && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Загрузка..." })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: handleAddResponse,
              disabled: createResponseMutation.isPending || !newResponse.trim() && attachments.length === 0,
              children: createResponseMutation.isPending ? "Отправляется..." : "Отправить ответ"
            }
          )
        ] })
      ] })
    ] }),
    !canCreateResponse && typedResponses.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-4", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Только назначенные участники могут оставлять ответы на эту задачу" }) })
  ] });
};
const getActivityIcon = (action) => {
  switch (action) {
    case "created_task":
      return /* @__PURE__ */ jsx("div", { className: "bg-green-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(CheckSquare, { className: "h-5 w-5 text-green-600 rounded-full" }) });
    case "created_subtask":
      return /* @__PURE__ */ jsx("div", { className: "bg-emerald-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(CheckSquare, { className: "h-5 w-5 text-emerald-600 rounded-full" }) });
    case "updated_task":
    case "updated_subtask":
      return /* @__PURE__ */ jsx("div", { className: "bg-blue-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(FileEdit, { className: "h-5 w-5 text-blue-600 rounded-full" }) });
    case "completed_task":
      return /* @__PURE__ */ jsx("div", { className: "bg-green-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-green-600 rounded-full" }) });
    case "created_project":
      return /* @__PURE__ */ jsx("div", { className: "bg-blue-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(FolderPlus, { className: "h-5 w-5 text-blue-600 rounded-full" }) });
    case "updated_project":
      return /* @__PURE__ */ jsx("div", { className: "bg-blue-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(FolderEdit, { className: "h-5 w-5 text-blue-600 rounded-full" }) });
    case "completed_project":
      return /* @__PURE__ */ jsx("div", { className: "bg-green-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-green-600 rounded-full" }) });
    case "created_workspace":
      return /* @__PURE__ */ jsx("div", { className: "bg-blue-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(Building2, { className: "h-5 w-5 text-blue-600 rounded-full" }) });
    case "added_comment":
      return /* @__PURE__ */ jsx("div", { className: "bg-blue-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(MessageSquare, { className: "h-5 w-5 text-blue-600 rounded-full" }) });
    case "added_member":
      return /* @__PURE__ */ jsx("div", { className: "bg-blue-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(UserPlus, { className: "h-5 w-5 text-blue-600 rounded-full" }) });
    case "removed_member":
      return /* @__PURE__ */ jsx("div", { className: "bg-red-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(UserMinus, { className: "h-5 w-5 text-red-600 rounded-full" }) });
    case "joined_workspace":
      return /* @__PURE__ */ jsx("div", { className: "bg-blue-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(LogIn, { className: "h-5 w-5 text-blue-600 rounded-full" }) });
    case "added_attachment":
      return /* @__PURE__ */ jsx("div", { className: "bg-blue-600/10 p-2 rounded-md", children: /* @__PURE__ */ jsx(Upload, { className: "h-5 w-5 text-blue-600 rounded-full" }) });
    default:
      return null;
  }
};
const TaskActivity = ({ resourceId }) => {
  const { language } = useLanguage();
  const [page, setPage] = useState(1);
  const { data, isPending } = useQuery({
    queryKey: ["activities", resourceId, page],
    queryFn: () => fetchData(`/tasks/${resourceId}/activities?page=${page}`),
    placeholderData: keepPreviousData
  });
  if (isPending) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsx(Loader2, { className: "animate-spin" }) });
  }
  const { activities, pagination } = data;
  return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-lg p-6 shadow-sm", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4", children: "Активность" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: activities == null ? void 0 : activities.map((activity) => {
      var _a, _b;
      return /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary", children: getActivityIcon(activity.action) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: ((_a = activity == null ? void 0 : activity.user) == null ? void 0 : _a.name) || "Неизвестный пользователь" }),
            " ",
            (_b = activity == null ? void 0 : activity.details) == null ? void 0 : _b.description
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: language === "tj" ? getRelativeTimeTajik(activity.createdAt) : getRelativeTimeRussian(activity.createdAt) })
        ] })
      ] }, activity._id);
    }) }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-4", children: /* @__PURE__ */ jsx(
      Button,
      {
        variant: "outline",
        onClick: () => {
          if (page < pagination.totalPages) {
            setPage(page + 1);
          }
        },
        disabled: page >= pagination.totalPages,
        children: "Загрузить больше"
      }
    ) })
  ] });
};
const WatchersList = ({ watchers }) => {
  return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-lg p-6 shadow-sm mb-6", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4", children: "Наблюдатели" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: watchers && watchers.length > 0 ? watchers.map((watcher) => {
      var _a;
      return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(Avatar, { className: "h-6 w-6", children: [
          /* @__PURE__ */ jsx(
            AvatarImage,
            {
              src: (watcher == null ? void 0 : watcher.profilePicture) || getUserAvatar(watcher.name)
            }
          ),
          /* @__PURE__ */ jsx(AvatarFallback, { children: ((_a = watcher == null ? void 0 : watcher.name) == null ? void 0 : _a.charAt(0)) || "U" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-sm", children: (watcher == null ? void 0 : watcher.name) || "Unknown User" })
      ] }, watcher._id);
    }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Нет наблюдателей" }) })
  ] });
};
function meta$4() {
  return [{
    title: "Vazifa | Детали задачи"
  }, {
    name: "description",
    content: "Просмотр деталей задачи в Vazifa!"
  }];
}
const TaskDetailPage = () => {
  var _a;
  const {
    taskId
  } = useParams();
  useNavigate();
  const {
    user
  } = useAuth();
  const queryClient2 = useQueryClient();
  const [isWatching, setIsWatching] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newSubTask, setNewSubTask] = useState("");
  const [showSubTaskForm, setShowSubTaskForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showEditAssignees, setShowEditAssignees] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const {
    data,
    isPending,
    error
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchData(`/tasks/${taskId}`),
    enabled: !!taskId
  });
  const task = data == null ? void 0 : data.task;
  (data == null ? void 0 : data.comments) || [];
  const subTasks = (data == null ? void 0 : data.subTasks) || [];
  useMutation({
    mutationFn: (content) => postData(`/tasks/${taskId}/comments`, {
      content
    }),
    onSuccess: () => {
      queryClient2.invalidateQueries({
        queryKey: ["task", taskId]
      });
      setNewComment("");
    }
  });
  const addSubTaskMutation = useMutation({
    mutationFn: (title) => postData(`/tasks/${taskId}/subtasks`, {
      title
    }),
    onSuccess: () => {
      queryClient2.invalidateQueries({
        queryKey: ["task", taskId]
      });
      setNewSubTask("");
      setShowSubTaskForm(false);
    }
  });
  const updateStatusMutation = useUpdateTaskStatusMutation();
  const toggleWatchMutation = useMutation({
    mutationFn: () => postData(`/tasks/${taskId}/watch`, {}),
    onSuccess: () => {
      setIsWatching(!isWatching);
      queryClient2.invalidateQueries({
        queryKey: ["task", taskId]
      });
    }
  });
  const markImportantMutation = useMutation({
    mutationFn: () => postData(`/tasks/${taskId}/mark-important`, {}),
    onSuccess: () => {
      queryClient2.invalidateQueries({
        queryKey: ["task", taskId]
      });
    }
  });
  const updateAssigneesMutation = useMutation({
    mutationFn: async (assignees) => {
      console.log("=== MUTATION FUNCTION DEBUG ===");
      console.log("Assignees to send:", assignees);
      console.log("URL:", `/api-v1/tasks/${taskId}/assignees`);
      console.log("Token:", localStorage.getItem("token") ? "Present" : "Missing");
      const requestBody = {
        assignees
      };
      console.log("Request body:", JSON.stringify(requestBody));
      const response = await fetch(`/api-v1/tasks/${taskId}/assignees`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(requestBody)
      });
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response data:", errorData);
        throw new Error(errorData.message || "Failed to update assignees");
      }
      const responseData = await response.json();
      console.log("Success response data:", responseData);
      return responseData;
    },
    onSuccess: (data2) => {
      console.log("=== MUTATION SUCCESS ===");
      console.log("Success data:", data2);
      queryClient2.invalidateQueries({
        queryKey: ["task", taskId]
      });
      queryClient2.refetchQueries({
        queryKey: ["task", taskId]
      });
      setShowEditAssignees(false);
    },
    onError: (error2) => {
      console.log("=== MUTATION ERROR ===");
      console.error("Mutation error:", error2);
      console.error("Error message:", error2.message);
    }
  });
  const {
    data: usersData
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchData("/users/all")
  });
  const handleAddSubTask = () => {
    if (newSubTask.trim()) {
      addSubTaskMutation.mutate(newSubTask);
    }
  };
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  };
  const handlePublishStatus = () => {
    if (selectedStatus && selectedStatus !== (task == null ? void 0 : task.status) && taskId) {
      updateStatusMutation.mutate({
        taskId,
        status: selectedStatus
      });
    }
  };
  if (task && !selectedStatus) {
    setSelectedStatus(task.status);
  }
  const handleEditAssignees = () => {
    var _a2;
    const currentAssigneeIds = ((_a2 = task == null ? void 0 : task.assignees) == null ? void 0 : _a2.map((assignee) => assignee._id)) || [];
    setSelectedAssignees(currentAssigneeIds);
    setShowEditAssignees(true);
  };
  const handleSaveAssignees = async () => {
    var _a2;
    console.log("=== SAVE ASSIGNEES DEBUG ===");
    console.log("Current selectedAssignees:", selectedAssignees);
    console.log("Task ID:", taskId);
    console.log("Current task assignees:", (_a2 = task == null ? void 0 : task.assignees) == null ? void 0 : _a2.map((a) => a._id));
    try {
      if (!selectedAssignees || selectedAssignees.length === 0) {
        console.log("Sending empty array");
        updateAssigneesMutation.mutate([]);
      } else {
        console.log("Sending assignees:", selectedAssignees);
        updateAssigneesMutation.mutate(selectedAssignees);
      }
    } catch (error2) {
      console.error("Error in handleSaveAssignees:", error2);
    }
  };
  const handleToggleAssignee = (userId) => {
    setSelectedAssignees((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };
  const getBackUrl = () => {
    return "/dashboard/all-tasks";
  };
  if (isPending) {
    return /* @__PURE__ */ jsx(Loader, {
      message: "Загрузка задачи..."
    });
  }
  if (error || !task) {
    return /* @__PURE__ */ jsxs("div", {
      className: "flex flex-col items-center justify-center min-h-[400px] space-y-4",
      children: [/* @__PURE__ */ jsx("h2", {
        className: "text-2xl font-semibold",
        children: "Задача не найдена"
      }), /* @__PURE__ */ jsx("p", {
        className: "text-muted-foreground",
        children: "Запрашиваемая задача не существует или была удалена."
      }), /* @__PURE__ */ jsx(Link, {
        to: getBackUrl(),
        children: /* @__PURE__ */ jsxs(Button, {
          children: [/* @__PURE__ */ jsx(ArrowLeft, {
            className: "h-4 w-4 mr-2"
          }), "Вернуться к задачам"]
        })
      })]
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-6",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "flex items-center justify-between",
      children: [/* @__PURE__ */ jsx(Link, {
        to: getBackUrl(),
        children: /* @__PURE__ */ jsxs(Button, {
          variant: "outline",
          size: "sm",
          children: [/* @__PURE__ */ jsx(ArrowLeft, {
            className: "h-4 w-4 mr-2"
          }), "Назад к задачам"]
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex items-center space-x-2",
        children: [((user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "super_admin") && /* @__PURE__ */ jsxs(Button, {
          variant: task.isImportant ? "default" : "outline",
          size: "sm",
          onClick: () => markImportantMutation.mutate(),
          disabled: markImportantMutation.isPending,
          children: [/* @__PURE__ */ jsx(Star, {
            className: `h-4 w-4 mr-2 ${task.isImportant ? "fill-current" : ""}`
          }), task.isImportant ? "Важная" : "Отметить важной"]
        }), ((user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "super_admin" || (user == null ? void 0 : user.role) === "manager") && /* @__PURE__ */ jsxs(Button, {
          variant: "outline",
          size: "sm",
          onClick: () => toggleWatchMutation.mutate(),
          children: [isWatching ? /* @__PURE__ */ jsx(EyeOff, {
            className: "h-4 w-4 mr-2"
          }) : /* @__PURE__ */ jsx(Eye, {
            className: "h-4 w-4 mr-2"
          }), isWatching ? "Не следить" : "Следить"]
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "xl:col-span-2 space-y-4 lg:space-y-6",
        children: [/* @__PURE__ */ jsxs(Card, {
          children: [/* @__PURE__ */ jsx(CardHeader, {
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-start justify-between",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2 flex-1",
                children: [/* @__PURE__ */ jsx(TaskTitle, {
                  title: task.title,
                  taskId
                }), /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center space-x-2 flex-wrap",
                  children: [/* @__PURE__ */ jsx(Badge, {
                    variant: task.status.toLowerCase(),
                    children: getTaskStatusRussian(task.status)
                  }), task.priority && /* @__PURE__ */ jsxs(Badge, {
                    variant: task.priority === "High" ? "destructive" : "secondary",
                    children: [/* @__PURE__ */ jsx(Flag, {
                      className: "h-3 w-3 mr-1"
                    }), getPriorityRussian(task.priority)]
                  }), task.isArchived && /* @__PURE__ */ jsxs(Badge, {
                    variant: "outline",
                    children: [/* @__PURE__ */ jsx(Archive, {
                      className: "h-3 w-3 mr-1"
                    }), "В архиве"]
                  }), task.isImportant && /* @__PURE__ */ jsxs(Badge, {
                    variant: "default",
                    className: "bg-yellow-500 hover:bg-yellow-600",
                    children: [/* @__PURE__ */ jsx(Star, {
                      className: "h-3 w-3 mr-1 fill-current"
                    }), "Важная"]
                  })]
                })]
              }), ((user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "super_admin" || (user == null ? void 0 : user.role) === "manager") && /* @__PURE__ */ jsxs("div", {
                className: "flex items-center space-x-2",
                children: [/* @__PURE__ */ jsxs(Select, {
                  onValueChange: handleStatusChange,
                  value: selectedStatus,
                  children: [/* @__PURE__ */ jsx(SelectTrigger, {
                    className: "w-40",
                    children: /* @__PURE__ */ jsx(SelectValue, {})
                  }), /* @__PURE__ */ jsxs(SelectContent, {
                    children: [/* @__PURE__ */ jsx(SelectItem, {
                      value: "To Do",
                      children: "К выполнению"
                    }), /* @__PURE__ */ jsx(SelectItem, {
                      value: "In Progress",
                      children: "В процессе"
                    }), /* @__PURE__ */ jsx(SelectItem, {
                      value: "Done",
                      children: "Выполнено"
                    })]
                  })]
                }), selectedStatus !== task.status && /* @__PURE__ */ jsxs(Button, {
                  size: "sm",
                  onClick: handlePublishStatus,
                  disabled: updateStatusMutation.isPending,
                  children: [/* @__PURE__ */ jsx(Send, {
                    className: "h-4 w-4 mr-2"
                  }), updateStatusMutation.isPending ? "Публикация..." : "Опубликовать"]
                })]
              })]
            })
          }), /* @__PURE__ */ jsxs(CardContent, {
            className: "space-y-6",
            children: [/* @__PURE__ */ jsx(TaskDescription, {
              description: task.description || "",
              taskId
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [/* @__PURE__ */ jsx(User, {
                    className: "h-4 w-4 text-muted-foreground"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "font-medium",
                    children: "Исполнители:"
                  }), /* @__PURE__ */ jsx("span", {
                    children: task.assignees && task.assignees.length > 0 ? task.assignees.map((assignee) => (assignee == null ? void 0 : assignee.name) || "Неизвестный").join(", ") : "Не назначены"
                  }), ((user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "super_admin" || (user == null ? void 0 : user.role) === "manager") && /* @__PURE__ */ jsxs(Dialog, {
                    open: showEditAssignees,
                    onOpenChange: setShowEditAssignees,
                    children: [/* @__PURE__ */ jsx(DialogTrigger, {
                      asChild: true,
                      children: /* @__PURE__ */ jsx(Button, {
                        variant: "ghost",
                        size: "sm",
                        className: "h-6 w-6 p-0 ml-2",
                        onClick: handleEditAssignees,
                        children: /* @__PURE__ */ jsx(Edit, {
                          className: "h-4 w-4"
                        })
                      })
                    }), /* @__PURE__ */ jsxs(DialogContent, {
                      className: "sm:max-w-md",
                      children: [/* @__PURE__ */ jsx(DialogHeader, {
                        children: /* @__PURE__ */ jsx(DialogTitle, {
                          children: "Редактировать исполнителей"
                        })
                      }), /* @__PURE__ */ jsxs("div", {
                        className: "space-y-4",
                        children: [/* @__PURE__ */ jsx("div", {
                          className: "text-sm text-gray-600 mb-3",
                          children: "Выберите участников для назначения на задачу:"
                        }), /* @__PURE__ */ jsx("div", {
                          className: "max-h-60 overflow-y-auto space-y-2 border rounded p-2",
                          children: !usersData ? /* @__PURE__ */ jsx("div", {
                            className: "text-center py-4 text-gray-500",
                            children: "Загрузка пользователей..."
                          }) : ((_a = usersData == null ? void 0 : usersData.users) == null ? void 0 : _a.length) > 0 ? usersData.users.map((userItem) => {
                            var _a2;
                            const isCurrentlyAssigned = (_a2 = task == null ? void 0 : task.assignees) == null ? void 0 : _a2.some((assignee) => assignee._id === userItem._id);
                            const isSelected = selectedAssignees.includes(userItem._id);
                            return /* @__PURE__ */ jsxs("div", {
                              className: "flex items-center space-x-3 p-2 hover:bg-gray-50 rounded",
                              children: [/* @__PURE__ */ jsx("input", {
                                type: "checkbox",
                                id: userItem._id,
                                checked: isSelected,
                                onChange: () => handleToggleAssignee(userItem._id),
                                className: "rounded w-4 h-4"
                              }), /* @__PURE__ */ jsxs("label", {
                                htmlFor: userItem._id,
                                className: "flex items-center space-x-2 cursor-pointer flex-1",
                                children: [/* @__PURE__ */ jsx("span", {
                                  className: "font-medium",
                                  children: userItem.name
                                }), /* @__PURE__ */ jsx(Badge, {
                                  variant: "outline",
                                  className: "text-xs",
                                  children: userItem.role === "admin" ? "Админ" : userItem.role === "manager" ? "Менеджер" : userItem.role === "super_admin" ? "Супер админ" : "Участник"
                                }), isCurrentlyAssigned && /* @__PURE__ */ jsx(Badge, {
                                  variant: "secondary",
                                  className: "text-xs bg-blue-100 text-blue-800",
                                  children: "Назначен"
                                })]
                              })]
                            }, userItem._id);
                          }) : (usersData == null ? void 0 : usersData.length) > 0 ? (
                            // Handle case where users is directly an array
                            usersData.map((userItem) => {
                              var _a2;
                              const isCurrentlyAssigned = (_a2 = task == null ? void 0 : task.assignees) == null ? void 0 : _a2.some((assignee) => assignee._id === userItem._id);
                              const isSelected = selectedAssignees.includes(userItem._id);
                              return /* @__PURE__ */ jsxs("div", {
                                className: "flex items-center space-x-3 p-2 hover:bg-gray-50 rounded",
                                children: [/* @__PURE__ */ jsx("input", {
                                  type: "checkbox",
                                  id: userItem._id,
                                  checked: isSelected,
                                  onChange: () => handleToggleAssignee(userItem._id),
                                  className: "rounded w-4 h-4"
                                }), /* @__PURE__ */ jsxs("label", {
                                  htmlFor: userItem._id,
                                  className: "flex items-center space-x-2 cursor-pointer flex-1",
                                  children: [/* @__PURE__ */ jsx("span", {
                                    className: "font-medium",
                                    children: userItem.name
                                  }), /* @__PURE__ */ jsx(Badge, {
                                    variant: "outline",
                                    className: "text-xs",
                                    children: userItem.role === "admin" ? "Админ" : userItem.role === "manager" ? "Менеджер" : userItem.role === "super_admin" ? "Супер админ" : "Участник"
                                  }), isCurrentlyAssigned && /* @__PURE__ */ jsx(Badge, {
                                    variant: "secondary",
                                    className: "text-xs bg-blue-100 text-blue-800",
                                    children: "Назначен"
                                  })]
                                })]
                              }, userItem._id);
                            })
                          ) : /* @__PURE__ */ jsxs("div", {
                            className: "text-center py-4 text-gray-500",
                            children: ["Пользователи не найдены", /* @__PURE__ */ jsx("br", {}), /* @__PURE__ */ jsxs("small", {
                              children: ["Debug: ", JSON.stringify(usersData)]
                            })]
                          })
                        }), /* @__PURE__ */ jsxs("div", {
                          className: "flex space-x-2 pt-2",
                          children: [/* @__PURE__ */ jsx(Button, {
                            onClick: handleSaveAssignees,
                            disabled: updateAssigneesMutation.isPending,
                            className: "flex-1",
                            children: updateAssigneesMutation.isPending ? "Сохранение..." : "Сохранить"
                          }), /* @__PURE__ */ jsx(Button, {
                            variant: "outline",
                            onClick: () => setShowEditAssignees(false),
                            className: "flex-1",
                            children: "Отмена"
                          })]
                        })]
                      })]
                    })]
                  })]
                }), task.responsibleManager && typeof task.responsibleManager === "object" && /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [/* @__PURE__ */ jsx(Users, {
                    className: "h-4 w-4 text-muted-foreground"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "font-medium",
                    children: "Ответственный менеджер:"
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center space-x-2",
                    children: [task.responsibleManager.profilePicture && /* @__PURE__ */ jsx("img", {
                      src: task.responsibleManager.profilePicture,
                      alt: task.responsibleManager.name,
                      className: "h-6 w-6 rounded-full object-cover"
                    }), /* @__PURE__ */ jsx("span", {
                      className: "font-medium text-blue-600",
                      children: task.responsibleManager.name
                    })]
                  })]
                }), task.dueDate && /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [/* @__PURE__ */ jsx(Calendar$1, {
                    className: "h-4 w-4 text-muted-foreground"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "font-medium",
                    children: "Срок выполнения:"
                  }), /* @__PURE__ */ jsx("span", {
                    children: formatDateDetailedRussian(task.dueDate)
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [/* @__PURE__ */ jsx(Clock, {
                    className: "h-4 w-4 text-muted-foreground"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "font-medium",
                    children: "Создано:"
                  }), /* @__PURE__ */ jsx("span", {
                    children: formatDateDetailedRussian(task.createdAt)
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [/* @__PURE__ */ jsx(Clock, {
                    className: "h-4 w-4 text-muted-foreground"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "font-medium",
                    children: "Обновлено:"
                  }), /* @__PURE__ */ jsx("span", {
                    children: formatDateDetailedRussian(task.updatedAt)
                  })]
                })]
              })]
            }), /* @__PURE__ */ jsx(TaskAttachments, {
              attachments: task.attachments || [],
              taskId
            })]
          })]
        }), /* @__PURE__ */ jsxs(Card, {
          children: [/* @__PURE__ */ jsx(CardHeader, {
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsxs(CardTitle, {
                className: "flex items-center",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-5 w-5 mr-2"
                }), "Подзадачи (", subTasks.length, ")"]
              }), /* @__PURE__ */ jsxs(Button, {
                variant: "outline",
                size: "sm",
                onClick: () => setShowSubTaskForm(!showSubTaskForm),
                children: [/* @__PURE__ */ jsx(Plus, {
                  className: "h-4 w-4 mr-2"
                }), "Добавить подзадачу"]
              })]
            })
          }), /* @__PURE__ */ jsxs(CardContent, {
            children: [showSubTaskForm && /* @__PURE__ */ jsxs("div", {
              className: "mb-4 space-y-2",
              children: [/* @__PURE__ */ jsx(Input, {
                placeholder: "Название подзадачи...",
                value: newSubTask,
                onChange: (e) => setNewSubTask(e.target.value),
                onKeyPress: (e) => e.key === "Enter" && handleAddSubTask()
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex space-x-2",
                children: [/* @__PURE__ */ jsx(Button, {
                  size: "sm",
                  onClick: handleAddSubTask,
                  disabled: addSubTaskMutation.isPending,
                  children: "Добавить"
                }), /* @__PURE__ */ jsx(Button, {
                  variant: "outline",
                  size: "sm",
                  onClick: () => setShowSubTaskForm(false),
                  children: "Отмена"
                })]
              })]
            }), subTasks.length > 0 ? /* @__PURE__ */ jsx("div", {
              className: "space-y-2",
              children: subTasks.map((subTask) => /* @__PURE__ */ jsxs("div", {
                className: "flex items-center space-x-2 p-2 border rounded",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-4 w-4 text-muted-foreground"
                }), /* @__PURE__ */ jsx("span", {
                  className: "flex-1",
                  children: subTask.title
                }), /* @__PURE__ */ jsx(Badge, {
                  variant: subTask.status.toLowerCase(),
                  children: getTaskStatusRussian(subTask.status)
                })]
              }, subTask._id))
            }) : /* @__PURE__ */ jsx("p", {
              className: "text-muted-foreground text-center py-4",
              children: "Подзадачи отсутствуют"
            })]
          })]
        }), /* @__PURE__ */ jsx(ResponseSection, {
          taskId,
          task
        }), ((user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.role) === "super_admin" || (user == null ? void 0 : user.role) === "manager") && /* @__PURE__ */ jsx(CommentSection, {
          taskId,
          members: []
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "space-y-4 lg:space-y-6",
        children: [/* @__PURE__ */ jsx(WatchersList, {
          watchers: task.watchers || []
        }), /* @__PURE__ */ jsx(TaskActivity, {
          resourceId: taskId
        })]
      })]
    })]
  });
};
const task_$taskId = withComponentProps(TaskDetailPage);
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: task_$taskId,
  meta: meta$4
}, Symbol.toStringTag, { value: "Module" }));
const UserLayout = () => {
  const {
    isAuthenticated,
    isLoading
  } = useAuth();
  if (isLoading) return /* @__PURE__ */ jsx(Loader, {
    message: "Loading..."
  });
  if (!isAuthenticated) return /* @__PURE__ */ jsx(Navigate, {
    to: "/",
    replace: true
  });
  return /* @__PURE__ */ jsx("div", {
    className: "container max-w-3xl mx-auto py-8 md:py-16",
    children: /* @__PURE__ */ jsx(Outlet, {})
  });
};
const userLayout = withComponentProps(UserLayout);
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: userLayout
}, Symbol.toStringTag, { value: "Module" }));
const BackButton = () => {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsx(
    Button,
    {
      variant: "outline",
      size: "sm",
      className: "mr-4 p-0",
      onClick: () => navigate(-1),
      children: "← Назад"
    }
  );
};
const queryKey = ["user"];
const useUserProfileQuery = () => {
  return useQuery({
    queryKey,
    queryFn: () => fetchData("/users/profile")
  });
};
const useNotificationsQuery = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchData("/users/notifications")
  });
};
const useMarkAllNotificationsAsRead = () => {
  return useMutation({
    mutationFn: () => updateData("/users/notifications", { data: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};
const useMarkNotificationAsRead = () => {
  return useMutation({
    mutationFn: (id) => updateData(`/users/notifications/${id}`, { data: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};
const useChangePassword = () => {
  return useMutation({
    mutationFn: (data) => updateData("/users/change-password", data)
  });
};
const useUpdateUserProfile = () => {
  return useMutation({
    mutationFn: (data) => updateData("/users/profile", data)
  });
};
const useGet2FAStatus = () => {
  return useQuery({
    queryKey: ["2fa-status"],
    queryFn: () => fetchData("/users/2fa-status")
  });
};
const useEnable2FA = () => {
  return useMutation({
    mutationFn: (data) => postData("/users/enable-2fa", data)
  });
};
const useVerify2FA = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => postData("/users/verify-2fa", data),
    onSuccess: () => {
      queryClient2.invalidateQueries({ queryKey: ["2fa-status"] });
    }
  });
};
const useDisable2FA = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationFn: (data) => postData("/users/disable-2fa", data),
    onSuccess: () => {
      queryClient2.invalidateQueries({ queryKey: ["2fa-status"] });
    }
  });
};
function meta$3({}) {
  return [{
    title: "TaskHub | Notifications"
  }, {
    name: "description",
    content: "Notifications to TaskHub!"
  }];
}
const NotificationsPage = () => {
  const {
    data,
    isLoading
  } = useNotificationsQuery();
  const {
    mutate: markAllAsRead,
    isPending: isMarkingAllAsRead
  } = useMarkAllNotificationsAsRead();
  const {
    mutate: markAsRead,
    isPending: isMarkingAsRead
  } = useMarkNotificationAsRead();
  const handleMarkAllAsRead = () => {
    markAllAsRead(void 0, {
      onSuccess: () => {
        toast.success("All notifications marked as read");
      },
      onError: (error) => {
        var _a, _b;
        const errorMessage = ((_b = (_a = error.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || "An error occurred";
        toast.error(errorMessage);
        console.error(error);
      }
    });
  };
  const handleMarkAsRead = (id) => {
    markAsRead(id, {
      onSuccess: () => {
        toast.success("Notification marked as read");
      },
      onError: (error) => {
        var _a, _b;
        const errorMessage = ((_b = (_a = error.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || "An error occurred";
        toast.error(errorMessage);
        console.error(error);
      }
    });
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex justify-center items-center h-screen",
      children: /* @__PURE__ */ jsx(Loader, {
        message: "Загрузка уведомлений..."
      })
    });
  }
  const {
    notifications: notifications2,
    unreadCount
  } = data;
  return /* @__PURE__ */ jsxs("div", {
    className: "",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "flex items-center justify-between mb-6 px-4 md:px-0",
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx(BackButton, {}), /* @__PURE__ */ jsx("h1", {
          className: "text-xl md:text-2xl font-bold",
          children: "Уведомления"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex items-center gap-2",
        children: [unreadCount > 0 && /* @__PURE__ */ jsxs(Badge, {
          variant: "default",
          className: "rounded-full",
          children: [unreadCount, " новый"]
        }), /* @__PURE__ */ jsx(Button, {
          variant: "outline",
          size: "sm",
          onClick: handleMarkAllAsRead,
          disabled: unreadCount === 0 || isMarkingAllAsRead,
          children: "Отметить все как прочитанное"
        })]
      })]
    }), /* @__PURE__ */ jsx(ScrollArea, {
      className: "h-[calc(100vh-200px)]",
      children: /* @__PURE__ */ jsx("div", {
        className: "space-y-1",
        children: notifications2.length > 0 ? notifications2.map((notification) => /* @__PURE__ */ jsxs("div", {
          className: `p-4 rounded-lg transition-colors ${notification.isRead ? "bg-card" : "bg-accent"}`,
          onClick: () => markAsRead(notification._id),
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-start gap-4",
            children: [notification.relatedData.actorId ? /* @__PURE__ */ jsxs(Avatar, {
              className: "h-10 w-10",
              children: [/* @__PURE__ */ jsx(AvatarImage, {
                src: notification.relatedData.actorId.profilePicture,
                alt: notification.relatedData.actorId.name
              }), /* @__PURE__ */ jsx(AvatarFallback, {
                className: "bg-black text-white",
                children: notification.relatedData.actorId.name.charAt(0)
              })]
            }) : /* @__PURE__ */ jsx("div", {
              className: "h-10 w-10 flex items-center justify-center rounded-full bg-primary/10",
              children: /* @__PURE__ */ jsxs("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "text-primary",
                children: [/* @__PURE__ */ jsx("path", {
                  d: "M2 20h.01"
                }), /* @__PURE__ */ jsx("path", {
                  d: "M7 20v-4"
                }), /* @__PURE__ */ jsx("path", {
                  d: "M12 20v-8"
                }), /* @__PURE__ */ jsx("path", {
                  d: "M17 20V8"
                }), /* @__PURE__ */ jsx("path", {
                  d: "M22 4v16"
                })]
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex-1",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between items-start",
                children: [/* @__PURE__ */ jsx("h3", {
                  className: "font-medium",
                  children: notification.title
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-xs text-muted-foreground",
                  children: formatDistanceToNow(notification.createdAt, {
                    addSuffix: true
                  })
                })]
              }), /* @__PURE__ */ jsx("p", {
                className: "text-sm text-muted-foreground mt-1",
                children: notification.message
              })]
            })]
          }), !notification.isRead && /* @__PURE__ */ jsx("div", {
            className: "flex justify-end mt-2",
            children: /* @__PURE__ */ jsx(Button, {
              variant: "ghost",
              size: "sm",
              onClick: () => handleMarkAsRead(notification._id),
              disabled: isMarkingAsRead,
              children: "Отметить как прочитанное"
            })
          })]
        }, notification._id)) : /* @__PURE__ */ jsx("div", {
          className: "text-center py-8",
          children: /* @__PURE__ */ jsx("p", {
            className: "text-muted-foreground",
            children: "Нет уведомлений"
          })
        })
      })
    })]
  });
};
const notifications = withComponentProps(NotificationsPage);
const route20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: notifications,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationOptions, setConfirmationOptions] = useState(null);
  const confirm = (options) => {
    setConfirmationOptions(options);
    setIsOpen(true);
  };
  const handleConfirm = () => {
    confirmationOptions == null ? void 0 : confirmationOptions.onConfirm();
    setIsOpen(false);
  };
  const handleCancel = () => {
    setIsOpen(false);
  };
  return {
    isOpen,
    confirm,
    handleConfirm,
    handleCancel,
    confirmationOptions
  };
};
const ConfirmationDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Delete Confirmation",
  message,
  buttonText = "Confirm"
}) => {
  return /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange: onCancel, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: title }),
      /* @__PURE__ */ jsx(DialogDescription, { children: message })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onCancel, children: "Отмена" }),
      /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: onConfirm, children: buttonText })
    ] })
  ] }) });
};
const TwoFASection = () => {
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { confirm, confirmationOptions, handleCancel, handleConfirm, isOpen } = useConfirmation();
  const { data, isLoading: is2FALoading } = useGet2FAStatus();
  const { mutate: enable2FA, isPending: isEnabling2FA } = useEnable2FA();
  const { mutate: verify2FA, isPending: isVerifying2FA } = useVerify2FA();
  const { mutate: disable2FA, isPending: isDisabling2FA } = useDisable2FA();
  const handleEnable2FA = async () => {
    enable2FA(
      {},
      {
        onSuccess: () => {
          setOtpSent(true);
          toast.info("A verification code has been sent to your email.");
        },
        onError: (error) => {
          toast.error(error.response.data.message);
          console.log(error);
        }
      }
    );
  };
  const handleVerify2FA = async () => {
    verify2FA(
      { code: otpCode },
      {
        onSuccess: () => {
          setOtpSent(false);
          setOtpCode("");
          toast.success("2FA enabled successfully!");
        },
        onError: (error) => {
          toast.error(error.response.data.message);
          console.log(error);
        }
      }
    );
  };
  const handleDisable2FA = async () => {
    confirm({
      title: "Disable 2FA",
      message: "Are you sure you want to disable 2FA?",
      onConfirm: async () => {
        disable2FA(
          {},
          {
            onSuccess: () => {
              toast.success("2FA disabled successfully");
            },
            onError: (error) => {
              var _a, _b;
              const errorMessage = ((_b = (_a = error == null ? void 0 : error.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || "Failed to disable 2FA";
              toast.error(errorMessage);
            }
          }
        );
      }
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Двухфакторная аутентификация (2FA)" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Добавьте дополнительный уровень безопасности к своей учетной записи. Если эта функция включена, вам потребуется ввести код,отправленный на вашу электронную почту после входа в систему." })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: is2FALoading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Загрузка статуса 2FA..." })
      ] }) : (data == null ? void 0 : data.enabled) ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-emerald-600", children: "2FA включена на вашем аккаунте" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleDisable2FA,
            disabled: is2FALoading || isDisabling2FA,
            variant: "destructive",
            children: "Отключить 2FA"
          }
        )
      ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-yellow-600", children: "2FA не включена." }),
        !otpSent ? /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleEnable2FA,
            disabled: is2FALoading || isEnabling2FA,
            className: "bg-black text-white",
            children: "Включить 2FA"
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "otp", children: "Введите код, отправленный на вашу электронную почту" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "otp",
              type: "text",
              value: otpCode,
              onChange: (e) => setOtpCode(e.target.value),
              placeholder: "6-digit code",
              maxLength: 6,
              disabled: is2FALoading || isVerifying2FA
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: handleVerify2FA,
              disabled: is2FALoading || otpCode.length !== 6 || isVerifying2FA,
              children: "Проверьте и включите"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              onClick: () => setOtpSent(false),
              disabled: is2FALoading || isVerifying2FA,
              children: "Отмена"
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(
      ConfirmationDialog,
      {
        isOpen,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
        title: (confirmationOptions == null ? void 0 : confirmationOptions.title) || "",
        message: (confirmationOptions == null ? void 0 : confirmationOptions.message) || "",
        buttonText: "Disable 2FA"
      }
    )
  ] });
};
function meta$2() {
  return [{
    title: "TaskHub | User Profile"
  }, {
    name: "description",
    content: "Profile to TaskHub!"
  }];
}
const changePasswordSchema = z$1.object({
  currentPassword: z$1.string().min(1, {
    message: "Current password is required"
  }),
  newPassword: z$1.string().min(8, {
    message: "New password is required"
  }),
  confirmPassword: z$1.string().min(8, {
    message: "Confirm password is required"
  })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
const profileSchema = z$1.object({
  name: z$1.string().min(1, {
    message: "Name is required"
  }),
  lastName: z$1.string().optional(),
  phoneNumber: z$1.string().optional(),
  profilePicture: z$1.string().optional()
});
const ProfilePage = () => {
  var _a;
  const {
    data: user,
    isPending
  } = useUserProfileQuery();
  const {
    logout
  } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: (user == null ? void 0 : user.name) || "",
      lastName: (user == null ? void 0 : user.lastName) || "",
      profilePicture: (user == null ? void 0 : user.profilePicture) || ""
    },
    values: {
      name: (user == null ? void 0 : user.name) || "",
      lastName: (user == null ? void 0 : user.lastName) || "",
      phoneNumber: (user == null ? void 0 : user.phoneNumber) || "",
      profilePicture: (user == null ? void 0 : user.profilePicture) || ""
    }
  });
  const {
    mutate: updateUserProfile,
    isPending: isUpdatingProfile
  } = useUpdateUserProfile();
  const {
    mutate: changePassword,
    isPending: isChangingPassword,
    error
  } = useChangePassword();
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const handlePasswordChange = (values) => {
    changePassword(values, {
      onSuccess: () => {
        toast.success("Password updated successfully. You will be logged out. Please login again.");
        form.reset();
        setTimeout(() => {
          logout();
          navigate("/");
        }, 3e3);
      },
      onError: (error2) => {
        var _a2, _b;
        const errorMessage = ((_b = (_a2 = error2.response) == null ? void 0 : _a2.data) == null ? void 0 : _b.error) || "Failed to update password";
        toast.error(errorMessage);
        console.log(error2);
      }
    });
  };
  const handleAvatarChange = async (e) => {
    var _a2;
    const file = ((_a2 = e.target.files) == null ? void 0 : _a2[0]) || null;
    setAvatarFile(file);
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("File size must be less than 1MB.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const cloudName = "dlvubqfkj";
      const uploadPreset = "da121806-44c2-4a62-8ca1-5af331bc8d38";
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round(progressEvent.loaded * 100 / progressEvent.total));
          }
        }
      });
      const uploadedUrl = response.data.secure_url;
      profileForm.setValue("profilePicture", uploadedUrl);
      toast.success("Avatar uploaded!");
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  const handleProfileFormSubmit = (values) => {
    updateUserProfile({
      name: values.name,
      lastName: values.lastName || "",
      phoneNumber: values.phoneNumber || "",
      profilePicture: values.profilePicture || ""
    }, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
      },
      onError: (error2) => {
        var _a2, _b;
        const errorMessage = ((_b = (_a2 = error2.response) == null ? void 0 : _a2.data) == null ? void 0 : _b.error) || "Failed to update profile";
        toast.error(errorMessage);
        console.log(error2);
      }
    });
  };
  if (isPending) return /* @__PURE__ */ jsx("div", {
    className: "flex justify-center items-center h-screen",
    children: /* @__PURE__ */ jsx(Loader, {
      message: "Loading..."
    })
  });
  return /* @__PURE__ */ jsxs("div", {
    className: "space-y-8",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "px-4 md:px-0",
      children: [/* @__PURE__ */ jsx(BackButton, {}), /* @__PURE__ */ jsx("h3", {
        className: "text-lg font-medium",
        children: "Информация профиля"
      }), /* @__PURE__ */ jsx("p", {
        className: "text-sm text-muted-foreground",
        children: "Управляйте настройками и предпочтениями своей учетной записи."
      })]
    }), /* @__PURE__ */ jsx(Separator, {}), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        children: [/* @__PURE__ */ jsx(CardTitle, {
          children: "Персональная информация"
        }), /* @__PURE__ */ jsx(CardDescription, {
          children: "Обновите свои личные данные."
        })]
      }), /* @__PURE__ */ jsx(CardContent, {
        children: /* @__PURE__ */ jsx(Form, {
          ...profileForm,
          children: /* @__PURE__ */ jsxs("form", {
            onSubmit: profileForm.handleSubmit(handleProfileFormSubmit),
            className: "grid gap-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center space-x-4 mb-6",
              children: [/* @__PURE__ */ jsxs(Avatar, {
                className: "h-20 w-20 bg-gray-600",
                children: [/* @__PURE__ */ jsx(AvatarImage, {
                  src: profileForm.watch("profilePicture") || (user == null ? void 0 : user.profilePicture),
                  alt: user == null ? void 0 : user.name
                }), /* @__PURE__ */ jsx(AvatarFallback, {
                  className: "text-xl",
                  children: ((_a = user == null ? void 0 : user.name) == null ? void 0 : _a.charAt(0)) || "U"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("input", {
                  id: "avatar-upload",
                  type: "file",
                  accept: "image/*",
                  onChange: handleAvatarChange,
                  disabled: uploading || isUpdatingProfile,
                  style: {
                    display: "none"
                  }
                }), /* @__PURE__ */ jsx(Button, {
                  type: "button",
                  size: "sm",
                  variant: "outline",
                  onClick: () => {
                    var _a2;
                    return (_a2 = document.getElementById("avatar-upload")) == null ? void 0 : _a2.click();
                  },
                  disabled: uploading || isUpdatingProfile,
                  children: "Изменить аватар"
                }), avatarFile && /* @__PURE__ */ jsxs("div", {
                  className: "text-xs text-muted-foreground mt-1",
                  children: ["Выбрано:", " ", /* @__PURE__ */ jsx("span", {
                    className: "font-medium",
                    children: avatarFile.name
                  }), " (", Math.round(avatarFile.size / 1024), " KB)"]
                }), uploading && /* @__PURE__ */ jsx("div", {
                  className: "w-full bg-muted rounded h-2 mt-2 overflow-hidden",
                  children: /* @__PURE__ */ jsx("div", {
                    className: "bg-blue-600 h-2 rounded",
                    style: {
                      width: `${uploadProgress}%`
                    }
                  })
                })]
              })]
            }), /* @__PURE__ */ jsx(FormField, {
              control: profileForm.control,
              name: "name",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsx(FormLabel, {
                  children: "Имя"
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    ...field
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsx(FormField, {
              control: profileForm.control,
              name: "lastName",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsx(FormLabel, {
                  children: "Фамилия"
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    ...field
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsx(FormField, {
              control: profileForm.control,
              name: "phoneNumber",
              render: ({
                field
              }) => /* @__PURE__ */ jsxs(FormItem, {
                children: [/* @__PURE__ */ jsx(FormLabel, {
                  children: "Номер телефона"
                }), /* @__PURE__ */ jsx(FormControl, {
                  children: /* @__PURE__ */ jsx(Input, {
                    ...field,
                    type: "tel",
                    placeholder: "+992 XX XXX XXXX"
                  })
                }), /* @__PURE__ */ jsx(FormMessage, {})]
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid gap-2",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "email",
                children: "Адрес электронной почты"
              }), /* @__PURE__ */ jsx(Input, {
                id: "email",
                type: "email",
                defaultValue: user == null ? void 0 : user.email,
                disabled: true
              }), /* @__PURE__ */ jsx("p", {
                className: "text-xs text-muted-foreground",
                children: "Ваш адрес электронной почты не может быть изменен."
              })]
            }), /* @__PURE__ */ jsx(Button, {
              type: "submit",
              className: "w-fit",
              disabled: isUpdatingProfile || isPending || uploading,
              children: isUpdatingProfile ? /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(Loader2, {
                  className: "mr-2 h-4 w-4 animate-spin"
                }), "Сохранение..."]
              }) : "Сохранить изменения"
            })]
          })
        })
      })]
    }), /* @__PURE__ */ jsxs(Card, {
      children: [/* @__PURE__ */ jsxs(CardHeader, {
        children: [/* @__PURE__ */ jsx(CardTitle, {
          children: "Безопасность"
        }), /* @__PURE__ */ jsx(CardDescription, {
          children: "Обновите свой пароль."
        })]
      }), /* @__PURE__ */ jsx(CardContent, {
        children: /* @__PURE__ */ jsx(Form, {
          ...form,
          children: /* @__PURE__ */ jsxs("form", {
            onSubmit: form.handleSubmit(handlePasswordChange),
            className: "grid gap-4",
            children: [error && /* @__PURE__ */ jsxs(Alert, {
              variant: "destructive",
              children: [/* @__PURE__ */ jsx(AlertCircle, {
                className: "h-4 w-4"
              }), /* @__PURE__ */ jsx(AlertDescription, {
                children: error.message
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid gap-2",
              children: [/* @__PURE__ */ jsx(FormField, {
                control: form.control,
                name: "currentPassword",
                render: ({
                  field
                }) => /* @__PURE__ */ jsxs(FormItem, {
                  children: [/* @__PURE__ */ jsx(FormLabel, {
                    children: "Текущий пароль"
                  }), /* @__PURE__ */ jsx(FormControl, {
                    children: /* @__PURE__ */ jsx(Input, {
                      id: "current-password",
                      type: "password",
                      placeholder: "********",
                      ...field
                    })
                  }), /* @__PURE__ */ jsx(FormMessage, {})]
                })
              }), /* @__PURE__ */ jsx(FormField, {
                control: form.control,
                name: "newPassword",
                render: ({
                  field
                }) => /* @__PURE__ */ jsxs(FormItem, {
                  children: [/* @__PURE__ */ jsx(FormLabel, {
                    children: "Новый пароль"
                  }), /* @__PURE__ */ jsx(FormControl, {
                    children: /* @__PURE__ */ jsx(Input, {
                      id: "new-password",
                      type: "password",
                      placeholder: "********",
                      ...field
                    })
                  }), /* @__PURE__ */ jsx(FormMessage, {})]
                })
              }), /* @__PURE__ */ jsx(FormField, {
                control: form.control,
                name: "confirmPassword",
                render: ({
                  field
                }) => /* @__PURE__ */ jsxs(FormItem, {
                  children: [/* @__PURE__ */ jsx(FormLabel, {
                    children: "Подтвердите пароль"
                  }), /* @__PURE__ */ jsx(FormControl, {
                    children: /* @__PURE__ */ jsx(Input, {
                      id: "confirm-password",
                      placeholder: "********",
                      type: "password",
                      ...field
                    })
                  }), /* @__PURE__ */ jsx(FormMessage, {})]
                })
              })]
            }), /* @__PURE__ */ jsx(Button, {
              type: "submit",
              className: "mt-2 w-fit",
              disabled: isPending || isChangingPassword,
              children: isPending || isChangingPassword ? /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(Loader2, {
                  className: "mr-2 h-4 w-4 animate-spin"
                }), "Обновление..."]
              }) : "Update Password"
            })]
          })
        })
      })]
    }), /* @__PURE__ */ jsx(TwoFASection, {})]
  });
};
const profile = withComponentProps(ProfilePage);
const route21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: profile,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
function meta$1({}) {
  return [{
    title: "TaskHub | Reset Password"
  }, {
    name: "description",
    content: "Reset Password to TaskHub!"
  }];
}
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("tk");
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    mutate,
    isPending: isResetting
  } = useResetPasswordMutation();
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });
  const onSubmit = async (values) => {
    var _a, _b;
    setError(null);
    setIsSuccess(false);
    try {
      if (!token) {
        setError("Invalid or missing token.");
        return;
      }
      mutate({
        token,
        newPassword: values.password,
        confirmPassword: values.confirmPassword
      }, {
        onSuccess: () => {
          setIsSuccess(true);
          form.reset();
        },
        onError: (error2) => {
          var _a2, _b2;
          setError(((_b2 = (_a2 = error2 == null ? void 0 : error2.response) == null ? void 0 : _a2.data) == null ? void 0 : _b2.message) || error2.message || "Failed to reset password");
          console.log(error2);
        }
      });
    } catch (err) {
      setError(((_b = (_a = err == null ? void 0 : err.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) || err.message || "Failed to reset password");
    }
  };
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4",
    children: /* @__PURE__ */ jsxs("div", {
      className: "w-full max-w-md space-y-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex flex-col items-center space-y-2 text-center",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-bold",
          children: "Сбросить пароль"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-muted-foreground",
          children: "Введите новый пароль ниже."
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        className: "border-border/50 shadow-xl",
        children: [/* @__PURE__ */ jsx(CardHeader, {
          children: /* @__PURE__ */ jsxs(Link, {
            to: "/",
            className: "flex items-center text-sm text-muted-foreground hover:text-foreground",
            children: [/* @__PURE__ */ jsx(ArrowLeft, {
              className: "mr-2 h-4 w-4"
            }), "Вернуться к входу"]
          })
        }), /* @__PURE__ */ jsx(CardContent, {
          children: isSuccess ? /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col items-center space-y-4 py-6",
            children: [/* @__PURE__ */ jsx("div", {
              className: "rounded-full bg-primary/10 p-3",
              children: /* @__PURE__ */ jsx(CheckCircle2, {
                className: "h-8 w-8 text-primary"
              })
            }), /* @__PURE__ */ jsx("h3", {
              className: "text-xl font-semibold",
              children: "Сброс пароля успешен"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-center text-muted-foreground",
              children: "Ваш пароль сброшен. Теперь вы можете войти, используя новый пароль."
            }), /* @__PURE__ */ jsx(Button, {
              asChild: true,
              className: "mt-4",
              children: /* @__PURE__ */ jsx(Link, {
                to: "/",
                children: "Перейти к входу"
              })
            })]
          }) : /* @__PURE__ */ jsx(Form, {
            ...form,
            children: /* @__PURE__ */ jsxs("form", {
              onSubmit: form.handleSubmit(onSubmit),
              className: "space-y-4",
              children: [error && /* @__PURE__ */ jsxs(Alert, {
                variant: "destructive",
                children: [/* @__PURE__ */ jsx(AlertCircle, {
                  className: "h-4 w-4"
                }), /* @__PURE__ */ jsx(AlertDescription, {
                  children: error
                })]
              }), /* @__PURE__ */ jsx(FormField, {
                control: form.control,
                name: "password",
                render: ({
                  field
                }) => /* @__PURE__ */ jsxs(FormItem, {
                  children: [/* @__PURE__ */ jsx(FormLabel, {
                    children: "Новый пароль"
                  }), /* @__PURE__ */ jsx(FormControl, {
                    children: /* @__PURE__ */ jsx(Input, {
                      type: "password",
                      placeholder: "••••••••",
                      ...field
                    })
                  }), /* @__PURE__ */ jsx(FormMessage, {})]
                })
              }), /* @__PURE__ */ jsx(FormField, {
                control: form.control,
                name: "confirmPassword",
                render: ({
                  field
                }) => /* @__PURE__ */ jsxs(FormItem, {
                  children: [/* @__PURE__ */ jsx(FormLabel, {
                    children: "Подтвердите новый пароль"
                  }), /* @__PURE__ */ jsx(FormControl, {
                    children: /* @__PURE__ */ jsx(Input, {
                      type: "password",
                      placeholder: "••••••••",
                      ...field
                    })
                  }), /* @__PURE__ */ jsx(FormMessage, {})]
                })
              }), /* @__PURE__ */ jsx(Button, {
                type: "submit",
                size: "lg",
                className: "w-full",
                disabled: isResetting,
                children: isResetting ? /* @__PURE__ */ jsxs(Fragment, {
                  children: [/* @__PURE__ */ jsx(Loader2, {
                    className: "mr-2 h-4 w-4 animate-spin"
                  }), "Переустановка..."]
                }) : "Reset Password"
              })]
            })
          })
        }), /* @__PURE__ */ jsx(CardFooter, {
          children: /* @__PURE__ */ jsxs("div", {
            className: "text-center text-sm w-full",
            children: ["Забыли пароль?", " ", /* @__PURE__ */ jsx(Link, {
              to: "/",
              className: "text-blue-600 font-semibold hover:underline",
              children: "Войти"
            })]
          })
        })]
      })]
    })
  });
};
const resetPassword = withComponentProps(ResetPasswordPage);
const route22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: resetPassword,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function meta({}) {
  return [{
    title: "TaskHub | Page Not Found"
  }, {
    name: "description",
    content: "Page Not Found to TaskHub!"
  }];
}
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex items-center justify-center bg-gray-100",
    children: /* @__PURE__ */ jsxs("div", {
      className: "text-center",
      children: [/* @__PURE__ */ jsx("h1", {
        className: "text-4xl font-bold mb-4",
        children: "404"
      }), /* @__PURE__ */ jsx("p", {
        className: "text-xl text-gray-600 mb-4",
        children: "Упс! Страница не найдена."
      }), /* @__PURE__ */ jsx(Button, {
        onClick: () => navigate(-1),
        children: "Вернуться назад"
      })]
    })
  });
};
const notFound = withComponentProps(NotFound);
const route23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: notFound,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-By2RqoIa.js", "imports": ["/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/index-SQXACE-4.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-BDUd1uy4.js", "imports": ["/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/index-SQXACE-4.js", "/assets/with-props-DZFoMOGS.js", "/assets/auth-context-BRfrjLsp.js", "/assets/language-context-DwF0ibTh.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/index-CSzYmE0U.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js"], "css": ["/assets/root-DYgbzcfO.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/auth-layout": { "id": "routes/auth/auth-layout", "parentId": "root", "path": void 0, "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/auth-layout-CW8AEnuo.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/loader-09zPHqqK.js", "/assets/auth-context-BRfrjLsp.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/index-CSzYmE0U.js", "/assets/index-SQXACE-4.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/sign-in": { "id": "routes/auth/sign-in", "parentId": "routes/auth/auth-layout", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/sign-in-DpR6BBTW.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/form-DZzfTWTj.js", "/assets/index-CSzYmE0U.js", "/assets/use-auth-DySE9sPW.js", "/assets/auth-context-BRfrjLsp.js", "/assets/alert-DqHgJ41w.js", "/assets/button-DXi4Qs_L.js", "/assets/input-IkQKRTMy.js", "/assets/circle-alert-DroFiDLN.js", "/assets/loader-circle-NsKzwp7P.js", "/assets/card-BsXsZQeO.js", "/assets/schema-BMX0QkVm.js", "/assets/toast-messages-BMbI_7GX.js", "/assets/index-DzszfRT3.js", "/assets/label-DnEgSiPv.js", "/assets/index-7DfICFps.js", "/assets/index-SQXACE-4.js", "/assets/useMutation-Ug0BUQy9.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/createLucideIcon-CKae7mtu.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/sign-up": { "id": "routes/auth/sign-up", "parentId": "routes/auth/auth-layout", "path": "sign-up", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/sign-up-BEGlDU6a.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/form-DZzfTWTj.js", "/assets/index-CSzYmE0U.js", "/assets/alert-DqHgJ41w.js", "/assets/button-DXi4Qs_L.js", "/assets/card-BsXsZQeO.js", "/assets/input-IkQKRTMy.js", "/assets/schema-BMX0QkVm.js", "/assets/loader-circle-NsKzwp7P.js", "/assets/toast-messages-BMbI_7GX.js", "/assets/circle-alert-DroFiDLN.js", "/assets/index-DzszfRT3.js", "/assets/label-DnEgSiPv.js", "/assets/index-7DfICFps.js", "/assets/index-SQXACE-4.js", "/assets/createLucideIcon-CKae7mtu.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/forgot-password": { "id": "routes/auth/forgot-password", "parentId": "routes/auth/auth-layout", "path": "forgot-password", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/forgot-password-DcrImz-R.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/button-DXi4Qs_L.js", "/assets/input-IkQKRTMy.js", "/assets/card-BsXsZQeO.js", "/assets/form-DZzfTWTj.js", "/assets/alert-DqHgJ41w.js", "/assets/use-auth-DySE9sPW.js", "/assets/arrow-left-CioVwuCL.js", "/assets/circle-check-BIk_6xY0.js", "/assets/circle-alert-DroFiDLN.js", "/assets/loader-circle-NsKzwp7P.js", "/assets/index-DzszfRT3.js", "/assets/label-DnEgSiPv.js", "/assets/index-7DfICFps.js", "/assets/index-SQXACE-4.js", "/assets/useMutation-Ug0BUQy9.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/index-CSzYmE0U.js", "/assets/createLucideIcon-CKae7mtu.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/verify-email": { "id": "routes/auth/verify-email", "parentId": "routes/auth/auth-layout", "path": "verify-email", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/verify-email-NUYr5VYn.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/button-DXi4Qs_L.js", "/assets/card-BsXsZQeO.js", "/assets/use-auth-DySE9sPW.js", "/assets/arrow-left-CioVwuCL.js", "/assets/loader-circle-NsKzwp7P.js", "/assets/circle-check-BIk_6xY0.js", "/assets/circle-x-CblRDiPG.js", "/assets/index-DzszfRT3.js", "/assets/useMutation-Ug0BUQy9.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/index-CSzYmE0U.js", "/assets/index-SQXACE-4.js", "/assets/createLucideIcon-CKae7mtu.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/verify.$token": { "id": "routes/verify.$token", "parentId": "routes/auth/auth-layout", "path": "verify/:token", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/verify._token-omfxaRKa.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/loader-circle-NsKzwp7P.js", "/assets/circle-check-big-C6XYVBqU.js", "/assets/circle-x-CblRDiPG.js", "/assets/createLucideIcon-CKae7mtu.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/callback": { "id": "routes/auth/callback", "parentId": "routes/auth/auth-layout", "path": "auth/callback", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/callback-89blGkuu.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/index-CSzYmE0U.js", "/assets/loader-09zPHqqK.js", "/assets/auth-context-BRfrjLsp.js", "/assets/toast-messages-BMbI_7GX.js", "/assets/index-SQXACE-4.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/dashboard-layout": { "id": "routes/dashboard/dashboard-layout", "parentId": "root", "path": void 0, "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": true, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/dashboard-layout-DrBPCsO5.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/avatar-BrNFCVTh.js", "/assets/button-DXi4Qs_L.js", "/assets/dropdown-menu-NXVKWIIS.js", "/assets/auth-context-BRfrjLsp.js", "/assets/language-context-DwF0ibTh.js", "/assets/form-DZzfTWTj.js", "/assets/index-CSzYmE0U.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/card-BsXsZQeO.js", "/assets/index-DzszfRT3.js", "/assets/DayPicker-B7DBXuI6.js", "/assets/popover-BS4go8yB.js", "/assets/index-DOBHTXVc.js", "/assets/Combination-BnIgCuso.js", "/assets/select-CzaKESy1.js", "/assets/index-DQjhtfC1.js", "/assets/index-4oqkfR53.js", "/assets/index-7DfICFps.js", "/assets/dialog-t2vAfIxl.js", "/assets/input-IkQKRTMy.js", "/assets/textarea-Btv-WhEw.js", "/assets/use-task-CEYgmF7y.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/calendar-BiVnGx_-.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/bell-XTNdTybh.js", "/assets/scroll-area-C96JGsDD.js", "/assets/user-D_BZu4xt.js", "/assets/star-B_Bun3Hp.js", "/assets/clipboard-list-Bj36NxRE.js", "/assets/users-C7wkPL1j.js", "/assets/circle-check-BIk_6xY0.js", "/assets/settings-CIFR7PJp.js", "/assets/loader-09zPHqqK.js", "/assets/useMutation-Ug0BUQy9.js", "/assets/schema-BMX0QkVm.js", "/assets/badge-Dg-iJNId.js", "/assets/index-PdpdsD6y.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/label-DnEgSiPv.js", "/assets/index-SQXACE-4.js", "/assets/en-US-DuGUIuVI.js", "/assets/index-BdQq_4o_.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/index": { "id": "routes/dashboard/index", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-BZf1jBQl.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/loader-09zPHqqK.js", "/assets/auth-context-BRfrjLsp.js", "/assets/language-context-DwF0ibTh.js", "/assets/use-task-CEYgmF7y.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/date-utils-iFeXSzOZ.js", "/assets/index-CSzYmE0U.js", "/assets/index-SQXACE-4.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/useMutation-Ug0BUQy9.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/my-tasks": { "id": "routes/dashboard/my-tasks", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard/my-tasks", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/my-tasks-fF9AFsS9.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/loader-09zPHqqK.js", "/assets/language-context-DwF0ibTh.js", "/assets/badge-Dg-iJNId.js", "/assets/button-DXi4Qs_L.js", "/assets/card-BsXsZQeO.js", "/assets/dropdown-menu-NXVKWIIS.js", "/assets/input-IkQKRTMy.js", "/assets/index-DOBHTXVc.js", "/assets/index-4oqkfR53.js", "/assets/index-7DfICFps.js", "/assets/index-PdpdsD6y.js", "/assets/Combination-BnIgCuso.js", "/assets/index-DzszfRT3.js", "/assets/use-task-CEYgmF7y.js", "/assets/index-D9oiEvlI.js", "/assets/date-utils-iFeXSzOZ.js", "/assets/translations-DbaL5CzK.js", "/assets/arrow-up-narrow-wide-tzc8En0I.js", "/assets/funnel-BjcA4KsN.js", "/assets/circle-check-BIk_6xY0.js", "/assets/clock-DjglJpR6.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/index-DQjhtfC1.js", "/assets/index-SQXACE-4.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/useMutation-Ug0BUQy9.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/achieved": { "id": "routes/dashboard/achieved", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard/achieved", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/achieved-BCfEHuq6.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/badge-Dg-iJNId.js", "/assets/button-DXi4Qs_L.js", "/assets/card-BsXsZQeO.js", "/assets/input-IkQKRTMy.js", "/assets/select-CzaKESy1.js", "/assets/table-DfStPPJC.js", "/assets/date-filters-Dz8AEGlx.js", "/assets/popover-BS4go8yB.js", "/assets/use-task-CEYgmF7y.js", "/assets/date-utils-iFeXSzOZ.js", "/assets/translations-DbaL5CzK.js", "/assets/loader-09zPHqqK.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/index-DzszfRT3.js", "/assets/circle-check-big-C6XYVBqU.js", "/assets/funnel-BjcA4KsN.js", "/assets/calendar-BiVnGx_-.js", "/assets/eye-BkIADoZ_.js", "/assets/DayPicker-B7DBXuI6.js", "/assets/index-SQXACE-4.js", "/assets/index-BdQq_4o_.js", "/assets/index-DOBHTXVc.js", "/assets/index-DQjhtfC1.js", "/assets/index-7DfICFps.js", "/assets/index-PdpdsD6y.js", "/assets/Combination-BnIgCuso.js", "/assets/endOfMonth-CunzQUlw.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/en-US-DuGUIuVI.js", "/assets/index-4oqkfR53.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/useMutation-Ug0BUQy9.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/all-tasks": { "id": "routes/dashboard/all-tasks", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard/all-tasks", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/all-tasks-BAqAlN-L.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/loader-09zPHqqK.js", "/assets/language-context-DwF0ibTh.js", "/assets/badge-Dg-iJNId.js", "/assets/button-DXi4Qs_L.js", "/assets/card-BsXsZQeO.js", "/assets/index-DzszfRT3.js", "/assets/input-IkQKRTMy.js", "/assets/select-CzaKESy1.js", "/assets/table-DfStPPJC.js", "/assets/avatar-BrNFCVTh.js", "/assets/date-filters-Dz8AEGlx.js", "/assets/popover-BS4go8yB.js", "/assets/date-utils-iFeXSzOZ.js", "/assets/translations-DbaL5CzK.js", "/assets/auth-context-BRfrjLsp.js", "/assets/use-task-CEYgmF7y.js", "/assets/circle-alert-DroFiDLN.js", "/assets/calendar-BiVnGx_-.js", "/assets/arrow-up-narrow-wide-tzc8En0I.js", "/assets/eye-BkIADoZ_.js", "/assets/DayPicker-B7DBXuI6.js", "/assets/index-SQXACE-4.js", "/assets/index-BdQq_4o_.js", "/assets/index-DOBHTXVc.js", "/assets/index-DQjhtfC1.js", "/assets/index-7DfICFps.js", "/assets/index-PdpdsD6y.js", "/assets/Combination-BnIgCuso.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/endOfMonth-CunzQUlw.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/en-US-DuGUIuVI.js", "/assets/index-4oqkfR53.js", "/assets/index-CSzYmE0U.js", "/assets/index-D9oiEvlI.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/useMutation-Ug0BUQy9.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/manager-tasks": { "id": "routes/dashboard/manager-tasks", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard/manager-tasks", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/manager-tasks-BS_03GqQ.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/badge-Dg-iJNId.js", "/assets/card-BsXsZQeO.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/auth-context-BRfrjLsp.js", "/assets/language-context-DwF0ibTh.js", "/assets/date-utils-iFeXSzOZ.js", "/assets/user-D_BZu4xt.js", "/assets/star-B_Bun3Hp.js", "/assets/calendar-BiVnGx_-.js", "/assets/clock-DjglJpR6.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/index-DzszfRT3.js", "/assets/index-CSzYmE0U.js", "/assets/index-SQXACE-4.js", "/assets/index-D9oiEvlI.js", "/assets/createLucideIcon-CKae7mtu.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/important-tasks": { "id": "routes/dashboard/important-tasks", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard/important-tasks", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/important-tasks-J_-JlBfE.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/badge-Dg-iJNId.js", "/assets/card-BsXsZQeO.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/auth-context-BRfrjLsp.js", "/assets/language-context-DwF0ibTh.js", "/assets/translations-DbaL5CzK.js", "/assets/date-utils-iFeXSzOZ.js", "/assets/star-B_Bun3Hp.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/user-D_BZu4xt.js", "/assets/calendar-BiVnGx_-.js", "/assets/clock-DjglJpR6.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/index-DzszfRT3.js", "/assets/index-CSzYmE0U.js", "/assets/index-SQXACE-4.js", "/assets/index-D9oiEvlI.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/analytics": { "id": "routes/dashboard/analytics", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard/analytics", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/analytics-CHk3BCOH.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/loader-09zPHqqK.js", "/assets/card-BsXsZQeO.js", "/assets/index-DOBHTXVc.js", "/assets/index-7DfICFps.js", "/assets/index-DzszfRT3.js", "/assets/button-DXi4Qs_L.js", "/assets/select-CzaKESy1.js", "/assets/auth-context-BRfrjLsp.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/language-context-DwF0ibTh.js", "/assets/circle-alert-DroFiDLN.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/clipboard-list-Bj36NxRE.js", "/assets/clock-DjglJpR6.js", "/assets/circle-check-big-C6XYVBqU.js", "/assets/index-SQXACE-4.js", "/assets/index-BdQq_4o_.js", "/assets/index-DQjhtfC1.js", "/assets/index-PdpdsD6y.js", "/assets/Combination-BnIgCuso.js", "/assets/index-CSzYmE0U.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/members": { "id": "routes/dashboard/members", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard/members", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/members-Bue12GzD.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/index-CSzYmE0U.js", "/assets/loader-09zPHqqK.js", "/assets/avatar-BrNFCVTh.js", "/assets/badge-Dg-iJNId.js", "/assets/button-DXi4Qs_L.js", "/assets/card-BsXsZQeO.js", "/assets/dropdown-menu-NXVKWIIS.js", "/assets/input-IkQKRTMy.js", "/assets/select-CzaKESy1.js", "/assets/table-DfStPPJC.js", "/assets/dialog-t2vAfIxl.js", "/assets/date-utils-iFeXSzOZ.js", "/assets/auth-context-BRfrjLsp.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/useMutation-Ug0BUQy9.js", "/assets/circle-alert-DroFiDLN.js", "/assets/users-C7wkPL1j.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/shield-BIPXOmMt.js", "/assets/user-D_BZu4xt.js", "/assets/clock-DjglJpR6.js", "/assets/circle-check-big-C6XYVBqU.js", "/assets/settings-CIFR7PJp.js", "/assets/index-SQXACE-4.js", "/assets/index-DOBHTXVc.js", "/assets/index-7DfICFps.js", "/assets/index-DzszfRT3.js", "/assets/Combination-BnIgCuso.js", "/assets/index-DQjhtfC1.js", "/assets/index-PdpdsD6y.js", "/assets/index-4oqkfR53.js", "/assets/index-BdQq_4o_.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/workspace-setting": { "id": "routes/dashboard/workspace-setting", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard/settings", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/workspace-setting-t-_f6YII.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/button-DXi4Qs_L.js", "/assets/card-BsXsZQeO.js", "/assets/input-IkQKRTMy.js", "/assets/label-DnEgSiPv.js", "/assets/separator-BX1z1Ogo.js", "/assets/auth-context-BRfrjLsp.js", "/assets/index-CSzYmE0U.js", "/assets/settings-CIFR7PJp.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/user-D_BZu4xt.js", "/assets/shield-BIPXOmMt.js", "/assets/bell-XTNdTybh.js", "/assets/index-DzszfRT3.js", "/assets/index-7DfICFps.js", "/assets/index-SQXACE-4.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard/task.$taskId": { "id": "routes/dashboard/task.$taskId", "parentId": "routes/dashboard/dashboard-layout", "path": "dashboard/task/:taskId", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/task._taskId-C7o85eS1.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/useMutation-Ug0BUQy9.js", "/assets/use-task-CEYgmF7y.js", "/assets/loader-09zPHqqK.js", "/assets/badge-Dg-iJNId.js", "/assets/button-DXi4Qs_L.js", "/assets/card-BsXsZQeO.js", "/assets/input-IkQKRTMy.js", "/assets/select-CzaKESy1.js", "/assets/dialog-t2vAfIxl.js", "/assets/date-utils-iFeXSzOZ.js", "/assets/translations-DbaL5CzK.js", "/assets/auth-context-BRfrjLsp.js", "/assets/index-CSzYmE0U.js", "/assets/loader-circle-NsKzwp7P.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/textarea-Btv-WhEw.js", "/assets/avatar-BrNFCVTh.js", "/assets/scroll-area-C96JGsDD.js", "/assets/separator-BX1z1Ogo.js", "/assets/popover-BS4go8yB.js", "/assets/index-D9oiEvlI.js", "/assets/formatDistanceToNow-CnAFtDTq.js", "/assets/eye-BkIADoZ_.js", "/assets/language-context-DwF0ibTh.js", "/assets/circle-check-BIk_6xY0.js", "/assets/circle-check-big-C6XYVBqU.js", "/assets/arrow-left-CioVwuCL.js", "/assets/star-B_Bun3Hp.js", "/assets/user-D_BZu4xt.js", "/assets/users-C7wkPL1j.js", "/assets/calendar-BiVnGx_-.js", "/assets/clock-DjglJpR6.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/index-DzszfRT3.js", "/assets/index-SQXACE-4.js", "/assets/index-BdQq_4o_.js", "/assets/index-DOBHTXVc.js", "/assets/index-DQjhtfC1.js", "/assets/index-7DfICFps.js", "/assets/index-PdpdsD6y.js", "/assets/Combination-BnIgCuso.js", "/assets/index-4oqkfR53.js", "/assets/en-US-DuGUIuVI.js", "/assets/endOfMonth-CunzQUlw.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/user/user-layout": { "id": "routes/user/user-layout", "parentId": "root", "path": void 0, "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/user-layout-Dh-FxItp.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/loader-09zPHqqK.js", "/assets/auth-context-BRfrjLsp.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/index-CSzYmE0U.js", "/assets/index-SQXACE-4.js", "/assets/index-D9oiEvlI.js", "/assets/differenceInCalendarDays-DdX_lYA2.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/user/notifications": { "id": "routes/user/notifications", "parentId": "routes/user/user-layout", "path": "user/notifications", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/notifications-R4aT35dV.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/index-CSzYmE0U.js", "/assets/loader-09zPHqqK.js", "/assets/use-user-Dkbdx9b-.js", "/assets/avatar-BrNFCVTh.js", "/assets/badge-Dg-iJNId.js", "/assets/button-DXi4Qs_L.js", "/assets/scroll-area-C96JGsDD.js", "/assets/formatDistanceToNow-CnAFtDTq.js", "/assets/index-SQXACE-4.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/useMutation-Ug0BUQy9.js", "/assets/auth-context-BRfrjLsp.js", "/assets/index-D9oiEvlI.js", "/assets/index-DOBHTXVc.js", "/assets/index-7DfICFps.js", "/assets/index-DzszfRT3.js", "/assets/index-4oqkfR53.js", "/assets/index-PdpdsD6y.js", "/assets/index-BdQq_4o_.js", "/assets/en-US-DuGUIuVI.js", "/assets/endOfMonth-CunzQUlw.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/user/profile": { "id": "routes/user/profile", "parentId": "routes/user/user-layout", "path": "user/profile", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/profile-DhaBY02w.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/form-DZzfTWTj.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/index-CSzYmE0U.js", "/assets/loader-09zPHqqK.js", "/assets/card-BsXsZQeO.js", "/assets/button-DXi4Qs_L.js", "/assets/input-IkQKRTMy.js", "/assets/label-DnEgSiPv.js", "/assets/use-user-Dkbdx9b-.js", "/assets/dialog-t2vAfIxl.js", "/assets/loader-circle-NsKzwp7P.js", "/assets/alert-DqHgJ41w.js", "/assets/avatar-BrNFCVTh.js", "/assets/separator-BX1z1Ogo.js", "/assets/auth-context-BRfrjLsp.js", "/assets/circle-alert-DroFiDLN.js", "/assets/index-DzszfRT3.js", "/assets/index-SQXACE-4.js", "/assets/index-7DfICFps.js", "/assets/useQuery-BfZYG4Bu.js", "/assets/differenceInCalendarDays-DdX_lYA2.js", "/assets/useMutation-Ug0BUQy9.js", "/assets/index-DOBHTXVc.js", "/assets/Combination-BnIgCuso.js", "/assets/index-4oqkfR53.js", "/assets/createLucideIcon-CKae7mtu.js", "/assets/index-D9oiEvlI.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/reset-password": { "id": "routes/auth/reset-password", "parentId": "root", "path": "reset-password", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/reset-password-CphYyAFW.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/form-DZzfTWTj.js", "/assets/button-DXi4Qs_L.js", "/assets/card-BsXsZQeO.js", "/assets/input-IkQKRTMy.js", "/assets/alert-DqHgJ41w.js", "/assets/fetch-utils-B8j2yESG.js", "/assets/schema-BMX0QkVm.js", "/assets/use-auth-DySE9sPW.js", "/assets/arrow-left-CioVwuCL.js", "/assets/circle-check-BIk_6xY0.js", "/assets/circle-alert-DroFiDLN.js", "/assets/loader-circle-NsKzwp7P.js", "/assets/index-DzszfRT3.js", "/assets/label-DnEgSiPv.js", "/assets/index-7DfICFps.js", "/assets/index-SQXACE-4.js", "/assets/useMutation-Ug0BUQy9.js", "/assets/index-CSzYmE0U.js", "/assets/createLucideIcon-CKae7mtu.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/not-found": { "id": "routes/not-found", "parentId": "root", "path": "*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/not-found-BKtPP2si.js", "imports": ["/assets/with-props-DZFoMOGS.js", "/assets/chunk-D4RADZKF-CrjPcDIC.js", "/assets/button-DXi4Qs_L.js", "/assets/index-DzszfRT3.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-ab165de6.js", "version": "ab165de6", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/auth/auth-layout": {
    id: "routes/auth/auth-layout",
    parentId: "root",
    path: void 0,
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/auth/sign-in": {
    id: "routes/auth/sign-in",
    parentId: "routes/auth/auth-layout",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route2
  },
  "routes/auth/sign-up": {
    id: "routes/auth/sign-up",
    parentId: "routes/auth/auth-layout",
    path: "sign-up",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/auth/forgot-password": {
    id: "routes/auth/forgot-password",
    parentId: "routes/auth/auth-layout",
    path: "forgot-password",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/auth/verify-email": {
    id: "routes/auth/verify-email",
    parentId: "routes/auth/auth-layout",
    path: "verify-email",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/verify.$token": {
    id: "routes/verify.$token",
    parentId: "routes/auth/auth-layout",
    path: "verify/:token",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/auth/callback": {
    id: "routes/auth/callback",
    parentId: "routes/auth/auth-layout",
    path: "auth/callback",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/dashboard/dashboard-layout": {
    id: "routes/dashboard/dashboard-layout",
    parentId: "root",
    path: void 0,
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/dashboard/index": {
    id: "routes/dashboard/index",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/dashboard/my-tasks": {
    id: "routes/dashboard/my-tasks",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard/my-tasks",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/dashboard/achieved": {
    id: "routes/dashboard/achieved",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard/achieved",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/dashboard/all-tasks": {
    id: "routes/dashboard/all-tasks",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard/all-tasks",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/dashboard/manager-tasks": {
    id: "routes/dashboard/manager-tasks",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard/manager-tasks",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/dashboard/important-tasks": {
    id: "routes/dashboard/important-tasks",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard/important-tasks",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/dashboard/analytics": {
    id: "routes/dashboard/analytics",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard/analytics",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/dashboard/members": {
    id: "routes/dashboard/members",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard/members",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/dashboard/workspace-setting": {
    id: "routes/dashboard/workspace-setting",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard/settings",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/dashboard/task.$taskId": {
    id: "routes/dashboard/task.$taskId",
    parentId: "routes/dashboard/dashboard-layout",
    path: "dashboard/task/:taskId",
    index: void 0,
    caseSensitive: void 0,
    module: route18
  },
  "routes/user/user-layout": {
    id: "routes/user/user-layout",
    parentId: "root",
    path: void 0,
    index: void 0,
    caseSensitive: void 0,
    module: route19
  },
  "routes/user/notifications": {
    id: "routes/user/notifications",
    parentId: "routes/user/user-layout",
    path: "user/notifications",
    index: void 0,
    caseSensitive: void 0,
    module: route20
  },
  "routes/user/profile": {
    id: "routes/user/profile",
    parentId: "routes/user/user-layout",
    path: "user/profile",
    index: void 0,
    caseSensitive: void 0,
    module: route21
  },
  "routes/auth/reset-password": {
    id: "routes/auth/reset-password",
    parentId: "root",
    path: "reset-password",
    index: void 0,
    caseSensitive: void 0,
    module: route22
  },
  "routes/not-found": {
    id: "routes/not-found",
    parentId: "root",
    path: "*",
    index: void 0,
    caseSensitive: void 0,
    module: route23
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
