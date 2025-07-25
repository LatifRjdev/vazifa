import type { Project } from "@/types";
import { ProjectCard } from "../projects/project-card";
import { NoDataFound } from "../shared/no-data";
import { getProgressPercentage } from "@/lib";

interface ProjectsListProps {
  projects: Project[];
  workspaceId: string;
  onCreateProject: () => void;
}

export const ProjectsList = ({
  projects,
  workspaceId,
  onCreateProject,
}: ProjectsListProps) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Проекты</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <NoDataFound
            title="Пока нет проектов"
            description="Начните с создания своего первого проекта в этом рабочем пространстве."
            buttonText="Создать проект"
            buttonOnClick={onCreateProject}
          />
        ) : (
          projects.map((project) => {
            const projectProgress = getProgressPercentage(project?.tasks);
            return (
              <ProjectCard
                key={project._id}
                project={project}
                progress={projectProgress}
                workspaceId={workspaceId}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
