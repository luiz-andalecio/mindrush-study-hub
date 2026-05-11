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
  // Prompt especializado para identificar redações nota 1000
  return `Você é um corretor especialista em redações do ENEM, treinado para seguir rigorosamente os critérios oficiais do INEP.

IMPORTANTE: redações do ENEM não possuem título. Não solicite, não invente e não avalie título — avalie apenas o texto dissertativo-argumentativo a partir do tema proposto.

===== REGRAS DE ZERAMENTO OBRIGATÓRIO (nota final 0) =====
VOCÊ DEVE retornar {"status":"redacao_zerada","motivo":"...","nota_final":0} IMEDIATAMENTE se detectar:

1. MENOS DE 7 LINHAS: redação com 6 linhas ou menos é SEMPRE zerada. Exemplo: "A redação possui apenas X linhas. O ENEM exige mínimo de 7 linhas com conteúdo autoral."

2. FUGA TOTAL AO TEMA: texto não se conecta ao tema proposto, aborda assunto completamente diferente

3. NÃO É DISSERTATIVO-ARGUMENTATIVO: é poema, narrativa/história, lista de tópicos, ou carece de tese e argumentos estruturados

4. TEXTO DESCONEXO/ABSURDO: deliberadamente absurdo (receitas de comida, hinos de clubes, mensagens aleatórias tipo "Sou lindo", etc)

5. CÓPIA INTEGRAL: copia principalmente/integralmente dos textos motivadores (não é autoral)

6. OFENSAS GRAVES: linguagem profana ou ofensiva dirigida à banca ou grupos sociais

7. EM BRANCO: nenhum texto escrito ou ilegível

Nota sobre Direitos Humanos: Se a proposta de intervenção (C5) violar direitos humanos (tortura, segregação, execução), ZERA APENAS C5 (nota 0 em C5), mas continua avaliando C1-C4 normalmente. A nota_final não será 0.

===== CRITÉRIOS PARA NOTA 1000 (5 competências com 200 pontos cada) =====
Para atribuir nota 1000, a redação DEVE cumprir TODOS estes requisitos:

C1 (Norma culta - 200): Máximo 2 falhas gramaticais leves, ZERO falhas estruturais. Sintaxe excelente, domínio exemplar da variante culta. Pontuação impecável.

C2 (Compreensão do tema - 200): Repertório sociocultural LEGÍTIMO (áreas de saber reconhecidas), PERTINENTE (conectado ao tema) e PRODUTIVO (vinculado à argumentação). Mínimo 1 repertório forte bem integrado.

C3 (Argumentação - 200): Tese cristalina, defesa estratégica com progressão temática impecável. Ausência total de lacunas argumentativas. Marcas de autoria evidentes e coerência absoluta.

C4 (Coesão - 200): Conectivos interparágrafos presentes (mínimo 2 transições bem marcadas). Conectivos intraparágrafos estratégicos em todos os parágrafos. Repetições vocabulares mínimas, uso de pronominalizações e elipses.

C5 (Proposta de intervenção - 200): Presença dos 5 elementos obrigatórios: Agente (quem executa), Ação (verbo de ação claro), Meio/Modo (como será executado), Efeito (resultado esperado), Detalhamento (explicações concretas). Proposta viável, específica e bem fundamentada.

===== REGRAS DE AVALIAÇÃO NORMAL =====
1. Leia TODA a redação antes de avaliar
2. Analise profundamente a argumentação
3. Não seja excessivamente generoso
4. Não invente problemas inexistentes
5. Seja coerente entre nota e justificativa
6. Use critérios próximos ao corretor real do ENEM
7. Linguagem clara e educativa
8. Explique erros e acertos
9. Não elogie sem justificativa
10. A nota deve refletir a qualidade REAL do texto

===== COMPETÊNCIAS (avaliar EXATAMENTE as 5) =====
C1: Norma padrão (0-200 pontos)
C2: Compreensão do tema (0-200)
C3: Argumentação (0-200)
C4: Coesão (0-200)
C5: Proposta de intervenção com agente, ação, meio/modo, finalidade, detalhamento (0-200)

Níveis: muito fraco (0-40) | fraco (41-80) | regular (81-120) | bom (121-160) | excelente (161-200)

===== FORMATO OBRIGATÓRIO =====
Retorne APENAS JSON válido, sem markdown, sem explicação, sem texto após JSON.

SE ZERAR: {"status":"redacao_zerada","motivo":"descrição clara do motivo","nota_final":0}

SE NÃO ZERAR: {"status":"ok","tema_identificado":"tema","tese_identificada":"tese","competencias":{"c1":{"nota":N,"nivel":"X","justificativa":"texto"},"c2":{"nota":N,"nivel":"X","justificativa":"texto"},"c3":{"nota":N,"nivel":"X","justificativa":"texto"},"c4":{"nota":N,"nivel":"X","justificativa":"texto"},"c5":{"nota":N,"nivel":"X","justificativa":"texto"}},"nota_final":soma_das_5,"resumo_geral":"texto","pontos_fortes":["item1","item2","item3"],"pontos_melhorar":["item1","item2","item3"],"sugestoes_praticas":["item1","item2","item3"]}

IMPORTANTE: 
- nota_final DEVE ser a SOMA exata de c1.nota + c2.nota + c3.nota + c4.nota + c5.nota.
- Se e SOMENTE SE todas as 5 competências tiverem 200 pontos, a nota_final será 1000 (excelência máxima).
- Nota 1000 é RARA e exige qualidade excepcional em TODOS os critérios.

RETORNE APENAS JSON. Nada além disso.`;
}

function extractFirstJsonObject(text: string): string | null {
  // Extração robusta: pega do primeiro '{' ao último '}'
  // Depois sanitiza comentários e trailing commas
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  let json = text.slice(start, end + 1);

  // Remove comentários simples (//)
  json = json.replace(/,\s*\/\/[^\n]*/g, ",");
  // Remove comentários de bloco (/* */)
  json = json.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove trailing commas antes de ] ou }
  json = json.replace(/,\s*([\]}])/g, "$1");
  
  // Remove espaços em branco extremos
  json = json.trim();
  
  // Validação: garante que começa com { e termina com }
  if (!json.startsWith("{") || !json.endsWith("}")) {
    return null;
  }

  return json;
}

function normalizeNotaFinal(result: EnemCorrection): EnemCorrection {
  if (result.status !== "ok") return result;
  const sum =
    result.competencias.c1.nota +
    result.competencias.c2.nota +
    result.competencias.c3.nota +
    result.competencias.c4.nota +
    result.competencias.c5.nota;

  // Garante que nota_final = soma exata das 5 competências
  if (result.nota_final !== sum) {
    return { ...result, nota_final: sum };
  }

  return result;
}

// Mapeia níveis em inglês para português (Groq às vezes responde em inglês)
function normalizeNivel(nivel: unknown): string {
  const levelMap: Record<string, string> = {
    excellent: "excelente",
    good: "bom",
    weak: "fraco",
    "very weak": "muito fraco",
    // Mapeamentos para português (caso já chegue correto)
    "muito fraco": "muito fraco",
    fraco: "fraco",
    regular: "regular",
    bom: "bom",
    excelente: "excelente",
  };

  const normalized = String(nivel).toLowerCase().trim();
  return levelMap[normalized] || "regular"; // Padrão: regular se não encontrar
}

function normalizeCompetencias(result: any): EnemCorrection {
  // Garante que todos os níveis estão em português
  if (result.status === "ok") {
    Object.keys(result.competencias).forEach((key) => {
      result.competencias[key].nivel = normalizeNivel(result.competencias[key].nivel);
    });
  }
  return result;
}

function getProviderStatus(err: unknown): number | undefined {
  const raw = typeof err === "object" && err && "status" in err ? (err as any).status : undefined;
  return typeof raw === "number" ? raw : undefined;
}

function countNonEmptyLines(text: string): number {
  // Conta as linhas de uma redação seguindo a lógica ENEM:
  // 1. Separa por quebras de linha reais (\n)
  // 2. Filtra linhas vazias
  // 3. Para cada linha com texto, conta a quantidade de linhas visuais
  //    (considerando que em um textarea com width ~100 chars, linhas longas quebram)
  
  const lines = text.split(/\r?\n/);
  let totalLines = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    
    // Cada 100 caracteres ≈ 1 linha visual na folha ENEM
    // Adiciona 1 para a linha base + partes adicionais para texto longo
    const visualLines = Math.max(1, Math.ceil(trimmed.length / 100));
    totalLines += visualLines;
  }
  
  return totalLines;
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

  let parsedJson = JSON.parse(jsonCandidate);
  
  // Normaliza níveis se Groq respondeu em inglês
  if (parsedJson.status === "ok" && parsedJson.competencias) {
    Object.keys(parsedJson.competencias).forEach((key) => {
      if (parsedJson.competencias[key].nivel) {
        parsedJson.competencias[key].nivel = normalizeNivel(parsedJson.competencias[key].nivel);
      }
    });
  }
  
  const result = enemCorrectionSchema.parse(parsedJson);
  return normalizeNotaFinal(result);
}

export async function correctEnemEssay(input: { theme: string; essay: string; requestId?: string }) {
  // PRÉ-VALIDAÇÃO: Se menos de 7 linhas, zera imediatamente (não chama IA)
  const lineCount = countNonEmptyLines(input.essay);
  if (lineCount < 7) {
    logger.info(
      {
        requestId: input.requestId,
        essayLines: lineCount,
      },
      "Redação zerada: menos de 7 linhas (validação local)",
    );
    return {
      status: "redacao_zerada" as const,
      motivo: `A redação possui apenas ${lineCount} linhas. O ENEM exige um mínimo de 7 linhas com conteúdo autoral para aceitar a avaliação.`,
      nota_final: 0,
    };
  }

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

    // Não faz retry em erros de autenticação/cota
    if (status === 401 || status === 403 || status === 429) {
      throw err;
    }

    // 1 retry: reduz temperatura e reforça o "JSON apenas"
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
            "\n\nCRÍTICO: Sua última resposta estava inválida ou malformada. RETORNE APENAS JSON VÁLIDO. Nada mais.",
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
    let parsedJson = JSON.parse(jsonCandidate);
    
    // Normaliza níveis se Groq respondeu em inglês
    if (parsedJson.status === "ok" && parsedJson.competencias) {
      Object.keys(parsedJson.competencias).forEach((key) => {
        if (parsedJson.competencias[key].nivel) {
          parsedJson.competencias[key].nivel = normalizeNivel(parsedJson.competencias[key].nivel);
        }
      });
    }
    
    const result = enemCorrectionSchema.parse(parsedJson);
    return normalizeNotaFinal(result);
  }
}
