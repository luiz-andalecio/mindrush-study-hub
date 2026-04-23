import type { Logger } from "pino";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../errors";
import { env } from "../../env";
import { TtlCache } from "./enem.cache";
import { EnemApiClient, EnemApiHttpError } from "./enem.client";
import {
  mapExam,
  mapExamDetail,
  mapQuestion,
  mapQuestionsPage,
} from "./enem.mapper";
import type {
  EnemApiExam,
  EnemApiExamDetail,
  EnemApiQuestion,
  EnemApiQuestionsPage,
  EnemExamDto,
  EnemQuestionDto,
  EnemQuestionsPageDto,
  EnemQuestionsQuery,
} from "./enem.types";

const ONE_HOUR_MS = 60 * 60 * 1000;

const cache = new TtlCache(ONE_HOUR_MS, 800);

const client = new EnemApiClient({
  // A docs usa https://api.enem.dev/v1/...
  baseUrl: env.enemApiBaseUrl,
  timeoutMs: 10_000,
  maxRetries: 4,
});

function cacheKey(parts: Array<string | number | undefined>) {
  return parts.filter((p) => p !== undefined).join("|");
}

function questionId(year: number, index: number, language?: string) {
  return `${year}:${index}:${language ?? "pt"}`;
}

function toHttpError(err: unknown) {
  if (err instanceof EnemApiHttpError) return err;
  return undefined;
}

export const enemService = {
  async listExams(log?: Logger): Promise<EnemExamDto[]> {
    const key = cacheKey(["exams"]);
    const hit = cache.get<EnemExamDto[]>(key);
    if (hit) return hit;

    try {
      const apiExams = await client.getJson<EnemApiExam[]>("/exams", undefined, log);
      const mapped = apiExams.map(mapExam);

      cache.set(key, mapped);
      return mapped;
    } catch (err) {
      log?.warn({ err }, "enem.dev offline/erro; usando fallback do banco (provas)");

      const exams = await prisma.enemExam.findMany({ orderBy: { year: "desc" } });
      if (!exams.length) {
        const http = toHttpError(err);
        throw new ApiError(http?.status === 404 ? 404 : 503, "Serviço ENEM indisponível.");
      }

      const mapped: EnemExamDto[] = exams.map((e) => ({
        year: e.year,
        title: e.title,
        disciplines: e.disciplines as any,
        languages: e.languages as any,
      }));

      cache.set(key, mapped);
      return mapped;
    }
  },

  async getExamByYear(year: number, log?: Logger): Promise<EnemExamDto> {
    const key = cacheKey(["exam", year]);
    const hit = cache.get<EnemExamDto>(key);
    if (hit) return hit;

    try {
      const apiExam = await client.getJson<EnemApiExamDetail>(`/exams/${year}`, undefined, log);
      const mapped = mapExamDetail(apiExam);

      cache.set(key, mapped);
      return mapped;
    } catch (err) {
      log?.warn({ year, err }, "enem.dev offline/erro; usando fallback do banco (prova)");

      const exam = await prisma.enemExam.findUnique({ where: { year } });
      if (!exam) {
        const http = toHttpError(err);
        throw new ApiError(http?.status === 404 ? 404 : 503, "Prova não encontrada.");
      }

      const mapped: EnemExamDto = {
        year: exam.year,
        title: exam.title,
        disciplines: exam.disciplines as any,
        languages: exam.languages as any,
      };

      cache.set(key, mapped);
      return mapped;
    }
  },

  async listQuestions(year: number, query: EnemQuestionsQuery, log?: Logger): Promise<EnemQuestionsPageDto> {
    const key = cacheKey(["questions", year, query.limit, query.offset, query.language]);
    const hit = cache.get<EnemQuestionsPageDto>(key);
    if (hit) return hit;

    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;

    try {
      const apiPage = await client.getJson<EnemApiQuestionsPage>(
        `/exams/${year}/questions`,
        { limit, offset, language: query.language },
        log,
      );

      const mapped = mapQuestionsPage(apiPage);

      cache.set(key, mapped);
      return mapped;
    } catch (err) {
      log?.warn({ year, query, err }, "enem.dev offline/erro; usando fallback do banco (questões)");

      // Fallback: melhor esforço. Não sabemos total real local, então calculamos com count.
      const where: { year: number; language?: string | null } = { year };
      if (query.language) where.language = query.language;

      const [total, rows] = await Promise.all([
        prisma.enemQuestion.count({ where }),
        prisma.enemQuestion.findMany({
          where,
          orderBy: { index: "asc" },
          skip: offset,
          take: limit,
        }),
      ]);

      if (!rows.length) {
        const http = toHttpError(err);
        throw new ApiError(http?.status === 404 ? 404 : 503, "Questões não encontradas.");
      }

      const questions: EnemQuestionDto[] = rows.map((q) => ({
        year: q.year,
        index: q.index,
        title: q.title,
        discipline: q.discipline,
        language: q.language,
        context: q.context,
        files: q.files as any,
        correctAlternative: q.correctAlternative as any,
        alternativesIntroduction: q.alternativesIntroduction,
        alternatives: q.alternatives as any,
      }));

      const page: EnemQuestionsPageDto = {
        metadata: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
        questions,
      };

      cache.set(key, page);
      return page;
    }
  },

  async getQuestionByIndex(year: number, index: number, language?: string, log?: Logger): Promise<EnemQuestionDto> {
    const key = cacheKey(["question", year, index, language]);
    const hit = cache.get<EnemQuestionDto>(key);
    if (hit) return hit;

    try {
      const apiQuestion = await client.getJson<EnemApiQuestion>(
        `/exams/${year}/questions/${index}`,
        { language },
        log,
      );

      const mapped = mapQuestion(apiQuestion);

      cache.set(key, mapped);
      return mapped;
    } catch (err) {
      log?.warn({ year, index, language, err }, "enem.dev offline/erro; usando fallback do banco (questão)");

      const id = questionId(year, index, language);
      const row = await prisma.enemQuestion.findUnique({ where: { id } });
      if (!row) {
        // Tenta fallback sem language explícita (pt).
        const rowPt = await prisma.enemQuestion.findUnique({ where: { id: questionId(year, index) } });
        if (!rowPt) {
          const http = toHttpError(err);
          throw new ApiError(http?.status === 404 ? 404 : 503, "Questão não encontrada.");
        }

        const mapped: EnemQuestionDto = {
          year: rowPt.year,
          index: rowPt.index,
          title: rowPt.title,
          discipline: rowPt.discipline,
          language: rowPt.language,
          context: rowPt.context,
          files: rowPt.files as any,
          correctAlternative: rowPt.correctAlternative as any,
          alternativesIntroduction: rowPt.alternativesIntroduction,
          alternatives: rowPt.alternatives as any,
        };

        cache.set(key, mapped);
        return mapped;
      }

      const mapped: EnemQuestionDto = {
        year: row.year,
        index: row.index,
        title: row.title,
        discipline: row.discipline,
        language: row.language,
        context: row.context,
        files: row.files as any,
        correctAlternative: row.correctAlternative as any,
        alternativesIntroduction: row.alternativesIntroduction,
        alternatives: row.alternatives as any,
      };

      cache.set(key, mapped);
      return mapped;
    }
  },
};
