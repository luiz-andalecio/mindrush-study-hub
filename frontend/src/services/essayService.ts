import api from './api';
import type { Essay } from '@/types';

export const essayService = {
  list: () => api.get<Essay[]>('/essays'),
  submit: (data: { title: string; content: string; theme: string }) => api.post<Essay>('/essays', data),
  getResult: (id: string) => api.get<Essay>(`/essays/${id}`),
};
