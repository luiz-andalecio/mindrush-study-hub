import type {
  EnemApiExam,
  EnemApiExamDetail,
  EnemApiQuestion,
  EnemApiQuestionsPage,
  EnemExamDto,
  EnemQuestionDto,
  EnemQuestionsPageDto,
} from "./enem.types";

export function mapExam(api: EnemApiExam): EnemExamDto {
  return {
    year: api.year,
    title: api.title,
    disciplines: api.disciplines,
    languages: api.languages,
  };
}

export function mapExamDetail(api: EnemApiExamDetail): EnemExamDto {
  // Por enquanto expomos somente campos estáveis.
  return mapExam(api);
}

export function mapQuestion(api: EnemApiQuestion): EnemQuestionDto {
  return {
    year: api.year,
    index: api.index,
    title: api.title,
    discipline: api.discipline,
    language: api.language,
    context: api.context,
    files: api.files,
    correctAlternative: api.correctAlternative,
    alternativesIntroduction: api.alternativesIntroduction,
    alternatives: api.alternatives,
  };
}

export function mapQuestionsPage(api: EnemApiQuestionsPage): EnemQuestionsPageDto {
  return {
    metadata: api.metadata,
    questions: api.questions.map(mapQuestion),
  };
}
