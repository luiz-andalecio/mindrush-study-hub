import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWeaknesses, useLearningCurve } from '@/hooks/useStatistics';
import { AlertCircle, TrendingDown, TrendingUp, Target, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Componente de Análise de Fraquezas e Oportunidades
 * Design escuro com bordas neon, detalhes roxos e texto claro
 */

// Mapeamento de disciplinas de siglas/nomes banco para formato legível
const disciplineMap: { [key: string]: string } = {
  'matematica': 'Matemática',
  'linguagens': 'Linguagens e Códigos',
  'ciencias-humanas': 'Ciências Humanas',
  'ciencias-natureza': 'Ciências da Natureza',
  'redacao': 'Redação',
};

const formatDisciplineName = (discipline: string): string => {
  const normalized = discipline.toLowerCase().trim();
  
  // Tenta encontrar no mapa
  if (disciplineMap[normalized]) {
    return disciplineMap[normalized];
  }
  
  // Tenta correspondência parcial
  for (const [key, value] of Object.entries(disciplineMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Capitaliza a primeira letra se nenhuma correspondência encontrada
  return normalized
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function WeaknessAnalytics() {
  const { data: weaknessData, loading: weaknessLoading, error: weaknessError } = useWeaknesses();
  const { data: learningCurve, error: learningError } = useLearningCurve('month');

  const tooltipStyle = {
    backgroundColor: 'hsl(230 25% 10%)',
    border: '1px solid hsl(230 20% 16%)',
    borderRadius: '8px',
    color: 'hsl(210 40% 96%)',
  };

  if (weaknessLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 bg-slate-800" />
        <Skeleton className="h-40 bg-slate-800" />
      </div>
    );
  }

  if (weaknessError || learningError) {
    return (
      <div className="space-y-2">
        {weaknessError && (
          <div className="rounded-lg p-3 bg-slate-900 border border-red-500/50 text-red-400 text-sm">
            Erro ao carregar fraquezas: {weaknessError}
          </div>
        )}
        {learningError && (
          <div className="rounded-lg p-3 bg-slate-900 border border-red-500/50 text-red-400 text-sm">
            Erro ao carregar curva de aprendizado: {learningError}
          </div>
        )}
      </div>
    );
  }

  if (!weaknessData) {
    return (
      <div className="rounded-lg p-4 bg-slate-900 border border-red-500/50 text-red-400">
        Erro ao carregar análise de fraquezas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seção de Análises Avançadas */}
      <div>
        <h2 className="text-xl font-bold mb-2 text-slate-100">Análises Avançadas</h2>
        <p className="text-sm text-slate-400 mb-6">
          Análise profunda com gráficos interativos da curva de aprendizado, fraquezas e oportunidades de melhora
        </p>
      </div>

      {/* Tópicos Críticos - Com dados estatísticos */}
      {weaknessData.criticalTopics.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-red-500/50 shadow-lg shadow-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              Tópicos Críticos Que Precisam de Atenção
            </CardTitle>
            <CardDescription className="text-slate-400">
              Áreas com baixo desempenho que podem impactar significativamente sua nota
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weaknessData.criticalTopics.map(topic => {
                const relatedWeakness = weaknessData.topWeaknesses.find((w) => 
                  w.topic.toLowerCase() === topic.toLowerCase() ||
                  topic.toLowerCase().includes(w.topic.toLowerCase())
                );
                
                return (
                  <div key={topic} className="p-4 bg-slate-800/50 rounded-lg border border-red-500/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-red-300">{topic}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {relatedWeakness ? `em ${formatDisciplineName(relatedWeakness.area)}` : 'Área crítica'}
                        </p>
                      </div>
                      <Badge className="bg-red-600/90 shrink-0">🔴 Crítico</Badge>
                    </div>
                    
                    {relatedWeakness && (
                      <div className="mt-3 pt-3 border-t border-red-500/20">
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div>
                            <p className="text-slate-400">Acurácia</p>
                            <p className="font-bold text-red-300">{Math.round(relatedWeakness.accuracy)}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Questões</p>
                            <p className="font-bold text-slate-200">{relatedWeakness.correctCount}/{relatedWeakness.totalCount}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Potencial</p>
                            <p className="font-bold text-emerald-300">+{Math.round(relatedWeakness.improvementPotential)}%</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 bg-red-500/10 p-2 rounded">
                          💡 Estudar este tópico pode aumentar sua nota em até <span className="font-bold text-emerald-400">{Math.round(relatedWeakness.improvementPotential)} pontos</span>. 
                          Use o <span className="font-bold text-cyan-400">Chatbot</span> para receber explicações personalizadas.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Principais Fraquezas */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-violet-500/50 shadow-lg shadow-violet-500/5">
        <CardHeader>
          <CardTitle className="text-violet-400">
            Principais Fraquezas {weaknessData.topWeaknesses.length > 0 && `(${Math.min(10, weaknessData.topWeaknesses.length)})`}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Tópicos com menor desempenho - Aprenda para crescer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weaknessData.topWeaknesses.slice(0, 10).map((weakness, idx: number) => (
              <div key={`${weakness.area}-${weakness.topic}-${idx}`} className="border border-violet-500/30 bg-slate-800/50 rounded-lg p-4">
                {/* Cabeçalho com ranking */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-violet-600/80 text-white rounded-full font-bold text-sm shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{weakness.topic}</p>
                      <p className="text-xs text-slate-400">em {formatDisciplineName(weakness.area)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Badge className={
                      weakness.severity === 'critical' ? 'bg-red-600/90' :
                      weakness.severity === 'high' ? 'bg-orange-600/90' :
                      weakness.severity === 'medium' ? 'bg-yellow-600/90' : 'bg-blue-600/90'
                    }>
                      {weakness.severity === 'critical' ? '🔴 Crítico' :
                       weakness.severity === 'high' ? '🟠 Alto' :
                       weakness.severity === 'medium' ? '🟡 Médio' : '🟢 Baixo'}
                    </Badge>
                    {weakness.trend === 'improving' && (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/50 bg-emerald-500/10">
                        <TrendingUp className="w-3 h-3 mr-1" /> Melhorando
                      </Badge>
                    )}
                    {weakness.trend === 'declining' && (
                      <Badge variant="outline" className="text-red-400 border-red-400/50 bg-red-500/10">
                        <TrendingDown className="w-3 h-3 mr-1" /> Piorando
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Acurácia</p>
                    <p className="text-lg font-bold text-cyan-300">{Math.round(weakness.accuracy)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Questões</p>
                    <p className="text-lg font-bold text-violet-300">{weakness.correctCount}/{weakness.totalCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Potencial</p>
                    <p className="text-lg font-bold text-emerald-300">+{Math.round(weakness.improvementPotential)}%</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-300">
                    <span>Acurácia Atual</span>
                    <span>{Math.round(weakness.accuracy)}%</span>
                  </div>
                  <Progress value={weakness.accuracy} className="h-2 mb-3 bg-slate-700" />
                </div>

                {/* Recomendação com contexto */}
                <div className="bg-slate-700/50 p-3 rounded-lg border border-violet-500/20">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {weakness.improvementPotential > 50 ? (
                      <>
                        <span className="font-semibold text-violet-400">⭐ Grande Oportunidade!</span> Você acertou apenas <span className="font-bold text-orange-400">{Math.round((weakness.correctCount / weakness.totalCount) * 100)}%</span> das questões neste tópico. 
                        Estudar isto pode aumentar sua nota em até <span className="font-bold text-emerald-400">{Math.round(weakness.improvementPotential)} pontos</span>! 
                        <span className="text-cyan-400 font-semibold ml-1">Use o Chatbot</span> para aprender com profundidade.
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-violet-400">💡 Oportunidade de Melhora</span> Continue praticando este tópico. 
                        Ganho potencial: <span className="font-bold text-emerald-400">+{Math.round(weakness.improvementPotential)} pontos</span>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
            
            {weaknessData.topWeaknesses.length === 0 && (
              <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-center">
                <p className="text-emerald-400 font-semibold">🎉 Parabéns!</p>
                <p className="text-sm text-slate-300 mt-1">Você não tem fraquezas críticas no momento. Continue estudando!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Oportunidades de Melhora */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/50 shadow-lg shadow-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-400">
            <Target className="w-5 h-5" />
            Maiores Oportunidades de Melhora
          </CardTitle>
          <CardDescription className="text-slate-400">
            Tópicos que podem trazer maior ganho na sua nota
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weaknessData.improvementOpportunities.slice(0, 5).map((opportunity, idx: number) => {
              const relatedWeakness = weaknessData.topWeaknesses.find((w) => 
                w.topic.toLowerCase() === opportunity.topic.toLowerCase()
              );
              
              return (
                <div key={opportunity.topic} className="flex items-center justify-between p-3 bg-slate-800/50 border border-emerald-500/30 rounded-lg hover:border-emerald-500/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-emerald-600/80 text-white rounded-full font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{opportunity.topic}</p>
                      {relatedWeakness && (
                        <p className="text-xs text-slate-400">
                          {Math.round(relatedWeakness.accuracy)}% acurácia em {formatDisciplineName(relatedWeakness.area)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-400">+{Math.round(opportunity.potentialGain)}</p>
                    <p className="text-xs text-slate-400">pontos</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Curva de Aprendizado */}
      {learningCurve && learningCurve.dataPoints.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/50 shadow-lg shadow-cyan-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
              Curva de Aprendizado (Últimos 30 dias)
            </CardTitle>
            <CardDescription className="text-slate-400 flex items-center justify-between">
              <span>Sua evolução de acurácia ao longo do tempo</span>
              <Badge className={
                learningCurve.trend === 'improving' ? 'bg-emerald-600/90' :
                learningCurve.trend === 'declining' ? 'bg-red-600/90' : 'bg-blue-600/90'
              }>
                {learningCurve.trend === 'improving' ? '📈 Melhorando' :
                 learningCurve.trend === 'declining' ? '📉 Piorando' : '➡️ Estável'}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={learningCurve.dataPoints.map(point => ({
                  date: new Date(point.date).toLocaleDateString('pt-BR'),
                  accuracy: Math.round(point.accuracy),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 16%)" />
                  <XAxis dataKey="date" stroke="hsl(215 20% 55%)" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="hsl(215 20% 55%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="hsl(250 80% 62%)"
                    name="Acurácia (%)"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(250 80% 62%)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Análise do trend */}
            <div className="p-3 bg-slate-800/50 rounded-lg border border-cyan-500/30">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-cyan-400">Análise:</span>{' '}
                {learningCurve.trend === 'improving' && `Você está melhorando! Força de trend: ${Math.round(learningCurve.trendStrength)}%`}
                {learningCurve.trend === 'declining' && `Está havendo uma queda. Força de trend: ${Math.round(learningCurve.trendStrength)}%`}
                {learningCurve.trend === 'stable' && 'Seu desempenho está estável nos últimos dias.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
