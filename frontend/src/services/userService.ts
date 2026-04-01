import api from './api';
import type { User, DashboardStats } from '@/types';

export const userService = {
  getProfile: () => api.get<User>('/users/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),
  getDashboardStats: () => api.get<DashboardStats>('/users/me/dashboard'),
};
