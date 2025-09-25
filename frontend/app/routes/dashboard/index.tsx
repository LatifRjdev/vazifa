import { Loader } from "@/components/loader";
import { useAuth } from "@/providers/auth-context";
import { useLanguage } from "@/providers/language-context";
import type { Task } from "@/types";
import { useGetMyTasksQuery } from "@/hooks/use-task";
import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/lib/fetch-utils";
import { formatDateDetailedRussian } from "@/lib/date-utils";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Vazifa | Панель управления" },
    { name: "description", content: "Панель управления Vazifa!" },
  ];
}

const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: myTasks, isPending: myTasksLoading } = useGetMyTasksQuery();
  
  // Для админов и менеджеров получаем все задачи
  const { data: allTasks, isPending: allTasksLoading } = useQuery({
    queryKey: ["all-tasks-dashboard"],
    queryFn: () => fetchData("/tasks/all-tasks"),
    enabled: user?.role && ["admin", "manager"].includes(user.role),
  });

  const isAdmin = user?.role && ["admin", "manager"].includes(user.role);
  const tasksLoading = isAdmin ? allTasksLoading : myTasksLoading;

  if (tasksLoading) {
    return <Loader message={t('common.loading_data')} />;
  }

  // Для админов показываем все задачи, для обычных пользователей - только свои
  let tasks: Task[] = [];
  if (isAdmin) {
    tasks = Array.isArray(allTasks) ? allTasks : 
            (allTasks && (allTasks as any).tasks && Array.isArray((allTasks as any).tasks)) ? (allTasks as any).tasks : [];
  } else {
    tasks = Array.isArray(myTasks) ? myTasks : [];
  }

  return (
    <div className="space-y-8 2xl:space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('nav.dashboard')}</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t('dashboard.total_tasks')}</h3>
          </div>
          <div className="text-2xl font-bold">{tasks.length}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t('dashboard.in_progress')}</h3>
          </div>
          <div className="text-2xl font-bold">
            {tasks.filter(task => task.status === 'In Progress').length}
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t('dashboard.completed')}</h3>
          </div>
          <div className="text-2xl font-bold">
            {tasks.filter(task => task.status === 'Done').length}
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t('dashboard.overdue')}</h3>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {tasks.filter(task => 
              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done'
            ).length}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('dashboard.recent_tasks')}
          </h3>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('common.created')}: {formatDateDetailedRussian(task.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.status === 'Done' ? 'bg-green-100 text-green-800' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status === 'Done' ? t('status.done') :
                       task.status === 'In Progress' ? t('status.in_progress') :
                       task.status === 'To Do' ? t('status.todo') : task.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.priority === 'High' ? 'bg-red-100 text-red-800' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority === 'High' ? t('priority.high') :
                       task.priority === 'Medium' ? t('priority.medium') : t('priority.low')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('tasks.no_tasks_yet')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
