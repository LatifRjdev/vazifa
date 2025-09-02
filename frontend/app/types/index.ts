export type TaskStatus = "To Do" | "In Progress" | "Review" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";

export interface User {
  _id: string;
  name: string;
  lastName?: string;
  phoneNumber?: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  role?: "super_admin" | "admin" | "manager" | "member";
}

// Оставляем Workspace для обратной совместимости
export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  owner: User | string;
  color: string;
  members: {
    user: User;
    role: "owner" | "admin" | "member" | "viewer";
    joinedAt: Date;
  }[];
  isArchived: boolean;
  createdAt: Date;
}

export enum ProjectStatus {
  PLANNING = "Planning",
  IN_PROGRESS = "In Progress",
  ON_HOLD = "On Hold",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

export enum ProjectMemberRole {
  MANAGER = "manager",
  CONTRIBUTOR = "contributor",
  VIEWER = "viewer",
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  startDate: Date;
  dueDate: Date;
  tags: string[];
  members: {
    user: User;
    role: ProjectMemberRole;
  }[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  workspace: string | Workspace;
  isArchived: boolean;
  progress: number;
}

export interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  dueDate: Date;
  priority: TaskPriority;
  assignee: User | string;
  createdBy: User | string;
  assignees: User[];
  subtasks?: Subtask[];
  watchers?: User[];
  attachments?: Attachment[];
  completedAt?: Date;
  responsibleManager?: User | string;
  isImportant?: boolean;
  markedImportantBy?: User | string;
  markedImportantAt?: Date;
}

export interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  _id: string;
}

export interface Comment {
  _id: string;
  author: User;
  text: string;
  createdAt: Date;
  parentComment?: string;
  reactions?: CommentReaction[];
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
  }[];
}

export interface Response {
  _id: string;
  author: User;
  text?: string;
  task: string;
  createdAt: Date;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
  }[];
}

export interface CommentReaction {
  emoji: string;
  user: User;
}

export type ResourceType =
  | "Task"
  | "Project"
  | "Workspace"
  | "Comment"
  | "User";

export type ActionType =
  | "created_task"
  | "updated_task"
  | "created_subtask"
  | "updated_subtask"
  | "completed_task"
  | "created_project"
  | "updated_project"
  | "completed_project"
  | "created_workspace"
  | "updated_workspace"
  | "added_comment"
  | "added_member"
  | "removed_member"
  | "joined_workspace"
  | "added_attachment";

export interface ActivityLog {
  _id: string;
  user: User;
  action: ActionType;
  resourceType: ResourceType;
  resourceId: string;
  details: any;
  createdAt: Date;
}

export type NotificationType =
  | "task_assigned"
  | "task_completed"
  | "comment_added"
  | "mentioned"
  | "due_date_approaching"
  | "workspace_invite"
  | "workspace_ownership_transferred";

export interface Notification {
  _id: string;
  recipient: User;
  message: string;
  createdAt: Date;
  isRead: boolean;
  title: string;
  relatedData: {
    taskId?: string;
    projectId?: string;
    workspaceId?: string;
    commentId?: string;
    actorId?: User;
  };
}
