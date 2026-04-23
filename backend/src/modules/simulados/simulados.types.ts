export type ENEMArea = "linguagens" | "humanas" | "natureza" | "matematica";

export type SimuladoStatus = "pending" | "in_progress" | "completed";

export type SimuladoExamPartDto = "DAY1" | "DAY2";

export type SimuladoDisciplineCountsDto = {
  linguagens: number;
  humanas: number;
  natureza: number;
  matematica: number;
};

export type SimuladoSummaryDto = {
  // ID de prova (por enquanto, o ano em string).
  id: string;
  year: number;
  part: SimuladoExamPartDto;
  title: string;

  totalQuestions: number;
  timeLimitSeconds: number;

  // Status baseado na última tentativa do usuário para este ano.
  status: SimuladoStatus;
  attemptId?: string | null;

  // Para DAY1 (linguagens): idioma da tentativa em andamento/última tentativa.
  languageChoice?: string | null;

  // Quando completed, esses campos ajudam a UI.
  correctCount?: number;
  score?: number; // 0..1
  completedAt?: string | null;

  disciplineCounts: SimuladoDisciplineCountsDto;
};

export type SimuladoQuestionAlternativePublicDto = {
  letter: string;
  text: string | null;
  file: string | null;
};

export type SimuladoQuestionPublicDto = {
  year: number;
  index: number;
  title: string;
  discipline: string | null;
  language: string | null;
  context: string | null;
  files: any[];
  alternativesIntroduction: string | null;
  alternatives: SimuladoQuestionAlternativePublicDto[];
};

export type SimuladoQuestionWithAnswerDto = SimuladoQuestionPublicDto & {
  correctAlternative: string;
};

export type SimuladoAttemptQuestionDto = {
  order: number;
  enemQuestionId: string;
  question: SimuladoQuestionPublicDto;
};

export type SimuladoAttemptDto = {
  attemptId: string;
  year: number;
  part: SimuladoExamPartDto;
  languageChoice: string | null;
  title: string;
  timeLimitSeconds: number;
  startedAt: string;

  pausedAt: string | null;
  pausedSeconds: number;

  progress: {
    answeredCount: number;
    totalCount: number;
  };

  questions: SimuladoAttemptQuestionDto[];
  answers: Array<{ enemQuestionId: string; selectedAlternative: string; flagged: boolean }>;
};

export type SimuladoSaveAnswerResponseDto = {
  attemptId: string;
  enemQuestionId: string;
  selectedAlternative: string;
  flagged: boolean;
  progress: {
    answeredCount: number;
    totalCount: number;
  };
};

export type SimuladoResultDto = {
  attemptId: string;
  year: number;
  title: string;

  startedAt: string;
  completedAt: string;
  durationSeconds: number;

  correctCount: number;
  totalCount: number;
  score: number; // 0..1

  results: Array<{
    enemQuestionId: string;
    selectedAlternative: string | null;
    correctAlternative: string;
    isCorrect: boolean;
    question: SimuladoQuestionWithAnswerDto;
  }>;
};

// Histórico de tentativas concluídas (para a aba "Concluídos")
export type SimuladoCompletedAttemptHistoryItemDto = {
  attemptId: string;
  simuladoId: string; // YYYY-d1 | YYYY-d2
  year: number;
  part: SimuladoExamPartDto;
  title: string;

  languageChoice: string | null;

  startedAt: string;
  completedAt: string;
  durationSeconds: number;

  correctCount: number;
  totalCount: number;
  score: number; // 0..1
};
