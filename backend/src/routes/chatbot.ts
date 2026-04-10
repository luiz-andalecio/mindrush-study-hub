import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const chatbotRouter = Router();

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const historyByUser = new Map<string, ChatMessage[]>();

const sendSchema = z.object({
  message: z.string().min(1).max(4000),
});

chatbotRouter.get("/history", (req, res) => {
  const userId = req.user!.userId;
  return res.json(historyByUser.get(userId) ?? []);
});

chatbotRouter.post("/", (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const body = sendSchema.parse(req.body);

    const now = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: randomUUID(),
      role: "user",
      content: body.message,
      timestamp: now,
    };

    const assistantMsg: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content: `MVP: ainda sem IA. Você disse: ${body.message}`,
      timestamp: new Date().toISOString(),
    };

    const history = historyByUser.get(userId) ?? [];
    history.push(userMsg, assistantMsg);
    historyByUser.set(userId, history);

    return res.status(201).json(assistantMsg);
  } catch (err) {
    return next(err);
  }
});
