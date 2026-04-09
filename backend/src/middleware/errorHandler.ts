import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: "Dados inválidos.", issues: err.issues });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Prisma: violação de unique (email)
  if (typeof err === "object" && err && "code" in err) {
    const anyErr = err as { code?: string };
    if (anyErr.code === "P2002") {
      return res.status(409).json({ message: "Já existe um usuário cadastrado com esse e-mail." });
    }
  }

  // Evita vazar detalhes internos para o frontend.
  return res.status(500).json({ message: "Erro interno do servidor." });
}
