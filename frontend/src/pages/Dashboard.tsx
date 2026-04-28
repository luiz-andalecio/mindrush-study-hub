import {
  BarChart3, ClipboardList, MapIcon, Flame, MessageCircle,
  PenTool, Swords, Trophy, User, TrendingUp, Target, Award
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { XPBar } from '@/components/XPBar';
import { QuickAccessCard } from '@/components/QuickAccessCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import type { DashboardStats } from '@/types';
import { userService } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await userService.getDashboardStats();
        if (!alive) return;
        setStats(res.data);
      } catch {
        if (!alive) return;
        setStats(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const xpLevel = stats?.level ?? user?.level ?? 1;
  const xpToNext = stats?.xpToNextLevel ?? user?.xpToNextLevel ?? 100;
  const currentInLevel = useMemo(() => Math.max(0, 100 - xpToNext), [xpToNext]);

  const weeklyData = stats?.weeklyPerformance ?? [
    { day: 'Seg', score: 0 },
    { day: 'Ter', score: 0 },
    { day: 'Qua', score: 0 },
    { day: 'Qui', score: 0 },
    { day: 'Sex', score: 0 },
    { day: 'Sáb', score: 0 },
    { day: 'Dom', score: 0 },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-display font-bold">
          Olá, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Estudante'}</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Continue sua jornada de estudos!</p>
      </div>

      {/* XP Bar */}
      <div className="rounded-xl p-5 gradient-card border border-border/50 shadow-card">
        <XPBar current={currentInLevel} max={100} level={xpLevel} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Simulados"
          value={String(stats?.simuladosCompleted ?? 0)}
          icon={<ClipboardList className="w-5 h-5 text-primary-foreground" />}
          subtitle="Concluídos"
        />
        <StatCard
          title="Ranking"
          value={`#${stats?.rankPosition ?? user?.rankPosition ?? 0}`}
          icon={<Trophy className="w-5 h-5 text-primary-foreground" />}
          subtitle="Mundial"
          gradient="gradient-warm"
        />
        <StatCard
          title="Redação"
          value={String(stats?.essayScore ?? 0)}
          icon={<PenTool className="w-5 h-5 text-primary-foreground" />}
          subtitle="Última nota"
          gradient="gradient-accent"
        />
        <StatCard
          title="Progresso Diário"
          value={`${stats?.dailyProgress ?? 0}%`}
          icon={<Target className="w-5 h-5 text-primary-foreground" />}
          subtitle="Meta: 50 questões"
          gradient="gradient-success"
        />
      </div>

      {/* Chart + Streak */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl p-5 gradient-card border border-border/50 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Desempenho Semanal</h2>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 16%)" />
              <XAxis dataKey="day" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(230 25% 10%)',
                  border: '1px solid hsl(230 20% 16%)',
                  borderRadius: '8px',
                  color: 'hsl(210 40% 96%)',
                }}
              />
              <Bar dataKey="score" fill="hsl(250 80% 62%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Streak Card */}
        <div className="rounded-xl p-5 gradient-card border border-border/50 shadow-card flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full gradient-warm flex items-center justify-center mb-3 animate-pulse-glow">
            <Flame className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-3xl font-display font-bold">{stats?.streak ?? user?.streak ?? 0} dias</p>
          <p className="text-muted-foreground text-sm mt-1">Sequência de Estudos</p>
          <div className="flex gap-1 mt-3">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div key={d} className="w-6 h-6 rounded-full gradient-warm flex items-center justify-center">
                <Award className="w-3 h-3 text-primary-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="font-display font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

          <QuickAccessCard title="Jornada" description="Progrida por cards" icon={<MapIcon className="w-6 h-6 text-primary-foreground" />} to="/journey" />

          <QuickAccessCard title="PvP" description="Desafie outros estudantes" icon={<Swords className="w-6 h-6 text-primary-foreground" />} to="/pvp" gradient="gradient-warm" />

          <QuickAccessCard title="Chatbot" description="Tire suas dúvidas" icon={<MessageCircle className="w-6 h-6 text-primary-foreground" />} to="/chatbot" gradient="gradient-accent" />

          <QuickAccessCard title="Estatísticas" description="Acompanhe sua evolução" icon={<BarChart3 className="w-6 h-6 text-primary-foreground" />} to="/estatisticas" gradient="gradient-success" />

          <QuickAccessCard title="Simulados" description="Pratique com provas completas" icon={<ClipboardList className="w-6 h-6 text-primary-foreground" />} to="/simulados" />

          <QuickAccessCard title="Ranking" description="Veja sua posição" icon={<Trophy className="w-6 h-6 text-primary-foreground" />} to="/ranking" gradient="gradient-warm" />

          <QuickAccessCard title="Redação IA" description="Escreva e receba feedback" icon={<PenTool className="w-6 h-6 text-primary-foreground" />} to="/redacao" gradient="gradient-accent" />

          <QuickAccessCard title="Perfil" description="Gerencie sua conta" icon={<User className="w-6 h-6 text-primary-foreground" />} to="/perfil" gradient="gradient-success" />
        </div>
      </div>
    </div>
  );
}
