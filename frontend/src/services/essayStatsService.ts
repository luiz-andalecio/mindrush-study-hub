/**
 * Serviço frontend para análise de redações ENEM
 * Integra com os endpoints de estatísticas do backend
 */

import api from './api';
import type {
  EnemEssayStats,
  CompetencyHistoryPoint,
  AutomaticInsight,
  PredictionData,
  EssayListResponse,
  EnemEssay,
  EnemEssayAnalysis,
} from '@/types/essayAnalytics';

export const essayStatsService = {
  /**
   * Obter estatísticas agregadas do usuário em redações
   */
  getStats: () => api.get<EnemEssayStats>('/essay-stats/stats'),

  /**
   * Obter histórico de competências por semana/mês
   */
  getHistory: () => api.get<CompetencyHistoryPoint[]>('/essay-stats/history'),

  /**
   * Gerar insights automáticos baseados em análises
   */
  getInsights: () => api.get<AutomaticInsight[]>('/essay-stats/insights'),

  /**
   * Fazer predição de nota futura
   */
  getPrediction: () => api.get<PredictionData>('/essay-stats/prediction'),

  /**
   * Listar redações com filtros
   */
  listEssays: (filters: {
    startDate?: string;
    endDate?: string;
    minScore?: number;
    maxScore?: number;
    theme?: string;
    correctionStatus?: 'pending' | 'corrected' | 'zero_rated';
    sortBy?: 'date' | 'score' | 'competency';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) =>
    api.get<EssayListResponse>('/essay-stats/list', {
      params: filters,
    }),

  /**
   * Obter análise detalhada de uma redação específica
   */
  getEssayAnalysis: (essayId: string) =>
    api.get<{
      essay: EnemEssay;
      analysis: EnemEssayAnalysis;
    }>(`/essay-stats/${essayId}/analysis`),

  /**
   * Comparar com benchmark nacional e da plataforma
   */
  getBenchmarkComparison: () =>
    api.get<{
      userAverage: number;
      nationalAverage: number;
      platformAverage: number;
      topPercentileAverage: number;
      userPercentile: number;
      userRank: number;
      totalUsers: number;
      distanceToNational: number;
      distanceToPlatform: number;
    }>('/essay-stats/comparative/benchmark'),

  /**
   * Regenerar estatísticas (manutenção)
   */
  regenerateStats: () => api.post('/essay-stats/regenerate-stats', {}),
};
