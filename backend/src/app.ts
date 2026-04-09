import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./env";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { requireAuth } from "./middleware/requireAuth";
import { authRouter } from "./routes/auth";
import { chatbotRouter } from "./routes/chatbot";
import { essaysRouter } from "./routes/essays";
import { healthRouter } from "./routes/health";
import { questionsRouter } from "./routes/questions";
import { rankingRouter } from "./routes/ranking";
import { simuladosRouter } from "./routes/simulados";
import { usersRouter } from "./routes/users";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  // Em dev, o recomendado é usar o proxy do Vite.
  // Mesmo assim, deixamos CORS configurável para testes sem proxy.
  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true,
      credentials: true,
    }),
  );

  // Base path /api para ficar compatível com o backend Spring anterior.
  const api = express.Router();
  api.use(healthRouter);
  api.use("/auth", authRouter);
  api.use("/questions", questionsRouter); // GET liberado no backend antigo

  // Protegidas
  api.use(requireAuth);
  api.use("/users", usersRouter);
  api.use("/ranking", rankingRouter);
  api.use("/simulados", simuladosRouter);
  api.use("/essays", essaysRouter);
  api.use("/chatbot", chatbotRouter);

  app.use("/api", api);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
