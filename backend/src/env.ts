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
  // Segredos separados (boas práticas). Mantém compatibilidade com JWT_SECRET.
  accessTokenSecret: requireString("ACCESS_TOKEN_SECRET", process.env.JWT_SECRET),
  refreshTokenSecret: requireString("REFRESH_TOKEN_SECRET", process.env.JWT_SECRET),
  cookieSecret: requireString("COOKIE_SECRET", process.env.JWT_SECRET),

  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
  refreshTokenTtlRemember: process.env.REFRESH_TOKEN_TTL_REMEMBER ?? "30d",

  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? "mindrush_rt",
  csrfCookieName: process.env.CSRF_COOKIE_NAME ?? "mindrush_csrf",

  corsOrigins: csv(process.env.CORS_ORIGINS),
  databaseUrl: requireString("DATABASE_URL", buildDatabaseUrl()),

  // ENEM (enem.dev)
  // A docs usa https://api.enem.dev/v1/...
  // Para self-hosting, você pode apontar isso para a sua instância (ex.: Vercel).
  enemApiBaseUrl: process.env.ENEM_API_BASE_URL ?? "https://api.enem.dev/v1",
} as const;

for (const [key, secret] of Object.entries({
  ACCESS_TOKEN_SECRET: env.accessTokenSecret,
  REFRESH_TOKEN_SECRET: env.refreshTokenSecret,
  COOKIE_SECRET: env.cookieSecret,
})) {
  if (secret.length < 32) {
    throw new Error(`${key} precisa ter pelo menos 32 caracteres (HS256).\n`);
  }
}

