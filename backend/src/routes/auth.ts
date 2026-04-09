import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { env } from "../env";
import { ApiError } from "../errors";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
});

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

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

function signToken(email: string) {
  // Tipagem do jsonwebtoken é mais estrita (expiresIn não aceita `string` genérica).
  // Usamos cast porque no .env trabalhamos com formatos como "1d", "7d", etc.
  return jwt.sign({}, env.jwtSecret, {
    subject: email,
    expiresIn: env.jwtExpiresIn as unknown as jwt.SignOptions["expiresIn"],
  });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.trim().toLowerCase();
    const name = body.name.trim();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new ApiError(409, "Já existe um usuário cadastrado com esse e-mail.");

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        level: 1,
        xp: 0,
        coins: 0,
        streak: 0,
        createdAt: new Date(),
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

    const token = signToken(user.email);
    return res.json({ token, user: toUserResponse(user) });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const email = body.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        level: true,
        xp: true,
        coins: true,
        streak: true,
      },
    });

    if (!user) throw new ApiError(401, "E-mail ou senha inválidos.");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new ApiError(401, "E-mail ou senha inválidos.");

    const token = signToken(user.email);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return res.json({ token, user: toUserResponse(safeUser) });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/forgot-password", async (_req, _res, next) => {
  // MVP: não implementado ainda.
  return next(new ApiError(501, "Recuperação de senha ainda não implementada."));
});
