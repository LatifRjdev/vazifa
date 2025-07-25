import type { Workspace } from "@/types";

export const WorkspaceAvatar = ({
  color,
  name,
}: {
  color: string;
  name: string;
}) => {
  return (
    <div
      className="w-6 2xl:w-8 h-6 2xl:h-8 rounded flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <span className="text-xs font-medium text-white">{name.charAt(0)}</span>
    </div>
  );
};
