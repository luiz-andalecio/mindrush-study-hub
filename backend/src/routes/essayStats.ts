/**
 * Rotas para análise e estatísticas de redações ENEM
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { essayAnalyticsService } from '../services/analytics/essayAnalyticsService';
import { ApiError } from '../errors';

export const essayStatsRouter = Router();

// Schema para filters
const essayFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minScore: z.number().int().min(0).max(1000).optional(),
  maxScore: z.number().int().min(0).max(1000).optional(),
  theme: z.string().optional(),
  correctionStatus: z.enum(['pending', 'corrected', 'zero_rated']).optional(),
  sortBy: z.enum(['date', 'score', 'competency']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * GET /essays/stats - Obter estatísticas agregadas do usuário
 */
essayStatsRouter.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const stats = await essayAnalyticsService.getUserEssayStats(userId);

    if (!stats) {
      return res.json({
        totalEssays: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        message: 'Nenhuma redação corrigida ainda',
      });
    }

    return res.json(stats);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /essays/history - Obter histórico de competências
 */
essayStatsRouter.get('/history', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const history = await prisma.enemEssayCompetencyHistory.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      take: 26, // últimas 26 semanas
    });

    return res.json(history);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /essays/insights - Gerar insights automáticos
 */
essayStatsRouter.get('/insights', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const insights = await essayAnalyticsService.generateInsights(userId);

    return res.json(insights);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /essays/prediction - Fazer predição de nota futura
 */
essayStatsRouter.get('/prediction', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const prediction = await essayAnalyticsService.predictFutureScore(userId);

    if (!prediction) {
      return res.json({
        message: 'Dados insuficientes para fazer predição (mínimo 3 redações)',
      });
    }

    return res.json(prediction);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /essays/list - Listar redações com filtros
 */
essayStatsRouter.get('/list', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const filters = essayFiltersSchema.parse(req.query);

    const where: any = {
      userId,
      correctionStatus: filters.correctionStatus || 'corrected',
    };

    if (filters.startDate) {
      where.submittedAt = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      if (where.submittedAt) {
        where.submittedAt.lte = new Date(filters.endDate);
      } else {
        where.submittedAt = { lte: new Date(filters.endDate) };
      }
    }

    if (filters.minScore || filters.maxScore) {
      where.finalScore = {};
      if (filters.minScore) where.finalScore.gte = filters.minScore;
      if (filters.maxScore) where.finalScore.lte = filters.maxScore;
    }

    if (filters.theme) {
      where.theme = { contains: filters.theme, mode: 'insensitive' };
    }

    const [essays, total] = await Promise.all([
      prisma.enemEssay.findMany({
        where,
        orderBy: {
          [filters.sortBy || 'submittedAt']: filters.sortOrder || 'desc',
        },
        skip: filters.offset,
        take: filters.limit,
      }),
      prisma.enemEssay.count({ where }),
    ]);

    return res.json({
      essays: essays.map((e) => ({
        id: e.id,
        theme: e.theme,
        finalScore: e.finalScore,
        submittedAt: e.submittedAt,
        correctionStatus: e.correctionStatus,
      })),
      total,
      hasMore: filters.offset + filters.limit < total,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /essays/:id/analysis - Obter análise detalhada de uma redação
 */
essayStatsRouter.get('/:id/analysis', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const essayId = req.params.id;

    const essay = await prisma.enemEssay.findUnique({
      where: { id: essayId },
      include: { analysis: true },
    });

    if (!essay || essay.userId !== userId) {
      return next(new ApiError(404, 'Redação não encontrada'));
    }

    return res.json({
      essay: {
        id: essay.id,
        theme: essay.theme,
        wordCount: essay.wordCount,
        lineCount: essay.lineCount,
        finalScore: essay.finalScore,
        competencies: {
          c1: essay.competency1,
          c2: essay.competency2,
          c3: essay.competency3,
          c4: essay.competency4,
          c5: essay.competency5,
        },
        submittedAt: essay.submittedAt,
        correctionStatus: essay.correctionStatus,
      },
      analysis: essay.analysis,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /essays/comparative/benchmark - Comparar com benchmark
 */
essayStatsRouter.get('/comparative/benchmark', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const userStats = await prisma.enemEssayStats.findUnique({ where: { userId } });
    const allStats = await prisma.enemEssayStats.findMany();

    if (!userStats) {
      return res.json({
        message: 'Nenhuma redação corrigida',
      });
    }

    const allScores = allStats.map((s) => s.averageScore);
    const sortedScores = allScores.sort((a, b) => a - b);
    const userRank = sortedScores.findIndex((s) => s >= userStats.averageScore) + 1;
    const percentile = (userRank / sortedScores.length) * 100;

    const nationalAvg = 650; // valor fictício (seria integrado com dados reais)
    const platformAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const top10Threshold = sortedScores[Math.floor(sortedScores.length * 0.9)];

    return res.json({
      userAverage: Math.round(userStats.averageScore),
      nationalAverage: nationalAvg,
      platformAverage: Math.round(platformAvg),
      topPercentileAverage: Math.round(top10Threshold),
      userPercentile: Math.round(percentile),
      userRank,
      totalUsers: allStats.length,
      distanceToNational: Math.round(userStats.averageScore - nationalAvg),
      distanceToPlatform: Math.round(userStats.averageScore - platformAvg),
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /essays/regenerate-stats - Regenerar estatísticas (admin/manutenção)
 */
essayStatsRouter.post('/regenerate-stats', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    await essayAnalyticsService.getUserEssayStats(userId);
    await essayAnalyticsService.generateCompetencyHistory(userId);

    return res.json({ message: 'Estatísticas regeneradas com sucesso' });
  } catch (err) {
    return next(err);
  }
});
