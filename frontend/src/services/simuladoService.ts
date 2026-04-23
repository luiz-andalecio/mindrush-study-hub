import api from './api';
import type { Simulado, SimuladoAttempt, SimuladoResult, SimuladoSaveAnswerResponse, EnemAlternativeLetter, SimuladoCompletedAttemptHistoryItem } from '@/types';

export const simuladoService = {
  list: () => api.get<Simulado[]>('/simulados'),
  history: () => api.get<SimuladoCompletedAttemptHistoryItem[]>('/simulados/history'),
  start: (simuladoId: string, payload?: { languageChoice?: string }) =>
    api.post<SimuladoAttempt>(`/simulados/${simuladoId}/start`, payload ?? {}),
  getAttempt: (attemptId: string) => api.get<SimuladoAttempt>(`/simulados/${attemptId}`),
  saveAnswer: (attemptId: string, payload: { enemQuestionId: string; selectedAlternative: EnemAlternativeLetter; flagged?: boolean }) =>
    api.post<SimuladoSaveAnswerResponse>(`/simulados/${attemptId}/answer`, payload),
  submit: (attemptId: string, answers?: Record<string, string>) => api.post<SimuladoResult>(`/simulados/${attemptId}/submit`, { answers }),
  getResult: (attemptId: string) => api.get<SimuladoResult>(`/simulados/${attemptId}/result`),
  pause: (attemptId: string) => api.post<{ attemptId: string; pausedAt: string | null; pausedSeconds: number }>(`/simulados/${attemptId}/pause`),
  resume: (attemptId: string) => api.post<{ attemptId: string; pausedAt: string | null; pausedSeconds: number }>(`/simulados/${attemptId}/resume`),
  restart: (attemptId: string) => api.post<SimuladoAttempt>(`/simulados/${attemptId}/restart`),
};
