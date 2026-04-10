import type { NextFunction, Request, Response } from "express";
import { env } from "../env";
import { logger } from "../logger";

// Double Submit Cookie:
// - backend define um cookie NÃO httpOnly com um token aleatório (csrf cookie)
// - frontend lê esse cookie e manda no header x-csrf-token
// - backend valida header === cookie
// Isso mitiga CSRF mesmo quando usamos refresh token em cookie httpOnly.

function isOriginAllowed(origin: string) {
  if (!origin) return false;
  if (!env.corsOrigins.length) return true; // fallback dev
  return env.corsOrigins.includes(origin);
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const csrfCookie = req.cookies?.[env.csrfCookieName];
  const csrfHeader = req.header("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    logger.warn("CSRF rejeitado", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      hasCookie: Boolean(csrfCookie),
      hasHeader: Boolean(csrfHeader),
      matches: Boolean(csrfCookie && csrfHeader && csrfCookie === csrfHeader),
      origin: req.header("origin") ?? null,
    });
    return res.status(403).json({ message: "CSRF token ausente ou inválido." });
  }

  // Defesa extra: valida Origin quando presente.
  // Em dev com proxy do Vite, as requisições são same-origin e o Origin pode vir vazio.
  const origin = req.header("origin");
  if (origin && !isOriginAllowed(origin)) {
    logger.warn("CSRF origem rejeitada", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      origin,
    });
    return res.status(403).json({ message: "Origem não permitida." });
  }

  return next();
}
