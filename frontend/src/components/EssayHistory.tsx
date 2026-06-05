/**
 * Componente: Histórico de Redações e Comparativos
 * Lista e compara redações com benchmarks nacionais
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { EssayListResponse, EnemEssayStats } from '@/types/essayAnalytics';

interface EssayHistoryProps {
  essays: EssayListResponse | null;
  benchmark: any | null;
  stats: EnemEssayStats | null;
  onSelectEssay: (essayId: string) => void;
  loading: boolean;
}

function getScoreBadgeColor(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 800) return 'default';
  if (score >= 600) return 'secondary';
  if (score >= 400) return 'outline';
  return 'destructive';
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function EssayHistory({ essays, benchmark, stats, onSelectEssay, loading }: EssayHistoryProps) {
  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (!essays || essays.essays.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma redação encontrada</p>
      </div>
    );
  }

  // Dados para gráfico comparativo
  const comparisonData = [
    {
      name: 'Você',
      avg: stats?.averageScore || 0,
      melhor: stats?.bestScore || 0,
    },
    {
      name: 'Média Nacional',
      avg: benchmark?.nationalAverage || 650,
      melhor: 950,
    },
    {
      name: 'Plataforma',
      avg: benchmark?.platformAverage || 600,
      melhor: benchmark?.topPercentileAverage || 900,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Gráfico Comparativo */}
      {benchmark && (
        <Card>
          <CardHeader>
            <CardTitle>Benchmark: Sua Performance vs Média Nacional</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1000]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg" fill="hsl(var(--primary))" name="Média" />
                <Bar dataKey="melhor" fill="hsl(var(--accent))" name="Melhor" />
              </BarChart>
            </ResponsiveContainer>

            {/* Estatísticas do Benchmark */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sua Média</p>
                <p className="text-2xl font-bold">{benchmark.userAverage}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média Nacional</p>
                <p className="text-2xl font-bold">{benchmark.nationalAverage}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distância</p>
                <p
                  className={`text-2xl font-bold ${
                    benchmark.distanceToNational > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {benchmark.distanceToNational > 0 ? '+' : ''}
                  {benchmark.distanceToNational}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seu Percentil</p>
                <p className="text-2xl font-bold">{Math.round(benchmark.userPercentile)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Redações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Redações</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Total: {essays.total} redações | {essays.essays.length} exibidas
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead className="text-right">Nota</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {essays.essays.map((essay, i) => (
                  <TableRow key={essay.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(essay.submittedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{essay.theme}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getScoreBadgeColor(essay.finalScore)} className="font-bold">
                        {essay.finalScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          essay.correctionStatus === 'corrected'
                            ? 'default'
                            : essay.correctionStatus === 'zero_rated'
                              ? 'destructive'
                              : 'outline'
                        }
                      >
                        {essay.correctionStatus === 'corrected'
                          ? '✓'
                          : essay.correctionStatus === 'zero_rated'
                            ? '✗'
                            : '⏳'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectEssay(essay.id)}
                        className="gap-2"
                      >
                        Analisar
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {essays.hasMore && (
            <div className="mt-4 text-center">
              <Button variant="outline">Carregar Mais</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tendências */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Análise de Tendência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span>Desempenho Geral</span>
              <div className="flex items-center gap-2">
                {stats.tendencyDirection === 'improving' ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : stats.tendencyDirection === 'declining' ? (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                ) : (
                  <div className="w-5 h-5 text-yellow-600">→</div>
                )}
                <span className="font-semibold">
                  {stats.tendencyDirection === 'improving'
                    ? 'Melhorando'
                    : stats.tendencyDirection === 'declining'
                      ? 'Piorando'
                      : 'Estável'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Frequência</p>
                <p className="text-lg font-semibold">
                  {stats.essaysPerWeek.toFixed(1)}/semana
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Consistência</p>
                <p className="text-lg font-semibold">{Math.round(stats.consistencyScore)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
