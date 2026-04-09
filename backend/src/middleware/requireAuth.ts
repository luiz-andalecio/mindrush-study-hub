import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../security/tokens";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token ausente." });
  }

  try {
    const { userId, email } = verifyAccessToken(token);
    req.user = { userId, email };
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido." });
  }
}
