export interface User {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'user';
  profilePicture?: string;
  isEmailVerified: boolean;
  is2FAEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: User[];
  createdBy: User;
  dueDate?: string;
  attachments?: string[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  lastName?: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}
