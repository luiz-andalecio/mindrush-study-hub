import { z } from "zod";
import { env } from "../../env";
import { logger } from "../../logger";
import { getOpenAIClient } from "../openai/openaiClient";

const nivelSchema = z.enum(["muito fraco", "fraco", "regular", "bom", "excelente"]);

const competenciaSchema = z.object({
  nota: z.number().int().min(0).max(200),
  nivel: nivelSchema,
  justificativa: z.string().min(1),
});

const okSchema = z.object({
  status: z.literal("ok"),
  tema_identificado: z.string().min(1),
  tese_identificada: z.string().min(1),
  competencias: z.object({
    c1: competenciaSchema,
    c2: competenciaSchema,
    c3: competenciaSchema,
    c4: competenciaSchema,
    c5: competenciaSchema,
  }),
  nota_final: z.number().int().min(0).max(1000),
  resumo_geral: z.string().min(1),
  pontos_fortes: z.array(z.string().min(1)).min(1),
  pontos_melhorar: z.array(z.string().min(1)).min(1),
  sugestoes_praticas: z.array(z.string().min(1)).min(1),
});

const zeradaSchema = z.object({
  status: z.literal("redacao_zerada"),
  motivo: z.string().min(1),
  nota_final: z.literal(0),
});

export const enemCorrectionSchema = z.union([okSchema, zeradaSchema]);
export type EnemCorrection = z.infer<typeof enemCorrectionSchema>;

function buildSystemPrompt() {
  // Comentários em português: aqui fica o prompt “mestre” do corretor.
  // Mantive o essencial (critérios + formato). Se quiser, dá pra mover pra um arquivo .md.
  return `Você é um corretor especialista em redações do ENEM, treinado para seguir rigorosamente os critérios oficiais do INEP.\n\nIMPORTANTE: redações do ENEM não possuem título. Não solicite, não invente e não avalie título — avalie apenas o texto dissertativo-argumentativo a partir do tema proposto.\n\nRegras obrigatórias:\n1. Leia TODA a redação antes de avaliar.\n2. Analise profundamente a argumentação.\n3. NÃO seja excessivamente generoso.\n4. NÃO invente problemas inexistentes.\n5. Seja coerente entre nota e justificativa.\n6. Utilize critérios próximos ao corretor real do ENEM.\n7. Use linguagem clara e educativa.\n8. Explique erros e acertos.\n9. Não elogie sem justificativa.\n10. A nota deve refletir a qualidade REAL do texto.\n\nCritérios de zeramento (nota final 0): fuga total ao tema; texto não dissertativo-argumentativo; menos de 7 linhas; texto desconexo; em branco; cópia dos textos motivadores; ofensas graves; violação de direitos humanos; conteúdo deliberadamente inválido.\n\nCompetências (avaliar EXATAMENTE as 5):\nC1 Norma padrão; C2 Compreensão do tema; C3 Argumentação; C4 Coesão; C5 Proposta de intervenção (agente, ação, meio/modo, finalidade, detalhamento; sem violar direitos humanos).\n\nNíveis permitidos: muito fraco | fraco | regular | bom | excelente\n\nFormato obrigatório: retorne APENAS JSON VÁLIDO, sem markdown, sem texto fora do JSON.\nSe zerar, retorne apenas: {\"status\":\"redacao_zerada\",\"motivo\":\"...\",\"nota_final\":0}\nCaso contrário, retorne o JSON completo com: status=ok, tema_identificado, tese_identificada, competencias(c1..c5 com nota 0..200, nivel, justificativa), nota_final (soma das 5), resumo_geral, pontos_fortes[], pontos_melhorar[], sugestoes_praticas[].`;
}

function extractFirstJsonObject(text: string) {
  // Estratégia simples: tenta pegar do primeiro '{' ao último '}'
  // (o modelo às vezes inclui texto extra; isso limpa o máximo possível).
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function normalizeNotaFinal(result: EnemCorrection): EnemCorrection {
  if (result.status !== "ok") return result;
  const sum =
    result.competencias.c1.nota +
    result.competencias.c2.nota +
    result.competencias.c3.nota +
    result.competencias.c4.nota +
    result.competencias.c5.nota;

  // Garante a regra do contrato: nota_final deve ser a soma.
  if (result.nota_final !== sum) {
    return { ...result, nota_final: sum };
  }

  return result;
}

function getProviderStatus(err: unknown): number | undefined {
  const raw = typeof err === "object" && err && "status" in err ? (err as any).status : undefined;
  return typeof raw === "number" ? raw : undefined;
}

function countNonEmptyLines(text: string) {
  return text.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
}

function safeSnippet(text: string, max = 180) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max) + "…";
}

async function runOnce(
  { theme, essay }: { theme: string; essay: string },
  opts: { attempt: 1 | 2; requestId?: string } = { attempt: 1 },
) {
  const client = getOpenAIClient();

  const start = Date.now();
  logger.debug(
    {
      requestId: opts.requestId,
      attempt: opts.attempt,
      provider: "groq",
      model: env.groqModel,
      temperature: opts.attempt === 1 ? 0.2 : 0,
      themeLen: theme.length,
      essayLen: essay.length,
      essayLines: countNonEmptyLines(essay),
      themeSnippet: safeSnippet(theme, 120),
    },
    "Groq: iniciando correção ENEM",
  );

  const completion = await client.chat.completions.create({
    model: env.groqModel,
    temperature: opts.attempt === 1 ? 0.2 : 0,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      {
        role: "user",
        content: `Tema:\n${theme}\n\nRedação:\n${essay}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const durationMs = Date.now() - start;

  logger.debug(
    {
      requestId: opts.requestId,
      attempt: opts.attempt,
      durationMs,
      responseChars: text.length,
      usage: (completion as any).usage,
    },
    "Groq: resposta recebida",
  );

  const jsonCandidate = extractFirstJsonObject(text) ?? text;

  logger.debug(
    {
      requestId: opts.requestId,
      attempt: opts.attempt,
      extractedJsonChars: jsonCandidate.length,
    },
    "Groq: extraindo JSON da resposta",
  );

  const parsedJson = JSON.parse(jsonCandidate);
  const result = enemCorrectionSchema.parse(parsedJson);
  return normalizeNotaFinal(result);
}

export async function correctEnemEssay(input: { theme: string; essay: string; requestId?: string }) {
  try {
    return await runOnce({ theme: input.theme, essay: input.essay }, { attempt: 1, requestId: input.requestId });
  } catch (err) {
    const status = getProviderStatus(err);
    const message = err instanceof Error ? err.message : String(err);

    logger.warn(
      {
        requestId: input.requestId,
        providerStatus: status,
        message,
      },
      "Groq: falha na tentativa 1",
    );

    // Não faz retry em erros de autenticação/cota.
    if (status === 401 || status === 403 || status === 429) {
      throw err;
    }

    // 1 retry: reduz temperatura e reforça o “JSON apenas”.
    const client = getOpenAIClient();
    const start = Date.now();

    logger.info(
      {
        requestId: input.requestId,
        attempt: 2,
        model: env.groqModel,
      },
      "Groq: executando retry (tentativa 2)",
    );

    const completion = await client.chat.completions.create({
      model: env.groqModel,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            buildSystemPrompt() +
            "\n\nIMPORTANTE: Sua última resposta estava inválida. Agora retorne SOMENTE JSON válido e parseável.",
        },
        { role: "user", content: `Tema:\n${input.theme}\n\nRedação:\n${input.essay}` },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    logger.debug(
      {
        requestId: input.requestId,
        attempt: 2,
        durationMs: Date.now() - start,
        responseChars: text.length,
        usage: (completion as any).usage,
      },
      "Groq: resposta recebida (retry)",
    );

    const jsonCandidate = extractFirstJsonObject(text) ?? text;
    const parsedJson = JSON.parse(jsonCandidate);
    const result = enemCorrectionSchema.parse(parsedJson);
    return normalizeNotaFinal(result);
  }
}
