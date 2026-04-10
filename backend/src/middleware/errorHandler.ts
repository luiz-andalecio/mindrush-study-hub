import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../errors";
import { logger } from "../logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    logger.warn("Requisição inválida (Zod)", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      issuesCount: err.issues.length,
    });
    return res.status(400).json({ message: "Dados inválidos.", issues: err.issues });
  }

  if (err instanceof ApiError) {
    logger.warn("Erro de aplicação", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: err.status,
      message: err.message,
    });
    return res.status(err.status).json({ message: err.message });
  }

  // Prisma: violação de unique (email)
  if (typeof err === "object" && err && "code" in err) {
    const anyErr = err as { code?: string };
    if (anyErr.code === "P2002") {
      logger.warn("Conflito (Prisma P2002)", {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
      });
      return res.status(409).json({ message: "Já existe um usuário cadastrado com esse e-mail." });
    }
  }

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error("Erro inesperado", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    message,
    stack,
  });

  // Evita vazar detalhes internos para o frontend.
  return res.status(500).json({ message: "Erro interno do servidor." });
}
