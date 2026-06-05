import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticsOverview } from '@/components/StatisticsOverview';
import { WeaknessAnalytics } from '@/components/WeaknessAnalytics';
import { BadgesShowcase } from '@/components/BadgesShowcase';
import { EssayAnalysisTab } from '@/components/EssayAnalysisTab';
import { BarChart, TrendingUp, Trophy } from 'lucide-react';

/**
 * Página completa de Estatísticas e Análises
 * 
 * Integra:
 * - Dashboard geral de desempenho
 * - Análises avançadas com fraquezas e oportunidades
 * - Badges e conquistas gamificadas
 * - Gráficos interativos de evolução
 */
export default function Statistics() {
  return (
    <div className="min-h-screen space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Estatísticas</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Acompanhe sua evolução nos estudos com análises detalhadas e gamificação
        </p>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-max grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Análises</span>
          </TabsTrigger>
          <TabsTrigger value="essays" className="flex items-center gap-2">
            <span>✍️</span>
            <span className="hidden sm:inline">Redações</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Badges</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Geral */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <StatisticsOverview />
        </TabsContent>

        {/* Análises Avançadas + Fraquezas */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          <WeaknessAnalytics />
        </TabsContent>

        {/* Análise de Redação ENEM */}
        <TabsContent value="essays" className="space-y-6 mt-6">
          <EssayAnalysisTab />
        </TabsContent>

        {/* Badges e Conquistas */}
        <TabsContent value="badges" className="space-y-6 mt-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Suas Conquistas</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Badges desbloqueados e próximas metas para alcançar
            </p>
            <BadgesShowcase />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
