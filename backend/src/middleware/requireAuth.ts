import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../security/tokens";
import { logger } from "../logger";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    logger.warn("Auth rejeitado: token ausente", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      hasAuthorizationHeader: Boolean(header),
      scheme: scheme || null,
    });
    return res.status(401).json({ message: "Token ausente." });
  }

  try {
    const { userId, email } = verifyAccessToken(token);
    req.user = { userId, email };
    return next();
  } catch {
    logger.warn("Auth rejeitado: token inválido", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      tokenLength: token.length,
    });
    return res.status(401).json({ message: "Token inválido." });
  }
}
