import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Swords, Users, Play, Trophy, Clock, Plus, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockRooms = [
  { id: '1', code: 'ABC123', host: 'Carlos', status: 'waiting' as const },
  { id: '2', code: 'XYZ789', host: 'Ana', status: 'in_progress' as const },
  { id: '3', code: 'DEF456', host: 'Pedro', status: 'waiting' as const },
];

export default function PvP() {
  const [tab, setTab] = useState<'rooms' | 'match'>('rooms');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">PvP - Desafio</h1>
        <p className="text-muted-foreground text-sm mt-1">Desafie outros estudantes em tempo real</p>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl p-6 gradient-card border border-border/50 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-glow">
            <Plus className="w-7 h-7 text-primary-foreground" />
          </div>
          <h3 className="font-display font-semibold">Criar Sala</h3>
          <p className="text-sm text-muted-foreground">Crie uma sala e convide amigos</p>
          <Button className="gradient-primary text-primary-foreground font-semibold w-full">
            Criar sala
          </Button>
        </div>
        <div className="rounded-xl p-6 gradient-card border border-border/50 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center mx-auto">
            <LogIn className="w-7 h-7 text-primary-foreground" />
          </div>
          <h3 className="font-display font-semibold">Entrar em Sala</h3>
          <p className="text-sm text-muted-foreground">Use o código da sala</p>
          <div className="flex gap-2">
            <Input placeholder="Código da sala" className="bg-muted/50 border-border/50" />
            <Button className="gradient-accent text-primary-foreground">Entrar</Button>
          </div>
        </div>
      </div>

      {/* Available Rooms */}
      <div>
        <h2 className="font-display font-semibold mb-4">Salas disponíveis</h2>
        <div className="space-y-3">
          {mockRooms.map(room => (
            <div key={room.id} className="rounded-xl p-4 gradient-card border border-border/50 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Sala de {room.host}</p>
                  <p className="text-xs text-muted-foreground">Código: {room.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  room.status === 'waiting' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning',
                )}>
                  {room.status === 'waiting' ? 'Aguardando' : 'Em jogo'}
                </span>
                {room.status === 'waiting' && (
                  <Button size="sm" className="gradient-primary text-primary-foreground">
                    <Play className="w-3 h-3 mr-1" /> Entrar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
