import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, Flame, Coins } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export function Topbar() {
  const { user } = useAuth();

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

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 glass">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar questões, temas..."
            className="pl-9 w-64 bg-muted/50 border-border/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="flex items-center gap-1.5 text-warning text-sm font-medium">
          <Flame className="w-4 h-4" />
          <span>{user?.streak ?? 0}</span>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Coins className="w-4 h-4 text-warning" />
          <span>{(user?.coins ?? 0).toLocaleString('pt-BR')}</span>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full gradient-accent" />
        </Button>

        <Avatar className="w-8 h-8 border-2 border-primary/50">
          <AvatarFallback className="gradient-primary text-xs text-primary-foreground font-bold">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
