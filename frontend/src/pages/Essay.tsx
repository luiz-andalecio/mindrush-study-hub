import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Send, FileText, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const mockHistory = [
  { id: '1', title: 'Impactos da tecnologia na educação', score: 820, date: '15/03/2024' },
  { id: '2', title: 'Desafios da saúde pública', score: 740, date: '10/03/2024' },
  { id: '3', title: 'Mobilidade urbana no Brasil', score: 680, date: '05/03/2024' },
];

const competencies = [
  { name: 'Competência 1', label: 'Norma culta', score: 160, max: 200 },
  { name: 'Competência 2', label: 'Compreensão do tema', score: 180, max: 200 },
  { name: 'Competência 3', label: 'Argumentação', score: 160, max: 200 },
  { name: 'Competência 4', label: 'Coesão textual', score: 160, max: 200 },
  { name: 'Competência 5', label: 'Proposta de intervenção', score: 160, max: 200 },
];

export default function Essay() {
  const [showResult, setShowResult] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Redação IA</h1>
        <p className="text-muted-foreground text-sm mt-1">Escreva e receba correção inteligente</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-4">
            <Input placeholder="Título da redação" className="bg-muted/50 border-border/50 font-display font-semibold" />
            <Textarea
              placeholder="Escreva sua redação aqui... (mínimo 7 linhas, máximo 30 linhas)"
              className="min-h-[400px] bg-muted/50 border-border/50 resize-none text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">0 / 30 linhas</span>
              <Button onClick={() => setShowResult(true)} className="gradient-primary text-primary-foreground font-semibold">
                <Send className="w-4 h-4 mr-2" /> Enviar para correção
              </Button>
            </div>
          </div>

          {/* AI Result */}
          {showResult && (
            <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-4 animate-slide-up">
              <div className="text-center">
                <p className="text-4xl font-display font-bold text-gradient">820</p>
                <p className="text-sm text-muted-foreground">Nota estimada</p>
              </div>
              <div className="space-y-3">
                {competencies.map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{c.label}</span>
                      <span className="text-muted-foreground">{c.score}/{c.max}</span>
                    </div>
                    <Progress value={(c.score / c.max) * 100} className="h-2" />
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <h3 className="font-display font-semibold text-sm mb-2">Feedback</h3>
                <p className="text-sm text-muted-foreground">Boa redação! Sua argumentação está consistente. Sugestão: aprofunde a proposta de intervenção com mais detalhes sobre o agente responsável e os meios de execução.</p>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold">Histórico</h2>
          {mockHistory.map((essay) => (
            <div key={essay.id} className="rounded-xl p-4 gradient-card border border-border/50 shadow-card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{essay.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />{essay.date}
                    <span className="text-primary font-bold ml-auto">{essay.score}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
