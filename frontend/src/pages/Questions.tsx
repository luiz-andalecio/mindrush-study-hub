import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, PlayCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockQuestion = {
  id: '1',
  statement: 'A industrialização brasileira, iniciada no governo de Getúlio Vargas, trouxe transformações significativas para a economia do país. Considerando o processo de industrialização brasileira, é correto afirmar que:',
  area: 'humanas',
  difficulty: 'medio',
  year: 2022,
  topic: 'Industrialização',
  alternatives: [
    { id: 'a', letter: 'A', text: 'A industrialização brasileira teve início com a substituição de importações durante a Primeira Guerra Mundial.' },
    { id: 'b', letter: 'B', text: 'O Plano de Metas de Juscelino Kubitschek priorizou a indústria de base e infraestrutura.' },
    { id: 'c', letter: 'C', text: 'A industrialização foi exclusivamente voltada para o mercado externo.' },
    { id: 'd', letter: 'D', text: 'O processo industrial brasileiro não teve participação do capital estrangeiro.' },
    { id: 'e', letter: 'E', text: 'A concentração industrial no Sudeste foi eliminada com políticas regionais.' },
  ],
  correctAnswer: 'b',
  explanation: 'O Plano de Metas de JK (1956-1961) focou em energia, transportes, alimentação, indústria de base e educação, com o lema "50 anos em 5".',
};

export default function Questions() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected) setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Questões</h1>
        <p className="text-muted-foreground text-sm mt-1">Pratique com questões do ENEM</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Área', options: ['Linguagens', 'Humanas', 'Natureza', 'Matemática'] },
          { label: 'Dificuldade', options: ['Fácil', 'Médio', 'Difícil'] },
          { label: 'Ano', options: ['2023', '2022', '2021', '2020'] },
        ].map((filter) => (
          <Select key={filter.label}>
            <SelectTrigger className="w-36 bg-muted/50 border-border/50">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((opt) => (
                <SelectItem key={opt} value={opt.toLowerCase()}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Question Card */}
      <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary font-medium">Humanas</span>
          <span className="px-2 py-1 rounded-full bg-warning/20 text-warning font-medium">Médio</span>
          <span className="text-muted-foreground">ENEM 2022</span>
        </div>

        <p className="text-sm leading-relaxed">{mockQuestion.statement}</p>

        <div className="space-y-3">
          {mockQuestion.alternatives.map((alt) => {
            const isCorrect = submitted && alt.id === mockQuestion.correctAnswer;
            const isWrong = submitted && selected === alt.id && alt.id !== mockQuestion.correctAnswer;

            return (
              <button
                key={alt.id}
                onClick={() => !submitted && setSelected(alt.id)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3',
                  !submitted && selected === alt.id && 'border-primary bg-primary/10',
                  !submitted && selected !== alt.id && 'border-border/50 hover:border-primary/30 bg-muted/20',
                  isCorrect && 'border-success bg-success/10',
                  isWrong && 'border-destructive bg-destructive/10',
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                  !submitted && selected === alt.id && 'gradient-primary text-primary-foreground',
                  !submitted && selected !== alt.id && 'bg-muted text-muted-foreground',
                  isCorrect && 'gradient-success text-primary-foreground',
                  isWrong && 'bg-destructive text-destructive-foreground',
                )}>
                  {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : isWrong ? <XCircle className="w-4 h-4" /> : alt.letter}
                </span>
                <span className="text-sm mt-1">{alt.text}</span>
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!selected} className="gradient-primary text-primary-foreground font-semibold">
            Responder <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <h3 className="font-display font-semibold text-sm mb-2">Explicação</h3>
              <p className="text-sm text-muted-foreground">{mockQuestion.explanation}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-border/50">
                <PlayCircle className="w-4 h-4 mr-2" /> Ver vídeo explicação
              </Button>
              <Button onClick={() => { setSelected(null); setSubmitted(false); }} className="gradient-primary text-primary-foreground">
                Próxima questão <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
