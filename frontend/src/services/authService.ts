import api from './api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types';

export const authService = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  logout: () => { localStorage.removeItem('mindrush_token'); },
  getToken: () => localStorage.getItem('mindrush_token'),
  isAuthenticated: () => !!localStorage.getItem('mindrush_token'),
};
