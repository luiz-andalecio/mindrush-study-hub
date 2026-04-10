import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { XPBar } from '@/components/XPBar';
import { Edit, Award, Star, Zap, Trophy, Target, Flame, BookOpen, LogOut, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, logout, updateProfile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const initials = useMemo(
    () =>
      (user?.name || user?.email || 'MR')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join(''),
    [user?.email, user?.name],
  );

  useEffect(() => {
    if (!editOpen) return;
    setName(user?.name ?? '');
  }, [editOpen, user?.name]);

  async function handleSaveProfile() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({
        title: 'Nome inválido',
        description: 'Informe um nome para salvar seu perfil.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await updateProfile({ name: trimmed });
      toast({
        title: 'Perfil atualizado',
        description: 'Seu nome foi atualizado com sucesso.',
      });
      setEditOpen(false);
    } catch (err: unknown) {
      let description = 'Não foi possível atualizar seu perfil.';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data && typeof data === 'object' && 'message' in data) {
          const msg = (data as { message?: unknown }).message;
          if (typeof msg === 'string' && msg.trim()) description = msg;
        }
      }
      toast({
        title: 'Erro ao salvar',
        description,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Profile Header */}
      <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card">
        <div className="flex items-start gap-6">
          <Avatar className="w-20 h-20 border-4 border-primary/30">
            <AvatarFallback className="gradient-primary text-2xl font-display font-bold text-primary-foreground">
              {initials || 'MR'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-display font-bold">{user?.name || 'Estudante MindRush'}</h1>
                <p className="text-sm text-muted-foreground">{user?.email || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-border/50">
                      <Edit className="w-3.5 h-3.5 mr-2" /> Editar perfil
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Editar perfil</DialogTitle>
                      <DialogDescription>
                        Atualize seus dados.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Nome</Label>
                        <Input
                          id="profile-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome"
                          className="bg-muted/50"
                          maxLength={200}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-email">E-mail</Label>
                        <Input
                          id="profile-email"
                          value={user?.email ?? ''}
                          readOnly
                          disabled
                          className="bg-muted/30"
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Senha</p>
                        </div>
                        <Button variant="outline" className="border-border/50" disabled>
                          Trocar senha (em breve)
                        </Button>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" className="border-border/50" onClick={() => setEditOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary text-primary-foreground">
                        {saving ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-border/50">
                      <LogOut className="w-3.5 h-3.5 mr-2" /> Sair
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso encerra sua sessão neste navegador.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={logout}>Sair</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
