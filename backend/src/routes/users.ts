import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ApiError } from "../errors";

export const usersRouter = Router();

function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: null,
    level: user.level,
    xp: user.xp,
    xpToNextLevel: 100,
    coins: user.coins,
    streak: user.streak,
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
      },
    });

    if (!user) throw new ApiError(404, "Usuário não encontrado.");
    return res.json(toUserResponse(user));
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
      },
    });

    return res.json(toUserResponse(user));
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
      },
    });

    if (!user) throw new ApiError(404, "Usuário não encontrado.");

    // MVP: estatísticas fake para a UI renderizar.
    return res.json({
      dailyProgress: 0,
      xp: user.xp,
      xpToNextLevel: 100,
      level: user.level,
      rankPosition: 0,
      simuladosCompleted: 0,
      essayScore: 0,
      streak: user.streak,
      weeklyPerformance: [
        { day: "Seg", score: 0 },
        { day: "Ter", score: 0 },
        { day: "Qua", score: 0 },
        { day: "Qui", score: 0 },
        { day: "Sex", score: 0 },
        { day: "Sáb", score: 0 },
        { day: "Dom", score: 0 },
      ],
    });
  } catch (err) {
    return next(err);
  }
});
