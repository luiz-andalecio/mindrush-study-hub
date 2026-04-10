import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../security/tokens";
import { logger } from "../logger";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    const log = req.log ?? logger;
    log.warn(
      {
        requestId: req.requestId,
        hasAuthorizationHeader: Boolean(header),
        scheme: scheme || null,
      },
      "Auth rejeitado: token ausente",
    );
    return res.status(401).json({ message: "Token ausente." });
  }

  try {
    const { userId, email } = verifyAccessToken(token);
    req.user = { userId, email };
    return next();
  } catch {
    const log = req.log ?? logger;
    log.warn(
      {
        requestId: req.requestId,
        tokenLength: token.length,
      },
      "Auth rejeitado: token inválido",
    );
    return res.status(401).json({ message: "Token inválido." });
  }
}
