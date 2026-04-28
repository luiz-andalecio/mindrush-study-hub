import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ApiError } from "../errors";

export const usersRouter = Router();

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

function computeLevelFromXp(xp: number) {
  return Math.max(1, 1 + Math.floor(Math.max(0, xp) / 100));
}

function computeXpToNextLevel(xp: number) {
  const lvl = computeLevelFromXp(xp);
  const nextThreshold = lvl * 100;
  return Math.max(0, nextThreshold - xp);
}

async function computeRankPositionByXp(xp: number) {
  const higher = await prisma.user.count({ where: { xp: { gt: xp } } });
  return higher + 1;
}

async function normalizeStreak(userId: string, current: { streak: number; lastStreakAt: Date | null }) {
  if (!current.lastStreakAt) return { streak: current.streak, lastStreakAt: current.lastStreakAt };

  const now = new Date();
  const ok = isSameLocalDay(current.lastStreakAt, now) || isYesterdayLocalDay(current.lastStreakAt, now);
  if (ok) return { streak: current.streak, lastStreakAt: current.lastStreakAt };

  if (current.streak === 0) return { streak: 0, lastStreakAt: current.lastStreakAt };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { streak: 0 },
    select: { streak: true, lastStreakAt: true },
  });

  return updated;
}

function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  lastStreakAt: Date | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: null,
    level: computeLevelFromXp(user.xp),
    xp: user.xp,
    xpToNextLevel: computeXpToNextLevel(user.xp),
    coins: user.coins,
    streak: user.streak,
    // rankPosition é preenchido nas rotas (depende de query)
    rankPosition: 0,
    badges: [],
    achievements: [],
  };
}

usersRouter.get("/me", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Token inválido.");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        xp: true,
        coins: true,
        streak: true,
        lastStreakAt: true,
      },
    });

    if (!user) throw new ApiError(404, "Usuário não encontrado.");

    const normalized = await normalizeStreak(userId, { streak: user.streak, lastStreakAt: user.lastStreakAt });
    const rankPosition = await computeRankPositionByXp(user.xp);

    return res.json({
      ...toUserResponse({ ...user, streak: normalized.streak, lastStreakAt: normalized.lastStreakAt }),
      rankPosition,
    });
  } catch (err) {
    return next(err);
  }
});

const patchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
  })
  .passthrough();

usersRouter.put("/me", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Token inválido.");

    const patch = patchSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(patch.name ? { name: patch.name.trim() } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        xp: true,
        coins: true,
        streak: true,
        lastStreakAt: true,
      },
    });

    const normalized = await normalizeStreak(userId, { streak: user.streak, lastStreakAt: user.lastStreakAt });
    const rankPosition = await computeRankPositionByXp(user.xp);

    return res.json({
      ...toUserResponse({ ...user, streak: normalized.streak, lastStreakAt: normalized.lastStreakAt }),
      rankPosition,
    });
  } catch (err) {
    // Prisma lança erro se não encontrar o registro
    if (typeof err === "object" && err && "code" in err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "P2025") {
        return next(new ApiError(404, "Usuário não encontrado."));
      }
    }

    return next(err);
  }
});

usersRouter.get("/me/dashboard", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Token inválido.");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,
        xp: true,
        streak: true,
        lastStreakAt: true,
      },
    });

    if (!user) throw new ApiError(404, "Usuário não encontrado.");

    const normalized = await normalizeStreak(userId, { streak: user.streak, lastStreakAt: user.lastStreakAt });

    const now = new Date();
    const todayStart = startOfLocalDay(now);

    const [simuladosCompleted, dailyJourney, dailySimulados] = await Promise.all([
      prisma.simuladoAttempt.count({ where: { userId, status: "COMPLETED" } }),
      prisma.journeyNodeAttempt.aggregate({
        where: { userId, completedAt: { gte: todayStart } },
        _sum: { totalCount: true },
      }),
      prisma.simuladoAttempt.aggregate({
        where: { userId, status: "COMPLETED", completedAt: { gte: todayStart } },
        _sum: { totalCount: true },
      }),
    ]);

    const dailyQuestions = (dailyJourney._sum.totalCount ?? 0) + (dailySimulados._sum.totalCount ?? 0);
    const dailyGoal = 50;
    const dailyProgress = Math.min(100, Math.round((dailyQuestions / dailyGoal) * 100));

    // XP ganho nos últimos 7 dias (inclui hoje)
    const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const weeklyPerformance = await Promise.all(
      Array.from({ length: 7 }).map(async (_, idx) => {
        const dayOffset = 6 - idx;
        const dayStart = startOfLocalDay(new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000));
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);

        const [j, s] = await Promise.all([
          prisma.journeyNodeAttempt.aggregate({
            where: { userId, completedAt: { gte: dayStart, lt: dayEnd } },
            _sum: { xpEarned: true },
          }),
          prisma.simuladoAttempt.aggregate({
            where: { userId, status: "COMPLETED", completedAt: { gte: dayStart, lt: dayEnd } },
            _sum: { xpEarned: true },
          }),
        ]);

        return {
          day: dayLabels[dayStart.getDay()],
          score: (j._sum.xpEarned ?? 0) + (s._sum.xpEarned ?? 0),
        };
      }),
    );

    const rankPosition = await computeRankPositionByXp(user.xp);

    return res.json({
      dailyProgress,
      xp: user.xp,
      xpToNextLevel: computeXpToNextLevel(user.xp),
      level: computeLevelFromXp(user.xp),
      rankPosition,
      simuladosCompleted,
      // Ainda não temos redações como métrica consolidada.
      essayScore: 0,
      streak: normalized.streak,
      weeklyPerformance,
    });
  } catch (err) {
    return next(err);
  }
});

usersRouter.get("/me/profile-stats", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Token inválido.");

    const [journeyAgg, simuladoAgg, simuladosCompleted] = await Promise.all([
      prisma.journeyNodeAttempt.aggregate({
        where: { userId, completedAt: { not: null } },
        _sum: { totalCount: true, correctCount: true },
      }),
      prisma.simuladoAttempt.aggregate({
        where: { userId, status: "COMPLETED" },
        _sum: { totalCount: true, correctCount: true },
      }),
      prisma.simuladoAttempt.count({ where: { userId, status: "COMPLETED" } }),
    ]);

    const totalQuestions = (journeyAgg._sum.totalCount ?? 0) + (simuladoAgg._sum.totalCount ?? 0);
    const totalCorrect = (journeyAgg._sum.correctCount ?? 0) + (simuladoAgg._sum.correctCount ?? 0);
    const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

    return res.json({
      questionsResolved: totalQuestions,
      simuladosCompleted,
      essaysSubmitted: null,
      studyHours: null,
      bestStreak: null,
      averageAccuracy: accuracy,
    });
  } catch (err) {
    return next(err);
  }
});
