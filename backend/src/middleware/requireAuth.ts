import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";

type JwtPayload = {
  sub?: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token ausente." });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const email = decoded.sub;
    if (!email) return res.status(401).json({ message: "Token inválido." });
    req.user = { email };
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido." });
  }
}
