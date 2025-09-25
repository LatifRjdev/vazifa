import { CirclePlus, UserPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import type { User, Workspace } from "@/types";

export interface MemberProps {
  _id: string;
  user: User;
  role: string;
  joinedAt: Date;
}

interface WorkspaceHeaderProps {
  workspace: Workspace;
  members: MemberProps[];
  onCreateProject: () => void;
  onInviteMembers: () => void;
}

export const WorkspaceHeader = ({
  workspace,
  members,
  onCreateProject,
  onInviteMembers,
}: WorkspaceHeaderProps) => {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col-reverse md:flex-row md:items-center justify-between">
          <div className="flex  md:items-center gap-3">
            {workspace.color && (
              <WorkspaceAvatar color={workspace.color} name={workspace.name} />
            )}
            <h2 className="text-xl md:text-3xl font-bold">{workspace.name}</h2>
          </div>
          <div className="flex items-center justify-between md:justify-start gap-3 mb-4 md:mb-0">
            <Button variant="outline" size="sm" onClick={onInviteMembers}>
              <UserPlus className="mr-2 h-4 w-4" />
              Пригласить
            </Button>
            <Button onClick={onCreateProject}>
              <CirclePlus className="mr-2 h-4 w-4" />
              Новый Проект
            </Button>
          </div>
        </div>

        {workspace.description && (
          <p className="text-sm md:text-base text-muted-foreground">
            {workspace.description}
          </p>
        )}
      </div>

      {members.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Участники:</span>
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((member) => (
              <Avatar
                key={member._id}
                className="relative h-8 w-8 rounded-full border-2 border-background overflow-hidden"
                title={member.user?.name || "Member"}
              >
                <AvatarImage
                  src={member.user?.profilePicture || undefined}
                  alt={member.user.name}
                />
                <AvatarFallback>
                  {member.user.name ? member.user.name.charAt(0) : "M"}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 5 && (
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                +{members.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
