import api from './api';
import type { ChatMessage } from '@/types';

export const chatbotService = {
  sendMessage: (message: string) => api.post<ChatMessage>('/chatbot', { message }),
  getHistory: () => api.get<ChatMessage[]>('/chatbot/history'),
};
