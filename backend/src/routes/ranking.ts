import { Router } from "express";
import { prisma } from "../db/prisma";

export const rankingRouter = Router();

type RankingScope = "world" | "weekly" | "daily";

function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfLocalWeek(date: Date) {
  // Segunda-feira como início da semana.
  const d = startOfLocalDay(date);
  const jsDay = d.getDay(); // 0=Dom, 1=Seg...
  const mondayOffset = (jsDay + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return d;
}

function parseScope(raw: unknown): RankingScope {
  const v = String(raw ?? "world").toLowerCase();
  if (v === "daily" || v === "weekly" || v === "world") return v;
  return "world";
}

rankingRouter.get("/", async (req, res, next) => {
  try {
    const scope = parseScope(req.query.scope);

    // Ranking mundial: XP total do usuário.
    if (scope === "world") {
      const users = await prisma.user.findMany({
        take: 20,
        orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          xp: true,
          level: true,
        },
      });

      const leaderboard = users.map((u, idx) => ({
        position: idx + 1,
        userId: u.id,
        name: u.name,
        avatar: null,
        xp: u.xp,
        level: u.level,
        score: u.xp,
      }));

      return res.json(leaderboard);
    }

    // Semanal/diário: XP ganho no período (soma Jornada + Simulados).
    const now = new Date();
    const rangeStart = scope === "daily" ? startOfLocalDay(now) : startOfLocalWeek(now);
    const rangeEnd = scope === "daily" ? addDays(rangeStart, 1) : addDays(rangeStart, 7);

    const [journeyAgg, simuladoAgg] = await Promise.all([
      prisma.journeyNodeAttempt.groupBy({
        by: ["userId"],
        where: {
          completedAt: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },
        _sum: { xpEarned: true },
      }),
      prisma.simuladoAttempt.groupBy({
        by: ["userId"],
        where: {
          status: "COMPLETED",
          completedAt: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },
        _sum: { xpEarned: true },
      }),
    ]);

    const scoreByUserId = new Map<string, number>();
    for (const row of journeyAgg) {
      scoreByUserId.set(row.userId, (scoreByUserId.get(row.userId) ?? 0) + (row._sum.xpEarned ?? 0));
    }
    for (const row of simuladoAgg) {
      scoreByUserId.set(row.userId, (scoreByUserId.get(row.userId) ?? 0) + (row._sum.xpEarned ?? 0));
    }

    const userIds = Array.from(scoreByUserId.keys());
    if (userIds.length === 0) return res.json([]);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        createdAt: true,
      },
    });

    const sorted = users
      .map((u) => ({
        ...u,
        score: scoreByUserId.get(u.id) ?? 0,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, 20);

    const leaderboard = sorted.map((u, idx) => ({
      position: idx + 1,
      userId: u.id,
      name: u.name,
      avatar: null,
      xp: u.score,
      level: u.level,
      score: u.score,
    }));

    return res.json(leaderboard);
  } catch (err) {
    return next(err);
  }
});
