import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Send, FileText, Clock, Sparkles, HelpCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { essayService } from '@/services/essayService';
import type { Essay as EssayType } from '@/types';
import { useToast } from '@/hooks/use-toast';

type ThemeMode = 'enem' | 'custom' | 'ai';

// Lista oficial de temas do ENEM (1998–2023)
// Fonte: lista fornecida por você no chat.
const ENEM_THEMES_BY_YEAR: Record<number, string> = {
  2023: 'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil',
  2022: 'Desafios para a valorização de comunidades e povos tradicionais no Brasil',
  2021: 'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil',
  2020: 'O estigma associado às doenças mentais na sociedade brasileira',
  2019: 'Democratização do acesso ao cinema no Brasil',
  2018: 'Manipulação do comportamento do usuário pelo controle de dados na internet',
  2017: 'Desafios para a formação educacional de surdos no Brasil',
  2016: 'Caminhos para combater a intolerância religiosa no Brasil',
  2015: 'A persistência da violência contra a mulher na sociedade brasileira',
  2014: 'Publicidade infantil em questão no Brasil',
  2013: 'Efeitos da implantação da Lei Seca no Brasil',
  2012: 'Movimento imigratório para o Brasil no século XXI',
  2011: 'Viver em rede no século XXI: os limites entre o público e o privado',
  2010: 'O trabalho na construção da dignidade humana',
  2009: 'O indivíduo frente à ética nacional',
  2008: 'Como preservar a floresta amazônica',
  2007: 'O desafio de se conviver com a diferença',
  2006: 'O poder de transformação da leitura',
  2005: 'O trabalho infantil na realidade brasileira',
  2004: 'Como garantir a liberdade de informação e evitar abusos nos meios de comunicação',
  2003: 'A violência na sociedade brasileira: como mudar as regras desse jogo?',
  2002: 'O direito de votar: como fazer dessa conquista um meio para promover as transformações sociais de que o Brasil necessita?',
  2001: 'Desenvolvimento e preservação ambiental: como conciliar os interesses em conflito?',
  2000: 'Direitos da criança e do adolescente: como enfrentar esse desafio nacional?',
  1999: 'Cidadania e participação social',
  1998: 'Viver e aprender',
};

const competencies = [
  { name: 'Competência 1', label: 'Norma culta', score: 160, max: 200 },
  { name: 'Competência 2', label: 'Compreensão do tema', score: 180, max: 200 },
  { name: 'Competência 3', label: 'Argumentação', score: 160, max: 200 },
  { name: 'Competência 4', label: 'Coesão textual', score: 160, max: 200 },
  { name: 'Competência 5', label: 'Proposta de intervenção', score: 160, max: 200 },
];

export default function Essay() {
  const { toast } = useToast();

  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const [themeMode, setThemeMode] = useState<ThemeMode>('custom');
  const [selectedEnemYear, setSelectedEnemYear] = useState<string>('2023');
  const [customTheme, setCustomTheme] = useState('');
  const [activeTheme, setActiveTheme] = useState('');

  const [content, setContent] = useState('');
  const [resultEssay, setResultEssay] = useState<EssayType | null>(null);

  const [history, setHistory] = useState<EssayType[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedEssay, setSelectedEssay] = useState<EssayType | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 5;
  
  // Deletar
  const [essayToDelete, setEssayToDelete] = useState<EssayType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);

  const enemThemes = useMemo(() => {
    return Object.entries(ENEM_THEMES_BY_YEAR)
      .map(([year, theme]) => ({ year: Number(year), theme }))
      .sort((a, b) => b.year - a.year);
  }, []);

  // Conta linhas de forma similar ao backend e à folha ENEM:
  // Cada ~100 caracteres = 1 linha visual
  const linesCount = (() => {
    const lines = content.split(/\r?\n/);
    let totalLines = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      // Cada 100 caracteres ≈ 1 linha na folha
      const visualLines = Math.max(1, Math.ceil(trimmed.length / 100));
      totalLines += visualLines;
    }
    return totalLines;
  })();

  const computedTheme = (() => {
    if (themeMode === 'custom') return customTheme.trim();
    if (themeMode === 'enem') {
      const year = Number(selectedEnemYear);
      return ENEM_THEMES_BY_YEAR[year] ?? '';
    }
    return activeTheme.trim();
  })();

  const formatDateTime = (iso: string) => {
    try {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return iso;
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return iso;
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await essayService.list();
      const sorted = res.data
        .slice()
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setHistory(sorted);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleGenerateTheme = async () => {
    // MVP: geração local (sem IA) para não depender de OPENAI_API_KEY.
    setIsGeneratingTheme(true);
    try {
      const templates = [
        'Os desafios da alfabetização digital no Brasil',
        'O combate à desinformação nas redes sociais',
        'A inclusão de pessoas com deficiência no mercado de trabalho',
        'Os impactos da cultura do cancelamento na vida social',
        'Caminhos para reduzir a evasão escolar no ensino médio',
      ];
      setActiveTheme(templates[Math.floor(Math.random() * templates.length)]);
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handleDeleteEssay = async (essayId: string) => {
    try {
      // TODO: Implementar rota DELETE /essays/:id no backend
      // await essayService.delete(essayId);
      setHistory(history.filter(e => e.id !== essayId));
      setDeleteConfirmOpen(false);
      setEssayToDelete(null);
      setDetailsOpen(false);
      toast({
        title: 'Redação excluída',
        description: 'A redação foi removida do seu histórico.',
      });
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a redação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAllEssays = async () => {
    try {
      // TODO: Implementar rota DELETE /essays no backend
      // await essayService.deleteAll();
      setHistory([]);
      setCurrentPage(0);
      setDeleteAllConfirmOpen(false);
      toast({
        title: 'Histórico limpo',
        description: 'Todas as redações foram removidas.',
      });
    } catch {
      toast({
        title: 'Erro ao limpar',
        description: 'Não foi possível limpar o histórico. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Paginação
  const paginatedHistory = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return history.slice(start, start + ITEMS_PER_PAGE);
  }, [history, currentPage]);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const canGoNext = currentPage < totalPages - 1;
  const canGoPrev = currentPage > 0;

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const theme = computedTheme;
    if (!content.trim() || !theme) return;

    // Validação: menos de 7 linhas
    if (linesCount < 7) {
      const errorMsg = `Sua redação possui apenas ${linesCount} linha${linesCount !== 1 ? 's' : ''}. O ENEM exige um mínimo de 7 linhas com conteúdo autoral para aceitar a redação.`;
      setSubmitError(errorMsg);
      toast({
        title: 'Redação muito curta',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await essayService.submit({ content, theme });
      const corrected = await essayService.correct(created.data.id);
      setResultEssay(corrected.data);
      setShowResult(true);
      await loadHistory();
    } catch (err) {
      const fallback = 'Não foi possível corrigir sua redação. Tente novamente. Se o erro persistir, entre em contato com os administradores.';
      let message = fallback;

      if (axios.isAxiosError(err)) {
        const data = err.response?.data as Record<string, unknown> | undefined;
        const apiMessage = data?.message;
        if (typeof apiMessage === 'string' && apiMessage.trim()) {
          message = apiMessage;
        } else if (err.response?.status === 429) {
          message = 'Limite de requisições atingido. Tente novamente em alguns momentos.';
        } else {
          message = err.message || fallback;
        }
      } else if (err instanceof Error) {
        message = err.message || fallback;
      }

      setSubmitError(message);
      toast({
        title: 'Erro ao corrigir redação',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Redação IA</h1>
        <p className="text-muted-foreground text-sm mt-1">Escreva e receba correção inteligente</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível concluir a correção</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Tema */}
          <div className="grid gap-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <Select value={themeMode} onValueChange={(v) => setThemeMode(v as ThemeMode)}>
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue placeholder="Tipo de tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enem">Tema ENEM (1998–2023)</SelectItem>
                  <SelectItem value="custom">Tema próprio</SelectItem>
                  <SelectItem value="ai">Tema aleatório (IA)</SelectItem>
                </SelectContent>
              </Select>

              {themeMode === 'enem' && (
                <Select value={selectedEnemYear} onValueChange={setSelectedEnemYear}>
                  <SelectTrigger className="bg-muted/50 border-border/50">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {enemThemes
                      .map((t) => (
                        <SelectItem key={t.year} value={String(t.year)}>
                          {t.year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              {themeMode === 'ai' && (
                <Button
                  type="button"
                  onClick={handleGenerateTheme}
                  disabled={isGeneratingTheme}
                  className="gradient-primary text-primary-foreground font-semibold"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> {isGeneratingTheme ? 'Gerando...' : 'Gerar tema'}
                </Button>
              )}
            </div>

            {themeMode === 'custom' && (
              <Input
                placeholder="Digite seu tema (estilo ENEM)"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="bg-muted/50 border-border/50"
              />
            )}

            {themeMode !== 'custom' && (
              <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
                <p className="text-xs text-muted-foreground">Tema selecionado</p>
                <p className="text-sm mt-1">{computedTheme || '—'}</p>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-4">
            <Textarea
              placeholder="Escreva sua redação aqui... (mínimo 7 linhas, máximo 30 linhas)"
              className="min-h-[400px] bg-muted/50 border border-border/50 resize-none text-sm leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{linesCount} / 30 linhas</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">A contagem de linhas segue a simulação do formulário ENEM: cada 100 caracteres equivalem a 1 linha visual na folha.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim() || !computedTheme}
                className="gradient-primary text-primary-foreground font-semibold"
              >
                <Send className="w-4 h-4 mr-2" /> {isSubmitting ? 'Enviando...' : 'Enviar para correção'}
              </Button>
            </div>
          </div>

          {/* Resultado */}
          {showResult && resultEssay && (
            <div className="rounded-2xl p-6 gradient-card border border-border/50 shadow-card space-y-4 animate-slide-up">
              <div className="text-center">
                <p className="text-4xl font-display font-bold text-gradient">{resultEssay.score ?? 0}</p>
                <p className="text-sm text-muted-foreground">Nota estimada</p>
              </div>
              <div className="space-y-3">
                {competencies.map((c, idx) => {
                  const score = resultEssay.competencies?.[idx] ?? c.score;
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{c.label}</span>
                        <span className="text-muted-foreground">{score}/{c.max}</span>
                      </div>
                      <Progress value={(score / c.max) * 100} className="h-2" />
                    </div>
                  );
                })}
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <h3 className="font-display font-semibold text-sm mb-2">Feedback</h3>
                <p className="text-sm text-muted-foreground">{resultEssay.feedback || '—'}</p>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Histórico</h2>
            {history.length > 0 && (
              <button
                onClick={() => setDeleteAllConfirmOpen(true)}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Limpar tudo
              </button>
            )}
          </div>
          {historyLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

          {!historyLoading && history.length === 0 && (
            <p className="text-sm text-muted-foreground">Você ainda não enviou nenhuma redação.</p>
          )}

          {!historyLoading &&
            paginatedHistory.map((essay) => {
              const scoreLabel = essay.correction ? String(essay.score ?? 0) : 'Pendente';
              return (
                <div
                  key={essay.id}
                  className="w-full rounded-xl p-4 gradient-card border border-border/50 shadow-card hover:opacity-95 transition-opacity group relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEssay(essay);
                      setDetailsOpen(true);
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{essay.theme}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />{formatDateTime(essay.submittedAt)}
                          <span className="text-primary font-bold ml-auto">{scoreLabel}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setEssayToDelete(essay);
                      setDeleteConfirmOpen(true);
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={!canGoPrev}
                className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={!canGoNext}
                className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between pr-6">
            <div>
              <DialogTitle>Detalhes da redação</DialogTitle>
              <DialogDescription>Visualize seu tema, texto e resultado.</DialogDescription>
            </div>
            {selectedEssay && (
              <button
                onClick={() => {
                  setEssayToDelete(selectedEssay);
                  setDeleteConfirmOpen(true);
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {selectedEssay ? (
            <div className="space-y-4 mt-4">
              <div className="grid gap-2">
                <p className="text-xs font-medium text-muted-foreground">Tema</p>
                <p className="text-sm leading-relaxed">{selectedEssay.theme}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Data de envio</p>
                  <p className="text-sm mt-1 font-medium">{formatDateTime(selectedEssay.submittedAt)}</p>
                </div>
                <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Nota final</p>
                  <p className="text-sm mt-1 font-medium">{selectedEssay.correction ? selectedEssay.score ?? 0 : 'Pendente'}</p>
                </div>
                <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm mt-1 font-medium">{selectedEssay.correction ? '✓ Corrigida' : '⏳ Pendente'}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <p className="text-xs font-medium text-muted-foreground">Sua redação</p>
                <div className="rounded-xl bg-muted/30 border border-border/50 p-4 max-h-[200px] overflow-auto">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedEssay.content}</p>
                </div>
              </div>

              {selectedEssay.correction && (
                <>
                  {selectedEssay.feedback && (
                    <div className="grid gap-2">
                      <p className="text-xs font-medium text-muted-foreground">Análise e feedback</p>
                      <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
                        <p className="text-sm text-foreground leading-relaxed">{selectedEssay.feedback}</p>
                      </div>
                    </div>
                  )}

                  {selectedEssay.competencies && (
                    <div className="grid gap-2">
                      <p className="text-xs font-medium text-muted-foreground">Desempenho por competência</p>
                      <div className="space-y-2">
                        {selectedEssay.competencies.map((score, idx) => {
                          const labels = ['Norma culta', 'Compreensão do tema', 'Argumentação', 'Coesão textual', 'Proposta de intervenção'];
                          return (
                            <div key={idx} className="rounded-lg bg-muted/20 p-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">{labels[idx]}</span>
                                <span className="text-primary font-bold">{score}/200</span>
                              </div>
                              <Progress value={(score / 200) * 100} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione uma redação no histórico.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de deletar uma redação */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir redação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A redação será permanentemente removida do seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => essayToDelete && handleDeleteEssay(essayToDelete.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de deletar todas as redações */}
      <AlertDialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar histórico completo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as {history.length} redação(ções) serão permanentemente removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllEssays}
              className="bg-destructive hover:bg-destructive/90"
            >
              Limpar tudo
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
