import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { journeyService } from "./journey.service";

const createJourneySchema = z.object({
  area: z.enum(["Linguagens", "Ciências Humanas", "Ciências da Natureza", "Matemática"]),
  // Só usado quando area === "Linguagens"
  language: z.string().min(1).max(30).optional(),
});

const idSchema = z.string().uuid();

const answerSchema = z.object({
  enemQuestionId: z.string().min(1).max(64),
  selectedAlternative: z.string().min(1).max(1),
});

export const journeyController = {
  async listJourneys(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data = await journeyService.listJourneys(userId);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  async createJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const body = createJourneySchema.parse(req.body);
      const data = await journeyService.createJourney(userId, body, req.log);
      return res.status(201).json(data);
    } catch (err) {
      return next(err);
    }
  },

  async getJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const id = idSchema.parse(req.params.id);
      const data = await journeyService.getJourney(userId, id, req.log);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  async answer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const nodeId = idSchema.parse(req.params.nodeId);
      const body = answerSchema.parse(req.body);
      const data = await journeyService.answerNode(userId, nodeId, body, req.log);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  async getNodeDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const nodeId = idSchema.parse(req.params.nodeId);
      const data = await journeyService.getNodeDetails(userId, nodeId);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  async finalizeNode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const nodeId = idSchema.parse(req.params.nodeId);
      const data = await journeyService.finalizeNode(userId, nodeId, req.log);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  async retryNode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const nodeId = idSchema.parse(req.params.nodeId);
      const data = await journeyService.retryNode(userId, nodeId);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },
};
