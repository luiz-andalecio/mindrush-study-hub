import { Router } from "express";
import { prisma } from "../db/prisma";

export const rankingRouter = Router();

rankingRouter.get("/", async (_req, res, next) => {
  try {
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
  } catch (err) {
    return next(err);
  }
});
