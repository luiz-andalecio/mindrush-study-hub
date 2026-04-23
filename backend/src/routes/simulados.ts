import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors";
import { simuladosService } from "../modules/simulados/simulados.service";

export const simuladosRouter = Router();

simuladosRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");
    const list = await simuladosService.listSimulados(userId);
    return res.json(list);
  } catch (err) {
    return next(err);
  }
});

// Histórico de tentativas concluídas (todas as vezes que o usuário fez/refez)
simuladosRouter.get("/history", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");
    const out = await simuladosService.listCompletedAttemptHistory(userId);
    return res.json(out);
  } catch (err) {
    return next(err);
  }
});

// Inicia um simulado (id = simuladoId no formato YYYY-d1/ YYYY-d2, ex.: 2023-d1)
simuladosRouter.post("/:id/start", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");

    const body = z
      .object({
        languageChoice: z.string().optional(),
      })
      .default({})
      .parse(req.body);

    const attempt = await simuladosService.startSimulado(userId, req.params.id, { languageChoice: body.languageChoice ?? null });
    return res.json(attempt);
  } catch (err) {
    return next(err);
  }
});

// Carrega tentativa em andamento (id = attemptId)
simuladosRouter.get("/:id", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");
    const attempt = await simuladosService.getAttempt(userId, req.params.id);
    return res.json(attempt);
  } catch (err) {
    return next(err);
  }
});

// Salva 1 resposta durante o simulado (id = attemptId)
simuladosRouter.post("/:id/answer", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");

    const body = z
      .object({
        enemQuestionId: z.string().min(1),
        selectedAlternative: z.string().min(1).max(2),
        flagged: z.boolean().optional(),
      })
      .parse(req.body);

    const out = await simuladosService.saveAnswer(userId, req.params.id, body);
    return res.json(out);
  } catch (err) {
    return next(err);
  }
});

// Finaliza e corrige (id = attemptId)
simuladosRouter.post("/:id/submit", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");

    const body = z
      .object({
        answers: z.record(z.string(), z.string()).optional(),
      })
      .default({})
      .parse(req.body);

    const result = await simuladosService.submit(userId, req.params.id, body.answers);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

// Pausar timer (id = attemptId)
simuladosRouter.post("/:id/pause", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");
    const out = await simuladosService.pause(userId, req.params.id);
    return res.json(out);
  } catch (err) {
    return next(err);
  }
});

// Retomar timer (id = attemptId)
simuladosRouter.post("/:id/resume", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");
    const out = await simuladosService.resume(userId, req.params.id);
    return res.json(out);
  } catch (err) {
    return next(err);
  }
});

// Reiniciar prova (id = attemptId)
simuladosRouter.post("/:id/restart", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");
    const attempt = await simuladosService.restart(userId, req.params.id);
    return res.json(attempt);
  } catch (err) {
    return next(err);
  }
});

// Retorna resultado corrigido (id = attemptId)
simuladosRouter.get("/:id/result", async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, "Não autenticado.");
    const result = await simuladosService.getResult(userId, req.params.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});
