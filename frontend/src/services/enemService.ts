import api from "./api";
import type { EnemExam, EnemQuestion, EnemQuestionsPage } from "@/types";

export type ListEnemQuestionsParams = {
  year: number;
  limit?: number;
  offset?: number;
  language?: string;
};

export type GetEnemQuestionParams = {
  year: number;
  index: number;
  language?: string;
};

export const enemService = {
  listProvas: () => api.get<EnemExam[]>("/enem/provas"),

  getProva: (year: number) => api.get<EnemExam>(`/enem/provas/${year}`),

  listQuestoes: ({ year, ...params }: ListEnemQuestionsParams) =>
    api.get<EnemQuestionsPage>(`/enem/provas/${year}/questoes`, { params }),

  getQuestao: ({ year, index, ...params }: GetEnemQuestionParams) =>
    api.get<EnemQuestion>(`/enem/provas/${year}/questoes/${index}`, { params }),
};
