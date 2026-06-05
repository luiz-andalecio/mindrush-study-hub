/**
 * Componente: Insights Automáticos e Recomendações IA
 * Mostra recomendações inteligentes baseadas em análise dos dados
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import type { AutomaticInsight, PredictionData } from '@/types/essayAnalytics';

interface InsightsProps {
  insights: AutomaticInsight[];
  prediction: PredictionData | null;
  loading: boolean;
}

export function InsightsPanel({ insights, prediction, loading }: InsightsProps) {
  if (loading) {
    return <div className="text-center py-12">Gerando insights...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Seção de Predições */}
      {prediction && (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Predições Baseadas em IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{prediction.projectedScore}</div>
                <p className="text-sm text-muted-foreground">Nota Projetada</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{prediction.timeframeWeeks}w</div>
                <p className="text-sm text-muted-foreground">Tempo Estimado</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{prediction.confidence}%</div>
                <p className="text-sm text-muted-foreground">Confiança</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm">Probabilidade de 900+</span>
                <Badge variant="secondary">{prediction.probabilityOf900Plus}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Probabilidade de 950+</span>
                <Badge variant="secondary">{prediction.probabilityOf950Plus}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Probabilidade de 1000</span>
                <Badge variant="secondary">{prediction.probabilityOfPerfect}%</Badge>
              </div>
            </div>

            {prediction.projectedScore >= 800 && (
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg text-sm text-green-700 dark:text-green-400">
                ✨ Você está no caminho certo! Com dedicação, pode alcançar notas altas.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção de Insights */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Insights e Recomendações
        </h3>

        {insights.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Ainda não há insights disponíveis. Continue praticando!</p>
            </CardContent>
          </Card>
        ) : (
          insights.map((insight) => (
            <Alert
              key={insight.id}
              variant={
                insight.type === 'weakness' || insight.type === 'improvement'
                  ? 'destructive'
                  : 'default'
              }
              className={
                insight.priority === 'high'
                  ? 'border-l-4 border-l-red-500'
                  : insight.priority === 'medium'
                    ? 'border-l-4 border-l-yellow-500'
                    : 'border-l-4 border-l-blue-500'
              }
            >
              {insight.type === 'weakness' && <AlertTriangle className="w-4 h-4" />}
              {insight.type === 'strength' && <TrendingUp className="w-4 h-4 text-green-600" />}
              {insight.type === 'improvement' && <Lightbulb className="w-4 h-4" />}

              <div>
                <AlertTitle className="flex items-center gap-2">
                  {insight.title}
                  {insight.priority === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      Prioridade Alta
                    </Badge>
                  )}
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <p>{insight.description}</p>
                  {insight.actionableAdvice && (
                    <p className="mt-2 font-medium text-foreground">
                      💡 {insight.actionableAdvice}
                    </p>
                  )}
                  {insight.relatedCompetencies && insight.relatedCompetencies.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {insight.relatedCompetencies.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">
                          C{c}
                        </Badge>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          ))
        )}
      </div>

      {/* Dica da IA */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">💭 Análise IA</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 dark:text-blue-200">
          <p>
            Baseado em análise de seus padrões de escrita, recomendamos focar na{' '}
            <strong>variedade de conectivos</strong> e <strong>densidade argumentativa</strong> para
            melhorar sua coesão e argumentação. Estes são os pontos com maior potencial de evolução.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
