/**
 * Componente: Visão Geral de Redações
 * Mostra resumo rápido com cards principais e gráficos iniciais
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Target, BookOpen } from 'lucide-react';
import type { EnemEssayStats, CompetencyHistoryPoint } from '@/types/essayAnalytics';

interface EssayOverviewProps {
  stats: EnemEssayStats | null;
  history: CompetencyHistoryPoint[];
  loading: boolean;
}

export function EssayOverview({ stats, history, loading }: EssayOverviewProps) {
  if (loading) {
    return <div className="text-center py-12">Carregando dados...</div>;
  }

  if (!stats || stats.totalEssays === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Nenhuma redação corrigida</h3>
        <p className="text-sm text-muted-foreground">
          Envie redações para começar a acompanhar sua evolução
        </p>
      </div>
    );
  }

  // Dados para radar chart
  const radarData = [
    { competency: 'C1: Norma', value: stats.avgCompetency1, fullMark: 200 },
    { competency: 'C2: Compreensão', value: stats.avgCompetency2, fullMark: 200 },
    { competency: 'C3: Argumentação', value: stats.avgCompetency3, fullMark: 200 },
    { competency: 'C4: Coesão', value: stats.avgCompetency4, fullMark: 200 },
    { competency: 'C5: Proposta', value: stats.avgCompetency5, fullMark: 200 },
  ];

  // Dados para gráfico de barras (últimas competências)
  const competencyBarsData = [
    { name: 'C1', você: stats.avgCompetency1, nacional: 120 },
    { name: 'C2', você: stats.avgCompetency2, nacional: 120 },
    { name: 'C3', você: stats.avgCompetency3, nacional: 120 },
    { name: 'C4', você: stats.avgCompetency4, nacional: 120 },
    { name: 'C5', você: stats.avgCompetency5, nacional: 120 },
  ];

  // Dados para linha temporal
  const timelineData = history.slice(0, 12).map((h) => ({
    period: h.startDate.toLocaleDateString('pt-BR', { month: 'short' }),
    score: h.avgScore,
  }));

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageScore)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalEssays} redações corrigidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Nota</CardTitle>
            <Target className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestScore}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Melhor desempenho registrado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            <TrendingUp className={`w-4 h-4 ${stats.tendencyDirection === 'improving' ? 'text-green-500' : stats.tendencyDirection === 'declining' ? 'text-red-500' : 'text-yellow-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.evolutionPercentage > 0 ? '+' : ''}
              {stats.evolutionPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.tendencyDirection === 'improving'
                ? 'Evoluindo positivamente'
                : stats.tendencyDirection === 'declining'
                  ? 'Em queda'
                  : 'Estável'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistência</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.consistencyScore)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Variação de desempenho
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar de Competências */}
        <Card>
          <CardHeader>
            <CardTitle>Radar de Competências</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="competency" />
                <PolarRadiusAxis angle={90} domain={[0, 200]} />
                <Radar
                  name="Sua Média"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Comparação de Competências */}
        <Card>
          <CardHeader>
            <CardTitle>Competências vs Média Nacional</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={competencyBarsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 200]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="você" fill="hsl(var(--primary))" />
                <Bar dataKey="nacional" fill="hsl(var(--muted-foreground))" opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução ao longo do tempo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 1000]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
