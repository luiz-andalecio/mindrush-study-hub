import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Recuperar Senha</h1>
          <p className="text-muted-foreground text-sm mt-2">Enviaremos um link para redefinir sua senha</p>
        </div>

        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="seu@email.com" className="pl-9 bg-muted/50" />
            </div>
          </div>

          <Button className="w-full gradient-primary text-primary-foreground font-semibold h-11">
            Enviar link
          </Button>

          <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
