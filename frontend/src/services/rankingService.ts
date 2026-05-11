import api from './api';
import type { RankingEntry } from '@/types';

export const rankingService = {
  getLeaderboard: (scope: 'world' | 'weekly' | 'daily' = 'world') => api.get<RankingEntry[]>('/ranking', { params: { scope } }),
};
