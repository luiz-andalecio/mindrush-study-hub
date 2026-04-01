import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Play, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const mockSimulados = [
  { id: '1', title: 'ENEM 2023 - Ciências Humanas', area: 'humanas', questions: 45, time: 300, status: 'pending' as const },
  { id: '2', title: 'ENEM 2023 - Linguagens', area: 'linguagens', questions: 45, time: 300, status: 'completed' as const, score: 720 },
  { id: '3', title: 'ENEM 2022 - Matemática', area: 'matematica', questions: 45, time: 300, status: 'completed' as const, score: 680 },
  { id: '4', title: 'ENEM 2023 - Ciências da Natureza', area: 'natureza', questions: 45, time: 300, status: 'pending' as const },
];

export default function Simulados() {
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');

  const filtered = mockSimulados.filter(s =>
    activeTab === 'available' ? s.status === 'pending' : s.status === 'completed'
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Simulados</h1>
        <p className="text-muted-foreground text-sm mt-1">Pratique com provas completas do ENEM</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['available', 'completed'] as const).map(tab => (
          <Button
            key={tab}
            variant="ghost"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'font-medium',
              activeTab === tab && 'gradient-primary text-primary-foreground',
            )}
          >
            {tab === 'available' ? 'Disponíveis' : 'Concluídos'}
          </Button>
        ))}
      </div>

      {/* Simulados List */}
      <div className="space-y-4">
        {filtered.map(sim => (
          <div key={sim.id} className="rounded-xl p-5 gradient-card border border-border/50 shadow-card flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-display font-semibold">{sim.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{sim.questions} questões</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{sim.time / 60} horas</span>
              </div>
              {sim.status === 'completed' && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm font-medium">Nota TRI: <span className="text-primary font-bold">{sim.score}</span></span>
                  <Progress value={(sim.score! / 1000) * 100} className="w-32 h-2" />
                </div>
              )}
            </div>
            <Button className={cn(
              sim.status === 'pending' ? 'gradient-primary text-primary-foreground' : 'bg-muted/50',
            )}>
              {sim.status === 'pending' ? <><Play className="w-4 h-4 mr-2" /> Iniciar</> : <><BarChart3 className="w-4 h-4 mr-2" /> Ver resultado</>}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
