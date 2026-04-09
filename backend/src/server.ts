import { createApp } from "./app";
import { env } from "./env";
import { prisma } from "./db/prisma";

const app = createApp();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`MindRush API (Express) em http://localhost:${env.port}/api`);
});

async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`Encerrando (${signal})...`);
  server.close(() => {
    void prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
