/**
 * Rotas de Estatísticas e Análises
 * 
 * GET /stats/overview - Dashboard geral
 * GET /stats/areas - Desempenho por área
 * GET /stats/areas/:area - Detalhes de uma área
 * GET /stats/weaknesses - Mapa de fraquezas
 * GET /stats/tri-analysis - Análise TRI
 * GET /stats/learning-curve - Curva de aprendizado
 * GET /stats/performance-by-difficulty - Desempenho por dificuldade
 * GET /stats/badges - Badges do usuário
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { triService } from '../services/tri/triService';
import { performanceAnalyticsService } from '../services/performance/performanceAnalyticsService';
import { intelligentAnalyticsService } from '../services/analytics/intelligentAnalyticsService';
import { gamificationService } from '../services/gamification/gamificationService';
import { studyTypeAnalyticsService } from '../services/analytics/studyTypeAnalyticsService';
import { prisma } from '../db/prisma';
import { logger } from '../logger';

const router = Router();

// ============================================
// DASHBOARD GERAL
// ============================================

/**
 * GET /stats/overview
 * 
 * Retorna:
 * - Acurácia geral
 * - Questões respondidas
 * - Nota TRI estimada
 * - Melhor/pior área
 * - Streak atual
 * - Evolução semanal
 */
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;
    logger.info({ userId }, 'Fetching overview stats');

    // Busca estatísticas gerais
    const allTimeStats = await performanceAnalyticsService.calculatePeriodStats(
      userId,
      'all_time'
    );

    // Busca usuário para pegar metadados
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Retorna resposta simplificada (sem cálculos de melhor/pior área para evitar timeout)
    res.json({
      overallAccuracy: allTimeStats.overallAccuracy,
      questionsAnswered: allTimeStats.questionsAnswered,
      estimatedTriScore: user?.estimatedTriScore || 500,
      currentStreak: allTimeStats.currentStreak,
      maxStreak: allTimeStats.maxStreak,
      studyDays: allTimeStats.studyDays,
      averageTimePerQuestion: allTimeStats.averageTimePerQuestion,
      xp: user?.xp || 0,
      level: user?.level || 1,
    });
  } catch (error) {
    logger.error({ error, stack: (error as any).stack }, 'Erro ao buscar overview de estatísticas');
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: (error as any).message });
  }
});

// ============================================
// DESEMPENHO POR ÁREA
// ============================================

/**
 * GET /stats/areas
 * Retorna desempenho em todas as áreas
 */
router.get('/areas', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;
    const period = (req.query.period as string) || 'all_time';

    const areas = ['Linguagens', 'Ciências Humanas', 'Ciências da Natureza', 'Matemática'];
    const areaStats = await Promise.all(
      areas.map(area => {
        logger.info(`Buscando stats para área: ${area}, userId: ${userId}, period: ${period}`);
        return performanceAnalyticsService.getAreaPerformanceStats(userId, area, period as any);
      })
    );

    res.json({
      period,
      areas: areaStats,
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar áreas');
    res.status(500).json({ 
      message: 'Erro ao buscar desempenho por área',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /stats/areas/:area
 * Detalhes completos de uma área
 */
router.get('/areas/:area', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;
    const area = req.params.area;
    const period = (req.query.period as string) || 'all_time';

    const areaStats = await performanceAnalyticsService.getAreaPerformanceStats(
      userId,
      area,
      period as any
    );

    // Busca fraquezas nesta área
    const weaknesses = await prisma.weaknessAnalytic.findMany({
      where: {
        userId,
        area: area.replace('-', ' '),
      },
      orderBy: { accuracy: 'asc' },
      take: 5,
    });

    res.json({
      ...areaStats,
      weaknesses,
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar detalhes da área');
    res.status(500).json({ message: 'Erro ao buscar detalhes da área' });
  }
});

// ============================================
// ANÁLISES INTELIGENTES
// ============================================

/**
 * GET /stats/weaknesses
 * Mapa de fraquezas e tópicos problemáticos
 */
router.get('/weaknesses', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;
    logger.info(`Buscando fraquezas para userId: ${userId}`);

    const weaknessData = await intelligentAnalyticsService.identifyWeaknesses(userId);

    logger.info(`Fraquezas encontradas: ${weaknessData.topWeaknesses.length}`);
    res.json(weaknessData);
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar fraquezas');
    res.status(500).json({ 
      message: 'Erro ao analisar fraquezas',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /stats/learning-curve
 * Curva de aprendizado
 */
router.get('/learning-curve', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;
    const period = (req.query.period as 'week' | 'month' | 'all_time') || 'month';

    const curve = await intelligentAnalyticsService.calculateLearningCurve(userId, period);

    res.json(curve);
  } catch (error) {
    logger.error({ error }, 'Erro ao calcular curva de aprendizado');
    res.status(500).json({ message: 'Erro ao calcular curva de aprendizado' });
  }
});

/**
 * GET /stats/performance-by-difficulty
 * Desempenho por nível de dificuldade
 */
router.get('/performance-by-difficulty', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;

    const performance = await intelligentAnalyticsService.getPerformanceByDifficulty(userId);

    res.json(performance);
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar performance por dificuldade');
    res.status(500).json({ message: 'Erro ao buscar performance por dificuldade' });
  }
});

// ============================================
// TRI E ANÁLISES AVANÇADAS
// ============================================

/**
 * GET /stats/tri-analysis
 * Análise completa de TRI
 */
router.get('/tri-analysis', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;

    // Busca últimas tentativas de simulado
    const lastSimulados = await prisma.triAnalytic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calcula coerência pedagógica média
    const avgCoherence =
      lastSimulados.length > 0
        ? lastSimulados.reduce((sum, t) => sum + t.pedagogicalCoherence, 0) /
          lastSimulados.length
        : 100;

    res.json({
      lastAnalytics: lastSimulados,
      averageCoherence: avgCoherence,
      coherenceStatus:
        avgCoherence > 90 ? 'excelente' :
        avgCoherence > 75 ? 'boa' :
        avgCoherence > 60 ? 'regular' : 'fraca',
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar análise TRI');
    res.status(500).json({ message: 'Erro ao buscar análise TRI' });
  }
});

// ============================================
// GAMIFICAÇÃO
// ============================================

/**
 * GET /stats/badges
 * Badges desbloqueados do usuário
 */
router.get('/badges', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;

    const userBadges = await gamificationService.getUserBadges(userId);

    res.json({
      badges: userBadges,
      totalBadges: userBadges.length,
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar badges');
    res.status(500).json({ message: 'Erro ao buscar badges' });
  }
});

// ============================================
// EVOLUÇÃO TEMPORAL
// ============================================

/**
 * GET /stats/progress
 * Evolução ao longo do tempo
 */
router.get('/progress', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;

    // Calcula estatísticas para diferentes períodos
    const dailyStats = await performanceAnalyticsService.calculatePeriodStats(userId, 'daily');
    const weeklyStats = await performanceAnalyticsService.calculatePeriodStats(userId, 'weekly');
    const monthlyStats = await performanceAnalyticsService.calculatePeriodStats(userId, 'monthly');
    const allTimeStats = await performanceAnalyticsService.calculatePeriodStats(userId, 'all_time');

    res.json({
      daily: dailyStats,
      weekly: weeklyStats,
      monthly: monthlyStats,
      allTime: allTimeStats,
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar progresso');
    res.status(500).json({ message: 'Erro ao buscar progresso' });
  }
});

// ============================================
// ENDPOINTS DE ADMINISTRAÇÃO (OPCIONAL)
// ============================================

/**
 * POST /stats/initialize-badges
 * Inicializa badges padrão (Admin only)
 */
router.post('/initialize-badges', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;

    // Verifica se é admin (simplificado)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.email !== 'admin@mindrush.com') {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    await gamificationService.initializeDefaultBadges();

    res.json({ message: 'Badges inicializados com sucesso' });
  } catch (error) {
    logger.error({ error }, 'Erro ao inicializar badges');
    res.status(500).json({ message: 'Erro ao inicializar badges' });
  }
});

// ============================================
// ESTATÍSTICAS POR TIPO DE ESTUDO
// ============================================

/**
 * GET /stats/by-type
 * Retorna acurácia, distribuição e outros dados separados por tipo de estudo
 */
router.get('/by-type', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;
    const period = (req.query.period as string) || 'all_time';

    const accuracy = await studyTypeAnalyticsService.getAccuracyByStudyType(userId, period as any);
    const distribution = await studyTypeAnalyticsService.getStudyDistribution(userId, period as any);

    res.json({
      period,
      accuracy,
      distribution,
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar stats por tipo de estudo');
    res.status(500).json({ 
      message: 'Erro ao buscar estatísticas por tipo de estudo',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /stats/learning-curve/by-type
 * Retorna curva de aprendizado separada por tipo de estudo
 */
router.get('/learning-curve/by-type', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;
    const period = (req.query.period as 'week' | 'month' | 'all_time') || 'month';
    const studyType = (req.query.studyType as 'journey' | 'simulado' | 'all') || 'all';

    const curve = await studyTypeAnalyticsService.getLearningCurveByType(userId, period, studyType);

    res.json(curve);
  } catch (error) {
    logger.error({ error }, 'Erro ao calcular curva de aprendizado por tipo');
    res.status(500).json({ message: 'Erro ao calcular curva de aprendizado' });
  }
});

/**
 * GET /stats/areas/by-type
 * Retorna desempenho por área separado por tipo de estudo
 */
router.get('/areas/by-type', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;
    const period = (req.query.period as string) || 'all_time';

    const areas = ['Linguagens', 'Ciências Humanas', 'Ciências da Natureza', 'Matemática'];
    const areaStats = await Promise.all(
      areas.map(area => studyTypeAnalyticsService.getAreaPerformanceByType(userId, area, period as any))
    );

    res.json({
      period,
      areas: areaStats,
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar áreas por tipo');
    res.status(500).json({ 
      message: 'Erro ao buscar desempenho por área e tipo',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /stats/performance-by-difficulty/by-type
 * Retorna desempenho por dificuldade separado por tipo de estudo
 */
router.get('/performance-by-difficulty/by-type', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId!;
    const period = (req.query.period as string) || 'all_time';

    const performance = await studyTypeAnalyticsService.getPerformanceByDifficultyAndType(userId, period as any);

    res.json({
      period,
      performance,
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar performance por dificuldade e tipo');
    res.status(500).json({ 
      message: 'Erro ao buscar desempenho por dificuldade',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /stats/explanations
 * Retorna explicações de como os cálculos são feitos (TRI, ENEM, etc)
 */
router.get('/explanations', (req, res) => {
  res.json({
    tri: {
      title: 'Como a Nota TRI é Calculada?',
      description: `A Nota TRI (Teoria de Resposta ao Item) é um modelo estatístico que estima sua 
        proficiência com base em suas respostas. Não é apenas a quantidade de acertos que importa, 
        mas também a dificuldade das questões que você acerta ou erra.`,
      formula: 'Questões Corretas em Itens Difíceis = Nota Maior',
      example: 'Acertar uma questão difícil conta mais do que acertar uma fácil.',
      range: 'A nota TRI varia de 0 a 1000 pontos',
    },
    enem: {
      title: 'Como a Nota ENEM é Estimada?',
      description: `Sua nota ENEM estimada é calculada com base em sua acurácia (percentual de acertos) 
        e na nota TRI. A nota ENEM real varia de 0 a 1000 pontos dependendo do seu desempenho geral.`,
      formula: 'Nota ENEM ≈ Sua Acurácia × 1000 (com ajustes pela dificuldade)',
      factors: [
        'Seu percentual de acertos',
        'A dificuldade das questões que você respondeu',
        'A consistência de suas respostas',
      ],
    },
    accuracy: {
      title: 'Como a Acurácia é Calculada?',
      description: 'Acurácia é o percentual de questões que você acertou em relação ao total de questões respondidas.',
      formula: 'Acurácia = (Questões Corretas / Total de Questões) × 100%',
      example: 'Se você acertou 8 em 10 questões, sua acurácia é 80%',
    },
    streak: {
      title: 'O que é um Streak?',
      description: 'Um streak é o número de dias consecutivos em que você estudou.',
      example: 'Se você estudou todos os dias da última semana, seu streak é 7 dias',
    },
  });
});

export default router;
