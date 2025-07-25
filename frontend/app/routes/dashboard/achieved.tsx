import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/shared/no-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchData } from "@/lib/fetch-utils";
import type { Project, Task } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Achieved Project & Tasks" },
    { name: "description", content: "Achieved Project & Tasks to TaskHub!" },
  ];
}

const AchievedTask = () => {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const navigate = useNavigate();

  const { data, isPending } = useQuery({
    queryKey: ["archived-items", workspaceId],
    queryFn: () => fetchData(`/workspaces/${workspaceId}/archives`),
  }) as {
    data: { archivedProjects: Project[]; archivedTasks: Task[] };
    isPending: boolean;
  };

  if (isPending) {
    return <Loader message="Загрузка архивных элементов..." />;
  }

  if (!workspaceId || !data.archivedProjects || !data.archivedTasks) {
    return (
      <NoDataFound
        title="Архивные элементы не найдены."
        description="Вы можете архивировать проекты и задачи, чтобы они не мешались. Вы также можете восстановить их в любое время."
        buttonText="Вернуться"
        buttonOnClick={() => navigate(-1)}
      />
    );
  }

  const { archivedProjects, archivedTasks } = data;

  return (
    <div>
      <div className="container mx-auto py-5">
        {/* <h1 className="text-3xl font-bold mb-6">Achieved Items</h1> */}

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Архивные проекты</h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Заголовок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Прогресс</TableHead>
                <TableHead>Обновлено в</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedProjects?.map((project) => (
                <TableRow key={project._id}>
                  <TableCell>
                    <Link
                      to={`/workspaces/${project.workspace}/projects/${project._id}`}
                      className="font-medium hover:underline"
                    >
                      {project.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">Проект</div>
                  </TableCell>
                  <TableCell>{project.status}</TableCell>
                  <TableCell>{project.progress}%</TableCell>
                  <TableCell>
                    {format(new Date(project.updatedAt), "PP")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Архивированные задачи</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Заголовок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Приоритет</TableHead>
                <TableHead>Проект</TableHead>
                <TableHead>Обновлено в</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedTasks?.map((task) => (
                <TableRow key={task._id}>
                  <TableCell>
                    <Link
                      to={`/workspaces/${workspaceId}/projects/${task.project?._id}/tasks/${task._id}`}
                      className="font-medium hover:underline"
                    >
                      {task?.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">Задача</div>
                  </TableCell>
                  <TableCell>{task.status}</TableCell>
                  <TableCell>{task.priority}</TableCell>
                  <TableCell>{task.project?.title || "N/A"}</TableCell>
                  <TableCell>
                    {format(new Date(task.updatedAt), "PP")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </div>
  );
};

export default AchievedTask;
