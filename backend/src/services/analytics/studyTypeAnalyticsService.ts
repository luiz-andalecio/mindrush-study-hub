/**
 * Serviço de Análise por Tipo de Estudo
 * 
 * Separa acurácia, curva de aprendizado e desempenho por tipo:
 * - Jornada (JourneyQuestionAnswer)
 * - Simulado (SimuladoAnswer)
 * - PvP (ainda não implementado)
 */

import { prisma } from '../../db/prisma';
import { logger } from '../../logger';

interface AccuracyByType {
  journey: {
    correct: number;
    total: number;
    accuracy: number;
  };
  simulado: {
    correct: number;
    total: number;
    accuracy: number;
  };
  pvp: {
    correct: number;
    total: number;
    accuracy: number;
  };
}

interface StudyDistribution {
  journey: number; // quantidade de respostas
  simulado: number;
  pvp: number;
}

export class StudyTypeAnalyticsService {
  /**
   * Retorna acurácia separada por tipo de estudo
   */
  async getAccuracyByStudyType(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'
  ): Promise<AccuracyByType> {
    try {
      const { startDate, endDate } = this.getPeriodDateRange(period);

      // Jornada
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
        select: { isCorrect: true },
      });
      const journeyCorrect = journeyAnswers.filter(a => a.isCorrect).length;
      const journeyTotal = journeyAnswers.length;

      // Simulado
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
        select: { isCorrect: true },
      });
      const simuladoCorrect = simuladoAnswers.filter(a => a.isCorrect).length;
      const simuladoTotal = simuladoAnswers.length;

      // PvP (ainda não implementado)
      const pvpCorrect = 0;
      const pvpTotal = 0;

      return {
        journey: {
          correct: journeyCorrect,
          total: journeyTotal,
          accuracy: journeyTotal > 0 ? (journeyCorrect / journeyTotal) * 100 : 0,
        },
        simulado: {
          correct: simuladoCorrect,
          total: simuladoTotal,
          accuracy: simuladoTotal > 0 ? (simuladoCorrect / simuladoTotal) * 100 : 0,
        },
        pvp: {
          correct: pvpCorrect,
          total: pvpTotal,
          accuracy: 0,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Erro ao buscar acurácia por tipo de estudo');
      throw error;
    }
  }

  /**
   * Retorna distribuição de estudos (quantidade de questões respondidas por tipo)
   */
  async getStudyDistribution(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'
  ): Promise<StudyDistribution> {
    try {
      const { startDate, endDate } = this.getPeriodDateRange(period);

      // Contar respostas de jornada
      const journeyCount = await prisma.journeyQuestionAnswer.count({
        where: {
          attempt: {
            user: { id: userId },
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      });

      // Contar respostas de simulado
      const simuladoCount = await prisma.simuladoAnswer.count({
        where: {
          attempt: {
            userId: userId,
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      });

      return {
        journey: journeyCount,
        simulado: simuladoCount,
        pvp: 0,
      };
    } catch (error) {
      logger.error({ error }, 'Erro ao buscar distribuição de estudos');
      throw error;
    }
  }

  /**
   * Retorna desempenho por área, separado por tipo de estudo
   */
  async getAreaPerformanceByType(
    userId: string,
    area: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'
  ) {
    try {
      const { startDate, endDate } = this.getPeriodDateRange(period);

      // Busca todas as respostas do período e classifica em memória.
      // Isso evita falsos zeros quando a disciplina é salva com slug,
      // acentuação diferente ou variações de capitalização.
      const journeyAnswersArea = await prisma.journeyQuestionAnswer.findMany({
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
          enemQuestion: {
            select: { discipline: true },
          },
        },
      });

      const simuladoAnswersArea = await prisma.simuladoAnswer.findMany({
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
          enemQuestion: {
            select: { discipline: true },
          },
        },
      });

      const normalizedArea = this.normalizeAreaName(area).replace(/\s+/g, '');

      const journeyFiltered = journeyAnswersArea.filter(answer =>
        this.belongsToArea(normalizedArea, answer.enemQuestion?.discipline)
      );
      const simuladoFiltered = simuladoAnswersArea.filter(answer =>
        this.belongsToArea(normalizedArea, answer.enemQuestion?.discipline)
      );

      const journeyCorrect = journeyFiltered.filter(a => a.isCorrect).length;
      const simuladoCorrect = simuladoFiltered.filter(a => a.isCorrect).length;

      return {
        area,
        journey: {
          correct: journeyCorrect,
          total: journeyFiltered.length,
          accuracy: journeyFiltered.length > 0
            ? (journeyCorrect / journeyFiltered.length) * 100
            : 0,
        },
        simulado: {
          correct: simuladoCorrect,
          total: simuladoFiltered.length,
          accuracy: simuladoFiltered.length > 0
            ? (simuladoCorrect / simuladoFiltered.length) * 100
            : 0,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Erro ao buscar desempenho por área e tipo');
      throw error;
    }
  }

  /**
   * Retorna curva de aprendizado por tipo de estudo
   */
  async getLearningCurveByType(
    userId: string,
    period: 'week' | 'month' | 'all_time' = 'month',
    studyType: 'journey' | 'simulado' | 'all' = 'all'
  ) {
    try {
      const prismaperiod = period === 'week' ? 'weekly' : period === 'month' ? 'monthly' : 'all_time';
      const { startDate, endDate } = this.getPeriodDateRange(prismaperiod);

      let journeyDataPoints: any[] = [];
      let simuladoDataPoints: any[] = [];

      if (studyType === 'journey' || studyType === 'all') {
        // Busca respostas de jornada com data
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
          orderBy: { answeredAt: 'asc' },
        });

        journeyDataPoints = this.calculateAccuracyOverTime(journeyAnswers);
      }

      if (studyType === 'simulado' || studyType === 'all') {
        // Busca respostas de simulado com data
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
          orderBy: { answeredAt: 'asc' },
        });

        simuladoDataPoints = this.calculateAccuracyOverTime(simuladoAnswers);
      }

      if (studyType === 'all') {
        // Mescla as duas séries
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
          orderBy: { answeredAt: 'asc' },
        });

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
          orderBy: { answeredAt: 'asc' },
        });

        const allAnswers = [
          ...journeyAnswers,
          ...simuladoAnswers,
        ].sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime());

        return {
          period,
          studyType: 'all',
          dataPoints: this.calculateAccuracyOverTime(allAnswers),
          journeyDataPoints,
          simuladoDataPoints,
        };
      } else if (studyType === 'journey') {
        return {
          period,
          studyType: 'journey',
          dataPoints: journeyDataPoints,
        };
      } else {
        return {
          period,
          studyType: 'simulado',
          dataPoints: simuladoDataPoints,
        };
      }
    } catch (error) {
      logger.error({ error }, 'Erro ao buscar curva de aprendizado por tipo');
      throw error;
    }
  }

  /**
   * Retorna desempenho por dificuldade, separado por tipo
   */
  async getPerformanceByDifficultyAndType(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'
  ) {
    try {
      const { startDate, endDate } = this.getPeriodDateRange(period);

      // Jornada por dificuldade
      const journeyByDifficulty = await prisma.journeyQuestionAnswer.findMany({
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
          enemQuestionId: true,
        },
      });

      // Simulado por dificuldade
      const simuladoByDifficulty = await prisma.simuladoAnswer.findMany({
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
          enemQuestionId: true,
        },
      });

      // Busca informações de dificuldade do modelo QuestionDifficulty
      const questionIds = [
        ...journeyByDifficulty.map(a => a.enemQuestionId),
        ...simuladoByDifficulty.map(a => a.enemQuestionId),
      ];

      const questionDifficulties = await prisma.questionDifficulty.findMany({
        where: {
          enemQuestionId: { in: questionIds },
        },
        select: {
          enemQuestionId: true,
          difficulty: true,
        },
      });

      const difficultiesMap = new Map(questionDifficulties.map(q => [q.enemQuestionId, q.difficulty]));

      // Classifica em categorias easy/medium/hard baseado no valor de dificuldade
      const categorizeByDifficulty = (difficulty: number): string => {
        if (difficulty < -0.5) return 'easy';
        if (difficulty > 0.5) return 'hard';
        return 'medium';
      };

      // Agrupa por dificuldade
      const difficulties = ['easy', 'medium', 'hard'];
      const result: any = {};

      for (const difficulty of difficulties) {
        const journeyAnswers = journeyByDifficulty.filter(a => {
          const triDiff = difficultiesMap.get(a.enemQuestionId) || 0;
          return categorizeByDifficulty(triDiff) === difficulty;
        });
        const simuladoAnswers = simuladoByDifficulty.filter(a => {
          const triDiff = difficultiesMap.get(a.enemQuestionId) || 0;
          return categorizeByDifficulty(triDiff) === difficulty;
        });

        result[difficulty] = {
          journey: {
            correct: journeyAnswers.filter((a: any) => a.isCorrect).length,
            total: journeyAnswers.length,
            accuracy: journeyAnswers.length > 0
              ? (journeyAnswers.filter((a: any) => a.isCorrect).length / journeyAnswers.length) * 100
              : 0,
          },
          simulado: {
            correct: simuladoAnswers.filter((a: any) => a.isCorrect).length,
            total: simuladoAnswers.length,
            accuracy: simuladoAnswers.length > 0
              ? (simuladoAnswers.filter((a: any) => a.isCorrect).length / simuladoAnswers.length) * 100
              : 0,
          },
        };
      }

      return result;
    } catch (error) {
      logger.error({ error }, 'Erro ao buscar desempenho por dificuldade e tipo');
      throw error;
    }
  }

  /**
   * Calcula acurácia ao longo do tempo
   */
  private calculateAccuracyOverTime(answers: any[]): any[] {
    const dataPoints: any[] = [];
    let correctCount = 0;
    let totalCount = 0;

    // Agrupa por dia
    const dayGroups: Map<string, any[]> = new Map();

    for (const answer of answers) {
      const dateKey = new Date(answer.answeredAt).toISOString().split('T')[0];
      if (!dayGroups.has(dateKey)) {
        dayGroups.set(dateKey, []);
      }
      dayGroups.get(dateKey)!.push(answer);
    }

    // Calcula acurácia acumulada por dia
    for (const [date, dayAnswers] of Array.from(dayGroups.entries()).sort()) {
      correctCount += dayAnswers.filter((a: any) => a.isCorrect).length;
      totalCount += dayAnswers.length;

      dataPoints.push({
        date: new Date(date),
        accuracy: totalCount > 0 ? (correctCount / totalCount) * 100 : 0,
        correctCount,
        totalCount,
        dayAccuracy: dayAnswers.length > 0
          ? (dayAnswers.filter((a: any) => a.isCorrect).length / dayAnswers.length) * 100
          : 0,
      });
    }

    return dataPoints;
  }

  /**
   * Mapeia área para disciplinas ENEM
   */
  private mapDisciplineForArea(area: string): string[] {
    const mapping: Record<string, string[]> = {
      'Linguagens': [
        'Linguagens',
        'linguagens',
        'Português',
        'portugues',
        'Língua Portuguesa',
        'Inglês',
        'ingles',
        'English',
        'Espanhol',
        'espanhol',
        'Spanish',
      ],
      'Ciências Humanas': [
        'Ciências Humanas',
        'ciencias-humanas',
        'humanas',
        'História',
        'historia',
        'History',
        'Geografia',
        'geografia',
        'Geography',
        'Filosofia',
        'filosofia',
        'Philosophy',
        'Sociologia',
        'sociologia',
        'Sociology',
      ],
      'Ciências da Natureza': [
        'Ciências da Natureza',
        'ciencias-natureza',
        'natureza',
        'Biologia',
        'biologia',
        'Biology',
        'Física',
        'fisica',
        'Physics',
        'Química',
        'quimica',
        'Chemistry',
      ],
      'Matemática': ['Matemática', 'matematica', 'Mathematics'],
    };

    return mapping[area] || mapping[area.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()] || [];
  }

  private normalizeAreaName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  private normalizeDiscipline(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  private belongsToArea(area: string, discipline: string | null | undefined): boolean {
    const normalizedDiscipline = this.normalizeDiscipline(discipline);
    if (!normalizedDiscipline) {
      return false;
    }

    const areaAliases: Record<string, string[]> = {
      linguagens: ['linguagens', 'portugues', 'lingua portuguesa', 'ingles', 'english', 'espanhol', 'spanish'],
      cienciashumanas: ['ciencias-humanas', 'humanas', 'history', 'geography', 'philosophy', 'sociology'],
      cienciasdanatureza: ['ciencias-natureza', 'natureza', 'biology', 'physics', 'chemistry'],
      matematica: ['matematica', 'mathematics'],
    };

    if (area === 'linguagens') {
      return areaAliases.linguagens.some(alias => normalizedDiscipline.includes(alias));
    }

    if (area === 'cienciashumanas') {
      return areaAliases.cienciashumanas.some(alias => normalizedDiscipline.includes(alias));
    }

    if (area === 'cienciasdanatureza') {
      return areaAliases.cienciasdanatureza.some(alias => normalizedDiscipline.includes(alias));
    }

    if (area === 'matematica') {
      return areaAliases.matematica.some(alias => normalizedDiscipline.includes(alias));
    }

    return false;
  }

  /**
   * Determina range de datas do período
   */
  private getPeriodDateRange(
    period: 'daily' | 'weekly' | 'monthly' | 'all_time',
    referenceDate = new Date()
  ) {
    const endDate = new Date(referenceDate);
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date(endDate);

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'all_time':
        startDate = new Date('2020-01-01');
        break;
    }

    return { startDate, endDate };
  }
}

export const studyTypeAnalyticsService = new StudyTypeAnalyticsService();
