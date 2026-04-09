import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "../db/prisma";
import { env } from "../env";
import { ApiError } from "../errors";
import { requireCsrf } from "../middleware/requireCsrf";
import { randomToken, sha256, signAccessToken, signRefreshToken, verifyRefreshToken } from "../security/tokens";

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

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/api/auth",
  };
}

function csrfCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/api",
  };
}

function clearAuthCookies(res: any) {
  res.clearCookie(env.refreshCookieName, { ...cookieOptions(), signed: true });
  res.clearCookie(env.csrfCookieName, { ...csrfCookieOptions() });
}

function setRefreshCookie(res: any, refreshToken: string) {
  res.cookie(env.refreshCookieName, refreshToken, { ...cookieOptions(), signed: true });
}

function setCsrfCookie(res: any, csrfToken: string) {
  res.cookie(env.csrfCookieName, csrfToken, csrfCookieOptions());
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

    // Cria sessão + refresh em cookie (httpOnly) e retorna access token no body.
    // Access token fica em memória no frontend.
    const sessionId = randomUUID?.() ?? randomToken(16);
    const refreshToken = signRefreshToken(user.id, sessionId);
    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: sha256(refreshToken),
        csrfToken: randomToken(32),
        userAgent: req.header("user-agent") ?? undefined,
        ip: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: { csrfToken: true },
    });

    setRefreshCookie(res, refreshToken);
    setCsrfCookie(res, session.csrfToken);

    const token = signAccessToken({ sub: user.id, email: user.email });
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

    const sessionId = randomUUID?.() ?? randomToken(16);
    const refreshToken = signRefreshToken(user.id, sessionId);

    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: sha256(refreshToken),
        csrfToken: randomToken(32),
        userAgent: req.header("user-agent") ?? undefined,
        ip: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: { csrfToken: true },
    });

    setRefreshCookie(res, refreshToken);
    setCsrfCookie(res, session.csrfToken);

    const token = signAccessToken({ sub: user.id, email: user.email });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return res.json({ token, user: toUserResponse(safeUser) });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/refresh", requireCsrf, async (req, res, next) => {
  try {
    const rawRefresh = req.signedCookies?.[env.refreshCookieName] as string | undefined;
    if (!rawRefresh) throw new ApiError(401, "Refresh token ausente.");

    const { userId, sessionId } = verifyRefreshToken(rawRefresh);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        csrfToken: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (!session || session.userId !== userId) throw new ApiError(401, "Refresh token inválido.");
    if (session.revokedAt) throw new ApiError(401, "Sessão revogada.");
    if (session.expiresAt.getTime() < Date.now()) throw new ApiError(401, "Sessão expirada.");

    if (sha256(rawRefresh) !== session.refreshTokenHash) {
      // Reuse detection (possível roubo). Revoga a sessão atual.
      await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      clearAuthCookies(res);
      throw new ApiError(401, "Refresh token inválido.");
    }

    // Rotação: revoga a sessão antiga e cria outra.
    const newSessionId = randomUUID?.() ?? randomToken(16);
    const newRefresh = signRefreshToken(userId, newSessionId);
    const newCsrf = randomToken(32);

    await prisma.$transaction([
      prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), replacedById: newSessionId },
      }),
      prisma.session.create({
        data: {
          id: newSessionId,
          userId,
          refreshTokenHash: sha256(newRefresh),
          csrfToken: newCsrf,
          userAgent: req.header("user-agent") ?? undefined,
          ip: req.ip,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // Set cookies novos
    setRefreshCookie(res, newRefresh);
    setCsrfCookie(res, newCsrf);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new ApiError(401, "Usuário não encontrado.");

    const token = signAccessToken({ sub: userId, email: user.email });
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/logout", requireCsrf, async (req, res, next) => {
  try {
    const rawRefresh = req.signedCookies?.[env.refreshCookieName] as string | undefined;
    if (rawRefresh) {
      try {
        const { sessionId } = verifyRefreshToken(rawRefresh);
        await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } }).catch(() => undefined);
      } catch {
        // Ignora token inválido e apenas limpa cookies.
      }
    }

    clearAuthCookies(res);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/forgot-password", async (_req, _res, next) => {
  // MVP: não implementado ainda.
  return next(new ApiError(501, "Recuperação de senha ainda não implementada."));
});
