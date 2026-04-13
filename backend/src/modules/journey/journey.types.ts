export type JourneyNodeStatus = "LOCKED" | "AVAILABLE" | "COMPLETED";

export type JourneyQuestionAlternativePublicDto = {
  letter: string;
  text: string | null;
  file: string | null;
};

// Questão pública (sem gabarito) — usada durante a execução do questionário.
export type JourneyQuestionPublicDto = {
  year: number;
  index: number;
  title: string;
  discipline: string | null;
  language: string | null;
  context: string | null;
  // ENEM API usa um JSON de arquivos (em geral URLs). Mantemos flexível.
  files: any[];
  alternativesIntroduction: string | null;
  alternatives: JourneyQuestionAlternativePublicDto[];
};

// Questão com gabarito — usada apenas em resultados/histórico.
export type JourneyQuestionWithAnswerDto = JourneyQuestionPublicDto & {
  correctAlternative: string;
};

export type JourneyNodeQuestionDto = {
  id: string;
  order: number;
  enemQuestionId: string;
  // No card disponível: questão pública.
  // Em detalhes/histórico: pode vir com gabarito.
  question?: JourneyQuestionPublicDto | JourneyQuestionWithAnswerDto;
};

export type JourneyNodeDto = {
  id: string;
  order: number;
  status: JourneyNodeStatus;
  year: number;
  discipline: string;
  language?: string | null;

  minCorrect: number;
  totalQuestions: number;
  xpPerCorrect: number;
  coinsOnComplete: number;

  questions?: JourneyNodeQuestionDto[];

  // Última tentativa (resumo) — opcional para UI.
  lastAttempt?: {
    completedAt?: string | null;
    correctCount: number;
    totalCount: number;
    passed?: boolean | null;
    xpEarned: number;
    coinsEarned: number;
  };
};

export type JourneyDto = {
  id: string;
  area: string;
  discipline: string;
  language?: string | null;
  year: number;

  createdAt: string;
  updatedAt: string;

  progress: {
    totalNodes: number;
    completedNodes: number;
    accuracy: number; // 0..1 (best-effort)
    xpGained: number;
  };

  nodes: JourneyNodeDto[];
};

export type JourneySummaryDto = {
  id: string;
  area: string;
  discipline: string;
  language?: string | null;
  year: number;

  progress: {
    totalNodes: number;
    completedNodes: number;
  };
};

export type AnswerSaveResponseDto = {
  nodeId: string;
  enemQuestionId: string;
  selectedAlternative: string;
  attempt: {
    id: string;
    answeredCount: number;
    totalQuestions: number;
    completedAt: string | null;
  };
};

export type JourneyNodeAttemptAnswerDto = {
  enemQuestionId: string;
  selectedAlternative: string;
  isCorrect?: boolean;
};

export type JourneyNodeDetailsDto = {
  node: JourneyNodeDto;
  attempt: {
    id: string;
    completedAt?: string | null;
    passed?: boolean | null;
    correctCount?: number;
    totalCount?: number;
    answers: JourneyNodeAttemptAnswerDto[];
  } | null;
};

export type FinalizeNodeResponseDto = {
  nodeId: string;
  attempt: {
    id: string;
    correctCount: number;
    totalCount: number;
    completedAt: string;
    passed: boolean;
  };
  rewards: {
    xpEarned: number;
    coinsEarned: number;
    streak: number;
    unlockedNextNodeId?: string | null;
  };
  results: Array<{
    enemQuestionId: string;
    selectedAlternative: string;
    correctAlternative: string;
    isCorrect: boolean;
    question: JourneyQuestionWithAnswerDto;
  }>;
};

export type RetryNodeResponseDto = {
  nodeId: string;
  attemptId: string;
};
