import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, ChevronRight, Lock, Map as MapIcon, Sparkles, ArrowLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { journeyService } from '@/services/journeyService';
import type { FinalizeNodeResponse, Journey, JourneyNodeDetails, JourneyQuestionPublic, JourneyQuestionWithAnswer } from '@/types';
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Questions() {
  type Area = 'Linguagens' | 'Ciências Humanas' | 'Ciências da Natureza' | 'Matemática';
  type LanguageChoice = 'ingles' | 'espanhol';

  const [mode, setMode] = useState<'loading' | 'select' | 'map' | 'quiz'>('loading');

  const [selectedArea, setSelectedArea] = useState<Area>('Linguagens');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageChoice>('ingles');

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [nodeDetails, setNodeDetails] = useState<JourneyNodeDetails | null>(null);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [finalizeResult, setFinalizeResult] = useState<FinalizeNodeResponse | null>(null);

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

  // Carrega jornada existente (se houver)
  useEffect(() => {
    let mounted = true;

    async function boot() {
      setLoading(true);
      setError(null);

      try {
        const journeysRes = await journeyService.listJourneys().catch(() => null);

        if (!mounted) return;

        const summaries = journeysRes?.data ?? [];
        if (summaries.length) {
          const j = await journeyService.getJourney(summaries[0].id);
          if (!mounted) return;
          setJourney(j.data);
          setMode('map');
        } else {
          setMode('select');
        }
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : 'Falha ao carregar a Jornada';
        setError(message);
        setMode('select');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void boot();
    return () => {
      mounted = false;
    };
  }, []);

  const activeNode = useMemo(() => {
    if (!journey) return null;
    if (activeNodeId) return journey.nodes.find((n) => n.id === activeNodeId) ?? null;
    return journey.nodes.find((n) => n.status === 'AVAILABLE') ?? null;
  }, [journey, activeNodeId]);

  const quizNode = nodeDetails?.node ?? null;
  const quizQuestions = (quizNode?.questions ?? [])
    .map((q) => q.question)
    .filter(Boolean) as Array<JourneyQuestionPublic | JourneyQuestionWithAnswer>;
  const quizQuestionIds = (quizNode?.questions ?? []).map((q) => q.enemQuestionId);

  const currentQuestion = quizQuestions[currentIdx] ?? null;
  const currentQuestionId = quizQuestionIds[currentIdx] ?? null;

  const answeredCount = Object.keys(localAnswers).length;
  const totalQuestions = quizQuestions.length;
  const isCompletedView = Boolean(finalizeResult?.attempt.completedAt || nodeDetails?.attempt?.completedAt);

  useEffect(() => {
    // Reset quiz state ao mudar de node/mode
    setCurrentIdx(0);
    setNodeDetails(null);
    setLocalAnswers({});
    setFinalizeResult(null);
  }, [activeNodeId, mode]);

  const startJourney = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await journeyService.createJourney({
        area: selectedArea,
        ...(selectedArea === 'Linguagens' ? { language: selectedLanguage } : {}),
      });
      setJourney(res.data);
      setMode('map');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao criar a Jornada';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openNode = async (nodeId: string) => {
    setActiveNodeId(nodeId);
    setMode('quiz');

    setLoading(true);
    setError(null);
    try {
      const details = await journeyService.getNodeDetails(nodeId);
      setNodeDetails(details.data);

      const fromServer: Record<string, string> = {};
      for (const a of details.data.attempt?.answers ?? []) {
        fromServer[a.enemQuestionId] = a.selectedAlternative;
      }
      setLocalAnswers(fromServer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar o card';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePick = async (enemQuestionId: string, letter: string) => {
    if (!activeNodeId) return;
    if (savingAnswer) return;

    setSavingAnswer(true);
    setError(null);
    const next = letter.toUpperCase();

    setLocalAnswers((prev) => ({ ...prev, [enemQuestionId]: next }));

    try {
      await journeyService.saveAnswer(activeNodeId, {
        enemQuestionId,
        selectedAlternative: next,
      });

      const details = await journeyService.getNodeDetails(activeNodeId);
      setNodeDetails(details.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar resposta';
      setError(message);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleFinalize = async () => {
    if (!activeNodeId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await journeyService.finalizeNode(activeNodeId);
      setFinalizeResult(res.data);

      if (journey) {
        const fresh = await journeyService.getJourney(journey.id);
        setJourney(fresh.data);
      }

      const details = await journeyService.getNodeDetails(activeNodeId);
      setNodeDetails(details.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao finalizar o questionário';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!activeNodeId) return;

    setLoading(true);
    setError(null);
    try {
      await journeyService.retryNode(activeNodeId);
      setFinalizeResult(null);
      setCurrentIdx(0);

      const details = await journeyService.getNodeDetails(activeNodeId);
      setNodeDetails(details.data);

      const fromServer: Record<string, string> = {};
      for (const a of details.data.attempt?.answers ?? []) {
        fromServer[a.enemQuestionId] = a.selectedAlternative;
      }
      setLocalAnswers(fromServer);

      if (journey) {
        const fresh = await journeyService.getJourney(journey.id);
        setJourney(fresh.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao reiniciar o card';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const historyResults = useMemo(() => {
    if (!nodeDetails?.attempt?.completedAt) return null;

    const answerMap = new Map((nodeDetails.attempt?.answers ?? []).map((a) => [a.enemQuestionId, a] as const));
    const questions = nodeDetails.node.questions ?? [];

    return questions
      .map((q) => {
        const question = q.question as JourneyQuestionWithAnswer | undefined;
        const a = answerMap.get(q.enemQuestionId);
        if (!question || !('correctAlternative' in question) || !a) return null;

        const selectedAlternative = a.selectedAlternative;
        const correctAlternative = question.correctAlternative;
        const isCorrect = a.isCorrect ?? selectedAlternative === correctAlternative;

        return {
          enemQuestionId: q.enemQuestionId,
          selectedAlternative,
          correctAlternative,
          isCorrect,
          question,
        };
      })
      .filter(Boolean);
  }, [nodeDetails]);

  const resultsForDisplay = finalizeResult?.results ?? historyResults ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Jornada</h1>
        <p className="text-muted-foreground text-sm mt-1">Progrida por cards (5 questões) e desbloqueie níveis</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {mode === 'loading' ? (
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card">
          <p className="text-sm text-muted-foreground">Carregando Jornada...</p>
        </div>
      ) : null}

      {mode === 'select' ? (
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Comece sua trilha</h2>
          </div>

          <p className="text-sm text-muted-foreground">
            Escolha uma área e uma disciplina. Cada card tem 5 questões e desbloqueia o próximo ao acertar pelo menos 3.
          </p>

          <div className="flex flex-wrap gap-3">
            <Select value={selectedArea} onValueChange={(v) => setSelectedArea(v as Area)}>
              <SelectTrigger className="w-56 bg-muted/50 border-border/50">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                {(['Linguagens', 'Ciências Humanas', 'Ciências da Natureza', 'Matemática'] as Area[]).map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedArea === 'Linguagens' ? (
              <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as LanguageChoice)}>
                <SelectTrigger className="min-w-56 bg-muted/50 border-border/50">
                  <SelectValue placeholder="Idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingles">Inglês</SelectItem>
                  <SelectItem value="espanhol">Espanhol</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={startJourney}
              disabled={loading || (selectedArea === 'Linguagens' && !selectedLanguage)}
              className="gradient-primary text-primary-foreground font-semibold"
            >
              Começar Jornada <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      ) : null}

      {mode === 'map' && journey ? (
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold">
                  {journey.area}
                  {journey.area === 'Linguagens' && journey.language ? ` • ${journey.language}` : ''}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Cards concluídos: {journey.progress.completedNodes}/{journey.progress.totalNodes} •{' '}
                <span className="inline-flex items-center gap-1">
                  Precisão: {Math.round((journey.progress.accuracy ?? 0) * 100)}%
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Como calculamos a precisão?"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Como a precisão é calculada?</DialogTitle>
                        <DialogDescription>
                          A precisão representa sua taxa de acertos na Jornada.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3 text-sm">
                        <p>
                          Usamos a fórmula: <strong>precisão = acertos / questões respondidas</strong>.
                        </p>
                        <p>
                          Para não “punir” quem refaz um card para melhorar, consideramos <strong>apenas a última tentativa finalizada de cada card</strong>.
                          Depois somamos os acertos e o total de questões dessas últimas tentativas.
                        </p>
                        <p className="text-muted-foreground">
                          Exemplo: se no Card 1 você fez 4/5 e no Card 2 fez 3/5 (na última tentativa de cada um), a precisão será (4+3)/(5+5) = 70%.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              className="border-border/50"
              onClick={() => setMode('select')}
            >
              Trocar disciplina
            </Button>
          </div>

          <div className="space-y-3">
            {journey.nodes.map((node) => {
              const locked = node.status === 'LOCKED';
              const available = node.status === 'AVAILABLE';
              const completed = node.status === 'COMPLETED';

              return (
                <div
                  key={node.id}
                  className={cn(
                    'w-full p-4 rounded-xl border flex items-center justify-between gap-3 transition-all',
                    locked && 'bg-muted/20 border-border/40 opacity-70',
                    available && 'bg-primary/10 border-primary/40',
                    completed && 'bg-success/10 border-success/30',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center font-bold',
                        locked && 'bg-muted text-muted-foreground',
                        available && 'gradient-primary text-primary-foreground animate-pulse',
                        completed && 'gradient-success text-primary-foreground',
                      )}
                    >
                      {locked ? <Lock className="w-4 h-4" /> : completed ? <CheckCircle2 className="w-4 h-4" /> : node.order}
                    </div>

                    <div>
                      <p className="text-sm font-medium">Card {node.order}</p>
                      <p className="text-xs text-muted-foreground">
                        5 questões • precisa {node.minCorrect} acertos • {node.xpPerCorrect} XP/acerto
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {completed ? (
                      <span className="text-xs text-muted-foreground">Concluído</span>
                    ) : null}
                    <Button
                      onClick={() => openNode(node.id)}
                      disabled={locked}
                      className={cn(available ? 'gradient-primary text-primary-foreground' : '')}
                      variant={available ? 'default' : 'outline'}
                    >
                      {locked ? 'Bloqueado' : available ? 'Iniciar' : 'Ver'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {mode === 'quiz' && journey && activeNode ? (
        <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold">Card {activeNode.order}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {journey.area} • {journey.discipline} • ENEM {journey.year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isCompletedView ? (
                <Button variant="outline" className="border-border/50" onClick={handleRetry} disabled={loading}>
                  Tentar de novo
                </Button>
              ) : null}
              <Button variant="outline" className="border-border/50" onClick={() => setMode('map')}>
                Voltar ao mapa
              </Button>
            </div>
          </div>

          {!nodeDetails || !currentQuestion || !currentQuestionId ? (
            <p className="text-sm text-muted-foreground">Carregando questões do card...</p>
          ) : isCompletedView ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-semibold text-sm">Resultado</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {finalizeResult
                        ? `Acertos: ${finalizeResult.attempt.correctCount}/${finalizeResult.attempt.totalCount}`
                        : nodeDetails.attempt
                          ? `Acertos: ${nodeDetails.attempt.correctCount ?? 0}/${nodeDetails.attempt.totalCount ?? 0}`
                          : ''}
                    </p>
                  </div>
                  {finalizeResult ? (
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {finalizeResult.attempt.passed ? 'Aprovado' : 'Reprovado'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        +{finalizeResult.rewards.xpEarned} XP • +{finalizeResult.rewards.coinsEarned} coins • streak: {finalizeResult.rewards.streak}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                {resultsForDisplay.map((r, idx) => (
                  <div
                    key={r.enemQuestionId}
                    className={cn(
                      'p-4 rounded-xl border',
                      r.isCorrect ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">Questão {idx + 1}</p>
                      {r.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>

                    {r.question.context ? <Md value={r.question.context} /> : null}
                    <div className="mt-2">
                      <Md value={r.question.title} />
                    </div>

                    {r.question.alternativesIntroduction ? (
                      <div className="mt-2">
                        <Md value={r.question.alternativesIntroduction} />
                      </div>
                    ) : null}

                    <div className="mt-3 space-y-2">
                      {r.question.alternatives.map((alt) => {
                        const selected = r.selectedAlternative === alt.letter;
                        const correct = r.correctAlternative === alt.letter;

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
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-border/50" onClick={() => setMode('map')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button onClick={handleRetry} className="gradient-primary text-primary-foreground" disabled={loading}>
                  Tentar de novo
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary font-medium">
                    {currentQuestion.discipline ?? journey.discipline}
                  </span>
                  <span className="text-muted-foreground">
                    Questão {currentIdx + 1}/{totalQuestions}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalQuestions }).map((_, idx) => {
                    const qId = quizQuestionIds[idx];
                    const answered = Boolean(qId && localAnswers[qId]);
                    const active = idx === currentIdx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentIdx(idx)}
                        className={cn(
                          'w-9 h-9 rounded-xl border text-sm font-semibold transition-all',
                          active && 'border-primary bg-primary/10',
                          !active && answered && 'border-success/30 bg-success/10',
                          !active && !answered && 'border-border/50 bg-muted/20',
                        )}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentQuestion.context ? <Md value={currentQuestion.context} /> : null}
              <div>
                <Md value={currentQuestion.title} />
              </div>
              {currentQuestion.alternativesIntroduction ? <Md value={currentQuestion.alternativesIntroduction} /> : null}

              <div className="space-y-3">
                {(currentQuestion.alternatives ?? []).map((alt) => {
                  const picked = localAnswers[currentQuestionId] === alt.letter;
                  return (
                    <button
                      key={alt.letter}
                      onClick={() => handlePick(currentQuestionId, alt.letter)}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3',
                        picked && 'border-primary bg-primary/10',
                        !picked && 'border-border/50 hover:border-primary/30 bg-muted/20',
                      )}
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
                  onClick={() => setCurrentIdx((v) => Math.min(totalQuestions - 1, v + 1))}
                  disabled={currentIdx >= totalQuestions - 1}
                >
                  Próxima
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Respondidas: {answeredCount}/{totalQuestions}
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={loading || savingAnswer || answeredCount < totalQuestions}
                      className="gradient-primary text-primary-foreground font-semibold"
                    >
                      Finalizar Questionário
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Finalizar questionário?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Depois de finalizar, o resultado será exibido (verde/vermelho) e o card ficará concluído.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleFinalize}>Finalizar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
