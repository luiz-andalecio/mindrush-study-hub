import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError } from "../errors";
import { correctEnemEssay } from "../services/ai/enemEssayCorrector";

export const essaysRouter = Router();

// Armazenamento em memória (MVP) para não bloquear o frontend.
type StoredEssay = {
  id: string;
  content: string;
  theme: string;
  score: number;
  competencies: number[];
  feedback: string;
  submittedAt: string;
  // Resultado completo do corretor (JSON do modelo)
  correction?: unknown;
};

const essaysByUser = new Map<string, Map<string, StoredEssay>>();

const submitSchema = z.object({
  content: z.string().min(1),
  theme: z.string().min(1).max(200),
});

essaysRouter.get("/", (req, res) => {
  const userId = req.user!.userId;
  const store = essaysByUser.get(userId);
  req.log?.debug(
    {
      requestId: req.requestId,
      userId,
      count: store ? store.size : 0,
    },
    "Listando redações do usuário",
  );
  return res.json(store ? Array.from(store.values()) : []);
});

essaysRouter.post("/", (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const body = submitSchema.parse(req.body);

    req.log?.info(
      {
        requestId: req.requestId,
        userId,
        themeLen: body.theme.length,
        contentLen: body.content.length,
        contentLines: body.content.split(/\r?\n/).filter((l) => l.trim().length > 0).length,
      },
      "Recebendo redação (submit)",
    );

    const essay: StoredEssay = {
      id: randomUUID(),
      content: body.content,
      theme: body.theme,
      score: 0,
      competencies: [],
      feedback: "",
      submittedAt: new Date().toISOString(),
    };

    if (!essaysByUser.has(userId)) essaysByUser.set(userId, new Map());
    essaysByUser.get(userId)!.set(essay.id, essay);

    req.log?.info(
      {
        requestId: req.requestId,
        userId,
        essayId: essay.id,
        submittedAt: essay.submittedAt,
      },
      "Redação armazenada (MVP em memória)",
    );

    return res.status(201).json(essay);
  } catch (err) {
    return next(err);
  }
});

// Corrige uma redação usando a API Groq (Llama 3.3 70B)
essaysRouter.post("/:id/correct", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const store = essaysByUser.get(userId);
    const essay = store?.get(req.params.id);
    if (!essay) return next(new ApiError(404, "Redação não encontrada."));

    const start = Date.now();
    req.log?.info(
      {
        requestId: req.requestId,
        userId,
        essayId: essay.id,
        themeLen: essay.theme.length,
        contentLen: essay.content.length,
        contentLines: essay.content.split(/\r?\n/).filter((l) => l.trim().length > 0).length,
      },
      "Iniciando correção ENEM (IA)",
    );

    const result = await correctEnemEssay({ theme: essay.theme, essay: essay.content, requestId: req.requestId });
    essay.correction = result;

    if (result.status === "redacao_zerada") {
      essay.score = 0;
      essay.competencies = [0, 0, 0, 0, 0];
      essay.feedback = result.motivo;
    } else {
      essay.score = result.nota_final;
      essay.competencies = [
        result.competencias.c1.nota,
        result.competencias.c2.nota,
        result.competencias.c3.nota,
        result.competencias.c4.nota,
        result.competencias.c5.nota,
      ];
      // Mantém um campo curto para UI atual; o detalhado fica em correction.
      essay.feedback = result.resumo_geral;
    }

    req.log?.info(
      {
        requestId: req.requestId,
        userId,
        essayId: essay.id,
        status: result.status,
        score: essay.score,
        durationMs: Date.now() - start,
      },
      "Correção ENEM finalizada (IA)",
    );

    return res.json(essay);
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);

    // Falhas de configuração local
    if (message.includes("GROQ_API_KEY")) {
      return next(
        new ApiError(501, "IA não configurada no servidor (GROQ_API_KEY ausente).", {
          code: "AI_NOT_CONFIGURED",
        }),
      );
    }

    // Erros vindos do SDK da Groq geralmente carregam `status`.
    const statusRaw = typeof err === "object" && err && "status" in err ? (err as any).status : undefined;
    const status = typeof statusRaw === "number" ? statusRaw : undefined;

    if (status === 429) {
      return next(
        new ApiError(
          429,
          "Groq recusou a requisição por limite/cota (429). Tente novamente em alguns minutos (limites se resetam).",
          {
            code: "GROQ_QUOTA_OR_RATE_LIMIT",
            details: {
              provider: "groq",
              providerStatus: status,
              providerMessage: message,
            },
          },
        ),
      );
    }

    if (status === 401 || status === 403) {
      return next(
        new ApiError(
          502,
          "Falha ao autenticar com Groq. Verifique se a chave GROQ_API_KEY está correta e ativa.",
          {
            code: "GROQ_AUTH_FAILED",
            details: {
              provider: "groq",
              providerStatus: status,
              providerMessage: message,
            },
          },
        ),
      );
    }

    // Caso geral: deixa o errorHandler transformar em 500.
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
