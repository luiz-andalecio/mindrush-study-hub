import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Play, BarChart3, ArrowLeft, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { simuladoService } from '@/services/simuladoService';
import type { EnemAlternativeLetter, Simulado, SimuladoAttempt, SimuladoCompletedAttemptHistoryItem, SimuladoResult } from '@/types';
import { RewardDialog } from '@/components/RewardDialog';
import { useAuth } from '@/contexts/AuthContext';

type AreaKey = 'linguagens' | 'humanas' | 'natureza' | 'matematica';

function formatHms(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function areaFromDiscipline(discipline: string | null | undefined): AreaKey {
  const raw = (discipline ?? '').trim().toLowerCase();
  const norm = raw.normalize('NFD').replace(/\p{Diacritic}/gu, '');

  if (norm.includes('matemat')) return 'matematica';
  if (norm.includes('human')) return 'humanas';
  if (norm.includes('nature')) return 'natureza';
  return 'linguagens';
}

function areaLabel(area: AreaKey) {
  switch (area) {
    case 'linguagens':
      return 'Linguagens';
    case 'humanas':
      return 'Humanas';
    case 'natureza':
      return 'Natureza';
    case 'matematica':
      return 'Matemática';
  }
}

function areaBadgeClass(area: AreaKey) {
  switch (area) {
    case 'linguagens':
      return 'gradient-primary text-primary-foreground';
    case 'humanas':
      return 'gradient-accent text-primary-foreground';
    case 'natureza':
      return 'gradient-success text-primary-foreground';
    case 'matematica':
      return 'gradient-warm text-primary-foreground';
  }
}

function Md({ value }: { value: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noreferrer" className={cn('underline underline-offset-4')} />
          ),
          img: (props) => (
            <img
              {...props}
              alt={props.alt ?? 'Imagem da questão'}
              loading="lazy"
              className={cn('max-w-full h-auto rounded-xl border border-border/50 bg-muted/20')}
            />
          ),
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}

export default function Simulados() {
  const [view, setView] = useState<'list' | 'attempt' | 'result'>('list');
  const [activeTab, setActiveTab] = useState<'available' | 'in_progress' | 'completed'>('available');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [completedHistory, setCompletedHistory] = useState<SimuladoCompletedAttemptHistoryItem[]>([]);

  const [attempt, setAttempt] = useState<SimuladoAttempt | null>(null);
  const [result, setResult] = useState<SimuladoResult | null>(null);
  const [resultSimuladoId, setResultSimuladoId] = useState<string | null>(null);
  const [rewardOpen, setRewardOpen] = useState(false);

  const { refreshSession } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [savingAnswer, setSavingAnswer] = useState(false);

  const [localAnswers, setLocalAnswers] = useState<Record<string, EnemAlternativeLetter>>({});
  const [tick, setTick] = useState(() => Date.now());

  // Escolha de idioma por simulado (apenas para DAY1). Default: inglês.
  const [languageChoiceBySimuladoId, setLanguageChoiceBySimuladoId] = useState<Record<string, 'ingles' | 'espanhol'>>({});

  async function loadList() {
    setLoading(true);
    setError(null);
    try {
      const res = await simuladoService.list();
      setSimulados(res.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar simulados';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCompletedHistory() {
    setLoading(true);
    setError(null);
    try {
      const res = await simuladoService.history();
      setCompletedHistory(res.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar histórico';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadList();
  }, []);

  useEffect(() => {
    if (view !== 'list') return;
    if (activeTab !== 'completed') return;
    void loadCompletedHistory();
  }, [activeTab, view]);

  useEffect(() => {
    if (view !== 'attempt' || !attempt) return;

    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [view, attempt]);

  const filtered = useMemo(() => {
    return simulados.filter((s) => {
      if (activeTab === 'available') return true;
      if (activeTab === 'in_progress') return s.status === 'in_progress';
      return false;
    });
  }, [simulados, activeTab]);

  const filteredGroupedByYear = useMemo(() => {
    const byYear = new Map<number, Simulado[]>();
    for (const s of filtered) {
      const list = byYear.get(s.year) ?? [];
      list.push(s);
      byYear.set(s.year, list);
    }

    const years = Array.from(byYear.keys()).sort((a, b) => b - a);
    return years.map((year) => {
      const sims = (byYear.get(year) ?? []).slice().sort((a, b) => (a.part === b.part ? 0 : a.part === 'DAY1' ? -1 : 1));
      return { year, sims };
    });
  }, [filtered]);

  const answeredCount = useMemo(() => Object.keys(localAnswers).length, [localAnswers]);
  const totalCount = attempt?.progress.totalCount ?? 0;

  const timeRemainingSeconds = useMemo(() => {
    if (!attempt) return 0;
    const startedAt = new Date(attempt.startedAt).getTime();
    const nowForCalc = attempt.pausedAt ? new Date(attempt.pausedAt).getTime() : tick;
    const base = Math.max(0, Math.floor((nowForCalc - startedAt) / 1000));
    const elapsed = Math.max(0, base - attempt.pausedSeconds);
    return Math.max(0, attempt.timeLimitSeconds - elapsed);
  }, [attempt, tick]);

  const isPaused = Boolean(attempt?.pausedAt);

  const attemptQuestion = attempt?.questions[currentIdx] ?? null;
  const attemptQuestionId = attemptQuestion?.enemQuestionId ?? null;
  const attemptQuestionData = attemptQuestion?.question ?? null;

  const attemptNavGroups = useMemo(() => {
    if (!attempt) return null;
    const groups: Record<AreaKey, Array<{ idx: number; enemQuestionId: string; discipline: string | null }>> = {
      linguagens: [],
      humanas: [],
      natureza: [],
      matematica: [],
    };

    attempt.questions.forEach((q, idx) => {
      const area = areaFromDiscipline(q.question.discipline);
      groups[area].push({ idx, enemQuestionId: q.enemQuestionId, discipline: q.question.discipline ?? null });
    });

    return groups;
  }, [attempt]);

  const resultQuestion = result?.results[currentIdx] ?? null;
  const resultNavGroups = useMemo(() => {
    if (!result) return null;
    const groups: Record<AreaKey, Array<{ idx: number; enemQuestionId: string; isCorrect: boolean; discipline: string | null }>> = {
      linguagens: [],
      humanas: [],
      natureza: [],
      matematica: [],
    };

    result.results.forEach((r, idx) => {
      const area = areaFromDiscipline(r.question.discipline);
      groups[area].push({ idx, enemQuestionId: r.enemQuestionId, isCorrect: r.isCorrect, discipline: r.question.discipline ?? null });
    });

    return groups;
  }, [result]);

  const openAttempt = (data: SimuladoAttempt) => {
    setAttempt(data);
    setResult(null);
    setView('attempt');
    setCurrentIdx(0);

    const fromServer: Record<string, EnemAlternativeLetter> = {};
    for (const a of data.answers ?? []) {
      fromServer[a.enemQuestionId] = a.selectedAlternative;
    }
    setLocalAnswers(fromServer);
  };

  const startOrResume = async (sim: Simulado) => {
    setLoading(true);
    setError(null);
    try {
      if (sim.status === 'in_progress' && sim.attemptId) {
        const res = await simuladoService.getAttempt(sim.attemptId);
        openAttempt(res.data);
        return;
      }

      const languageChoice = languageChoiceBySimuladoId[sim.id] ?? 'ingles';
      const res = await simuladoService.start(sim.id, sim.part === 'DAY1' ? { languageChoice } : {});
      openAttempt(res.data);
      await loadList();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao iniciar simulado';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const viewResultByAttemptId = async (attemptId: string, simuladoId?: string | null) => {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    try {
      if (simuladoId) setResultSimuladoId(simuladoId);
      const res = await simuladoService.getResult(attemptId);
      setResult(res.data);
      setAttempt(null);
      setView('result');
      setCurrentIdx(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar resultado';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const viewResult = async (sim: Simulado) => {
    if (!sim.attemptId) return;
    // Mantém o idioma atual como default do "refazer" (caso DAY1)
    if (sim.part === 'DAY1' && sim.languageChoice) {
      const lang = sim.languageChoice === 'espanhol' ? 'espanhol' : 'ingles';
      setLanguageChoiceBySimuladoId((prev) => ({ ...prev, [sim.id]: lang }));
    }
    return viewResultByAttemptId(sim.attemptId, sim.id);
  };

  const handlePick = async (enemQuestionId: string, letter: EnemAlternativeLetter) => {
    if (!attempt) return;
    if (savingAnswer) return;

    setSavingAnswer(true);
    setError(null);

    setLocalAnswers((prev) => ({ ...prev, [enemQuestionId]: letter }));

    try {
      const res = await simuladoService.saveAnswer(attempt.attemptId, {
        enemQuestionId,
        selectedAlternative: letter,
      });

      setAttempt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          progress: res.data.progress,
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar resposta';
      setError(message);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;

    setLoading(true);
    setError(null);
    try {
      const res = await simuladoService.submit(attempt.attemptId, localAnswers);
      setResult(res.data);
      setAttempt(null);
      setView('result');
      setCurrentIdx(0);
      await loadList();

      await refreshSession();

      if ((res.data.rewards?.xpEarned ?? 0) > 0 || (res.data.rewards?.coinsEarned ?? 0) > 0) {
        setRewardOpen(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao finalizar simulado';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseToggle = async () => {
    if (!attempt) return;

    setLoading(true);
    setError(null);
    try {
      if (attempt.pausedAt) {
        const res = await simuladoService.resume(attempt.attemptId);
        setAttempt((prev) => (prev ? { ...prev, pausedAt: res.data.pausedAt, pausedSeconds: res.data.pausedSeconds } : prev));
      } else {
        const res = await simuladoService.pause(attempt.attemptId);
        setAttempt((prev) => (prev ? { ...prev, pausedAt: res.data.pausedAt, pausedSeconds: res.data.pausedSeconds } : prev));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao pausar/retomar';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!attempt) return;
    setLoading(true);
    setError(null);
    try {
      const res = await simuladoService.restart(attempt.attemptId);
      openAttempt(res.data);
      await loadList();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao reiniciar o simulado';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedoFromResult = async () => {
    if (!resultSimuladoId) return;
    const isDay1 = resultSimuladoId.endsWith('d1');
    const languageChoice = languageChoiceBySimuladoId[resultSimuladoId] ?? 'ingles';

    setLoading(true);
    setError(null);
    try {
      const res = await simuladoService.start(resultSimuladoId, isDay1 ? { languageChoice } : {});
      openAttempt(res.data);
      await loadList();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao refazer o simulado';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('pt-BR');
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Simulados</h1>
        <p className="text-muted-foreground text-sm mt-1">Pratique com provas completas do ENEM</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <RewardDialog
        open={rewardOpen}
        onOpenChange={setRewardOpen}
        title="Simulado finalizado!"
        xpEarned={result?.rewards?.xpEarned ?? 0}
        coinsEarned={result?.rewards?.coinsEarned ?? 0}
      />

      {view === 'list' ? (
        <>
          {/* Tabs */}
          <div className="flex gap-2">
            {(['available', 'in_progress', 'completed'] as const).map((tab) => (
              <Button
                key={tab}
                variant="ghost"
                onClick={() => setActiveTab(tab)}
                className={cn('font-medium', activeTab === tab && 'gradient-primary text-primary-foreground')}
              >
                {tab === 'available' ? 'Disponíveis' : tab === 'in_progress' ? 'Em andamento' : 'Concluídos'}
              </Button>
            ))}
          </div>

          {activeTab !== 'completed' ? (
            <div className="space-y-6">
              {loading && !filtered.length ? (
                <div className="rounded-xl p-5 gradient-card border border-border/50 shadow-card">
                  <p className="text-sm text-muted-foreground">Carregando simulados...</p>
                </div>
              ) : null}

              {filteredGroupedByYear.map(({ year, sims }) => (
                <div key={year} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold">{year}</h3>
                    <span className="text-xs text-muted-foreground">2 dias</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sims.map((sim) => {
                      const completed = sim.status === 'completed';
                      const inProgress = sim.status === 'in_progress';
                      const percent = completed && typeof sim.score === 'number' ? Math.round(sim.score * 100) : null;
                      const chosenLang = languageChoiceBySimuladoId[sim.id] ?? 'ingles';

                      return (
                        <div
                          key={sim.id}
                          className="rounded-xl p-5 gradient-card border border-border/50 shadow-card flex items-center justify-between gap-4"
                        >
                          <div className="flex-1">
                            <h4 className="font-display font-semibold">{sim.title}</h4>

                            {sim.part === 'DAY1' ? (
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-muted-foreground">Idioma:</span>
                                <div className="inline-flex rounded-xl border border-border/50 bg-muted/20 p-1">
                                  <ToggleGroup
                                    type="single"
                                    value={chosenLang}
                                    onValueChange={(v) => {
                                      if (!v) return;
                                      if (v !== 'ingles' && v !== 'espanhol') return;
                                      setLanguageChoiceBySimuladoId((prev) => ({ ...prev, [sim.id]: v }));
                                    }}
                                    disabled={inProgress || loading}
                                    className="gap-1"
                                  >
                                    <ToggleGroupItem
                                      value="ingles"
                                      className={cn(
                                        'h-7 px-3 rounded-lg text-xs border border-border/50 bg-transparent',
                                        'data-[state=on]:gradient-primary data-[state=on]:text-primary-foreground data-[state=on]:border-transparent',
                                      )}
                                    >
                                      Inglês
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                      value="espanhol"
                                      className={cn(
                                        'h-7 px-3 rounded-lg text-xs border border-border/50 bg-transparent',
                                        'data-[state=on]:gradient-primary data-[state=on]:text-primary-foreground data-[state=on]:border-transparent',
                                      )}
                                    >
                                      Espanhol
                                    </ToggleGroupItem>
                                  </ToggleGroup>
                                </div>

                                {inProgress && sim.languageChoice ? (
                                  <span className="text-xs text-muted-foreground">(em uso: {sim.languageChoice})</span>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {sim.totalQuestions} questões
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatHms(sim.timeLimitSeconds)}
                              </span>
                              {inProgress ? <span className="text-xs">Em andamento</span> : null}
                            </div>

                            {completed ? (
                              <div className="mt-3 flex items-center gap-3">
                                <span className="text-sm font-medium">
                                  Acertos:{' '}
                                  <span className="text-primary font-bold">
                                    {sim.correctCount ?? 0}/{sim.totalQuestions}
                                  </span>
                                  {percent !== null ? ` • ${percent}%` : ''}
                                </span>
                                <Progress value={(sim.score ?? 0) * 100} className="w-28 h-2" />
                              </div>
                            ) : null}
                          </div>

                          <Button
                            disabled={loading}
                            className={cn(
                              !completed
                                ? inProgress
                                  ? 'gradient-primary text-primary-foreground'
                                  : 'gradient-success text-primary-foreground'
                                : 'bg-muted/50',
                            )}
                            onClick={() => (completed ? void viewResult(sim) : void startOrResume(sim))}
                          >
                            {!completed ? (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                {inProgress ? 'Continuar' : 'Iniciar'}
                              </>
                            ) : (
                              <>
                                <BarChart3 className="w-4 h-4 mr-2" /> Ver resultado
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {loading && !completedHistory.length ? (
                <div className="rounded-xl p-5 gradient-card border border-border/50 shadow-card">
                  <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                </div>
              ) : null}

              {!loading && !completedHistory.length ? (
                <div className="rounded-xl p-5 gradient-card border border-border/50 shadow-card">
                  <p className="text-sm text-muted-foreground">Você ainda não concluiu nenhum simulado.</p>
                </div>
              ) : null}

              {completedHistory.map((h) => (
                <div
                  key={h.attemptId}
                  className="rounded-xl p-5 gradient-card border border-border/50 shadow-card flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-display font-semibold">{h.title}</h3>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <p>
                        Início: <span className="text-foreground/90">{formatDateTime(h.startedAt)}</span>
                      </p>
                      <p>
                        Término: <span className="text-foreground/90">{formatDateTime(h.completedAt)}</span>
                      </p>
                      <p>
                        Acertos: <span className="text-primary font-semibold">{h.correctCount}/{h.totalCount}</span> • {Math.round(h.score * 100)}% • Duração:{' '}
                        {formatHms(h.durationSeconds)}
                      </p>
                      {h.part === 'DAY1' && h.languageChoice ? (
                        <p>
                          Idioma: <span className="text-foreground/90">{h.languageChoice}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    disabled={loading}
                    className="bg-muted/50"
                    onClick={() => {
                      if (h.part === 'DAY1' && h.languageChoice) {
                        const lang = h.languageChoice === 'espanhol' ? 'espanhol' : 'ingles';
                        setLanguageChoiceBySimuladoId((prev) => ({ ...prev, [h.simuladoId]: lang }));
                      }
                      void viewResultByAttemptId(h.attemptId, h.simuladoId);
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" /> Ver resultado
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {view === 'attempt' && attempt && attemptQuestionData && attemptQuestionId ? (
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold">{attempt.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Respondidas: {answeredCount}/{attempt.progress.totalCount} • Tempo restante: {formatHms(timeRemainingSeconds)}
              </p>
              <div className="mt-2">
                <Progress value={attempt.progress.totalCount > 0 ? (answeredCount / attempt.progress.totalCount) * 100 : 0} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-border/50"
                onClick={() => void handlePauseToggle()}
                disabled={loading}
              >
                {isPaused ? 'Retomar' : 'Pausar'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-border/50" disabled={loading}>
                    Refazer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Refazer simulado?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso vai zerar suas respostas, desmarcar todas as questões e reiniciar o timer desta prova.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void handleRestart()}>Refazer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                className="border-border/50"
                onClick={() => {
                  setView('list');
                  setAttempt(null);
                  setResult(null);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="gradient-primary text-primary-foreground" disabled={loading}>
                    Finalizar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Finalizar simulado?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você respondeu {answeredCount} de {attempt.progress.totalCount} questões. Ao finalizar, você verá a correção (verde/vermelho) e o gabarito.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit}>Finalizar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Navegação por disciplina */}
          {attemptNavGroups ? (
            <div className="space-y-3">
              {(['linguagens', 'humanas', 'natureza', 'matematica'] as const).map((area) => {
                const items = attemptNavGroups[area];
                if (!items.length) return null;

                return (
                  <div key={area} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', areaBadgeClass(area))}>
                        {areaLabel(area)}
                      </span>
                      <span className="text-xs text-muted-foreground">{items.length} questões</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {items.map((it) => {
                        const answered = Boolean(localAnswers[it.enemQuestionId]);
                        const active = it.idx === currentIdx;
                        return (
                          <button
                            key={it.enemQuestionId}
                            onClick={() => setCurrentIdx(it.idx)}
                            className={cn(
                              'w-9 h-9 rounded-xl border text-xs font-semibold transition-all',
                              active && 'border-primary bg-primary/10',
                              !active && answered && 'border-primary/30 bg-primary/10',
                              !active && !answered && 'border-border/50 bg-muted/20',
                            )}
                          >
                            {it.idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Questão */}
          <div className="space-y-4 relative">
            {isPaused ? (
              <div className="absolute inset-0 z-10 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="max-w-md text-center space-y-2">
                  <p className="font-display font-semibold">O tempo da prova foi pausado</p>
                  <p className="text-sm text-muted-foreground">
                    Recomendamos que você não pesquise a questão por fora — afinal, é um simulado.
                    Quando quiser continuar, a gente te espera de braços abertos.
                  </p>
                  <Button className="gradient-primary text-primary-foreground" onClick={() => void handlePauseToggle()} disabled={loading}>
                    Retomar
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    'px-2 py-1 rounded-full font-medium',
                    areaBadgeClass(areaFromDiscipline(attemptQuestionData.discipline)),
                  )}
                >
                  {attemptQuestionData.discipline ?? areaLabel(areaFromDiscipline(attemptQuestionData.discipline))}
                </span>
                <span className="text-muted-foreground">Questão {currentIdx + 1}/{attempt.progress.totalCount}</span>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formatHms(timeRemainingSeconds)}
              </span>
            </div>

            {attemptQuestionData.context ? <Md value={attemptQuestionData.context} /> : null}
            <Md value={attemptQuestionData.title} />
            {attemptQuestionData.alternativesIntroduction ? <Md value={attemptQuestionData.alternativesIntroduction} /> : null}

            <div className="space-y-3">
              {(attemptQuestionData.alternatives ?? []).map((alt) => {
                const picked = localAnswers[attemptQuestionId] === alt.letter;
                return (
                  <button
                    key={alt.letter}
                    onClick={() => void handlePick(attemptQuestionId, alt.letter)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3',
                      picked && 'border-primary bg-primary/10',
                      !picked && 'border-border/50 hover:border-primary/30 bg-muted/20',
                    )}
                    disabled={savingAnswer || loading || isPaused}
                  >
                    <span
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                        picked ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {alt.letter}
                    </span>
                    <div className="text-sm mt-1">
                      <Md value={alt.text ?? (alt.file ? `![](${alt.file})` : '—')} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                className="border-border/50"
                onClick={() => setCurrentIdx((v) => Math.max(0, v - 1))}
                disabled={currentIdx === 0}
              >
                Anterior
              </Button>

              <Button
                variant="outline"
                className="border-border/50"
                onClick={() => setCurrentIdx((v) => Math.min(attempt.progress.totalCount - 1, v + 1))}
                disabled={currentIdx >= attempt.progress.totalCount - 1}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {view === 'result' && result && resultQuestion ? (
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold">Resultado — {result.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Acertos: {result.correctCount}/{result.totalCount} • {Math.round(result.score * 100)}% • Duração: {formatHms(result.durationSeconds)}
              </p>
              <div className="mt-2">
                <Progress value={result.score * 100} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="gradient-success text-primary-foreground"
                onClick={() => void handleRedoFromResult()}
                disabled={loading || !resultSimuladoId}
              >
                <Play className="w-4 h-4 mr-2" /> Refazer
              </Button>
              <Button
                variant="outline"
                className="border-border/50"
                onClick={() => {
                  setView('list');
                  setResult(null);
                  setAttempt(null);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            </div>
          </div>

          {/* Navegação por disciplina */}
          {resultNavGroups ? (
            <div className="space-y-3">
              {(['linguagens', 'humanas', 'natureza', 'matematica'] as const).map((area) => {
                const items = resultNavGroups[area];
                if (!items.length) return null;

                return (
                  <div key={area} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', areaBadgeClass(area))}>
                        {areaLabel(area)}
                      </span>
                      <span className="text-xs text-muted-foreground">{items.length} questões</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {items.map((it) => {
                        const active = it.idx === currentIdx;
                        return (
                          <button
                            key={it.enemQuestionId}
                            onClick={() => setCurrentIdx(it.idx)}
                            className={cn(
                              'w-9 h-9 rounded-xl border text-xs font-semibold transition-all',
                              active && 'border-primary bg-primary/10',
                              !active && it.isCorrect && 'border-success/30 bg-success/10',
                              !active && !it.isCorrect && 'border-destructive/30 bg-destructive/10',
                            )}
                          >
                            {it.idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Questão corrigida */}
          <div className={cn('p-4 rounded-xl border', resultQuestion.isCorrect ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30')}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">Questão {currentIdx + 1}</p>
              {resultQuestion.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
            </div>

            {resultQuestion.question.context ? <Md value={resultQuestion.question.context} /> : null}
            <div className="mt-2">
              <Md value={resultQuestion.question.title} />
            </div>

            {resultQuestion.question.alternativesIntroduction ? (
              <div className="mt-2">
                <Md value={resultQuestion.question.alternativesIntroduction} />
              </div>
            ) : null}

            <div className="mt-3 space-y-2">
              {resultQuestion.question.alternatives.map((alt) => {
                const selected = resultQuestion.selectedAlternative === alt.letter;
                const correct = resultQuestion.correctAlternative === alt.letter;

                return (
                  <div
                    key={alt.letter}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border flex items-start gap-3',
                      correct && 'border-success bg-success/10',
                      selected && !correct && 'border-destructive bg-destructive/10',
                      !selected && !correct && 'border-border/50 bg-muted/20',
                    )}
                  >
                    <span
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                        correct && 'gradient-success text-primary-foreground',
                        selected && !correct && 'bg-destructive text-destructive-foreground',
                        !selected && !correct && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {correct ? <CheckCircle2 className="w-4 h-4" /> : alt.letter}
                    </span>
                    <div className="text-sm mt-0.5">
                      <Md value={alt.text ?? (alt.file ? `![](${alt.file})` : '—')} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                className="border-border/50"
                onClick={() => setCurrentIdx((v) => Math.max(0, v - 1))}
                disabled={currentIdx === 0}
              >
                Anterior
              </Button>

              <Button
                variant="outline"
                className="border-border/50"
                onClick={() => setCurrentIdx((v) => Math.min(result.totalCount - 1, v + 1))}
                disabled={currentIdx >= result.totalCount - 1}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
