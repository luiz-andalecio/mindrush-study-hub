import api from './api';
import type { Simulado } from '@/types';

export const simuladoService = {
  list: () => api.get<Simulado[]>('/simulados'),
  start: (id: string) => api.post<Simulado>(`/simulados/${id}/start`),
  submit: (id: string, answers: Record<string, string>) => api.post(`/simulados/${id}/submit`, { answers }),
  getResult: (id: string) => api.get(`/simulados/${id}/result`),
};
