import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, Flame, Coins } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Topbar() {
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
          <span>7</span>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Coins className="w-4 h-4 text-warning" />
          <span>1.250</span>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full gradient-accent" />
        </Button>

        <Avatar className="w-8 h-8 border-2 border-primary/50">
          <AvatarFallback className="gradient-primary text-xs text-primary-foreground font-bold">MR</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
