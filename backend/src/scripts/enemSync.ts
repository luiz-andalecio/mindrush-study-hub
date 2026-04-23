import { prisma } from "../db/prisma";
import { env } from "../env";
import { EnemApiClient } from "../modules/enem/enem.client";
import { mapExam, mapQuestionsPage } from "../modules/enem/enem.mapper";
import type { EnemApiExam, EnemApiQuestionsPage } from "../modules/enem/enem.types";

function questionId(year: number, index: number, language?: string | null) {
  return `${year}:${index}:${language ?? "pt"}`;
}

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  const baseUrl = env.enemApiBaseUrl;
  if (!baseUrl) {
    throw new Error("ENEM_API_BASE_URL não configurada.");
  }

  const client = new EnemApiClient({
    baseUrl,
    timeoutMs: 20_000,
    maxRetries: 6,
  });

  console.log(`[enem:sync] Base URL: ${baseUrl}`);
  console.log("[enem:sync] Carregando lista de provas...");

  const exams = await client.getJson<EnemApiExam[]>("/exams", undefined);
  const mappedExams = exams.map(mapExam).sort((a, b) => a.year - b.year);

  console.log(`[enem:sync] Provas encontradas: ${mappedExams.length}`);

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

  // Ingestão de questões
  // Estratégia:
  // - Para cada ano, baixar páginas com limit=50 (evita falhas observadas com limits altos)
  // - Repetir para cada language opcional informada em /exams (para capturar variantes inglês/espanhol)
  // - Upsert por id estável {year}:{index}:{languageOrPt}
  const LIMIT = 50;

  for (const exam of mappedExams) {
    const languageValues = (exam.languages ?? [])
      .map((l) => l.value)
      .filter(Boolean);

    // Inclui undefined também (versão padrão)
    const languagesToSync = [undefined, ...languageValues];

    for (const lang of languagesToSync) {
      console.log(`[enem:sync] Ano ${exam.year} - language=${lang ?? "(default)"}`);

      let offset = 0;
      let pageCount = 0;
      let totalUpserts = 0;

      while (true) {
        const apiPage = await client.getJson<EnemApiQuestionsPage>(
          `/exams/${exam.year}/questions`,
          { limit: LIMIT, offset, language: lang },
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

        // Evita transação gigante.
        for (const batch of chunk(upserts, 200)) {
          await prisma.$transaction(batch);
        }

        totalUpserts += upserts.length;
        console.log(
          `[enem:sync]  offset=${offset} page=${pageCount} upserts=${upserts.length} total=${totalUpserts} hasMore=${mapped.metadata.hasMore}`,
        );

        if (!mapped.metadata.hasMore) break;
        offset += LIMIT;
      }
    }
  }

  console.log("[enem:sync] Concluído.");
}

main()
  .catch((err) => {
    console.error("[enem:sync] Falhou:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
