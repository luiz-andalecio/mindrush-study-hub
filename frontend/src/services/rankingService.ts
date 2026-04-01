import api from './api';
import type { RankingEntry } from '@/types';

export const rankingService = {
  getLeaderboard: () => api.get<RankingEntry[]>('/ranking'),
};
