/**
 * Hook customizado para buscar estatísticas da API
 */

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

type ApiError = {
  message?: string;
};

export interface OverviewStats {
  overallAccuracy: number;
  questionsAnswered: number;
  estimatedTriScore: number;
  bestArea: string;
  bestAreaAccuracy: number;
  worstArea: string;
  worstAreaAccuracy: number;
  currentStreak: number;
  maxStreak: number;
  studyDays: number;
  weeklyEvolution: number | null;
  averageTimePerQuestion: number;
  xp: number;
  level: number;
}

export interface AreaStats {
  area: string;
  accuracy: number;
  estimatedTriScore: number;
  correctCount: number;
  totalCount: number;
}

export interface Weakness {
  topic: string;
  area: string;
  accuracy: number;
  correctCount: number;
  totalCount: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  improvementPotential: number;
  trend: 'improving' | 'stable' | 'declining' | null;
}

export interface WeaknessDashboard {
  topWeaknesses: Weakness[];
  criticalTopics: string[];
  improvementOpportunities: Array<{ topic: string; potentialGain: number }>;
  overallWeaknessScore: number;
}

export interface LearningPoint {
  date: Date;
  accuracy: number;
  questionsAnswered: number;
}

export interface LearningCurve {
  period: 'week' | 'month' | 'all_time';
  dataPoints: LearningPoint[];
  trend: 'improving' | 'declining' | 'stable';
  trendStrength: number;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  xpReward: number;
  coinReward?: number;
  rarity?: string;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  unlockedAt: string;
  badge: Badge;
}

export interface PerformanceByDifficultyStats {
  [key: string]: number;
}

export interface PerformanceByDifficultyData {
  easy: number;
  medium: number;
  hard: number;
  stats: PerformanceByDifficultyStats;
}

export interface TriAnalysis {
  averageCoherence?: number;
  [key: string]: unknown;
}

export interface BadgeResponse {
  badges: UserBadge[];
  totalBadges: number;
}

export interface AccuracyByTypeData {
  accuracy?: {
    journey?: { accuracy: number };
    simulado?: { accuracy: number };
    essay?: { accuracy: number };
  };
  distribution?: {
    journey?: number;
    simulado?: number;
    essay?: number;
  };
  [key: string]: unknown;
}

export interface LearningCurveByTypeData {
  period?: 'week' | 'month' | 'all_time';
  dataPoints?: Array<{ date: string; accuracy: number; questionsAnswered?: number }>;
  trend?: 'improving' | 'declining' | 'stable';
  trendStrength?: number;
  [key: string]: unknown;
}

export interface AreaStatsByTypeData {
  areas?: Array<{
    area: string;
    journey?: { accuracy: number };
    simulado?: { accuracy: number };
  }>;
  [key: string]: unknown;
}

export interface DifficultyStatsByTypeData {
  performance?: Record<
    string,
    {
      journey?: { accuracy: number };
      simulado?: { accuracy: number };
    }
  >;
  [key: string]: unknown;
}

export interface StatisticsExplanations {
  tri?: {
    title?: string;
    description?: string;
    formula?: string;
  };
  enem?: {
    title?: string;
    description?: string;
    factors?: string[];
  };
  accuracy?: {
    title?: string;
    description?: string;
    factors?: string[];
  };
  [key: string]: unknown;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const error = err as ApiError;
    return error.message || fallback;
  }

  return fallback;
}

// ==================== HOOKS ====================

export function useOverviewStats() {
  const [data, setData] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<OverviewStats>('/stats/overview');
      setData(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erro ao buscar estatísticas'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}

export function useAreaStats(period: string = 'all_time') {
  const [data, setData] = useState<AreaStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get<{ areas: AreaStats[] }>('/stats/areas', {
      params: { period },
    })
      .then(res => {
        setData(res.data.areas);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'Erro ao buscar áreas'));
        setLoading(false);
      });
  }, [period]);

  return { data, loading, error };
}

export function useWeaknesses() {
  const [data, setData] = useState<WeaknessDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeaknesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<WeaknessDashboard>('/stats/weaknesses');
      setData(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erro ao buscar fraquezas'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeaknesses();
  }, [fetchWeaknesses]);

  return { data, loading, error, refetch: fetchWeaknesses };
}

export function useLearningCurve(period: 'week' | 'month' | 'all_time' = 'month') {
  const [data, setData] = useState<LearningCurve | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get<LearningCurve>('/stats/learning-curve', {
      params: { period },
    })
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Erro ao buscar curva de aprendizado');
        setLoading(false);
      });
  }, [period]);

  return { data, loading, error };
}

export function usePerformanceByDifficulty() {
  const [data, setData] = useState<{
    easy: number;
    medium: number;
    hard: number;
    stats: PerformanceByDifficultyStats;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get('/stats/performance-by-difficulty')
      .then(res => {
        setData(res.data as PerformanceByDifficultyData);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'Erro ao buscar desempenho por dificuldade'));
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useTriAnalysis() {
  const [data, setData] = useState<TriAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get('/stats/tri-analysis')
      .then(res => {
        setData(res.data as TriAnalysis);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'Erro ao buscar análise TRI'));
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useUserBadges() {
  const [data, setData] = useState<BadgeResponse>({
    badges: [],
    totalBadges: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get('/stats/badges')
      .then(res => {
        setData(res.data as BadgeResponse);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'Erro ao buscar badges'));
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

/**
 * Hook para buscar acurácia separada por tipo de estudo
 */
export function useAccuracyByType(period = 'all_time') {
  const [data, setData] = useState<AccuracyByTypeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get('/stats/by-type', { params: { period } })
      .then(res => {
        setData(res.data as AccuracyByTypeData);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'Erro ao buscar acurácia por tipo'));
        setLoading(false);
      });
  }, [period]);

  return { data, loading, error };
}

/**
 * Hook para buscar curva de aprendizado separada por tipo de estudo
 */
export function useLearningCurveByType(period: 'week' | 'month' | 'all_time' = 'month', studyType: 'journey' | 'simulado' | 'all' = 'all') {
  const [data, setData] = useState<LearningCurveByTypeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get('/stats/learning-curve/by-type', { params: { period, studyType } })
      .then(res => {
        setData(res.data as LearningCurveByTypeData);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'Erro ao buscar curva de aprendizado'));
        setLoading(false);
      });
  }, [period, studyType]);

  return { data, loading, error };
}

/**
 * Hook para buscar desempenho por área separado por tipo de estudo
 */
export function useAreaStatsByType(period = 'all_time') {
  const [data, setData] = useState<AreaStatsByTypeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get('/stats/areas/by-type', { params: { period } })
      .then(res => {
        setData(res.data as AreaStatsByTypeData);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'Erro ao buscar áreas por tipo'));
        setLoading(false);
      });
  }, [period]);

  return { data, loading, error };
}

/**
 * Hook para buscar desempenho por dificuldade separado por tipo de estudo
 */
export function usePerformanceByDifficultyAndType(period = 'all_time') {
  const [data, setData] = useState<DifficultyStatsByTypeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get('/stats/performance-by-difficulty/by-type', { params: { period } })
      .then(res => {
        setData(res.data as DifficultyStatsByTypeData);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'Erro ao buscar performance por dificuldade'));
        setLoading(false);
      });
  }, [period]);

  return { data, loading, error };
}

/**
 * Hook para buscar explicações de como os cálculos são feitos
 */
export function useStatisticsExplanations() {
  const [data, setData] = useState<StatisticsExplanations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get('/stats/explanations')
      .then(res => {
        setData(res.data as StatisticsExplanations);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'Erro ao buscar explicações'));
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
