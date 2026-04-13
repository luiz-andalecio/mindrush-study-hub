import type { Logger } from "pino";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../errors";
import type {
  AnswerSaveResponseDto,
  FinalizeNodeResponseDto,
  JourneyDto,
  JourneyNodeDetailsDto,
  JourneySummaryDto,
  RetryNodeResponseDto,
} from "./journey.types";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function normalizeDiscipline(value: string | null | undefined) {
  const raw = (value ?? "").trim().toLowerCase();
  // Remove acentos/diacríticos para permitir match entre "matematica" e "Matemática".
  return raw.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

type JourneyArea = "Linguagens" | "Ciências Humanas" | "Ciências da Natureza" | "Matemática";

function toCanonicalDiscipline(area: JourneyArea): string {
  // Valores que a enem.dev costuma usar no campo discipline.
  switch (area) {
    case "Linguagens":
      return "linguagens";
    case "Ciências Humanas":
      return "ciencias-humanas";
    case "Ciências da Natureza":
      return "ciencias-natureza";
    case "Matemática":
      return "matematica";
  }
}

function parseEnemQuestionId(id: string): { year: number; index: number; language?: string } {
  const [y, i, l] = id.split(":");
  const year = Number(y);
  const index = Number(i);
  const language = l && l !== "pt" ? l : undefined;

  if (!Number.isFinite(year) || !Number.isFinite(index)) {
    throw new ApiError(400, "ID de questão ENEM inválido.");
  }

  return { year, index, language };
}

function toPublicAlternatives(alternatives: any): Array<{ letter: string; text: string | null; file: string | null }> {
  const list = Array.isArray(alternatives) ? alternatives : [];
  return list.map((a) => ({
    letter: String(a?.letter ?? ""),
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

function toQuestionWithAnswer(q: {
  year: number;
  index: number;
  title: string;
  discipline: string | null;
  language: string | null;
  context: string | null;
  files: any;
  alternativesIntroduction: string | null;
  alternatives: any;
  correctAlternative: string;
}) {
  return {
    ...toPublicQuestion(q),
    correctAlternative: String(q.correctAlternative),
  };
}

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameLocalDay(a: Date, b: Date) {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

function isYesterdayLocalDay(last: Date, now: Date) {
  const lastDay = startOfLocalDay(last).getTime();
  const today = startOfLocalDay(now).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  return today - lastDay === oneDay;
}

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function ensureNodeQuestions(nodeId: string) {
  const node = await prisma.journeyNode.findUnique({
    where: { id: nodeId },
    include: { questions: true, journey: true },
  });

  if (!node) throw new ApiError(404, "Card não encontrado.");

  if (node.questions.length >= node.totalQuestions) return;

  // A Jornada agora é pré-criada com as questões já amarradas no banco.
  // Se cair aqui, é porque a pré-criação falhou ou o banco ainda não foi sincronizado.
  throw new ApiError(
    503,
    "Card sem questões. Execute a pré-carga (npm run enem:sync) e recrie a Jornada.",
  );
}

async function computeJourneyProgress(journeyId: string) {
  const [nodes, agg] = await Promise.all([
    prisma.journeyNode.findMany({ where: { journeyId }, select: { status: true } }),
    prisma.journeyNodeAttempt.aggregate({
      where: { node: { journeyId }, completedAt: { not: null } },
      _sum: { correctCount: true, totalCount: true, xpEarned: true },
    }),
  ]);

  const totalNodes = nodes.length;
  const completedNodes = nodes.filter((n) => n.status === "COMPLETED").length;

  const correct = agg._sum.correctCount ?? 0;
  const total = agg._sum.totalCount ?? 0;

  return {
    totalNodes,
    completedNodes,
    accuracy: total > 0 ? correct / total : 0,
    xpGained: agg._sum.xpEarned ?? 0,
  };
}

export const journeyService = {
  async listJourneys(userId: string): Promise<JourneySummaryDto[]> {
    const journeys = await prisma.journey.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { nodes: { select: { status: true } } },
    });

    return journeys.map((j) => ({
      id: j.id,
      area: j.area,
      discipline: j.discipline,
      language: j.language,
      year: j.year,
      progress: {
        totalNodes: j.nodes.length,
        completedNodes: j.nodes.filter((n) => n.status === "COMPLETED").length,
      },
    }));
  },

  async createJourney(
    userId: string,
    input: { area: JourneyArea; language?: string },
    log?: Logger,
  ): Promise<JourneyDto> {
    const area = input.area;
    const discipline = toCanonicalDiscipline(area);

    const languageRaw = (input.language ?? "").trim().toLowerCase();
    const language = area === "Linguagens" ? (languageRaw || null) : null;

    if (area === "Linguagens" && !language) {
      throw new ApiError(400, "Para Linguagens, selecione Inglês ou Espanhol.");
    }

    if (area === "Linguagens" && language && !["ingles", "espanhol"].includes(language)) {
      throw new ApiError(400, "Idioma inválido. Use 'ingles' ou 'espanhol'.");
    }

    // A Jornada usa somente o banco local pré-carregado.
    // Escolhemos um ano "de exibição" como o mais recente no banco (se existir).
    const latestYearRow = await prisma.enemExam.findFirst({ orderBy: { year: "desc" }, select: { year: true } });
    const year = latestYearRow?.year ?? 2023;

    const existing = await prisma.journey.findFirst({
      where: { userId, discipline, year, language },
      select: { id: true },
    });
    if (existing) return this.getJourney(userId, existing.id, log);

    const targetDiscipline = normalizeDiscipline(discipline);

    const disciplineVariants = Array.from(
      new Set([
        discipline,
        // Variações comuns com acento / caixa (para não depender do formato exato da API).
        discipline === "matematica" ? "Matemática" : undefined,
        discipline === "ciencias-humanas" ? "Ciências Humanas" : undefined,
        discipline === "ciencias-natureza" ? "Ciências da Natureza" : undefined,
        discipline === "linguagens" ? "Linguagens" : undefined,
      ].filter(Boolean) as string[]),
    );

    // Filtra por disciplina (normalizando acentos) e, em Linguagens, inclui:
    // - questões em português (language null)
    // - questões do idioma escolhido (language == escolhido)
    // Observação: language=null NÃO implica "Linguagens"; por isso sempre filtramos por discipline.
    const all = await prisma.enemQuestion.findMany({
      where: {
        discipline: { in: disciplineVariants },
        ...(area === "Linguagens"
          ? {
              OR: [{ language: null }, { language }],
            }
          : {}),
      },
      select: { id: true, year: true, index: true, discipline: true, language: true },
      orderBy: [{ year: "asc" }, { index: "asc" }],
    });

    const ids = all
      .filter((q) => normalizeDiscipline(q.discipline) === targetDiscipline)
      .map((q) => q.id);

    if (ids.length < 5) {
      log?.warn({ area, discipline, language, total: ids.length }, "Poucas questões no banco para criar Jornada");
      throw new ApiError(
        503,
        "Não há questões suficientes no banco para criar a Jornada. Rode a pré-carga (npm run enem:sync).",
      );
    }

    const groups = chunk(ids, 5);

    const created = await prisma.$transaction(async (tx) => {
      const journey = await tx.journey.create({
        data: {
          userId,
          area,
          discipline,
          language,
          year,
        },
        select: { id: true },
      });

      await tx.journeyNode.createMany({
        data: groups.map((_, idx) => {
          const order = idx + 1;
          return {
            journeyId: journey.id,
            order,
            status: order === 1 ? "AVAILABLE" : "LOCKED",
            year,
            discipline,
            language,
          };
        }),
      });

      const nodes = await tx.journeyNode.findMany({
        where: { journeyId: journey.id },
        select: { id: true, order: true },
      });

      const nodeByOrder = new Map(nodes.map((n) => [n.order, n.id]));

      const questionRows = groups.flatMap((g, idx) => {
        const nodeOrder = idx + 1;
        const nodeId = nodeByOrder.get(nodeOrder);
        if (!nodeId) return [];
        return g.map((enemQuestionId, qIdx) => ({
          nodeId,
          order: qIdx + 1,
          enemQuestionId,
        }));
      });

      for (const batch of chunk(questionRows, 1000)) {
        await tx.journeyNodeQuestion.createMany({ data: batch });
      }

      return journey;
    });

    // Sanidade: garante que o primeiro node tem 5 questões.
    const firstNode = await prisma.journeyNode.findFirst({
      where: { journeyId: created.id, order: 1 },
      select: { id: true },
    });
    if (firstNode) await ensureNodeQuestions(firstNode.id);

    return this.getJourney(userId, created.id, log);
  },

  async getJourney(userId: string, journeyId: string, log?: Logger): Promise<JourneyDto> {
    const journey = await prisma.journey.findFirst({
      where: { id: journeyId, userId },
      include: {
        nodes: {
          orderBy: { order: "asc" },
          include: {
            questions: { orderBy: { order: "asc" } },
            attempts: {
              where: { userId },
              orderBy: { startedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!journey) throw new ApiError(404, "Jornada não encontrada.");

    // Garante que o node disponível tem questões (pré-criado).
    const available = journey.nodes.find((n) => n.status === "AVAILABLE");
    if (available) await ensureNodeQuestions(available.id);

    const progress = await computeJourneyProgress(journey.id);

    const nodes = await prisma.journeyNode.findMany({
      where: { journeyId: journey.id },
      orderBy: { order: "asc" },
      include: {
        questions: { orderBy: { order: "asc" }, include: { enemQuestion: true } },
        attempts: {
          where: { userId },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    return {
      id: journey.id,
      area: journey.area,
      discipline: journey.discipline,
      language: journey.language,
      year: journey.year,
      createdAt: journey.createdAt.toISOString(),
      updatedAt: journey.updatedAt.toISOString(),
      progress,
      nodes: nodes.map((n) => ({
        id: n.id,
        order: n.order,
        status: n.status as any,
        year: n.year,
        discipline: n.discipline,
        language: n.language,
        minCorrect: n.minCorrect,
        totalQuestions: n.totalQuestions,
        xpPerCorrect: n.xpPerCorrect,
        coinsOnComplete: n.coinsOnComplete,
        questions:
          n.status === "LOCKED"
            ? undefined
            : n.questions.map((q) => ({
                id: q.id,
                order: q.order,
                enemQuestionId: q.enemQuestionId,
                // Para UX: enviamos os detalhes completos apenas no card disponível.
                // mas SEM gabarito durante a tentativa.
                question: n.status === "AVAILABLE" ? toPublicQuestion({
                  year: q.enemQuestion.year,
                  index: q.enemQuestion.index,
                  title: q.enemQuestion.title,
                  discipline: q.enemQuestion.discipline,
                  language: q.enemQuestion.language,
                  context: q.enemQuestion.context,
                  files: q.enemQuestion.files as any,
                  alternativesIntroduction: q.enemQuestion.alternativesIntroduction,
                  alternatives: q.enemQuestion.alternatives as any,
                }) : undefined,
              })),
        lastAttempt: n.attempts[0]
          ? {
              completedAt: toIso(n.attempts[0].completedAt),
              correctCount: n.attempts[0].correctCount,
              totalCount: n.attempts[0].totalCount,
              passed: n.attempts[0].passed,
              xpEarned: n.attempts[0].xpEarned,
              coinsEarned: n.attempts[0].coinsEarned,
            }
          : undefined,
      })),
    };
  },

  async getNodeDetails(userId: string, nodeId: string): Promise<JourneyNodeDetailsDto> {
    const node = await prisma.journeyNode.findUnique({
      where: { id: nodeId },
      include: {
        journey: true,
        questions: { orderBy: { order: "asc" }, include: { enemQuestion: true } },
      },
    });

    if (!node || node.journey.userId !== userId) throw new ApiError(404, "Card não encontrado.");
    if (node.status === "LOCKED") throw new ApiError(403, "Card bloqueado.");

    await ensureNodeQuestions(node.id);

    const activeAttempt = await prisma.journeyNodeAttempt.findFirst({
      where: { nodeId: node.id, userId, completedAt: null },
      orderBy: { startedAt: "desc" },
    });

    const attempt =
      activeAttempt ??
      (await prisma.journeyNodeAttempt.findFirst({
        where: { nodeId: node.id, userId, completedAt: { not: null } },
        orderBy: { startedAt: "desc" },
      }));

    const answers = attempt
      ? await prisma.journeyQuestionAnswer.findMany({
          where: { attemptId: attempt.id },
          select: { enemQuestionId: true, selectedAlternative: true, isCorrect: true },
          orderBy: { answeredAt: "asc" },
        })
      : [];

    const answerMap = new Map(answers.map((a) => [a.enemQuestionId, a]));
    const completed = Boolean(attempt?.completedAt);

    return {
      node: {
        id: node.id,
        order: node.order,
        status: node.status as any,
        year: node.year,
        discipline: node.discipline,
        language: node.language,
        minCorrect: node.minCorrect,
        totalQuestions: node.totalQuestions,
        xpPerCorrect: node.xpPerCorrect,
        coinsOnComplete: node.coinsOnComplete,
        questions: node.questions.map((q) => {
          const a = answerMap.get(q.enemQuestionId);
          return {
            id: q.id,
            order: q.order,
            enemQuestionId: q.enemQuestionId,
            question: completed
              ? toQuestionWithAnswer({
                  year: q.enemQuestion.year,
                  index: q.enemQuestion.index,
                  title: q.enemQuestion.title,
                  discipline: q.enemQuestion.discipline,
                  language: q.enemQuestion.language,
                  context: q.enemQuestion.context,
                  files: q.enemQuestion.files as any,
                  correctAlternative: q.enemQuestion.correctAlternative,
                  alternativesIntroduction: q.enemQuestion.alternativesIntroduction,
                  alternatives: q.enemQuestion.alternatives as any,
                })
              : toPublicQuestion({
                  year: q.enemQuestion.year,
                  index: q.enemQuestion.index,
                  title: q.enemQuestion.title,
                  discipline: q.enemQuestion.discipline,
                  language: q.enemQuestion.language,
                  context: q.enemQuestion.context,
                  files: q.enemQuestion.files as any,
                  alternativesIntroduction: q.enemQuestion.alternativesIntroduction,
                  alternatives: q.enemQuestion.alternatives as any,
                }),
            // selectedAlternative e isCorrect são expostos via attempt.answers (abaixo),
            // mas a UI pode preferir correlacionar usando enemQuestionId.
          };
        }),
      },
      attempt: attempt
        ? {
            id: attempt.id,
            completedAt: toIso(attempt.completedAt),
            passed: attempt.passed,
            correctCount: attempt.correctCount,
            totalCount: attempt.totalCount,
            answers: answers.map((a) => ({
              enemQuestionId: a.enemQuestionId,
              selectedAlternative: a.selectedAlternative,
              ...(completed ? { isCorrect: a.isCorrect } : {}),
            })),
          }
        : null,
    };
  },

  async retryNode(userId: string, nodeId: string): Promise<RetryNodeResponseDto> {
    const node = await prisma.journeyNode.findUnique({ where: { id: nodeId }, include: { journey: true } });
    if (!node || node.journey.userId !== userId) throw new ApiError(404, "Card não encontrado.");
    if (node.status === "LOCKED") throw new ApiError(403, "Card bloqueado.");

    const attempt = await prisma.journeyNodeAttempt.create({ data: { nodeId: node.id, userId } });
    return { nodeId: node.id, attemptId: attempt.id };
  },

  async finalizeNode(userId: string, nodeId: string, log?: Logger): Promise<FinalizeNodeResponseDto> {
    const node = await prisma.journeyNode.findUnique({
      where: { id: nodeId },
      include: {
        journey: true,
        questions: { orderBy: { order: "asc" }, include: { enemQuestion: true } },
      },
    });

    if (!node || node.journey.userId !== userId) throw new ApiError(404, "Card não encontrado.");
    if (node.status === "LOCKED") throw new ApiError(403, "Card bloqueado.");

    await ensureNodeQuestions(node.id);

    const attempt = await prisma.journeyNodeAttempt.findFirst({
      where: { nodeId: node.id, userId, completedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (!attempt) throw new ApiError(400, "Nenhuma tentativa em andamento.");

    const answers = await prisma.journeyQuestionAnswer.findMany({
      where: { attemptId: attempt.id },
      select: { enemQuestionId: true, selectedAlternative: true },
      orderBy: { answeredAt: "asc" },
    });

    if (answers.length < node.totalQuestions) {
      throw new ApiError(400, "Responda todas as questões antes de finalizar.");
    }

    const answerById = new Map(answers.map((a) => [a.enemQuestionId, a]));
    const now = new Date();

    // Calcula correção por questão
    const results = node.questions.map((q) => {
      const a = answerById.get(q.enemQuestionId);
      if (!a) throw new ApiError(400, "Responda todas as questões antes de finalizar.");
      const correctAlternative = String(q.enemQuestion.correctAlternative).toUpperCase();
      const selectedAlternative = String(a.selectedAlternative).toUpperCase();
      const isCorrect = selectedAlternative === correctAlternative;

      return {
        enemQuestionId: q.enemQuestionId,
        selectedAlternative,
        correctAlternative,
        isCorrect,
        question: toQuestionWithAnswer({
          year: q.enemQuestion.year,
          index: q.enemQuestion.index,
          title: q.enemQuestion.title,
          discipline: q.enemQuestion.discipline,
          language: q.enemQuestion.language,
          context: q.enemQuestion.context,
          files: q.enemQuestion.files as any,
          correctAlternative: q.enemQuestion.correctAlternative,
          alternativesIntroduction: q.enemQuestion.alternativesIntroduction,
          alternatives: q.enemQuestion.alternatives as any,
        }),
      };
    });

    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = node.totalQuestions;
    const passed = correctCount >= node.minCorrect;
    const xpEarned = correctCount * node.xpPerCorrect;
    const coinsEarned = passed ? node.coinsOnComplete : 0;

    const txResult = await prisma.$transaction(async (tx) => {
      await tx.journeyNodeAttempt.update({
        where: { id: attempt.id },
        data: {
          completedAt: now,
          correctCount,
          totalCount,
          passed,
          xpEarned,
          coinsEarned,
        },
      });

      // Atualiza answers com isCorrect
      for (const r of results) {
        await tx.journeyQuestionAnswer.update({
          where: { attemptId_enemQuestionId: { attemptId: attempt.id, enemQuestionId: r.enemQuestionId } },
          data: { isCorrect: r.isCorrect },
        });
      }

      // Atualiza XP/coins/level + streak
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new ApiError(404, "Usuário não encontrado.");

      const nextXp = user.xp + xpEarned;
      const nextCoins = user.coins + coinsEarned;
      const nextLevel = Math.max(1, 1 + Math.floor(nextXp / 100));

      let nextStreak = user.streak;
      if (!user.lastStreakAt) {
        nextStreak = 1;
      } else if (isSameLocalDay(user.lastStreakAt, now)) {
        nextStreak = user.streak;
      } else if (isYesterdayLocalDay(user.lastStreakAt, now)) {
        nextStreak = user.streak + 1;
      } else {
        nextStreak = 1;
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: nextXp,
          coins: nextCoins,
          level: nextLevel,
          streak: nextStreak,
          lastStreakAt: now,
        },
      });

      let unlockedNextNodeId: string | null = null;

      if (passed) {
        await tx.journeyNode.update({ where: { id: node.id }, data: { status: "COMPLETED" } });

        const nextNode = await tx.journeyNode.findFirst({
          where: { journeyId: node.journeyId, order: node.order + 1 },
          select: { id: true, status: true },
        });

        if (nextNode && nextNode.status === "LOCKED") {
          await tx.journeyNode.update({ where: { id: nextNode.id }, data: { status: "AVAILABLE" } });
          unlockedNextNodeId = nextNode.id;
        }
      }

      await tx.journey.update({ where: { id: node.journeyId }, data: { updatedAt: now } });

      const streakRow = await tx.user.findUnique({ where: { id: userId }, select: { streak: true } });

      return {
        unlockedNextNodeId,
        streak: streakRow?.streak ?? 0,
      };
    });

    // Se desbloqueou próximo node, valida sanidade (pré-criado)
    if (txResult.unlockedNextNodeId) {
      await ensureNodeQuestions(txResult.unlockedNextNodeId);
    }

    return {
      nodeId: node.id,
      attempt: {
        id: attempt.id,
        correctCount,
        totalCount,
        completedAt: now.toISOString(),
        passed,
      },
      rewards: {
        xpEarned,
        coinsEarned,
        streak: txResult.streak,
        unlockedNextNodeId: txResult.unlockedNextNodeId,
      },
      results,
    };
  },

  async answerNode(
    userId: string,
    nodeId: string,
    input: { enemQuestionId: string; selectedAlternative: string },
    log?: Logger,
  ): Promise<AnswerSaveResponseDto> {
    const selected = input.selectedAlternative.trim().toUpperCase();
    if (!/^[A-E]$/.test(selected)) throw new ApiError(400, "Alternativa inválida.");

    const node = await prisma.journeyNode.findUnique({
      where: { id: nodeId },
      include: {
        journey: true,
        questions: { orderBy: { order: "asc" } },
      },
    });

    if (!node || node.journey.userId !== userId) throw new ApiError(404, "Card não encontrado.");

    if (node.status === "LOCKED") throw new ApiError(403, "Card bloqueado.");

    await ensureNodeQuestions(node.id);

    const belongs = node.questions.some((q) => q.enemQuestionId === input.enemQuestionId);
    if (!belongs) throw new ApiError(400, "Questão não pertence a este card.");

    // Não buscamos da enem.dev em runtime; a fonte é o banco pré-carregado.
    const q = await prisma.enemQuestion.findUnique({ where: { id: input.enemQuestionId } });
    if (!q) throw new ApiError(503, "Questão indisponível no banco. Rode a pré-carga (npm run enem:sync)." );

    const now = new Date();

    const attempt = await prisma.$transaction(async (tx) => {
      // Pega ou cria a tentativa ativa.
      let attemptRow = await tx.journeyNodeAttempt.findFirst({
        where: { nodeId: node.id, userId, completedAt: null },
        orderBy: { startedAt: "desc" },
      });

      if (!attemptRow) {
        // Se o node é COMPLETED e não há tentativa ativa, o usuário deve usar retry.
        if (node.status === "COMPLETED") {
          throw new ApiError(400, "Card já concluído. Clique em 'Tentar de novo' para refazer.");
        }
        attemptRow = await tx.journeyNodeAttempt.create({ data: { nodeId: node.id, userId } });
      }

      await tx.journeyQuestionAnswer.upsert({
        where: { attemptId_enemQuestionId: { attemptId: attemptRow.id, enemQuestionId: input.enemQuestionId } },
        update: {
          selectedAlternative: selected,
          answeredAt: now,
        },
        create: {
          attemptId: attemptRow.id,
          enemQuestionId: input.enemQuestionId,
          selectedAlternative: selected,
          isCorrect: false,
          answeredAt: now,
        },
      });

      const answeredCount = await tx.journeyQuestionAnswer.count({ where: { attemptId: attemptRow.id } });

      await tx.journeyNodeAttempt.update({
        where: { id: attemptRow.id },
        data: {
          totalCount: answeredCount,
        },
      });

      return { id: attemptRow.id, answeredCount, completedAt: attemptRow.completedAt };
    });

    return {
      nodeId,
      enemQuestionId: input.enemQuestionId,
      selectedAlternative: selected,
      attempt: {
        id: attempt.id,
        answeredCount: attempt.answeredCount,
        totalQuestions: node.totalQuestions,
        completedAt: toIso(attempt.completedAt),
      },
    };
  },
};
