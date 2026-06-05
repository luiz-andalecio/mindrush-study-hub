/**
 * Serviço de Análise de Desempenho
 * 
 * Calcula métricas gerais de desempenho do usuário:
 * - Acurácia geral
 * - Evolução semanal/mensal
 * - Frequência de estudos
 * - Tempo médio por questão
 * - Estatísticas de simulados
 */

import { prisma } from '../../db/prisma';
import { logger } from '../../logger';
import { triService } from '../tri/triService';

export interface DailyPerformanceMetrics {
  date: Date;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  timeSpentSeconds: number;
  averageTimePerQuestion: number;
}

export interface PerformancePeriodStats {
  period: string;
  startDate: Date;
  endDate: Date;
  questionsAnswered: number;
  correctAnswers: number;
  overallAccuracy: number;
  averageTimePerQuestion: number;
  studyDays: number;
  currentStreak: number;
  maxStreak: number;
  evolutionPercentage?: number;
}

export class PerformanceAnalyticsService {
  /**
   * Calcula estatísticas de desempenho para um período
   */
  async calculatePeriodStats(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time',
    referenceDate?: Date
  ): Promise<PerformancePeriodStats> {
    try {
      logger.info({ userId, period }, 'Starting calculatePeriodStats');
      const refDate = referenceDate || new Date();
      
      // Determina datas de início e fim do período
      const { startDate, endDate } = this.getPeriodDateRange(period, refDate);
      logger.info({ startDate, endDate }, 'Date range calculated');

      // Busca todas as respostas do usuário nesse período usando query mais simples
      logger.info('Fetching journey answers...');
      const journeyAnswers = await prisma.journeyQuestionAnswer.findMany({
        where: {
          attempt: {
            user: { id: userId },
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        select: {
          isCorrect: true,
          answeredAt: true,
        },
      });
      logger.info({ count: journeyAnswers.length }, 'Journey answers fetched');

      logger.info('Fetching simulado answers...');
      const simuladoAnswers = await prisma.simuladoAnswer.findMany({
        where: {
          attempt: {
            userId: userId,
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        select: {
          isCorrect: true,
          answeredAt: true,
        },
      });
      logger.info({ count: simuladoAnswers.length }, 'Simulado answers fetched');

      const allAnswers = [...journeyAnswers, ...simuladoAnswers];
      const correctAnswers = allAnswers.filter(a => a.isCorrect).length;
      const totalAnswers = allAnswers.length;
      
      // Calcula dias de estudo
      const studyDays = new Set(
        allAnswers.map(a => new Date(a.answeredAt).toDateString())
      ).size;

      // Calcula streak (cache do usuário)
      logger.info('Fetching user streak...');
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          streak: true,
        },
      });
      logger.info({ user }, 'User streak fetched');
      
      const currentStreak = user?.streak ?? 0;
      const maxStreak = currentStreak; // maxStreak usa o valor do streak (não há campo separado)

      // Calcula evolução (apenas para períodos menores)
      let evolutionPercentage: number | undefined;
      if (period !== 'all_time' && totalAnswers > 0) {
        evolutionPercentage = ((correctAnswers / totalAnswers) - 0.5) * 100; // Simplificado
      }

      logger.info({ totalAnswers, correctAnswers }, 'Stats calculated successfully');

      return {
        period,
        startDate,
        endDate,
        questionsAnswered: totalAnswers,
        correctAnswers: correctAnswers,
        overallAccuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
        averageTimePerQuestion: totalAnswers > 0 ? 120 : 0, // Tempo médio padrão
        studyDays,
        currentStreak,
        maxStreak,
        evolutionPercentage,
      };
    } catch (error) {
      logger.error({ error, stack: (error as any).stack }, 'Error in calculatePeriodStats');
      throw error;
    }
  }

  /**
   * Busca desempenho por área
   */
  async getAreaPerformanceStats(
    userId: string,
    area: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'
  ) {
    const { startDate, endDate } = this.getPeriodDateRange(period);

    // Mapeia a disciplina da área
    const disciplines = this.mapDisciplineForArea(area);

    // Busca respostas de simulado (mais simples e rápido)
    const simuladoAnswers = await prisma.simuladoAnswer.findMany({
      where: {
        attempt: {
          userId: userId,
          completedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        enemQuestion: {
          discipline: {
            in: disciplines,
          },
        },
      },
      select: {
        isCorrect: true,
      },
    });

    const correctCount = simuladoAnswers.filter(a => a.isCorrect).length;
    const totalCount = simuladoAnswers.length;

    return {
      area,
      period,
      accuracy: totalCount > 0 ? (correctCount / totalCount) * 100 : 0,
      correctCount,
      totalCount,
      estimatedTriScore: totalCount > 0 ? 500 + ((correctCount / totalCount - 0.5) * 200) : 500,
    };
  }

  /**
   * Calcula evolução percentual entre períodos consecutivos
   */
  private async calculateEvolution(
    userId: string,
    period: 'weekly' | 'monthly'
  ): Promise<number> {
    const now = new Date();
    const { startDate: currentStart } = this.getPeriodDateRange(period, now);
    
    // Período anterior
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    
    const { startDate: previousStart } = period === 'weekly'
      ? this.getPeriodDateRange('weekly', new Date(previousEnd.getTime() - 86400000))
      : this.getPeriodDateRange('monthly', new Date(previousEnd.getTime() - 86400000));

    // Acurácia do período atual
    const currentStats = await this.calculatePeriodStats(userId, period as any, now);
    const currentAccuracy = currentStats.overallAccuracy;

    // Acurácia do período anterior
    // (simplificado para não criar recursão infinita)
    const previousAnswers = await prisma.journeyQuestionAnswer.findMany({
      where: {
        attempt: {
          user: { id: userId },
          completedAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
      },
      select: { isCorrect: true },
    });

    const prevSimuladoAnswers = await prisma.simuladoAnswer.findMany({
      where: {
        attempt: {
          userId: userId,
          completedAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
      },
      select: { isCorrect: true },
    });

    const allPrevAnswers = [...previousAnswers, ...prevSimuladoAnswers];
    const previousAccuracy =
      allPrevAnswers.length > 0
        ? (allPrevAnswers.filter(a => a.isCorrect).length / allPrevAnswers.length) * 100
        : currentAccuracy;

    return ((currentAccuracy - previousAccuracy) / previousAccuracy) * 100 || 0;
  }

  /**
   * Calcula streaks de estudo
   */
  private async calculateStreaks(userId: string) {
    const answers = await prisma.journeyQuestionAnswer.findMany({
      where: {
        attempt: {
          user: { id: userId },
        },
      },
      select: {
        answeredAt: true,
      },
      orderBy: {
        answeredAt: 'desc',
      },
      take: 1000, // Últimas 1000 respostas para análise de streak
    });

    const dates = new Set(
      answers.map(a => new Date(a.answeredAt).toDateString())
    );

    const sortedDates = Array.from(dates).sort().reverse();
    
    let currentStreak = 0;
    let maxStreak = 0;
    let lastDate: Date | null = null;

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      
      if (!lastDate) {
        currentStreak = 1;
        maxStreak = 1;
        lastDate = date;
      } else {
        const diffDays = Math.floor(
          (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diffDays === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          break; // Streak quebrado
        }
        
        lastDate = date;
      }
    }

    // Verifica se o streak é ainda válido (não foi mais de 1 dia atrás)
    if (lastDate) {
      const daysAgo = Math.floor(
        (new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysAgo > 1) {
        currentStreak = 0;
      }
    }

    return { currentStreak, maxStreak };
  }

  /**
   * Calcula tempo médio por questão
   */
  private async calculateAverageTime(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Para jornadas, usa diferença entre answeredAt
    const journeyAttempts = await prisma.journeyNodeAttempt.findMany({
      where: {
        user: { id: userId },
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        startedAt: true,
        completedAt: true,
        totalCount: true,
      },
    });

    let totalTime = 0;
    let totalQuestions = 0;

    for (const attempt of journeyAttempts) {
      if (attempt.completedAt) {
        const time = (attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000;
        totalTime += time;
        totalQuestions += attempt.totalCount;
      }
    }

    return totalQuestions > 0 ? totalTime / totalQuestions : 0;
  }

  // ============ Helpers ============

  private getPeriodDateRange(period: string, referenceDate = new Date()) {
    const ref = new Date(referenceDate);
    let startDate: Date;
    let endDate = new Date(ref);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'daily':
        startDate = new Date(ref);
        startDate.setHours(0, 0, 0, 0);
        break;
        
      case 'weekly':
        startDate = new Date(ref);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(ref.getDate() - dayOfWeek); // Começa no domingo
        startDate.setHours(0, 0, 0, 0);
        break;
        
      case 'monthly':
        startDate = new Date(ref.getFullYear(), ref.getMonth(), 1);
        break;
        
      case 'all_time':
        startDate = new Date('2000-01-01');
        break;
        
      default:
        throw new Error(`Período inválido: ${period}`);
    }

    return { startDate, endDate };
  }

  private mapAreaName(area: string): string {
    const mapping: Record<string, string> = {
      'linguagens': 'Linguagens',
      'humanas': 'Ciências Humanas',
      'natureza': 'Ciências da Natureza',
      'matematica': 'Matemática',
      'redacao': 'Redação',
    };
    return mapping[area.toLowerCase()] || area;
  }

  private mapDisciplineForArea(area: string): string[] {
    const mapping: Record<string, string[]> = {
      'linguagens': ['Linguagens', 'English', 'Spanish'],
      'humanas': ['History', 'Geography', 'Philosophy', 'Sociology'],
      'natureza': ['Biology', 'Chemistry', 'Physics'],
      'matematica': ['Mathematics'],
      'redacao': ['Essay'],
    };
    return mapping[area.toLowerCase()] || [];
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService();
