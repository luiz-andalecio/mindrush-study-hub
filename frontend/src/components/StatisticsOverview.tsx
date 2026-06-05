import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  useOverviewStats, useAreaStats, useTriAnalysis, usePerformanceByDifficulty,
  useLearningCurve, useAccuracyByType, useAreaStatsByType,
  usePerformanceByDifficultyAndType, useStatisticsExplanations, useLearningCurveByType,
} from '@/hooks/useStatistics';
import { ExplanationPopover } from './ExplanationPopover';
import { Brain, Target, Flame, Zap, BarChart3, TrendingUp, BookOpen } from 'lucide-react';

type AccuracyFilter = 'geral' | 'jornada' | 'simulado';

/**
 * Componente principal do Dashboard de Estatísticas
 * Exibe métricas consolidadas com dados separados por tipo de estudo
 */
export function StatisticsOverview() {
  const [accuracyFilter, setAccuracyFilter] = useState<AccuracyFilter>('geral');
  const [areaFilter, setAreaFilter] = useState<AccuracyFilter>('geral');
  const [difficultyFilter, setDifficultyFilter] = useState<AccuracyFilter>('geral');
  const [curveFilter, setCurveFilter] = useState<AccuracyFilter>('geral');

  // Busca dados gerais
  const { data: overviewStats, loading: overviewLoading, error: overviewError } = useOverviewStats();

  // Busca dados separados por tipo
  const { data: accuracyByType, error: accuracyTypeError } = useAccuracyByType();
  const { data: areasByType, error: areasTypeError } = useAreaStatsByType();
  const { data: difficultyByType, error: difficultyTypeError } = usePerformanceByDifficultyAndType();
  const { data: triData, error: triError } = useTriAnalysis();
  const { data: explanations, error: explanationsError } = useStatisticsExplanations();

  // Dados para curva de aprendizado com filtro
  const curveStudyType = curveFilter === 'geral' ? 'all' : (curveFilter === 'jornada' ? 'journey' : 'simulado');
  const { data: learningCurveByType, error: learningByTypeError } = useLearningCurveByType('month', curveStudyType);
  const { data: learningCurveData, error: learningError } = useLearningCurve('month');

  const tooltipStyle = {
    backgroundColor: 'hsl(230 25% 10%)',
    border: '1px solid hsl(230 20% 16%)',
    borderRadius: '8px',
    color: 'hsl(210 40% 96%)',
  };

  const chartColors = [
    'hsl(250 80% 62%)', // Purple
    'hsl(220 70% 50%)', // Blue
    'hsl(270 70% 55%)', // Purple accent
    'hsl(35 90% 55%)',  // Orange
    'hsl(10 80% 60%)',  // Red
  ];

  if (overviewLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 bg-slate-800" />
        <Skeleton className="h-32 bg-slate-800" />
      </div>
    );
  }

  // Verificar erros
  const errors = [overviewError, accuracyTypeError, areasTypeError, difficultyTypeError, triError, learningError, learningByTypeError];
  if (errors.some(e => e)) {
    return (
      <div className="space-y-2">
        {overviewError && (
          <div className="rounded-lg p-3 bg-slate-900 border border-red-500/50 text-red-400 text-sm">
            Erro ao carregar visão geral: {overviewError}
          </div>
        )}
        {accuracyTypeError && (
          <div className="rounded-lg p-3 bg-slate-900 border border-red-500/50 text-red-400 text-sm">
            Erro ao carregar acurácia por tipo: {accuracyTypeError}
          </div>
        )}
        {areasTypeError && (
          <div className="rounded-lg p-3 bg-slate-900 border border-red-500/50 text-red-400 text-sm">
            Erro ao carregar áreas: {areasTypeError}
          </div>
        )}
        {difficultyTypeError && (
          <div className="rounded-lg p-3 bg-slate-900 border border-red-500/50 text-red-400 text-sm">
            Erro ao carregar dificuldades: {difficultyTypeError}
          </div>
        )}
      </div>
    );
  }

  if (!overviewStats) {
    return (
      <div className="rounded-lg p-4 bg-slate-900 border border-red-500/50 text-red-400">
        Erro ao carregar estatísticas
      </div>
    );
  }

  // ============ HELPER FUNCTIONS ============

  const getAccuracyValue = (filter: AccuracyFilter): number => {
    if (filter === 'geral') return overviewStats?.overallAccuracy || 0;
    interface AccuracyByType {
      journey?: { accuracy: number };
      simulado?: { accuracy: number };
    }
    const accuracy = accuracyByType?.accuracy as AccuracyByType | undefined;
    if (filter === 'jornada') return accuracy?.journey?.accuracy || 0;
    return accuracy?.simulado?.accuracy || 0;
  };

  const getAburacyBreakdown = (): Array<{ name: string; value: number; color: string }> => {
    interface DistributionType {
      journey?: number;
      simulado?: number;
      essay?: number;
    }
    const distribution = accuracyByType?.distribution as DistributionType | undefined;
    const journey = distribution?.journey || 0;
    const simulado = distribution?.simulado || 0;
    const essay = distribution?.essay || 0;

    return [
      { name: 'Jornada', value: journey, color: 'hsl(220 70% 50%)' },
      { name: 'Simulado', value: simulado, color: 'hsl(250 80% 62%)' },
      { name: 'Redação', value: essay, color: 'hsl(10 80% 60%)' },
    ].filter(item => item.value > 0);
  };

  const getAreaChartData = (): Array<{ subject: string; accuracy: number }> => {
    if (!areasByType?.areas || areasByType.areas.length === 0) {
      return [];
    }

    interface AreaData {
      area: string;
      journey?: { accuracy: number };
      simulado?: { accuracy: number };
    }

    return (areasByType.areas as AreaData[]).map((area: AreaData) => {
      let accuracy = 0;
      
      if (areaFilter === 'geral') {
        const journeyAcc = area.journey?.accuracy || 0;
        const simuladoAcc = area.simulado?.accuracy || 0;
        accuracy = journeyAcc > 0 || simuladoAcc > 0 
          ? Math.round((journeyAcc + simuladoAcc) / 2)
          : 0;
      } else if (areaFilter === 'jornada') {
        accuracy = Math.round(area.journey?.accuracy || 0);
      } else {
        accuracy = Math.round(area.simulado?.accuracy || 0);
      }

      const areaName = area.area
        .replace('Ciências da Natureza', 'Natureza')
        .replace('Ciências Humanas', 'Humanas');

      return {
        subject: areaName,
        accuracy: Math.max(0, Math.min(100, accuracy)),
      };
    }).filter((item: { subject: string; accuracy: number }) => item.accuracy > 0 || areasByType.areas.length <= 4);
  };

  const areaChartData = getAreaChartData();

  const getDifficultyChartData = (): Array<{ name: string; accuracy: number }> => {
    interface DifficultyData {
      journey?: { accuracy: number };
      simulado?: { accuracy: number };
    }
    type DifficultiesType = Record<string, DifficultyData>;
    const difficulties = (difficultyByType?.performance || {}) as DifficultiesType;
    const labels: Record<string, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };

    return Object.keys(difficulties).map((key: string) => {
      const difficulty = difficulties[key];
      let accuracy = 0;

      if (difficultyFilter === 'geral') {
        const journeyAcc = difficulty.journey?.accuracy || 0;
        const simuladoAcc = difficulty.simulado?.accuracy || 0;
        accuracy = Math.round((journeyAcc + simuladoAcc) / 2);
      } else if (difficultyFilter === 'jornada') {
        accuracy = Math.round(difficulty.journey?.accuracy || 0);
      } else {
        accuracy = Math.round(difficulty.simulado?.accuracy || 0);
      }

      return {
        name: labels[key] || key,
        accuracy,
      };
    });
  };

  const getEvolutionData = (): Array<{ date: string; accuracy: number }> => {
    // Usa os dados filtrados por tipo de estudo
    const curveData = learningCurveByType || learningCurveData;
    const dataPoints = (curveData?.dataPoints || []) as Array<{ date: string; accuracy: number }>;
    
    return dataPoints.slice(0, 30).map((p: { date: string; accuracy: number }) => ({
      date: new Date(p.date).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' }),
      accuracy: Math.round(p.accuracy),
    })) || [];
  };

  const EmptyChartState = ({ message }: { message: string }) => (
    <div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed border-orange-500/30 bg-slate-950/20 px-4 text-center text-sm text-slate-400">
      {message}
    </div>
  );

  // ============ RENDER ============

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card TRI */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/50 shadow-lg shadow-blue-500/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">Nota TRI Estimada</p>
            <ExplanationPopover
              title={explanations?.tri?.title || 'Como a Nota TRI é Calculada?'}
              description={explanations?.tri?.description || 'Baseada na dificuldade das questões respondidas'}
              formula={explanations?.tri?.formula}
            />
          </div>
          <p className="text-3xl font-bold text-blue-300">
            {Math.round(overviewStats.estimatedTriScore || 500)}
          </p>
          <p className="text-xs text-slate-400 mt-1">de 0 a 1000</p>
        </div>

        {/* Card Acurácia com Tabs */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/50 shadow-lg shadow-cyan-500/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Acurácia</p>
              <div className="text-xs flex gap-1">
                <button
                  onClick={() => setAccuracyFilter('geral')}
                  className={`px-2 py-1 rounded transition-colors ${
                    accuracyFilter === 'geral'
                      ? 'bg-cyan-500/50 text-cyan-300'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  Geral
                </button>
                <button
                  onClick={() => setAccuracyFilter('jornada')}
                  className={`px-2 py-1 rounded transition-colors ${
                    accuracyFilter === 'jornada'
                      ? 'bg-cyan-500/50 text-cyan-300'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  Jornada
                </button>
                <button
                  onClick={() => setAccuracyFilter('simulado')}
                  className={`px-2 py-1 rounded transition-colors ${
                    accuracyFilter === 'simulado'
                      ? 'bg-cyan-500/50 text-cyan-300'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  Simulado
                </button>
              </div>
            </div>
            <p className="text-3xl font-bold text-cyan-300">
              {Math.round(getAccuracyValue(accuracyFilter))}%
            </p>
            <p className="text-xs text-slate-400">
              {(overviewStats.questionsAnswered || 0).toLocaleString()} questões
            </p>
          </div>
        </div>

        {/* Card Streak */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-orange-500/50 shadow-lg shadow-orange-500/10">
          <p className="text-xs text-slate-400 mb-2">Sequência</p>
          <p className="text-3xl font-bold text-orange-300">
            {overviewStats.currentStreak || 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">dias seguidos</p>
        </div>

        {/* Card ENEM com Tabs */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-violet-500/50 shadow-lg shadow-violet-500/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Nota ENEM</p>
              <ExplanationPopover
                title={explanations?.enem?.title || 'Como a Nota ENEM é Estimada?'}
                description={explanations?.enem?.description || 'Baseada em sua acurácia e desempenho'}
                factors={explanations?.enem?.factors}
              />
            </div>
            <p className="text-3xl font-bold text-violet-300">
              {Math.round((getAccuracyValue(accuracyFilter) / 100) * 1000)}
            </p>
            <p className="text-xs text-slate-400">de 0 a 1000</p>
          </div>
        </div>
      </div>

      {/* Seção de Gráficos com Tabs */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Distribuição de Estudos - Pizza */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-violet-500/40">
            <CardHeader>
              <CardTitle className="text-violet-400">Distribuição de Estudos</CardTitle>
              <CardDescription className="text-slate-400">
                Questões respondidas por tipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getAburacyBreakdown().length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={getAburacyBreakdown()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}`}
                    >
                      {getAburacyBreakdown().map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="Sem dados suficientes para exibir a distribuição de estudos neste período." />
              )}
            </CardContent>
          </Card>

          {/* Curva de Aprendizado */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-emerald-400">Curva de Aprendizado</CardTitle>
                  <CardDescription className="text-slate-400">
                    Últimos 30 dias
                  </CardDescription>
                </div>
                <Tabs value={curveFilter} onValueChange={(v) => setCurveFilter(v as AccuracyFilter)} className="w-fit">
                  <TabsList className="grid grid-cols-3 bg-slate-800">
                    <TabsTrigger value="geral" className="text-xs">Geral</TabsTrigger>
                    <TabsTrigger value="jornada" className="text-xs">Jornada</TabsTrigger>
                    <TabsTrigger value="simulado" className="text-xs">Simulado</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {getEvolutionData().length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getEvolutionData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 16%)" />
                    <XAxis dataKey="date" stroke="hsl(210 40% 96%)" style={{ fontSize: 12 }} />
                    <YAxis stroke="hsl(210 40% 96%)" style={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="hsl(34 89% 72%)"
                      dot={{ fill: 'hsl(34 89% 72%)', r: 4 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="Sem dados suficientes para exibir a curva de aprendizado neste período." />
              )}
            </CardContent>
          </Card>

          {/* Acurácia por Área */}
          <Card className="rounded-2xl p-2 gradient-card border border-orange-500/40 shadow-card bg-gradient-to-br from-slate-900 to-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display font-semibold text-orange-400">Acurácia por Área</CardTitle>
                  <CardDescription className="text-slate-400">
                    Seu desempenho em cada disciplina
                  </CardDescription>
                </div>
                <Tabs value={areaFilter} onValueChange={(v) => setAreaFilter(v as AccuracyFilter)} className="w-fit">
                  <TabsList className="grid grid-cols-3 bg-slate-800">
                    <TabsTrigger value="geral" className="text-xs">Geral</TabsTrigger>
                    <TabsTrigger value="jornada" className="text-xs">Jornada</TabsTrigger>
                    <TabsTrigger value="simulado" className="text-xs">Simulado</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {areaChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={areaChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 16%)" />
                    <XAxis dataKey="subject" stroke="hsl(215 20% 55%)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="accuracy" fill="hsl(250 80% 62%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed border-orange-500/30 bg-slate-950/20 text-sm text-slate-400">
                  Sem dados suficientes para exibir a acurácia por área neste período.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance por Dificuldade */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-300">Performance por Dificuldade</CardTitle>
                  <CardDescription className="text-slate-400">
                    Como você se sai em cada nível
                  </CardDescription>
                </div>
                <Tabs value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as AccuracyFilter)} className="w-fit">
                  <TabsList className="grid grid-cols-3 bg-slate-800">
                    <TabsTrigger value="geral" className="text-xs">Geral</TabsTrigger>
                    <TabsTrigger value="jornada" className="text-xs">Jornada</TabsTrigger>
                    <TabsTrigger value="simulado" className="text-xs">Simulado</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {getDifficultyChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getDifficultyChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 16%)" />
                    <XAxis dataKey="name" stroke="hsl(210 40% 96%)" style={{ fontSize: 12 }} />
                    <YAxis stroke="hsl(210 40% 96%)" style={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="accuracy" fill="hsl(220 70% 50%)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="Sem dados suficientes para exibir a performance por dificuldade neste período." />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Card de Coerência TRI */}
        {triData?.averageCoherence !== undefined && (
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-emerald-400">Coerência TRI</CardTitle>
                  <CardDescription className="text-slate-400">
                    Consistência do seu padrão de respostas
                  </CardDescription>
                </div>
                <ExplanationPopover
                  title="O que é Coerência TRI?"
                  description="A coerência mede como seu padrão de respostas é consistente. Uma alta coerência significa que você não está respondendo aleatoriamente - suas respostas seguem um padrão que indica conhecimento real."
                  example="Se você acerta questões difíceis e erra as fáceis, sua coerência é baixa. Se você acerta progressivamente conforme a dificuldade diminui, sua coerência é alta."
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-emerald-400">
                    {Math.round(triData.averageCoherence)}%
                  </p>
                </div>
                <Progress
                  value={Math.min(100, triData.averageCoherence)}
                  className="h-2 bg-slate-700"
                />
                <p className="text-sm text-slate-300">
                  {triData.averageCoherence > 80
                    ? '✓ Excelente consistência nas respostas'
                    : triData.averageCoherence > 60
                    ? '→ Padrão normal de respostas'
                    : '⚠ Revisar suas estratégias de resolução'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
