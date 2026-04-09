import api from './api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types';

export const authService = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  refresh: () => api.post<{ token: string }>('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
};
