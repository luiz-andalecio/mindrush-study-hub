import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError } from "../errors";

export const essaysRouter = Router();

// Armazenamento em memória (MVP) para não bloquear o frontend.
const essaysByUser = new Map<string, Map<string, any>>();

const submitSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  theme: z.string().min(1).max(200),
});

essaysRouter.get("/", (req, res) => {
  const userId = req.user!.userId;
  const store = essaysByUser.get(userId);
  return res.json(store ? Array.from(store.values()) : []);
});

essaysRouter.post("/", (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const body = submitSchema.parse(req.body);

    const essay = {
      id: randomUUID(),
      title: body.title,
      content: body.content,
      theme: body.theme,
      score: 0,
      competencies: [],
      feedback: "",
      submittedAt: new Date().toISOString(),
    };

    if (!essaysByUser.has(userId)) essaysByUser.set(userId, new Map());
    essaysByUser.get(userId)!.set(essay.id, essay);

    return res.status(201).json(essay);
  } catch (err) {
    return next(err);
  }
});

essaysRouter.get("/:id", (req, res, next) => {
  const userId = req.user!.userId;
  const store = essaysByUser.get(userId);
  const essay = store?.get(req.params.id);
  if (!essay) return next(new ApiError(404, "Redação não encontrada."));
  return res.json(essay);
});
