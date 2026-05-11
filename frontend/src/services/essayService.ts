import api from './api';
import type { Essay } from '@/types';

export const essayService = {
  list: () => api.get<Essay[]>('/essays'),
  submit: (data: { content: string; theme: string }) => api.post<Essay>('/essays', data),
  correct: (id: string) => api.post<Essay>(`/essays/${id}/correct`),
  getResult: (id: string) => api.get<Essay>(`/essays/${id}`),
};
