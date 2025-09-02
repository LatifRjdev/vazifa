import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  Task, 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials,
  ApiResponse 
} from '../types';

// Используем localhost для разработки - в продакшене это будет ваш домен
const API_BASE_URL = 'http://localhost:5001/api-v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обработки ответов
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
};

export const taskAPI = {
  getMyTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks/my-tasks');
    return response.data;
  },

  getAllTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks/all-tasks');
    return response.data;
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData: Partial<Task>): Promise<Task> => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (id: string, taskData: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  updateTaskStatus: async (id: string, status: Task['status']): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },
};

export const userAPI = {
  getAllUsers: async (): Promise<{ users: User[] }> => {
    const response = await api.get('/users/all');
    return response.data;
  },
};

export default api;
