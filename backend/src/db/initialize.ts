import { prisma } from "./prisma";
import { env } from "../env";
import { EnemApiClient } from "../modules/enem/enem.client";
import { mapExam, mapQuestionsPage } from "../modules/enem/enem.mapper";
import type { EnemApiExam, EnemApiQuestionsPage } from "../modules/enem/enem.types";
import { logger } from "../logger";

function questionId(year: number, index: number, language?: string | null) {
  return `${year}:${index}:${language ?? "pt"}`;
}

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Sincroniza automaticamente as questões da API ENEM se o banco estiver vazio.
 * Chamada ao inicializar a aplicação.
 */
export async function initializeDatabase() {
  try {
    // Verifica se já existem questões no banco
    const questionCount = await prisma.enemQuestion.count();

    if (questionCount > 0) {
      logger.info(
        { questionCount },
        "✓ Banco ENEM já possui questões sincronizadas. Pulando sincronização automática."
      );
      return;
    }

    logger.info("⏳ Banco vazio detectado. Iniciando sincronização automática de questões ENEM...");

    const baseUrl = env.enemApiBaseUrl;
    if (!baseUrl) {
      logger.warn("⚠️  ENEM_API_BASE_URL não configurada. Pulando sincronização.");
      return;
    }

    const client = new EnemApiClient({
      baseUrl,
      timeoutMs: 20_000,
      maxRetries: 6,
    });

    logger.info({ baseUrl }, "📡 Carregando lista de provas ENEM...");

    const exams = await client.getJson<EnemApiExam[]>("/exams", undefined);
    const mappedExams = exams.map(mapExam).sort((a, b) => a.year - b.year);

    logger.info({ provasEncontradas: mappedExams.length }, "✓ Provas carregadas");

    // Upsert de provas
    for (const exam of mappedExams) {
      await prisma.enemExam.upsert({
        where: { year: exam.year },
        update: {
          title: exam.title,
          disciplines: exam.disciplines,
          languages: exam.languages,
        },
        create: {
          year: exam.year,
          title: exam.title,
          disciplines: exam.disciplines,
          languages: exam.languages,
        },
      });
    }

    logger.info("✓ Provas sincronizadas no banco");

    // Ingestão de questões
    const LIMIT = 50;
    let totalQuestionsUpserted = 0;

    for (const exam of mappedExams) {
      const languageValues = (exam.languages ?? [])
        .map((l) => l.value)
        .filter(Boolean);

      // Inclui undefined também (versão padrão/português)
      const languagesToSync = [undefined, ...languageValues];

      for (const lang of languagesToSync) {
        logger.info(
          { ano: exam.year, idioma: lang ?? "português" },
          "📥 Sincronizando questões..."
        );

        let offset = 0;
        let pageCount = 0;
        let totalUpsertsThisLang = 0;

        while (true) {
          const apiPage = await client.getJson<EnemApiQuestionsPage>(
            `/exams/${exam.year}/questions`,
            { limit: LIMIT, offset, language: lang }
          );

          const mapped = mapQuestionsPage(apiPage);
          pageCount += 1;

          const upserts = mapped.questions.map((q) => {
            const id = questionId(q.year, q.index, q.language);
            return prisma.enemQuestion.upsert({
              where: { id },
              update: {
                year: q.year,
                index: q.index,
                language: q.language,
                discipline: q.discipline,
                title: q.title,
                context: q.context,
                files: q.files,
                correctAlternative: q.correctAlternative,
                alternativesIntroduction: q.alternativesIntroduction,
                alternatives: q.alternatives,
              },
              create: {
                id,
                year: q.year,
                index: q.index,
                language: q.language,
                discipline: q.discipline,
                title: q.title,
                context: q.context,
                files: q.files,
                correctAlternative: q.correctAlternative,
                alternativesIntroduction: q.alternativesIntroduction,
                alternatives: q.alternatives,
              },
            });
          });

          // Evita transação gigante
          for (const batch of chunk(upserts, 200)) {
            await prisma.$transaction(batch);
          }

          totalUpsertsThisLang += upserts.length;
          totalQuestionsUpserted += upserts.length;

          if (pageCount % 5 === 0) {
            logger.debug(
              { ano: exam.year, idioma: lang ?? "português", pagina: pageCount, total: totalUpsertsThisLang },
              "📊 Progresso: questões sincronizadas"
            );
          }

          if (!mapped.metadata.hasMore) break;
          offset += LIMIT;
        }

        logger.info(
          { ano: exam.year, idioma: lang ?? "português", questoes: totalUpsertsThisLang },
          "✓ Questões sincronizadas para este idioma"
        );
      }
    }

    logger.info(
      { totalQuestoes: totalQuestionsUpserted },
      "🎉 Sincronização ENEM concluída com sucesso!"
    );
  } catch (err) {
    logger.error(
      { err },
      "❌ Erro durante sincronização automática. A aplicação seguirá sem as questões pré-carregadas. Execute 'npm run enem:sync' manualmente para sincronizar."
    );
    // Não relança o erro para não impedir o startup da aplicação
  }
}
