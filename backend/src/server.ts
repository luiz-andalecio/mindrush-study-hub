import { createApp } from "./app";
import { env } from "./env";
import { prisma } from "./db/prisma";
import { logger } from "./logger";

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`MindRush API (Express) em http://localhost:${env.port}/api`);
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
