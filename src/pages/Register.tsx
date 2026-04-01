import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient">Criar Conta</h1>
          <p className="text-muted-foreground text-sm mt-2">Comece sua jornada no MindRush</p>
        </div>

        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Seu nome" className="pl-9 bg-muted/50" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="seu@email.com" className="pl-9 bg-muted/50" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-10 bg-muted/50" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" className="pl-9 bg-muted/50" />
            </div>
          </div>

          <Button className="w-full gradient-primary text-primary-foreground font-semibold h-11 shadow-glow">
            Criar conta
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
