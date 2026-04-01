import api from './api';
import type { Question } from '@/types';

export const questionService = {
  getQuestions: (params?: Record<string, string>) => api.get<Question[]>('/questions', { params }),
  getQuestion: (id: string) => api.get<Question>(`/questions/${id}`),
  submitAnswer: (questionId: string, answer: string) => api.post(`/questions/${questionId}/answer`, { answer }),
};
