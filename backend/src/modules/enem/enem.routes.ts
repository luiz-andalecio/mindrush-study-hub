import { Router } from "express";
import { enemController } from "./enem.controller";

export const enemRouter = Router();

// Base: /api/enem
// Provas
enemRouter.get("/provas", enemController.listProvas);

// Detalhe de prova
enemRouter.get("/provas/:year", enemController.getProva);

// Questões da prova (paginado)
enemRouter.get("/provas/:year/questoes", enemController.listQuestoes);

// Detalhe de questão por número na prova
enemRouter.get("/provas/:year/questoes/:index", enemController.getQuestao);
