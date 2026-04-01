import { Trophy, Medal, Award } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const mockRanking = [
  { position: 1, name: 'Maria Silva', xp: 15200, level: 25, score: 945 },
  { position: 2, name: 'João Santos', xp: 14800, level: 24, score: 920 },
  { position: 3, name: 'Ana Oliveira', xp: 14100, level: 23, score: 905 },
  { position: 4, name: 'Carlos Lima', xp: 13500, level: 22, score: 890 },
  { position: 5, name: 'Beatriz Costa', xp: 12900, level: 21, score: 875 },
  { position: 6, name: 'Pedro Souza', xp: 12300, level: 20, score: 860 },
  { position: 7, name: 'Lucas Ferreira', xp: 11800, level: 19, score: 845 },
  { position: 8, name: 'Julia Martins', xp: 11200, level: 18, score: 830 },
  { position: 9, name: 'Gabriel Rocha', xp: 10600, level: 17, score: 815 },
  { position: 10, name: 'Camila Alves', xp: 10000, level: 16, score: 800 },
];

const topColors = ['gradient-warm', 'gradient-primary', 'gradient-accent'];
const topIcons = [Trophy, Medal, Award];

export default function Ranking() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Ranking</h1>
        <p className="text-muted-foreground text-sm mt-1">Os melhores estudantes da plataforma</p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4">
        {[1, 0, 2].map((idx) => {
          const entry = mockRanking[idx];
          const Icon = topIcons[idx];
          return (
            <div key={idx} className={cn('text-center', idx === 0 ? 'mb-4' : '')}>
              <div className={cn('w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto flex items-center justify-center border-4 border-border/50', topColors[idx])}>
                <span className="text-lg md:text-xl font-display font-bold text-primary-foreground">{entry.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <Icon className={cn('w-5 h-5 mx-auto mt-2', idx === 0 ? 'text-warning' : 'text-muted-foreground')} />
              <p className="font-display font-semibold text-sm mt-1">{entry.name.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground">{entry.xp.toLocaleString()} XP</p>
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
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left p-4">#</th>
              <th className="text-left p-4">Estudante</th>
              <th className="text-right p-4">XP</th>
              <th className="text-right p-4">Nível</th>
              <th className="text-right p-4">Nota</th>
            </tr>
          </thead>
          <tbody>
            {mockRanking.map((entry) => (
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
                <td className="p-4 text-right text-sm font-medium">{entry.xp.toLocaleString()}</td>
                <td className="p-4 text-right text-sm text-muted-foreground">{entry.level}</td>
                <td className="p-4 text-right text-sm font-bold text-primary">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
