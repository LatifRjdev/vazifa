import { RecentProjects } from "@/components/dashboard/recent-projects";
import {
  StatisticsCharts,
  type ProjectStatusData,
  type TaskPriorityData,
  type TaskTrendsData,
  type WorkspaceProductivityData,
} from "@/components/dashboard/statistics-charts";
import {
  StatsCard,
  type StatsCardProps,
} from "@/components/dashboard/stats-card";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { Loader } from "@/components/loader";
import { useGetWorkspaceStatsQuery } from "@/hooks/use-workspace";
import { useAuth } from "@/providers/auth-context";
import type { Project, Task } from "@/types";
import { useSearchParams } from "react-router";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Dashboard" },
    { name: "description", content: "Dashboard to TaskHub!" },
  ];
}

const DashboardPage = () => {
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");

  const { data, isPending } = useGetWorkspaceStatsQuery(
    workspaceId as string
  ) as {
    data: {
      stats: StatsCardProps;
      taskTrendsData: TaskTrendsData[];
      projectStatusData: ProjectStatusData[];
      taskPriorityData: TaskPriorityData[];
      workspaceProductivityData: WorkspaceProductivityData[];
      upcomingTasks: Task[];
      recentProjects: Project[];
    };
    isPending: boolean;
  };

  if (isPending) {
    return <Loader message="Загрузка статистики рабочего пространства..." />;
  }

  return (
    <div className="space-y-8 2xl:space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Панель управления</h2>
      </div>

      <StatsCard data={data.stats} />

      <StatisticsCharts
        stats={data.stats}
        taskTrendsData={data.taskTrendsData}
        projectStatusData={data.projectStatusData}
        taskPriorityData={data.taskPriorityData}
        workspaceProductivityData={data.workspaceProductivityData}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentProjects data={data.recentProjects} />

        <UpcomingTasks upcomingTasks={data.upcomingTasks} />
      </div>
    </div>
  );
};

export default DashboardPage;
