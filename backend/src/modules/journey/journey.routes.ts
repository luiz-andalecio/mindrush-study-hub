import { Router } from "express";
import { journeyController } from "./journey.controller";

export const journeyRouter = Router();

// Base: /api/journey (rotas protegidas por requireAuth no app.ts)
journeyRouter.get("/", journeyController.listJourneys);
journeyRouter.post("/", journeyController.createJourney);
journeyRouter.get("/:id", journeyController.getJourney);
// Rotas de Node (evita conflito com GET /:id)
journeyRouter.get("/nodes/:nodeId", journeyController.getNodeDetails);
journeyRouter.post("/nodes/:nodeId/answer", journeyController.answer);
journeyRouter.post("/nodes/:nodeId/finalize", journeyController.finalizeNode);
journeyRouter.post("/nodes/:nodeId/retry", journeyController.retryNode);

// Compat (legado)
journeyRouter.post("/:nodeId/answer", journeyController.answer);
