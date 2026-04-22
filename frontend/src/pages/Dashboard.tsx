import {
  BarChart3, ClipboardList, FileQuestion, Flame, MessageCircle,
  PenTool, Swords, Trophy, User, TrendingUp, Target, Award
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { XPBar } from '@/components/XPBar';
import { QuickAccessCard } from '@/components/QuickAccessCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const weeklyData = [
  { day: 'Seg', score: 72 },
  { day: 'Ter', score: 85 },
  { day: 'Qua', score: 60 },
  { day: 'Qui', score: 90 },
  { day: 'Sex', score: 78 },
  { day: 'Sáb', score: 65 },
  { day: 'Dom', score: 45 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-display font-bold">
          Olá, <span className="text-gradient">Estudante</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Continue sua jornada de estudos!</p>
      </div>

      {/* XP Bar */}
      <div className="rounded-xl p-5 gradient-card border border-border/50 shadow-card">
        <XPBar current={2750} max={4000} level={12} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Progresso Diário"
          value="68%"
          icon={<Target className="w-5 h-5 text-primary-foreground" />}
          subtitle="Meta: 50 questões"
        />
        <StatCard
          title="Ranking"
          value="#42"
          icon={<Trophy className="w-5 h-5 text-primary-foreground" />}
          subtitle="Top 5%"
          gradient="gradient-accent"
        />
        <StatCard
          title="Simulados"
          value="8"
          icon={<ClipboardList className="w-5 h-5 text-primary-foreground" />}
          subtitle="3 esta semana"
          gradient="gradient-success"
        />
        <StatCard
          title="Redação"
          value="820"
          icon={<PenTool className="w-5 h-5 text-primary-foreground" />}
          subtitle="Última nota"
          gradient="gradient-warm"
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
          <p className="text-3xl font-display font-bold">7 dias</p>
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
          <QuickAccessCard title="Simulados" description="Pratique com provas completas" icon={<ClipboardList className="w-6 h-6 text-primary-foreground" />} to="/simulados" />
          <QuickAccessCard title="Ranking" description="Veja sua posição" icon={<Trophy className="w-6 h-6 text-primary-foreground" />} to="/ranking" gradient="gradient-accent" />
          <QuickAccessCard title="Redação IA" description="Escreva e receba feedback" icon={<PenTool className="w-6 h-6 text-primary-foreground" />} to="/redacao" gradient="gradient-warm" />
          <QuickAccessCard title="Chatbot" description="Tire suas dúvidas" icon={<MessageCircle className="w-6 h-6 text-primary-foreground" />} to="/chatbot" gradient="gradient-success" />
          <QuickAccessCard title="PvP" description="Desafie outros estudantes" icon={<Swords className="w-6 h-6 text-primary-foreground" />} to="/pvp" />
          <QuickAccessCard title="Jornada" description="Progrida por cards" icon={<FileQuestion className="w-6 h-6 text-primary-foreground" />} to="/journey" gradient="gradient-accent" />
          <QuickAccessCard title="Estatísticas" description="Acompanhe sua evolução" icon={<BarChart3 className="w-6 h-6 text-primary-foreground" />} to="/estatisticas" gradient="gradient-success" />
          <QuickAccessCard title="Perfil" description="Gerencie sua conta" icon={<User className="w-6 h-6 text-primary-foreground" />} to="/perfil" gradient="gradient-warm" />
        </div>
      </div>
    </div>
  );
}
