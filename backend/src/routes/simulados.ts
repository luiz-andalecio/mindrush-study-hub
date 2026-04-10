import { Router } from "express";
import { ApiError } from "../errors";

export const simuladosRouter = Router();

simuladosRouter.get("/", (_req, res) => {
  return res.json([]);
});

simuladosRouter.post("/:id/start", (_req, _res, next) => {
  return next(new ApiError(501, "Iniciar simulado ainda não implementado."));
});

simuladosRouter.post("/:id/submit", (_req, _res, next) => {
  return next(new ApiError(501, "Enviar simulado ainda não implementado."));
});

simuladosRouter.get("/:id/result", (_req, _res, next) => {
  return next(new ApiError(501, "Resultado de simulado ainda não implementado."));
});
