import { prisma } from "../../db/prisma";
import { ApiError } from "../../errors";
import type {
  SimuladoAttemptDto,
  SimuladoExamPartDto,
  SimuladoDisciplineCountsDto,
  SimuladoCompletedAttemptHistoryItemDto,
  SimuladoResultDto,
  SimuladoSaveAnswerResponseDto,
  SimuladoSummaryDto,
} from "./simulados.types";

const ENEM_MIN_YEAR = 2009;
const ENEM_MAX_YEAR = 2023;

type ExamPart = "DAY1" | "DAY2";

// Tempo padrão (prova ENEM - comum usar 5h30 em um dia de prova)
export const DEFAULT_SIMULADO_TIME_LIMIT_SECONDS = 5 * 60 * 60 + 30 * 60;

function toIso(d: Date) {
  return d.toISOString();
}

function normalizeText(v: string) {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function coerceYear(raw: string) {
  const year = Number(raw);
  if (!Number.isInteger(year)) throw new ApiError(400, "Ano de simulado inválido.");
  if (year < ENEM_MIN_YEAR || year > ENEM_MAX_YEAR) throw new ApiError(400, `Ano fora do intervalo (${ENEM_MIN_YEAR}..${ENEM_MAX_YEAR}).`);
  return year;
}

function emptyCounts(): SimuladoDisciplineCountsDto {
  return { linguagens: 0, humanas: 0, natureza: 0, matematica: 0 };
}

function toAreaFromDiscipline(discipline: string | null | undefined): keyof SimuladoDisciplineCountsDto | null {
  const raw = (discipline ?? "").trim().toLowerCase();
  const norm = raw.normalize("NFD").replace(/\p{Diacritic}/gu, "");

  if (!norm) return null;
  if (norm.includes("matemat")) return "matematica";
  if (norm.includes("human")) return "humanas";
  if (norm.includes("nature")) return "natureza";
  if (norm.includes("linguag")) return "linguagens";
  return null;
}

function partFromArea(area: keyof SimuladoDisciplineCountsDto | null): ExamPart | null {
  if (!area) return null;
  if (area === "linguagens" || area === "humanas") return "DAY1";
  if (area === "natureza" || area === "matematica") return "DAY2";
  return null;
}

function parseSimuladoId(simuladoId: string): { year: number; part: ExamPart } {
  const raw = String(simuladoId ?? "").trim().toLowerCase();
  const match = raw.match(/^(\d{4})\s*[-_ ]\s*d([12])$/);
  if (!match) throw new ApiError(400, "ID do simulado inválido. Use formato YYYY-d1 ou YYYY-d2.");

  const year = coerceYear(match[1]);
  const part = match[2] === "1" ? "DAY1" : "DAY2";
  return { year, part };
}

function parseLanguageChoice(raw: unknown): "ingles" | "espanhol" | null {
  const v = typeof raw === "string" ? normalizeText(raw) : "";
  if (!v) return null;
  if (v.includes("ing") || v.includes("english")) return "ingles";
  if (v.includes("esp") || v.includes("span")) return "espanhol";
  return null;
}

function computeElapsedSeconds(attempt: { startedAt: Date; pausedAt: Date | null; pausedSeconds: number }, now = new Date()) {
  const base = Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000));
  const pausedNow = attempt.pausedAt ? Math.max(0, Math.floor((now.getTime() - attempt.pausedAt.getTime()) / 1000)) : 0;
  // pausedSeconds acumula pausas anteriores; se estiver pausado agora, descontamos também o trecho atual.
  return Math.max(0, base - attempt.pausedSeconds - pausedNow);
}

function toPublicAlternatives(alternatives: any): Array<{ letter: string; text: string | null; file: string | null }> {
  const list = Array.isArray(alternatives) ? alternatives : [];
  return list.map((a) => ({
    letter: String(a?.letter ?? "").toUpperCase(),
    text: a?.text ?? null,
    file: a?.file ?? null,
  }));
}

function toPublicQuestion(q: {
  year: number;
  index: number;
  title: string;
  discipline: string | null;
  language: string | null;
  context: string | null;
  files: any;
  alternativesIntroduction: string | null;
  alternatives: any;
}) {
  return {
    year: q.year,
    index: q.index,
    title: q.title,
    discipline: q.discipline,
    language: q.language,
    context: q.context,
    files: (q.files as any) ?? [],
    alternativesIntroduction: q.alternativesIntroduction,
    alternatives: toPublicAlternatives(q.alternatives),
  };
}

function toQuestionWithAnswer(q: Parameters<typeof toPublicQuestion>[0] & { correctAlternative: string }) {
  return {
    ...toPublicQuestion(q),
    correctAlternative: String(q.correctAlternative).toUpperCase(),
  };
}

function sortKeyForDiscipline(discipline: string | null | undefined): number {
  const area = toAreaFromDiscipline(discipline);
  switch (area) {
    case "linguagens":
      return 1;
    case "humanas":
      return 2;
    case "natureza":
      return 3;
    case "matematica":
      return 4;
    default:
      return 99;
  }
}

export const simuladosService = {
  coerceYear,

  async listCompletedAttemptHistory(userId: string): Promise<SimuladoCompletedAttemptHistoryItemDto[]> {
    const attempts = await prisma.simuladoAttempt.findMany({
      where: { userId, status: "COMPLETED", completedAt: { not: null } },
      orderBy: [{ completedAt: "desc" }, { startedAt: "desc" }],
      select: {
        id: true,
        year: true,
        part: true,
        languageChoice: true,
        startedAt: true,
        completedAt: true,
        durationSeconds: true,
        correctCount: true,
        totalCount: true,
      },
    });

    return attempts.map((a) => {
      const part = a.part as SimuladoExamPartDto;
      const simuladoId = `${a.year}-${a.part === "DAY1" ? "d1" : "d2"}`;
      const titlePart = a.part === "DAY1" ? "Dia 1 (Linguagens + Humanas)" : "Dia 2 (Natureza + Matemática)";
      const totalCount = a.totalCount || 0;
      const correctCount = a.correctCount || 0;
      const score = totalCount > 0 ? correctCount / totalCount : 0;

      return {
        attemptId: a.id,
        simuladoId,
        year: a.year,
        part,
        title: `ENEM ${a.year} — ${titlePart}`,
        languageChoice: a.languageChoice ?? null,
        startedAt: toIso(a.startedAt),
        completedAt: toIso(a.completedAt!),
        durationSeconds: a.durationSeconds ?? 0,
        correctCount,
        totalCount,
        score,
      };
    });
  },

  async listSimulados(userId: string): Promise<SimuladoSummaryDto[]> {
    const grouped = await prisma.enemQuestion.groupBy({
      by: ["year", "discipline", "language"],
      where: { year: { gte: ENEM_MIN_YEAR, lte: ENEM_MAX_YEAR } },
      _count: { _all: true },
    });

    type YearAcc = {
      humanas: number;
      natureza: number;
      matematica: number;
      linguagensBase: number;
      linguagensEn: number;
      linguagensEs: number;
    };

    const byYear = new Map<number, YearAcc>();

    for (const row of grouped) {
      const year = row.year;
      const acc: YearAcc = byYear.get(year) ?? {
        humanas: 0,
        natureza: 0,
        matematica: 0,
        linguagensBase: 0,
        linguagensEn: 0,
        linguagensEs: 0,
      };

      const area = toAreaFromDiscipline(row.discipline);
      const count = row._count._all;

      if (area === "humanas") acc.humanas += count;
      else if (area === "natureza") acc.natureza += count;
      else if (area === "matematica") acc.matematica += count;
      else if (area === "linguagens") {
        if (!row.language) {
          acc.linguagensBase += count;
        } else {
          const lang = parseLanguageChoice(row.language);
          if (lang === "espanhol") acc.linguagensEs += count;
          else if (lang === "ingles") acc.linguagensEn += count;
          else acc.linguagensBase += count;
        }
      }

      byYear.set(year, acc);
    }

    const years = Array.from(byYear.keys()).sort((a, b) => b - a);

    const items = years
      .flatMap((year) => {
        const acc = byYear.get(year)!;
        const day1Linguagens = acc.linguagensBase + Math.max(acc.linguagensEn, acc.linguagensEs);
        const day1Total = day1Linguagens + acc.humanas;
        const day2Total = acc.natureza + acc.matematica;

        const out: Array<{ year: number; part: ExamPart; total: number; counts: SimuladoDisciplineCountsDto }> = [];

        if (day1Total > 0) {
          out.push({
            year,
            part: "DAY1",
            total: day1Total,
            counts: { linguagens: day1Linguagens, humanas: acc.humanas, natureza: 0, matematica: 0 },
          });
        }

        if (day2Total > 0) {
          out.push({
            year,
            part: "DAY2",
            total: day2Total,
            counts: { linguagens: 0, humanas: 0, natureza: acc.natureza, matematica: acc.matematica },
          });
        }

        return out;
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return a.part === b.part ? 0 : a.part === "DAY1" ? -1 : 1;
      });

    const latestAttempts = items.length
      ? await prisma.simuladoAttempt.findMany({
          where: {
            userId,
            OR: items.map((i) => ({ year: i.year, part: i.part })),
          },
          orderBy: [{ year: "asc" }, { part: "asc" }, { startedAt: "desc" }],
          distinct: ["year", "part"],
          select: {
            id: true,
            year: true,
            part: true,
            status: true,
            languageChoice: true,
            correctCount: true,
            totalCount: true,
            completedAt: true,
          },
        })
      : [];

    const attemptByKey = new Map<string, (typeof latestAttempts)[number]>();
    for (const a of latestAttempts) attemptByKey.set(`${a.year}-${a.part}`, a);

    return items.map((it) => {
      const attempt = attemptByKey.get(`${it.year}-${it.part}`);

      const status = attempt
        ? attempt.status === "IN_PROGRESS"
          ? "in_progress"
          : "completed"
        : "pending";

      const totalQuestions = it.total;
      const correctCount = attempt?.correctCount ?? undefined;
      const totalCount = attempt?.totalCount ?? undefined;

      const titlePart = it.part === "DAY1" ? "Dia 1 (Linguagens + Humanas)" : "Dia 2 (Natureza + Matemática)";

      const id = `${it.year}-${it.part === "DAY1" ? "d1" : "d2"}`;

      return {
        id,
        year: it.year,
        part: it.part as SimuladoExamPartDto,
        title: `ENEM ${it.year} — ${titlePart}`,
        totalQuestions,
        timeLimitSeconds: DEFAULT_SIMULADO_TIME_LIMIT_SECONDS,
        status,
        attemptId: attempt?.id ?? null,
        languageChoice: attempt?.languageChoice ?? null,
        correctCount: status === "completed" ? correctCount : undefined,
        score: status === "completed" && totalCount && totalCount > 0 ? (correctCount ?? 0) / totalCount : undefined,
        completedAt: attempt?.completedAt ? attempt.completedAt.toISOString() : null,
        disciplineCounts: it.counts,
      };
    });
  },

  async startSimulado(userId: string, simuladoId: string, opts?: { languageChoice?: string | null }): Promise<SimuladoAttemptDto> {
    const { year, part } = parseSimuladoId(simuladoId);
    const languageChoice = parseLanguageChoice(opts?.languageChoice) ?? "ingles";

    // Busca todas as questões do ano e separa por área/parte em memória.
    // Motivo: o campo "discipline" pode variar (acentos/maiúsculas/textos),
    // então filtrar por substring no banco pode retornar vazio mesmo com dados.
    const questions = await prisma.enemQuestion.findMany({
      where: { year },
      select: {
        id: true,
        year: true,
        index: true,
        title: true,
        discipline: true,
        language: true,
        context: true,
        files: true,
        alternativesIntroduction: true,
        alternatives: true,
      },
    });

    if (!questions.length) {
      throw new ApiError(
        404,
        `Não há questões no banco para este ENEM (${year}). Rode o comando: npm run enem:sync`,
      );
    }

    const questionsForPart = questions.filter((q) => {
      const area = toAreaFromDiscipline(q.discipline);
      if (part === "DAY1") return area === "linguagens" || area === "humanas";
      return area === "natureza" || area === "matematica";
    });

    if (!questionsForPart.length) {
      throw new ApiError(
        404,
        `Não há questões no banco para este ENEM (${year}) na parte ${part === "DAY1" ? "Dia 1" : "Dia 2"}. Rode: npm run enem:sync`,
      );
    }

    const filteredByLanguage =
      part === "DAY1"
        ? questionsForPart.filter((q) => {
            const area = toAreaFromDiscipline(q.discipline);
            if (area !== "linguagens") return true;
            // Questões sem language são parte de Linguagens (base).
            if (!q.language) return true;
            // Questões de língua estrangeira: filtra conforme a escolha.
            return parseLanguageChoice(q.language) === languageChoice;
          })
        : questionsForPart;

    const ordered = filteredByLanguage
      .slice()
      .sort((a, b) => {
        const da = sortKeyForDiscipline(a.discipline);
        const db = sortKeyForDiscipline(b.discipline);
        if (da !== db) return da - db;
        return (a.index ?? 0) - (b.index ?? 0);
      });

    const totalCount = ordered.length;

    const created = await prisma.$transaction(async (tx) => {
      const attempt = await tx.simuladoAttempt.create({
        data: {
          userId,
          year,
          part,
          languageChoice: part === "DAY1" ? languageChoice : null,
          timeLimitSeconds: DEFAULT_SIMULADO_TIME_LIMIT_SECONDS,
          totalCount,
          correctCount: 0,
          status: "IN_PROGRESS",
          pausedSeconds: 0,
          pausedAt: null,
        },
        select: { id: true, startedAt: true, timeLimitSeconds: true, part: true, languageChoice: true, pausedAt: true, pausedSeconds: true },
      });

      await tx.simuladoAttemptQuestion.createMany({
        data: ordered.map((q, idx) => ({
          attemptId: attempt.id,
          order: idx + 1,
          enemQuestionId: q.id,
        })),
      });

      return attempt;
    });

    return {
      attemptId: created.id,
      year,
      part: created.part as SimuladoExamPartDto,
      languageChoice: created.languageChoice ?? null,
      title: `ENEM ${year} — ${part === "DAY1" ? "Dia 1 (Linguagens + Humanas)" : "Dia 2 (Natureza + Matemática)"}`,
      timeLimitSeconds: created.timeLimitSeconds,
      startedAt: toIso(created.startedAt),
      pausedAt: created.pausedAt ? toIso(created.pausedAt) : null,
      pausedSeconds: created.pausedSeconds,
      progress: {
        answeredCount: 0,
        totalCount,
      },
      questions: ordered.map((q, idx) => ({
        order: idx + 1,
        enemQuestionId: q.id,
        question: toPublicQuestion(q),
      })),
      answers: [],
    };
  },

  async getAttempt(userId: string, attemptId: string): Promise<SimuladoAttemptDto> {
    const attempt = await prisma.simuladoAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            enemQuestion: {
              select: {
                id: true,
                year: true,
                index: true,
                title: true,
                discipline: true,
                language: true,
                context: true,
                files: true,
                alternativesIntroduction: true,
                alternatives: true,
              },
            },
          },
        },
        answers: { select: { enemQuestionId: true, selectedAlternative: true, flagged: true } },
      },
    });

    if (!attempt || attempt.userId !== userId) throw new ApiError(404, "Tentativa não encontrada.");
    if (attempt.status !== "IN_PROGRESS") throw new ApiError(400, "Esta tentativa já foi finalizada.");

    const answeredCount = attempt.answers.length;

    return {
      attemptId: attempt.id,
      year: attempt.year,
      part: attempt.part as SimuladoExamPartDto,
      languageChoice: attempt.languageChoice ?? null,
      title: `ENEM ${attempt.year} — ${attempt.part === "DAY1" ? "Dia 1 (Linguagens + Humanas)" : "Dia 2 (Natureza + Matemática)"}`,
      timeLimitSeconds: attempt.timeLimitSeconds,
      startedAt: toIso(attempt.startedAt),
      pausedAt: attempt.pausedAt ? toIso(attempt.pausedAt) : null,
      pausedSeconds: attempt.pausedSeconds,
      progress: {
        answeredCount,
        totalCount: attempt.totalCount,
      },
      questions: attempt.questions.map((q) => ({
        order: q.order,
        enemQuestionId: q.enemQuestionId,
        question: toPublicQuestion(q.enemQuestion),
      })),
      answers: attempt.answers.map((a) => ({
        enemQuestionId: a.enemQuestionId,
        selectedAlternative: a.selectedAlternative,
        flagged: a.flagged,
      })),
    };
  },

  async pause(userId: string, attemptId: string): Promise<Pick<SimuladoAttemptDto, "attemptId" | "pausedAt" | "pausedSeconds">> {
    const attempt = await prisma.simuladoAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true, status: true, pausedAt: true, pausedSeconds: true },
    });

    if (!attempt || attempt.userId !== userId) throw new ApiError(404, "Tentativa não encontrada.");
    if (attempt.status !== "IN_PROGRESS") throw new ApiError(400, "Esta tentativa já foi finalizada.");
    if (attempt.pausedAt) {
      return { attemptId: attempt.id, pausedAt: toIso(attempt.pausedAt), pausedSeconds: attempt.pausedSeconds };
    }

    const updated = await prisma.simuladoAttempt.update({
      where: { id: attemptId },
      data: { pausedAt: new Date() },
      select: { id: true, pausedAt: true, pausedSeconds: true },
    });

    return { attemptId: updated.id, pausedAt: updated.pausedAt ? toIso(updated.pausedAt) : null, pausedSeconds: updated.pausedSeconds };
  },

  async resume(userId: string, attemptId: string): Promise<Pick<SimuladoAttemptDto, "attemptId" | "pausedAt" | "pausedSeconds">> {
    const attempt = await prisma.simuladoAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true, status: true, pausedAt: true, pausedSeconds: true },
    });

    if (!attempt || attempt.userId !== userId) throw new ApiError(404, "Tentativa não encontrada.");
    if (attempt.status !== "IN_PROGRESS") throw new ApiError(400, "Esta tentativa já foi finalizada.");
    if (!attempt.pausedAt) {
      return { attemptId: attempt.id, pausedAt: null, pausedSeconds: attempt.pausedSeconds };
    }

    const now = new Date();
    const delta = Math.max(0, Math.floor((now.getTime() - attempt.pausedAt.getTime()) / 1000));

    const updated = await prisma.simuladoAttempt.update({
      where: { id: attemptId },
      data: {
        pausedAt: null,
        pausedSeconds: attempt.pausedSeconds + delta,
      },
      select: { id: true, pausedAt: true, pausedSeconds: true },
    });

    return { attemptId: updated.id, pausedAt: null, pausedSeconds: updated.pausedSeconds };
  },

  async restart(userId: string, attemptId: string): Promise<SimuladoAttemptDto> {
    const attempt = await prisma.simuladoAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            enemQuestion: {
              select: {
                id: true,
                year: true,
                index: true,
                title: true,
                discipline: true,
                language: true,
                context: true,
                files: true,
                alternativesIntroduction: true,
                alternatives: true,
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== userId) throw new ApiError(404, "Tentativa não encontrada.");
    if (attempt.status !== "IN_PROGRESS") throw new ApiError(400, "Esta tentativa já foi finalizada.");

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.simuladoAnswer.deleteMany({ where: { attemptId } });
      await tx.simuladoAttempt.update({
        where: { id: attemptId },
        data: {
          startedAt: now,
          completedAt: null,
          durationSeconds: null,
          correctCount: 0,
          status: "IN_PROGRESS",
          pausedAt: null,
          pausedSeconds: 0,
        },
      });
    });

    return {
      attemptId: attempt.id,
      year: attempt.year,
      part: attempt.part as SimuladoExamPartDto,
      languageChoice: attempt.languageChoice ?? null,
      title: `ENEM ${attempt.year} — ${attempt.part === "DAY1" ? "Dia 1 (Linguagens + Humanas)" : "Dia 2 (Natureza + Matemática)"}`,
      timeLimitSeconds: attempt.timeLimitSeconds,
      startedAt: toIso(now),
      pausedAt: null,
      pausedSeconds: 0,
      progress: {
        answeredCount: 0,
        totalCount: attempt.totalCount,
      },
      questions: attempt.questions.map((q) => ({
        order: q.order,
        enemQuestionId: q.enemQuestionId,
        question: toPublicQuestion(q.enemQuestion),
      })),
      answers: [],
    };
  },

  async saveAnswer(
    userId: string,
    attemptId: string,
    input: { enemQuestionId: string; selectedAlternative: string; flagged?: boolean },
  ): Promise<SimuladoSaveAnswerResponseDto> {
    const attempt = await prisma.simuladoAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true, status: true, totalCount: true },
    });

    if (!attempt || attempt.userId !== userId) throw new ApiError(404, "Tentativa não encontrada.");
    if (attempt.status !== "IN_PROGRESS") throw new ApiError(400, "Esta tentativa já foi finalizada.");

    const enemQuestionId = String(input.enemQuestionId);
    const selectedAlternative = String(input.selectedAlternative).trim().toUpperCase();
    if (!selectedAlternative || selectedAlternative.length !== 1) throw new ApiError(400, "Alternativa inválida.");
    const flagged = Boolean(input.flagged);

    // Garante que a questão pertence a esta tentativa.
    const exists = await prisma.simuladoAttemptQuestion.findUnique({
      where: { attemptId_enemQuestionId: { attemptId, enemQuestionId } },
      select: { id: true },
    });
    if (!exists) throw new ApiError(400, "Esta questão não pertence a esta tentativa.");

    const q = await prisma.enemQuestion.findUnique({ where: { id: enemQuestionId }, select: { correctAlternative: true } });
    if (!q) throw new ApiError(404, "Questão não encontrada.");

    const isCorrect = String(q.correctAlternative).toUpperCase() === selectedAlternative;

    await prisma.simuladoAnswer.upsert({
      where: { attemptId_enemQuestionId: { attemptId, enemQuestionId } },
      create: {
        attemptId,
        enemQuestionId,
        selectedAlternative,
        isCorrect,
        flagged,
      },
      update: {
        selectedAlternative,
        isCorrect,
        flagged,
        answeredAt: new Date(),
      },
      select: { id: true },
    });

    const answeredCount = await prisma.simuladoAnswer.count({ where: { attemptId } });

    return {
      attemptId,
      enemQuestionId,
      selectedAlternative,
      flagged,
      progress: {
        answeredCount,
        totalCount: attempt.totalCount,
      },
    };
  },

  async submit(userId: string, attemptId: string, answers?: Record<string, string>): Promise<SimuladoResultDto> {
    // Se o frontend mandar um mapa de respostas no submit, fazemos best-effort para salvar tudo.
    if (answers && typeof answers === "object") {
      for (const [enemQuestionId, selectedAlternative] of Object.entries(answers)) {
        if (!selectedAlternative) continue;
        await this.saveAnswer(userId, attemptId, { enemQuestionId, selectedAlternative });
      }
    }

    const attempt = await prisma.simuladoAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            enemQuestion: {
              select: {
                id: true,
                year: true,
                index: true,
                title: true,
                discipline: true,
                language: true,
                context: true,
                files: true,
                alternativesIntroduction: true,
                alternatives: true,
                correctAlternative: true,
              },
            },
          },
        },
        answers: { select: { enemQuestionId: true, selectedAlternative: true, isCorrect: true } },
      },
    });

    if (!attempt || attempt.userId !== userId) throw new ApiError(404, "Tentativa não encontrada.");
    if (attempt.status !== "IN_PROGRESS") throw new ApiError(400, "Esta tentativa já foi finalizada.");

    // Se estiver pausado, finaliza a pausa antes de corrigir.
    if (attempt.pausedAt) {
      const now = new Date();
      const delta = Math.max(0, Math.floor((now.getTime() - attempt.pausedAt.getTime()) / 1000));
      await prisma.simuladoAttempt.update({
        where: { id: attemptId },
        data: { pausedAt: null, pausedSeconds: attempt.pausedSeconds + delta },
        select: { id: true },
      });
      attempt.pausedAt = null as any;
      attempt.pausedSeconds = attempt.pausedSeconds + delta;
    }

    const now = new Date();
    const durationSeconds = computeElapsedSeconds({ startedAt: attempt.startedAt, pausedAt: attempt.pausedAt, pausedSeconds: attempt.pausedSeconds }, now);

    const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
    const totalCount = attempt.totalCount;

    const updated = await prisma.simuladoAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        completedAt: now,
        durationSeconds,
        correctCount,
        totalCount,
      },
      select: { startedAt: true, completedAt: true },
    });

    const answerMap = new Map(attempt.answers.map((a) => [a.enemQuestionId, a] as const));

    const results = attempt.questions.map((qq) => {
      const q = qq.enemQuestion;
      const a = answerMap.get(q.id);
      const selectedAlternative = a?.selectedAlternative ?? null;
      const correctAlternative = String(q.correctAlternative).toUpperCase();
      const isCorrect = a?.isCorrect ?? false;

      return {
        enemQuestionId: q.id,
        selectedAlternative,
        correctAlternative,
        isCorrect,
        question: toQuestionWithAnswer(q),
      };
    });

    const score = totalCount > 0 ? correctCount / totalCount : 0;

    return {
      attemptId,
      year: attempt.year,
      title: `ENEM ${attempt.year} — Prova completa`,
      startedAt: toIso(updated.startedAt),
      completedAt: toIso(updated.completedAt!),
      durationSeconds,
      correctCount,
      totalCount,
      score,
      results,
    };
  },

  async getResult(userId: string, attemptId: string): Promise<SimuladoResultDto> {
    const attempt = await prisma.simuladoAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            enemQuestion: {
              select: {
                id: true,
                year: true,
                index: true,
                title: true,
                discipline: true,
                language: true,
                context: true,
                files: true,
                alternativesIntroduction: true,
                alternatives: true,
                correctAlternative: true,
              },
            },
          },
        },
        answers: { select: { enemQuestionId: true, selectedAlternative: true, isCorrect: true } },
      },
    });

    if (!attempt || attempt.userId !== userId) throw new ApiError(404, "Tentativa não encontrada.");
    if (attempt.status !== "COMPLETED" || !attempt.completedAt) throw new ApiError(400, "Esta tentativa ainda não foi finalizada.");

    const answerMap = new Map(attempt.answers.map((a) => [a.enemQuestionId, a] as const));

    const results = attempt.questions.map((qq) => {
      const q = qq.enemQuestion;
      const a = answerMap.get(q.id);
      const selectedAlternative = a?.selectedAlternative ?? null;
      const correctAlternative = String(q.correctAlternative).toUpperCase();
      const isCorrect = a?.isCorrect ?? false;

      return {
        enemQuestionId: q.id,
        selectedAlternative,
        correctAlternative,
        isCorrect,
        question: toQuestionWithAnswer(q),
      };
    });

    const score = attempt.totalCount > 0 ? attempt.correctCount / attempt.totalCount : 0;

    return {
      attemptId,
      year: attempt.year,
      title: `ENEM ${attempt.year} — Prova completa`,
      startedAt: toIso(attempt.startedAt),
      completedAt: toIso(attempt.completedAt),
      durationSeconds: attempt.durationSeconds ?? Math.max(0, Math.floor((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000)),
      correctCount: attempt.correctCount,
      totalCount: attempt.totalCount,
      score,
      results,
    };
  },
};
