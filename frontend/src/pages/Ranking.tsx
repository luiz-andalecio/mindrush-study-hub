import { Trophy, Medal, Award } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useMemo, useState } from 'react';
import type { RankingEntry } from '@/types';
import { rankingService } from '@/services/rankingService';

const topColors = ['gradient-warm', 'gradient-primary', 'gradient-accent'];
const topIcons = [Trophy, Medal, Award];

export default function Ranking() {
  const [scope, setScope] = useState<'world' | 'weekly' | 'daily'>('world');
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await rankingService.getLeaderboard(scope);
        if (!alive) return;
        setEntries(res.data);
      } catch {
        if (!alive) return;
        setEntries([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [scope]);

  const top3 = useMemo(() => entries.slice(0, 3), [entries]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Ranking</h1>
        <p className="text-muted-foreground text-sm mt-1">Os melhores estudantes da plataforma</p>
      </div>

      <div className="flex items-center justify-between">
        <Tabs value={scope} onValueChange={(v) => setScope(v as any)}>
          <TabsList>
            <TabsTrigger value="world">Mundial</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="daily">Diário</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          {scope === 'world' ? 'Ordenado por XP total' : 'Ordenado por XP ganho no período'}
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4">
        {[1, 0, 2].map((idx) => {
          const entry = top3[idx];
          const Icon = topIcons[idx];
          if (!entry) return <div key={idx} className={cn('w-20 md:w-24')} />;
          return (
            <div key={idx} className={cn('text-center', idx === 0 ? 'mb-4' : '')}>
              <div className={cn('w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto flex items-center justify-center border-4 border-border/50', topColors[idx])}>
                <span className="text-lg md:text-xl font-display font-bold text-primary-foreground">{entry.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <Icon className={cn('w-5 h-5 mx-auto mt-2', idx === 0 ? 'text-warning' : 'text-muted-foreground')} />
              <p className="font-display font-semibold text-sm mt-1">{entry.name.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground">{entry.xp.toLocaleString('pt-BR')} XP</p>
              <div className={cn(
                'mt-2 rounded-t-xl w-20 md:w-24 mx-auto flex items-center justify-center',
                topColors[idx],
                idx === 0 ? 'h-28' : idx === 1 ? 'h-20' : 'h-16',
              )}>
                <span className="text-2xl font-display font-bold text-primary-foreground">#{entry.position}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl gradient-card border border-border/50 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Carregando ranking...</div>
        ) : null}
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left p-4">#</th>
              <th className="text-left p-4">Estudante</th>
              <th className="text-right p-4">XP</th>
              <th className="text-right p-4">Nível</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.position} className={cn(
                'border-b border-border/30 hover:bg-muted/20 transition-colors',
                entry.position <= 3 && 'bg-primary/5',
              )}>
                <td className="p-4 font-display font-bold text-sm">
                  {entry.position <= 3 ? (
                    <span className="text-gradient">#{entry.position}</span>
                  ) : (
                    <span className="text-muted-foreground">#{entry.position}</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={cn('text-xs font-bold', entry.position <= 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                        {entry.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{entry.name}</span>
                  </div>
                </td>
                <td className="p-4 text-right text-sm font-medium">{entry.xp.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-right text-sm text-muted-foreground">{entry.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
