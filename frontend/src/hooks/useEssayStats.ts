/**
 * Hook customizado para análise de redações ENEM
 * Gerencia estado e requisições para o dashboard de redações
 */

import { useState, useEffect, useCallback } from 'react';
import { essayStatsService } from '@/services/essayStatsService';
import type {
  EnemEssayStats,
  CompetencyHistoryPoint,
  AutomaticInsight,
  PredictionData,
  EssayListResponse,
  EnemEssay,
  EnemEssayAnalysis,
  BenchmarkComparison,
  EssayFilters,
} from '@/types/essayAnalytics';

interface UseEssayStatsReturn {
  stats: EnemEssayStats | null;
  history: CompetencyHistoryPoint[];
  insights: AutomaticInsight[];
  prediction: PredictionData | null;
  essays: EssayListResponse | null;
  selectedEssay: EnemEssay | null;
  selectedAnalysis: EnemEssayAnalysis | null;
  benchmark: BenchmarkComparison | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  loadEssayAnalysis: (essayId: string) => Promise<void>;
  filterEssays: (filters: EssayFilters) => Promise<void>;
  getBenchmark: () => Promise<void>;
}

export function useEssayStats(): UseEssayStatsReturn {
  const [stats, setStats] = useState<EnemEssayStats | null>(null);
  const [history, setHistory] = useState<CompetencyHistoryPoint[]>([]);
  const [insights, setInsights] = useState<AutomaticInsight[]>([]);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [essays, setEssays] = useState<EssayListResponse | null>(null);
  const [selectedEssay, setSelectedEssay] = useState<EnemEssay | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<EnemEssayAnalysis | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, historyRes, insightsRes, predictionRes, essaysRes] = await Promise.all([
        essayStatsService.getStats(),
        essayStatsService.getHistory(),
        essayStatsService.getInsights(),
        essayStatsService.getPrediction(),
        essayStatsService.listEssays({ limit: 10, offset: 0 }),
      ]);

      setStats(statsRes.data);
      setHistory(historyRes.data);
      setInsights(insightsRes.data);
      setPrediction(predictionRes.data);
      setEssays(essaysRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const loadEssayAnalysis = useCallback(async (essayId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await essayStatsService.getEssayAnalysis(essayId);
      setSelectedEssay(res.data.essay);
      setSelectedAnalysis(res.data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar análise');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterEssays = useCallback(async (filters: EssayFilters) => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...filters };
      if (filters.startDate) payload.startDate = filters.startDate.toISOString();
      if (filters.endDate) payload.endDate = filters.endDate.toISOString();
      const res = await essayStatsService.listEssays(payload);
      setEssays(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao filtrar redações');
    } finally {
      setLoading(false);
    }
  }, []);

  const getBenchmark = useCallback(async () => {
    try {
      const res = await essayStatsService.getBenchmarkComparison();
      setBenchmark(res.data);
    } catch (err) {
      console.error('Erro ao carregar benchmark:', err);
    }
  }, []);

  return {
    stats,
    history,
    insights,
    prediction,
    essays,
    selectedEssay,
    selectedAnalysis,
    benchmark,
    loading,
    error,
    refreshStats,
    loadEssayAnalysis,
    filterEssays,
    getBenchmark,
  };
}
