import { Router } from "express";
import { ApiError } from "../errors";
import { requireAuth } from "../middleware/requireAuth";

export const questionsRouter = Router();

// MVP: ainda não temos banco de questões.
questionsRouter.get("/", (_req, res) => {
  return res.json([]);
});

questionsRouter.get("/:id", (_req, _res, next) => {
  return next(new ApiError(404, "Questão não encontrada."));
});

questionsRouter.post("/:id/answer", requireAuth, (_req, _res, next) => {
  return next(new ApiError(501, "Envio de resposta ainda não implementado."));
});
