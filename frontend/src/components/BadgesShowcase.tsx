import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import { useUserBadges } from '@/hooks/useStatistics';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Star, Zap, Lock, Sparkles } from 'lucide-react';

/**
 * Componente de Badges e Conquistas
 * Design escuro com bordas neon, detalhes roxos e texto claro
 */
export function BadgesShowcase() {
  const { data: badgesData, loading: badgesLoading, error: badgesError } = useUserBadges();

  if (badgesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 bg-slate-800" />
        <Skeleton className="h-40 bg-slate-800" />
      </div>
    );
  }

  if (badgesError) {
    return (
      <div className="rounded-lg p-3 bg-slate-900 border border-red-500/50 text-red-400 text-sm">
        Erro ao carregar badges: {badgesError}
      </div>
    );
  }

  if (!badgesData) {
    return (
      <div className="rounded-lg p-4 bg-slate-900 border border-red-500/50 text-red-400">
        Erro ao carregar badges
      </div>
    );
  }

  type BadgeItem = (typeof badgesData.badges)[number];

  // Agrupa badges por categoria
  const badgesByCategory = (badgesData.badges || []).reduce(
    (acc, item) => {
      const category = item.badge.category || 'outro';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, BadgeItem[]>
  );

  const categoryLabels: Record<string, string> = {
    milestone: '🎯 Marcos',
    mastery: '🎓 Domínio',
    consistency: '🔥 Consistência',
    speed: '⚡ Velocidade',
    outro: 'Outros',
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    milestone: <Trophy className="w-5 h-5" />,
    mastery: <Star className="w-5 h-5" />,
    consistency: <Zap className="w-5 h-5" />,
    speed: <Medal className="w-5 h-5" />,
  };

  const categoryColors: Record<string, { border: string; shadow: string; text: string }> = {
    milestone: { border: 'border-cyan-500/50', shadow: 'shadow-cyan-500/5', text: 'text-cyan-400' },
    mastery: { border: 'border-violet-500/50', shadow: 'shadow-violet-500/5', text: 'text-violet-400' },
    consistency: { border: 'border-orange-500/50', shadow: 'shadow-orange-500/5', text: 'text-orange-400' },
    speed: { border: 'border-blue-500/50', shadow: 'shadow-blue-500/5', text: 'text-blue-400' },
  };

  return (
    <div className="space-y-6">
      {/* Resumo de Badges */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-yellow-500/50 shadow-lg shadow-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-400">
            <Trophy className="w-6 h-6" />
            Suas Conquistas
          </CardTitle>
          <CardDescription className="text-slate-400">Badges e medalhas desbloqueadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-yellow-500/30">
              <p className="text-3xl font-bold text-yellow-400">{badgesData.totalBadges}</p>
              <p className="text-sm text-slate-400">Badges Desbloqueados</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-cyan-500/30">
              <p className="text-3xl font-bold text-cyan-300">
                {Object.values(badgesByCategory).flat().length}/50
              </p>
              <p className="text-sm text-slate-400">do Total Disponível</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-violet-500/30">
              <p className="text-3xl font-bold text-violet-300">
                {Math.round((badgesData.totalBadges / 50) * 100)}%
              </p>
              <p className="text-sm text-slate-400">Desbloqueados</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-emerald-500/30">
              <p className="text-3xl font-bold text-emerald-300">
                {badgesData.totalBadges * 10}
              </p>
              <p className="text-sm text-slate-400">XP de Badges</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges por Categoria */}
      {Object.entries(badgesByCategory).map(([category, badges]) => {
        const colors = categoryColors[category] || categoryColors.milestone;
        return (
          <Card key={category} className={`bg-gradient-to-br from-slate-900 to-slate-800 border ${colors.border} shadow-lg ${colors.shadow}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${colors.text}`}>
                {categoryIcons[category] || <Star className="w-5 h-5" />}
                {categoryLabels[category] || category}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {badges.length} badge{badges.length !== 1 ? 's' : ''} desbloqueado{badges.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {badges.map(item => (
                  <div key={item.badge.id} className="flex flex-col items-center text-center group cursor-pointer">
                    <div className={`w-16 h-16 mb-2 bg-gradient-to-br from-yellow-400/80 to-orange-500/80 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow border ${colors.border}`}>
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-semibold leading-tight text-slate-100">{item.badge.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(item.unlockedAt).toLocaleDateString('pt-BR')}
                    </p>
                    <BadgeComponent className="mt-2 bg-slate-700 text-slate-100">
                      +{item.badge.xpReward} XP
                    </BadgeComponent>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Próximas Conquistas */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-violet-500/40 shadow-lg shadow-violet-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-violet-400">
            <Sparkles className="w-5 h-5" />
            Próximas Conquistas
          </CardTitle>
          <CardDescription className="text-slate-400">Badges que você pode desbloquear em breve</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: '500 Questões',
                description: 'Responda 500 questões no total',
                progress: 75,
                icon: '🎯',
                borderColor: 'border-cyan-500/30',
              },
              {
                name: 'Mestre de Matemática',
                description: 'Atinja 90% de acurácia em Matemática',
                progress: 65,
                icon: '🎓',
                borderColor: 'border-violet-500/30',
              },
              {
                name: '14 Dias Consecutivos',
                description: 'Estude 14 dias seguidos',
                progress: 50,
                icon: '🔥',
                borderColor: 'border-orange-500/30',
              },
            ].map(badge => (
              <div
                key={badge.name}
                className={`p-4 bg-slate-800/50 rounded-lg border ${badge.borderColor} hover:border-opacity-75 transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <p className="font-semibold text-slate-100">{badge.name}</p>
                  </div>
                  <span className="text-2xl">{badge.icon}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{badge.description}</p>
                <div className="space-y-1">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-right">
                    {badge.progress}% concluído
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
