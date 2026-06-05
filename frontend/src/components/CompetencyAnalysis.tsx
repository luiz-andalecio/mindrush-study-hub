/**
 * Componente: Análise de Competências ENEM
 * Mostra análise aprofundada de cada uma das 5 competências
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { EnemEssayStats } from '@/types/essayAnalytics';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface CompetencyAnalysisProps {
  stats: EnemEssayStats | null;
}

const competencies = [
  {
    id: 1,
    name: 'Norma Culta',
    key: 'avgCompetency1',
    description: 'Domínio da variante culta da língua portuguesa',
    aspects: [
      'Erros gramaticais',
      'Ortografia',
      'Pontuação',
      'Concordância e regência',
      'Uso de crase',
    ],
  },
  {
    id: 2,
    name: 'Compreensão do Tema',
    key: 'avgCompetency2',
    description: 'Compreensão da proposta de redação e uso de repertório',
    aspects: [
      'Aderência ao tema',
      'Repertório sociocultural',
      'Repertório produtivo',
      'Conexão com argumentação',
      'Profundidade de análise',
    ],
  },
  {
    id: 3,
    name: 'Argumentação',
    key: 'avgCompetency3',
    description: 'Capacidade de construir e defender uma tese',
    aspects: [
      'Clareza da tese',
      'Força dos argumentos',
      'Progressão temática',
      'Criticidade',
      'Coerência lógica',
    ],
  },
  {
    id: 4,
    name: 'Coesão',
    key: 'avgCompetency4',
    description: 'Articulação e fluidez do texto',
    aspects: [
      'Uso de conectivos',
      'Variedade de conectivos',
      'Fluidez textual',
      'Estrutura de parágrafos',
      'Transições suaves',
    ],
  },
  {
    id: 5,
    name: 'Proposta de Intervenção',
    key: 'avgCompetency5',
    description: 'Capacidade de elaborar uma proposta de solução',
    aspects: [
      'Identificação do agente',
      'Ação clara',
      'Meio/modo',
      'Finalidade/efeito',
      'Detalhamento',
    ],
  },
];

function getLevelColor(score: number): string {
  if (score >= 161) return 'text-green-600';
  if (score >= 121) return 'text-blue-600';
  if (score >= 81) return 'text-yellow-600';
  if (score >= 41) return 'text-orange-600';
  return 'text-red-600';
}

function getLevelLabel(score: number): string {
  if (score >= 161) return 'Excelente';
  if (score >= 121) return 'Bom';
  if (score >= 81) return 'Regular';
  if (score >= 41) return 'Fraco';
  return 'Muito Fraco';
}

function getLevelBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 161) return 'default';
  if (score >= 121) return 'secondary';
  if (score >= 81) return 'outline';
  if (score >= 41) return 'destructive';
  return 'destructive';
}

export function CompetencyAnalysis({ stats }: CompetencyAnalysisProps) {
  if (!stats || stats.totalEssays === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhuma redação corrigida para análise</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="1" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        {competencies.map((c) => (
          <TabsTrigger key={c.id} value={c.id.toString()} className="text-xs sm:text-sm">
            C{c.id}
          </TabsTrigger>
        ))}
      </TabsList>

      {competencies.map((comp) => {
        const score = (stats as any)[comp.key] || 0;
        const percentage = (score / 200) * 100;
        const level = getLevelLabel(score);

        return (
          <TabsContent key={comp.id} value={comp.id.toString()} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Competência {comp.id}: {comp.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">{comp.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getLevelColor(score)}`}>
                      {Math.round(score)}
                    </div>
                    <Badge variant={getLevelBadgeVariant(score)} className="mt-2">
                      {level}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Barra de progresso */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Desempenho</span>
                    <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={percentage} className="h-3" />
                </div>

                {/* Aspectos da competência */}
                <div>
                  <h4 className="font-semibold mb-4">Aspectos Avaliados</h4>
                  <div className="space-y-3">
                    {comp.aspects.map((aspect, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{aspect}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sugestões personalizadas */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Sugestões de Melhoria
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    {score < 100 && (
                      <>
                        <li>• Revise os conceitos fundamentais desta competência</li>
                        <li>• Pratique com exercícios focados nesta área</li>
                        <li>• Analise redações modelo para melhorar</li>
                      </>
                    )}
                    {score >= 100 && score < 150 && (
                      <>
                        <li>• Aprofunde sua análise e crítica</li>
                        <li>• Procure ser mais consistente em suas técnicas</li>
                        <li>• Revise os detalhes que faltam para excelência</li>
                      </>
                    )}
                    {score >= 150 && (
                      <>
                        <li>• Você está indo muito bem! Mantenha a prática</li>
                        <li>• Desafie-se com temas mais complexos</li>
                        <li>• Foque na consistência desta performance</li>
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
