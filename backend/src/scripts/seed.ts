/**
 * Seed para inicializar dados padrão do MindRush
 * 
 * Executa com: npx ts-node src/scripts/seed.ts
 */

import { prisma } from '../db/prisma';
import { logger } from '../logger';

async function main() {
  try {
    logger.info('Iniciando seed de dados padrão...');

    // Inicializa badges
    await seedBadges();

    // Inicializa questões de dificuldade calibrada (opcional, pode vir da API)
    // await seedQuestionDifficulties();

    logger.info('✅ Seed completado com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Erro ao executar seed');
    process.exit(1);
  }
}

async function seedBadges() {
  logger.info('Inicializando badges...');

  const badges = [
    // ==================== MILESTONES ====================
    {
      code: 'milestone_100_questions',
      name: '100 Questões',
      description: 'Responda 100 questões na plataforma',
      category: 'milestone',
      criteria: { type: 'questions_count', value: 100 },
      xpReward: 100,
      coinReward: 50,
      rarity: 'common',
    },
    {
      code: 'milestone_250_questions',
      name: '250 Questões',
      description: 'Responda 250 questões na plataforma',
      category: 'milestone',
      criteria: { type: 'questions_count', value: 250 },
      xpReward: 250,
      coinReward: 125,
      rarity: 'common',
    },
    {
      code: 'milestone_500_questions',
      name: '500 Questões',
      description: 'Responda 500 questões na plataforma',
      category: 'milestone',
      criteria: { type: 'questions_count', value: 500 },
      xpReward: 500,
      coinReward: 250,
      rarity: 'rare',
    },
    {
      code: 'milestone_1000_questions',
      name: '1000 Questões',
      description: 'Responda 1000 questões na plataforma',
      category: 'milestone',
      criteria: { type: 'questions_count', value: 1000 },
      xpReward: 1000,
      coinReward: 500,
      rarity: 'epic',
    },

    // ==================== MASTERY ====================
    {
      code: 'mastery_linguagens',
      name: 'Mestre de Linguagens',
      description: 'Atinja 90% de acurácia em Linguagens',
      category: 'mastery',
      criteria: { type: 'area_accuracy', area: 'Linguagens', value: 90 },
      xpReward: 200,
      coinReward: 100,
      rarity: 'rare',
    },
    {
      code: 'mastery_humanas',
      name: 'Mestre de Humanas',
      description: 'Atinja 90% de acurácia em Ciências Humanas',
      category: 'mastery',
      criteria: { type: 'area_accuracy', area: 'Ciências Humanas', value: 90 },
      xpReward: 200,
      coinReward: 100,
      rarity: 'rare',
    },
    {
      code: 'mastery_natureza',
      name: 'Mestre de Natureza',
      description: 'Atinja 90% de acurácia em Ciências da Natureza',
      category: 'mastery',
      criteria: { type: 'area_accuracy', area: 'Ciências da Natureza', value: 90 },
      xpReward: 200,
      coinReward: 100,
      rarity: 'rare',
    },
    {
      code: 'mastery_matematica',
      name: 'Mestre de Matemática',
      description: 'Atinja 90% de acurácia em Matemática',
      category: 'mastery',
      criteria: { type: 'area_accuracy', area: 'Matemática', value: 90 },
      xpReward: 200,
      coinReward: 100,
      rarity: 'rare',
    },
    {
      code: 'mastery_perfect_score',
      name: 'Perfeição',
      description: 'Acerte todas as questões de um simulado completo',
      category: 'mastery',
      criteria: { type: 'perfect_simulado' },
      xpReward: 500,
      coinReward: 250,
      rarity: 'legendary',
    },

    // ==================== CONSISTENCY ====================
    {
      code: 'consistency_3_days',
      name: '3 Dias Consecutivos',
      description: 'Estude 3 dias seguidos',
      category: 'consistency',
      criteria: { type: 'consecutive_days', value: 3 },
      xpReward: 50,
      coinReward: 25,
      rarity: 'common',
    },
    {
      code: 'consistency_7_days',
      name: '7 Dias Consecutivos',
      description: 'Estude 7 dias seguidos',
      category: 'consistency',
      criteria: { type: 'consecutive_days', value: 7 },
      xpReward: 150,
      coinReward: 75,
      rarity: 'rare',
    },
    {
      code: 'consistency_14_days',
      name: '14 Dias Consecutivos',
      description: 'Estude 14 dias seguidos',
      category: 'consistency',
      criteria: { type: 'consecutive_days', value: 14 },
      xpReward: 350,
      coinReward: 175,
      rarity: 'epic',
    },
    {
      code: 'consistency_30_days',
      name: '30 Dias Consecutivos',
      description: 'Estude 30 dias seguidos',
      category: 'consistency',
      criteria: { type: 'consecutive_days', value: 30 },
      xpReward: 1000,
      coinReward: 500,
      rarity: 'legendary',
    },

    // ==================== SPEED ====================
    {
      code: 'speed_10_in_5min',
      name: '⚡ Velocidade',
      description: 'Responda 10 questões em menos de 5 minutos',
      category: 'speed',
      criteria: { type: 'speed_test', questions: 10, minutes: 5 },
      xpReward: 100,
      coinReward: 50,
      rarity: 'common',
    },
    {
      code: 'speed_20_in_10min',
      name: '⚡⚡ Velocista',
      description: 'Responda 20 questões em menos de 10 minutos',
      category: 'speed',
      criteria: { type: 'speed_test', questions: 20, minutes: 10 },
      xpReward: 250,
      coinReward: 125,
      rarity: 'rare',
    },
    {
      code: 'speed_simulado_under_4h',
      name: 'Raio Dourado',
      description: 'Complete um simulado completo em menos de 4 horas',
      category: 'speed',
      criteria: { type: 'simulado_speed', minutes: 240 },
      xpReward: 500,
      coinReward: 250,
      rarity: 'epic',
    },

    // ==================== ACHIEVEMENT ====================
    {
      code: 'achievement_first_simulado',
      name: 'Primeiro Simulado',
      description: 'Complete seu primeiro simulado completo',
      category: 'achievement',
      criteria: { type: 'complete_simulado' },
      xpReward: 100,
      coinReward: 50,
      rarity: 'common',
    },
    {
      code: 'achievement_tri_600',
      name: 'Nota 600',
      description: 'Atinja uma nota TRI de 600 em um simulado',
      category: 'achievement',
      criteria: { type: 'tri_score', value: 600 },
      xpReward: 300,
      coinReward: 150,
      rarity: 'rare',
    },
    {
      code: 'achievement_tri_700',
      name: 'Nota 700',
      description: 'Atinja uma nota TRI de 700 em um simulado',
      category: 'achievement',
      criteria: { type: 'tri_score', value: 700 },
      xpReward: 500,
      coinReward: 250,
      rarity: 'epic',
    },
    {
      code: 'achievement_tri_800',
      name: 'Nota 800',
      description: 'Atinja uma nota TRI de 800 em um simulado',
      category: 'achievement',
      criteria: { type: 'tri_score', value: 800 },
      xpReward: 1000,
      coinReward: 500,
      rarity: 'legendary',
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const badge of badges) {
    const exists = await prisma.badge.findUnique({
      where: { code: badge.code },
    });

    if (exists) {
      logger.info(`⏭️  Badge ${badge.code} já existe, pulando...`);
      skippedCount++;
      continue;
    }

    await prisma.badge.create({
      data: badge as any,
    });

    logger.info(`✅ Badge criado: ${badge.name}`);
    createdCount++;
  }

  logger.info(`📊 Badges: ${createdCount} criados, ${skippedCount} já existiam`);
}

// Executa o seed
main().catch(error => {
  logger.error('Erro fatal no seed:', error);
  process.exit(1);
});
