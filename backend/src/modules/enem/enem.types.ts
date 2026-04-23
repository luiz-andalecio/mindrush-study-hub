export type EnemDiscipline = {
  label: string;
  value: string;
};

export type EnemLanguage = {
  label: string;
  value: string;
};

// ===== Tipos EXTERNOS (respostas da enem.dev) =====

export type EnemApiErrorResponse = {
  error: {
    code: string;
    message: string;
    docUrl?: string;
  };
};

export type EnemApiExam = {
  title: string;
  year: number;
  disciplines: EnemDiscipline[];
  languages: EnemLanguage[];
};

export type EnemApiExamDetail = EnemApiExam & {
  // No /exams/{year} também pode vir um resumo de questões.
  questions?: Array<{
    title: string;
    index: number;
    discipline: string | null;
    language: string | null;
  }>;
};

export type EnemApiQuestionAlternativeLetter = "A" | "B" | "C" | "D" | "E";

export type EnemApiQuestionAlternative = {
  letter: EnemApiQuestionAlternativeLetter;
  text: string | null;
  file: string | null;
  isCorrect: boolean;
};

export type EnemApiQuestion = {
  title: string;
  index: number;
  discipline: string | null;
  language: string | null;
  year: number;
  context: string | null;
  files: string[];
  correctAlternative: EnemApiQuestionAlternativeLetter;
  alternativesIntroduction: string | null;
  alternatives: EnemApiQuestionAlternative[];
};

export type EnemApiQuestionsMetadata = {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
};

export type EnemApiQuestionsPage = {
  metadata: EnemApiQuestionsMetadata;
  questions: EnemApiQuestion[];
};

// ===== Tipos INTERNOS (o que a sua API expõe) =====

export type EnemExamDto = {
  year: number;
  title: string;
  disciplines: EnemDiscipline[];
  languages: EnemLanguage[];
};

export type EnemQuestionDto = {
  year: number;
  index: number;
  title: string;
  discipline: string | null;
  language: string | null;
  context: string | null;
  files: string[];
  correctAlternative: EnemApiQuestionAlternativeLetter;
  alternativesIntroduction: string | null;
  alternatives: EnemApiQuestionAlternative[];
};

export type EnemQuestionsPageDto = {
  metadata: EnemApiQuestionsMetadata;
  questions: EnemQuestionDto[];
};

export type EnemQuestionsQuery = {
  limit?: number;
  offset?: number;
  language?: string;
};
