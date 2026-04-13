import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, PlayCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enemService } from '@/services/enemService';
import { useQuestoes } from '@/hooks/useQuestoes';
import type { EnemExam, EnemQuestion } from '@/types';

export default function Questions() {
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  const [selected, setSelected] = useState<string | null>(null); // letra (A..E)
  const [submitted, setSubmitted] = useState(false);

  const [exams, setExams] = useState<EnemExam[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setExamsLoading(true);
    enemService
      .listProvas()
      .then((res) => {
        if (!mounted) return;
        setExams(res.data);
        if (res.data.length) {
          const latest = res.data.reduce((acc, cur) => (cur.year > acc.year ? cur : acc), res.data[0]);
          setSelectedYear(latest.year);
        }
      })
      .catch(() => {
        // Silencioso: a página ainda funciona se o usuário digitar o ano.
      })
      .finally(() => {
        if (!mounted) return;
        setExamsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filters = useMemo(() => {
    return {
      year: selectedYear,
      limit,
      offset,
      language,
    };
  }, [selectedYear, limit, offset, language]);

  const { data, loading, error } = useQuestoes(filters);

  const currentQuestion: EnemQuestion | null = data?.questions?.[currentIdx] ?? null;

  // Quando a página/filtros mudam, resetamos estado do card.
  useEffect(() => {
    setCurrentIdx(0);
    setSelected(null);
    setSubmitted(false);
  }, [selectedYear, language, limit, offset]);

  const handleSubmit = () => {
    if (selected) setSubmitted(true);
  };

  const handleNext = () => {
    if (!data || !data.questions.length) return;

    // Próxima questão dentro da mesma página.
    if (currentIdx < data.questions.length - 1) {
      setCurrentIdx((v) => v + 1);
      setSelected(null);
      setSubmitted(false);
      return;
    }

    // Próxima página (offset).
    if (data.metadata.hasMore) {
      setOffset((v) => v + limit);
      return;
    }
  };

  const canNext = Boolean(data?.questions?.length) && (currentIdx < (data?.questions.length ?? 0) - 1 || Boolean(data?.metadata.hasMore));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Questões</h1>
        <p className="text-muted-foreground text-sm mt-1">Pratique com questões do ENEM</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => {
            const year = Number(v);
            if (Number.isFinite(year)) {
              setSelectedYear(year);
              setOffset(0);
            }
          }}
        >
          <SelectTrigger className="w-36 bg-muted/50 border-border/50">
            <SelectValue placeholder={examsLoading ? 'Carregando...' : 'Ano'} />
          </SelectTrigger>
          <SelectContent>
            {(exams.length ? exams : [{ year: selectedYear, title: '', disciplines: [], languages: [] }]).map((e) => (
              <SelectItem key={e.year} value={String(e.year)}>
                {e.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={language ?? 'pt'}
          onValueChange={(v) => {
            setLanguage(v === 'pt' ? undefined : v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-44 bg-muted/50 border-border/50">
            <SelectValue placeholder="Idioma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt">Português</SelectItem>
            <SelectItem value="ingles">Inglês</SelectItem>
            <SelectItem value="espanhol">Espanhol</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(limit)}
          onValueChange={(v) => {
            const next = Number(v);
            if (!Number.isFinite(next)) return;
            setLimit(next);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-36 bg-muted/50 border-border/50">
            <SelectValue placeholder="Por página" />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Question Card */}
      <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary font-medium">
            {currentQuestion?.discipline ? currentQuestion.discipline : 'ENEM'}
          </span>
          <span className="px-2 py-1 rounded-full bg-warning/20 text-warning font-medium">
            {currentQuestion?.language ?? 'pt'}
          </span>
          <span className="text-muted-foreground">ENEM {selectedYear}</span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando questões...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !currentQuestion ? (
          <p className="text-sm text-muted-foreground">Nenhuma questão encontrada para esses filtros.</p>
        ) : (
          <>
            {currentQuestion.context ? (
              <p className="text-sm leading-relaxed">{currentQuestion.context}</p>
            ) : null}
            <p className="text-sm leading-relaxed font-medium">{currentQuestion.title}</p>
          </>
        )}

        <div className="space-y-3">
          {(currentQuestion?.alternatives ?? []).map((alt) => {
            const isCorrect = submitted && alt.letter === currentQuestion?.correctAlternative;
            const isWrong = submitted && selected === alt.letter && alt.letter !== currentQuestion?.correctAlternative;

            return (
              <button
                key={alt.letter}
                onClick={() => !submitted && setSelected(alt.letter)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3',
                  !submitted && selected === alt.letter && 'border-primary bg-primary/10',
                  !submitted && selected !== alt.letter && 'border-border/50 hover:border-primary/30 bg-muted/20',
                  isCorrect && 'border-success bg-success/10',
                  isWrong && 'border-destructive bg-destructive/10',
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                  !submitted && selected === alt.letter && 'gradient-primary text-primary-foreground',
                  !submitted && selected !== alt.letter && 'bg-muted text-muted-foreground',
                  isCorrect && 'gradient-success text-primary-foreground',
                  isWrong && 'bg-destructive text-destructive-foreground',
                )}>
                  {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : isWrong ? <XCircle className="w-4 h-4" /> : alt.letter}
                </span>
                <span className="text-sm mt-1">{alt.text ?? alt.file ?? '—'}</span>
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!selected || !currentQuestion} className="gradient-primary text-primary-foreground font-semibold">
            Responder <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <h3 className="font-display font-semibold text-sm mb-2">Explicação</h3>
              <p className="text-sm text-muted-foreground">
                A API do ENEM não fornece explicação. Gabarito: alternativa {currentQuestion?.correctAlternative ?? '—'}.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-border/50">
                <PlayCircle className="w-4 h-4 mr-2" /> Ver vídeo explicação
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canNext}
                className="gradient-primary text-primary-foreground"
              >
                Próxima questão <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
