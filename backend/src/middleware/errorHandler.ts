import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../errors";
import { logger } from "../logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const log = req.log ?? logger;

  if (err instanceof ZodError) {
    log.warn(
      {
        requestId: req.requestId,
        issuesCount: err.issues.length,
      },
      "Requisição inválida (Zod)",
    );
    return res.status(400).json({ message: "Dados inválidos.", issues: err.issues });
  }

  if (err instanceof ApiError) {
    log.warn(
      {
        requestId: req.requestId,
        status: err.status,
        message: err.message,
      },
      "Erro de aplicação",
    );
    return res.status(err.status).json({ message: err.message });
  }

  // Prisma: violação de unique (email)
  if (typeof err === "object" && err && "code" in err) {
    const anyErr = err as { code?: string };
    if (anyErr.code === "P2002") {
      log.warn(
        {
          requestId: req.requestId,
        },
        "Conflito (Prisma P2002)",
      );
      return res.status(409).json({ message: "Já existe um usuário cadastrado com esse e-mail." });
    }
  }

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  log.error(
    {
      requestId: req.requestId,
      message,
      stack,
    },
    "Erro inesperado",
  );

  // Evita vazar detalhes internos para o frontend.
  return res.status(500).json({ message: "Erro interno do servidor." });
}
