import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { enemService } from "./enem.service";

const yearSchema = z.coerce.number().int().positive();
const indexSchema = z.coerce.number().int().positive();

const listQuestionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  language: z.string().min(1).max(30).optional(),
});

const languageQuerySchema = z.object({
  language: z.string().min(1).max(30).optional(),
});

export const enemController = {
  async listProvas(req: Request, res: Response, next: NextFunction) {
    try {
      const log = req.log;
      const data = await enemService.listExams(log);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  async getProva(req: Request, res: Response, next: NextFunction) {
    try {
      const year = yearSchema.parse(req.params.year);
      const log = req.log;
      const data = await enemService.getExamByYear(year, log);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  async listQuestoes(req: Request, res: Response, next: NextFunction) {
    try {
      const year = yearSchema.parse(req.params.year);
      const query = listQuestionsQuerySchema.parse(req.query);
      const log = req.log;
      const data = await enemService.listQuestions(year, query, log);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  async getQuestao(req: Request, res: Response, next: NextFunction) {
    try {
      const year = yearSchema.parse(req.params.year);
      const index = indexSchema.parse(req.params.index);
      const { language } = languageQuerySchema.parse(req.query);
      const log = req.log;
      const data = await enemService.getQuestionByIndex(year, index, language, log);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },
};
