import { createApp } from "./app";
import { env } from "./env";
import { prisma } from "./db/prisma";
import { logger } from "./logger";

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`MindRush API (Express) em http://localhost:${env.port}/api`);
});

server.on("error", (err: any) => {
  if (err?.code === "EADDRINUSE") {
    logger.error(
      { port: env.port },
      `Porta ${env.port} já está em uso. Finalize o processo que está ouvindo nela ou rode com outra porta (ex.: PORT=8082 npm run dev).`,
    );
    process.exit(1);
  }

  throw err;
});

async function shutdown(signal: string) {
  logger.info(`Encerrando (${signal})...`);
  server.close(() => {
    void prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
