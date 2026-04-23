import type { Logger } from "pino";
import type { EnemApiErrorResponse } from "./enem.types";

export class EnemApiHttpError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly docUrl?: string;
  public readonly retryAfterMs?: number;

  constructor(opts: {
    status: number;
    message: string;
    code?: string;
    docUrl?: string;
    retryAfterMs?: number;
  }) {
    super(opts.message);
    this.status = opts.status;
    this.code = opts.code;
    this.docUrl = opts.docUrl;
    this.retryAfterMs = opts.retryAfterMs;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function jitter(ms: number) {
  // jitter simples (0%..20%)
  const factor = 1 + Math.random() * 0.2;
  return Math.round(ms * factor);
}

export type EnemApiClientOptions = {
  baseUrl: string; // ex.: https://api.enem.dev/v1
  timeoutMs?: number;
  maxRetries?: number;
};

export class EnemApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(opts: EnemApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.maxRetries = opts.maxRetries ?? 4;
  }

  async getJson<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
    log?: Logger,
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }

    return this.requestWithRetry<T>(url, log);
  }

  private async requestWithRetry<T>(url: URL, log?: Logger): Promise<T> {
    let attempt = 0;
    let backoffMs = 250;

    while (true) {
      attempt += 1;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
          signal: controller.signal,
        });

        // Debug útil para entender rate-limit em dev.
        const rateLimit = {
          limit: res.headers.get("x-ratelimit-limit"),
          remaining: res.headers.get("x-ratelimit-remaining"),
          reset: res.headers.get("x-ratelimit-reset"),
          retryAfter: res.headers.get("retry-after"),
        };
        if (rateLimit.limit || rateLimit.remaining || rateLimit.reset || rateLimit.retryAfter) {
          log?.debug({ url: url.toString(), rateLimit }, "enem.dev rate-limit headers");
        }

        if (res.ok) {
          const data = (await res.json()) as T;
          return data;
        }

        const retryAfterMs = parseRetryAfterMs(res.headers.get("retry-after"));

        // Tenta ler o formato de erro padronizado da API.
        let apiError: EnemApiErrorResponse | undefined;
        try {
          apiError = (await res.json()) as EnemApiErrorResponse;
        } catch {
          // ignore
        }

        const message = apiError?.error?.message ?? `HTTP ${res.status}`;
        const code = apiError?.error?.code;
        const docUrl = apiError?.error?.docUrl;

        const httpError = new EnemApiHttpError({
          status: res.status,
          message,
          code,
          docUrl,
          retryAfterMs,
        });

        // Retry apenas em 429 e 5xx.
        const canRetry = res.status === 429 || (res.status >= 500 && res.status <= 599);
        if (!canRetry || attempt > this.maxRetries) {
          throw httpError;
        }

        const waitMs =
          res.status === 429 && retryAfterMs !== undefined
            ? retryAfterMs
            : backoffMs;

        log?.warn(
          {
            url: url.toString(),
            status: res.status,
            code,
            attempt,
            waitMs,
          },
          "Falha ao chamar enem.dev; tentando novamente",
        );

        await sleep(jitter(waitMs));
        backoffMs = Math.min(backoffMs * 2, 4_000);
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";

        // Em timeout/erro de rede, também vale retry (até o limite).
        if ((isAbort || err instanceof TypeError) && attempt <= this.maxRetries) {
          log?.warn(
            {
              url: url.toString(),
              attempt,
              error: err instanceof Error ? err.message : String(err),
            },
            "Erro de rede/timeout ao chamar enem.dev; tentando novamente",
          );

          await sleep(jitter(backoffMs));
          backoffMs = Math.min(backoffMs * 2, 4_000);
          continue;
        }

        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }
  }
}
