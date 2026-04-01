import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { XPBar } from '@/components/XPBar';
import { Edit, Award, Star, Zap, Trophy, Target, Flame, BookOpen } from 'lucide-react';

const badges = [
  { name: 'Primeiro Login', icon: Star, color: 'gradient-warm' },
  { name: 'Mestre em Humanas', icon: BookOpen, color: 'gradient-primary' },
  { name: 'Sequência de 7', icon: Flame, color: 'gradient-accent' },
  { name: '100 Questões', icon: Target, color: 'gradient-success' },
  { name: 'Top 10 Ranking', icon: Trophy, color: 'gradient-primary' },
  { name: 'Redação 800+', icon: Zap, color: 'gradient-warm' },
];

const stats = [
  { label: 'Questões resolvidas', value: '1.247' },
  { label: 'Simulados feitos', value: '18' },
  { label: 'Redações enviadas', value: '12' },
  { label: 'Horas de estudo', value: '156h' },
  { label: 'Maior sequência', value: '14 dias' },
  { label: 'Acurácia média', value: '72%' },
];

export default function Profile() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Profile Header */}
      <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card">
        <div className="flex items-start gap-6">
          <Avatar className="w-20 h-20 border-4 border-primary/30">
            <AvatarFallback className="gradient-primary text-2xl font-display font-bold text-primary-foreground">MR</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-display font-bold">Estudante MindRush</h1>
                <p className="text-sm text-muted-foreground">estudante@mindrush.com</p>
              </div>
              <Button variant="outline" size="sm" className="border-border/50">
                <Edit className="w-3.5 h-3.5 mr-2" /> Editar perfil
              </Button>
            </div>
            <div className="mt-4">
              <XPBar current={2750} max={4000} level={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" /> Conquistas
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {badges.map((badge) => (
            <div key={badge.name} className="text-center">
              <div className={`w-12 h-12 rounded-xl ${badge.color} flex items-center justify-center mx-auto`}>
                <badge.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card">
        <h2 className="font-display font-semibold mb-4">Estatísticas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl bg-muted/20 border border-border/30 text-center">
              <p className="text-xl font-display font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
