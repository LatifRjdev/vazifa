import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterCredentials } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await authAPI.register(credentials);
      
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
