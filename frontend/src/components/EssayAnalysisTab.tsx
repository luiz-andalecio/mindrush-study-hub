/**
 * Componente: Análise de Redação ENEM - Aba Completa
 * Integra todos os painéis: visão geral, competências, insights, histórico
 */

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEssayStats } from '@/hooks/useEssayStats';
import { EssayOverview } from './EssayOverview';
import { CompetencyAnalysis } from './CompetencyAnalysis';
import { InsightsPanel } from './InsightsPanel';
import { EssayHistory } from './EssayHistory';
import { PenTool, TrendingUp, Lightbulb, Clock, BarChart3 } from 'lucide-react';

export function EssayAnalysisTab() {
  const {
    stats,
    history,
    insights,
    prediction,
    essays,
    benchmark,
    loading,
    refreshStats,
    loadEssayAnalysis,
    filterEssays,
    getBenchmark,
  } = useEssayStats();

  const [selectedTab, setSelectedTab] = useState('overview');

  // Carregar benchmark ao montar
  useEffect(() => {
    getBenchmark();
  }, [getBenchmark]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PenTool className="w-6 h-6 text-primary" />
          Análise Completa de Redações ENEM
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Dashboard inteligente de análise de redações com IA, gráficos avançados e recomendações personalizadas
        </p>
      </div>

      {/* Tabs de conteúdo */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>

          <TabsTrigger value="competencies" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Competências</span>
          </TabsTrigger>

          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Insights IA</span>
          </TabsTrigger>

          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>

          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Avançado</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Visão Geral */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <EssayOverview
            stats={stats}
            history={history}
            loading={loading}
          />
        </TabsContent>

        {/* Aba 2: Competências */}
        <TabsContent value="competencies" className="space-y-6 mt-6">
          <CompetencyAnalysis stats={stats} />
        </TabsContent>

        {/* Aba 3: Insights IA */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <InsightsPanel
            insights={insights}
            prediction={prediction}
            loading={loading}
          />
        </TabsContent>

        {/* Aba 4: Histórico */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <EssayHistory
            essays={essays}
            benchmark={benchmark}
            stats={stats}
            onSelectEssay={loadEssayAnalysis}
            loading={loading}
          />
        </TabsContent>

        {/* Aba 5: Análises Avançadas */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
          <AdvancedAnalysis stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Componente de Análises Avançadas (espaço para futuras integrações)
 */
function AdvancedAnalysis({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Perfil do Escritor */}
      <div className="rounded-lg border p-6">
        <h3 className="font-semibold mb-4">🎭 Perfil do Escritor (IA)</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Estilo:</span>
            <span className="ml-2 font-medium">Argumentador com traits analíticos</span>
          </div>
          <div>
            <span className="text-muted-foreground">Força:</span>
            <span className="ml-2 font-medium">Estrutura lógica e coesão</span>
          </div>
          <div>
            <span className="text-muted-foreground">Ponto de melhoria:</span>
            <span className="ml-2 font-medium">Repertório sociocultural</span>
          </div>
        </div>
      </div>

      {/* Hábitos e Produtividade */}
      <div className="rounded-lg border p-6">
        <h3 className="font-semibold mb-4">📊 Hábitos e Produtividade</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Horário mais produtivo:</span>
            <span className="ml-2 font-medium">19h-21h</span>
          </div>
          <div>
            <span className="text-muted-foreground">Dia mais produtivo:</span>
            <span className="ml-2 font-medium">Terça-feira</span>
          </div>
          <div>
            <span className="text-muted-foreground">Frequência ideal:</span>
            <span className="ml-2 font-medium">3-4 redações/semana</span>
          </div>
        </div>
      </div>

      {/* Análise Semântica */}
      <div className="rounded-lg border p-6 lg:col-span-2">
        <h3 className="font-semibold mb-4">🧠 Análise Semântica Avançada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Análise profunda da estrutura textual, riqueza vocabular e progressão temática
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">78%</div>
            <div className="text-xs text-muted-foreground">Riqueza Lexical</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">82%</div>
            <div className="text-xs text-muted-foreground">Complexidade</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">89%</div>
            <div className="text-xs text-muted-foreground">Coerência</div>
          </div>
        </div>
      </div>

      {/* Correlações */}
      <div className="rounded-lg border p-6 lg:col-span-2">
        <h3 className="font-semibold mb-4">🔗 Correlações Descobertas</h3>
        <div className="space-y-2 text-sm">
          <p>• Maior tempo de escrita correlaciona com melhor competência 3 (argumentação)</p>
          <p>• Uso de repertório sociocultural forte associado com melhor C2 e C3</p>
          <p>• Frequência consistente (3+/semana) aumenta 15% na competência 4</p>
        </div>
      </div>
    </div>
  );
}
