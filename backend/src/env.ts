import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

function loadEnv() {
  // Prioridade:
  // 1) backend/.env (quando você roda dentro da pasta backend)
  // 2) raiz/.env (compatível com o monorepo anterior)
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
  }
}

loadEnv();

function requireString(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function csv(value: string | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildDatabaseUrl() {
  // Para o Prisma CLI, é melhor setar DATABASE_URL explicitamente.
  // Mas em runtime, isto ajuda a reaproveitar o .env antigo do Spring.
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const port = process.env.DB_PORT;
  const host = process.env.DB_HOST ?? "localhost";
  const dbName = process.env.DB_NAME ?? "mindrush";

  if (!user || !password || !port) return undefined;

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?schema=public`;
}

// Se o .env antigo não tiver DATABASE_URL, tentamos derivar a partir de DB_*.
// IMPORTANTE: o Prisma Client lê process.env.DATABASE_URL em runtime.
if (!process.env.DATABASE_URL) {
  const derived = buildDatabaseUrl();
  if (derived) process.env.DATABASE_URL = derived;
}

export const env = {
  port: Number(process.env.PORT ?? process.env.SERVER_PORT ?? 8080),
  jwtSecret: requireString("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  corsOrigins: csv(process.env.CORS_ORIGINS),
  databaseUrl: requireString("DATABASE_URL", buildDatabaseUrl()),
} as const;

if (env.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres (HS256).\n");
}
