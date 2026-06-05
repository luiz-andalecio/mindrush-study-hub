/**
 * Serviço de Análises Inteligentes
 * 
 * Identifica:
 * - Fraquezas por tópico/competência
 * - Padrões de erro
 * - Tópicos dominados
 * - Curva de aprendizado
 */

import { prisma } from '../../db/prisma';
import { logger } from '../../logger';

export interface TopicWeakness {
  topic: string;
  area: string;
  accuracy: number;
  correctCount: number;
  totalCount: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  improvementPotential: number; // 0-100
  trend: 'improving' | 'stable' | 'declining' | null;
}

export interface WeaknessDashboard {
  topWeaknesses: TopicWeakness[];
  criticalTopics: string[];
  improvementOpportunities: Array<{
    topic: string;
    potentialGain: number;
  }>;
  overallWeaknessScore: number; // % de fraquezas
}

export interface LearningCurve {
  period: 'week' | 'month' | 'all_time';
  dataPoints: Array<{
    date: Date;
    accuracy: number;
    questionsAnswered: number;
  }>;
  trend: 'improving' | 'declining' | 'stable';
  trendStrength: number; // 0-100: intensidade do trend
}

export class IntelligentAnalyticsService {
  /**
   * Identifica fraquezas por tópico/competência
   */
  async identifyWeaknesses(userId: string): Promise<WeaknessDashboard> {
    // Busca do banco dados já calculadas
    const savedWeaknesses = await prisma.weaknessAnalytic.findMany({
      where: { userId },
      orderBy: { accuracy: 'asc' },
    });

    if (savedWeaknesses.length === 0) {
      // Calcula na primeira vez
      return await this.calculateWeaknesses(userId);
    }

    const topWeaknesses: TopicWeakness[] = savedWeaknesses
      .slice(0, 10)
      .map(w => ({
        topic: w.topic,
        area: w.area,
        accuracy: w.accuracy,
        correctCount: w.correctCount,
        totalCount: w.totalCount,
        severity: w.severity as any,
        improvementPotential: w.improvementPotential,
        trend: (w.trend as any) || null,
      }));

    const criticalTopics = topWeaknesses
      .filter(w => w.severity === 'critical' || w.severity === 'high')
      .map(w => w.topic);

    const improvementOpportunities = topWeaknesses
      .map(w => ({
        topic: w.topic,
        potentialGain: w.improvementPotential,
      }))
      .sort((a, b) => b.potentialGain - a.potentialGain)
      .slice(0, 5);

    const overallWeaknessScore = topWeaknesses.reduce((sum, w) => {
      const weight =
        w.severity === 'critical' ? 25 :
        w.severity === 'high' ? 15 :
        w.severity === 'medium' ? 8 : 2;
      return sum + weight;
    }, 0) / topWeaknesses.length;

    return {
      topWeaknesses,
      criticalTopics,
      improvementOpportunities,
      overallWeaknessScore,
    };
  }

  /**
   * Calcula fraquezas a partir das respostas
   */
  private async calculateWeaknesses(userId: string): Promise<WeaknessDashboard> {
    // Agrupa respostas por tópico/disciplina
    const journeyAnswers = await prisma.journeyQuestionAnswer.findMany({
      where: {
        attempt: {
          user: { id: userId },
        },
      },
      include: {
        attempt: {
          include: {
            node: {
              include: {
                journey: true,
              },
            },
          },
        },
        enemQuestion: true,
      },
    });

    // Agrupa por disciplina/tópico
    const topicStats = new Map<string, {
      area: string;
      correctCount: number;
      totalCount: number;
      previousAccuracy: number;
      responses: any[];
    }>();

    for (const answer of journeyAnswers) {
      const topic = answer.attempt.node.journey.discipline;
      const area = answer.attempt.node.journey.area;
      const key = `${area}:${topic}`;

      if (!topicStats.has(key)) {
        topicStats.set(key, {
          area,
          correctCount: 0,
          totalCount: 0,
          previousAccuracy: 0,
          responses: [],
        });
      }

      const stat = topicStats.get(key)!;
      stat.totalCount++;
      if (answer.isCorrect) stat.correctCount++;
      stat.responses.push(answer);
    }

    // Converte em array e calcula métricas
    const weaknesses: TopicWeakness[] = [];

    for (const [key, stat] of topicStats) {
      const [area, topic] = key.split(':');
      const accuracy = (stat.correctCount / stat.totalCount) * 100;

      // Determina severidade
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (accuracy < 40) severity = 'critical';
      else if (accuracy < 60) severity = 'high';
      else if (accuracy < 75) severity = 'medium';

      // Calcula potencial de melhora
      const improvementPotential = Math.max(
        0,
        100 - accuracy - (Math.random() * 10) // Adiciona pequena variação
      );

      // Detecta trend (simplificado)
      const recentAnswers = stat.responses.slice(-10);
      const olderAnswers = stat.responses.slice(0, Math.max(1, stat.responses.length - 10));
      
      const recentAccuracy = recentAnswers.length > 0
        ? (recentAnswers.filter(a => a.isCorrect).length / recentAnswers.length) * 100
        : accuracy;
      
      const olderAccuracy = olderAnswers.length > 0
        ? (olderAnswers.filter(a => a.isCorrect).length / olderAnswers.length) * 100
        : accuracy;

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentAccuracy > olderAccuracy + 5) trend = 'improving';
      else if (recentAccuracy < olderAccuracy - 5) trend = 'declining';

      weaknesses.push({
        topic,
        area,
        accuracy,
        correctCount: stat.correctCount,
        totalCount: stat.totalCount,
        severity,
        improvementPotential,
        trend,
      });
    }

    // Salva no banco
    for (const weakness of weaknesses) {
      await prisma.weaknessAnalytic.upsert({
        where: {
          userId_area_topic: {
            userId,
            area: weakness.area,
            topic: weakness.topic,
          },
        },
        update: {
          accuracy: weakness.accuracy,
          correctCount: weakness.correctCount,
          totalCount: weakness.totalCount,
          severity: weakness.severity,
          improvementPotential: weakness.improvementPotential,
          trend: weakness.trend,
          lastUpdated: new Date(),
        },
        create: {
          userId,
          area: weakness.area,
          topic: weakness.topic,
          accuracy: weakness.accuracy,
          correctCount: weakness.correctCount,
          totalCount: weakness.totalCount,
          severity: weakness.severity,
          improvementPotential: weakness.improvementPotential,
          trend: weakness.trend,
          lastUpdated: new Date(),
        },
      });
    }

    // Monta dashboard
    const sorted = weaknesses.sort((a, b) => a.accuracy - b.accuracy);
    const topWeaknesses = sorted.slice(0, 10);
    const criticalTopics = topWeaknesses
      .filter(w => w.severity === 'critical' || w.severity === 'high')
      .map(w => w.topic);

    const improvementOpportunities = topWeaknesses
      .map(w => ({
        topic: w.topic,
        potentialGain: w.improvementPotential,
      }))
      .sort((a, b) => b.potentialGain - a.potentialGain)
      .slice(0, 5);

    const overallWeaknessScore = topWeaknesses.reduce((sum, w) => {
      const weight =
        w.severity === 'critical' ? 25 :
        w.severity === 'high' ? 15 :
        w.severity === 'medium' ? 8 : 2;
      return sum + weight;
    }, 0) / Math.max(1, topWeaknesses.length);

    return {
      topWeaknesses,
      criticalTopics,
      improvementOpportunities,
      overallWeaknessScore,
    };
  }

  /**
   * Calcula curva de aprendizado
   */
  async calculateLearningCurve(
    userId: string,
    period: 'week' | 'month' | 'all_time' = 'month'
  ): Promise<LearningCurve> {
    const dayCount = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const now = new Date();
    const startDate = new Date(now.getTime() - dayCount * 24 * 60 * 60 * 1000);

    // Busca respostas
    const journeyAnswers = await prisma.journeyQuestionAnswer.findMany({
      where: {
        attempt: {
          user: { id: userId },
          completedAt: {
            gte: startDate,
            lte: now,
          },
        },
      },
      select: {
        isCorrect: true,
        answeredAt: true,
      },
    });

    const simuladoAnswers = await prisma.simuladoAnswer.findMany({
      where: {
        attempt: {
          userId,
          completedAt: {
            gte: startDate,
            lte: now,
          },
        },
      },
      select: {
        isCorrect: true,
        answeredAt: true,
      },
    });

    const allAnswers = [...journeyAnswers, ...simuladoAnswers];

    // Agrupa por dia
    const dailyData = new Map<string, { correct: number; total: number }>();

    for (const answer of allAnswers) {
      const dateStr = new Date(answer.answeredAt).toDateString();
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { correct: 0, total: 0 });
      }
      const day = dailyData.get(dateStr)!;
      day.total++;
      if (answer.isCorrect) day.correct++;
    }

    // Monta array de pontos
    const dataPoints = Array.from(dailyData.entries())
      .map(([dateStr, data]) => ({
        date: new Date(dateStr),
        accuracy: (data.correct / data.total) * 100,
        questionsAnswered: data.total,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calcula trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendStrength = 0;

    if (dataPoints.length > 1) {
      const midpoint = Math.floor(dataPoints.length / 2);
      const firstHalf = dataPoints.slice(0, midpoint);
      const secondHalf = dataPoints.slice(midpoint);

      const avgFirst = firstHalf.reduce((sum, p) => sum + p.accuracy, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, p) => sum + p.accuracy, 0) / secondHalf.length;

      if (avgSecond > avgFirst + 2) {
        trend = 'improving';
        trendStrength = Math.min(100, ((avgSecond - avgFirst) / avgFirst) * 100);
      } else if (avgSecond < avgFirst - 2) {
        trend = 'declining';
        trendStrength = Math.min(100, ((avgFirst - avgSecond) / avgFirst) * 100);
      }
    }

    return {
      period,
      dataPoints,
      trend,
      trendStrength,
    };
  }

  /**
   * Calcula desempenho por dificuldade
   */
  async getPerformanceByDifficulty(userId: string) {
    // Nota: Isso é simplificado. Em produção, teríamos
    // dificuldade calibrada para cada questão no banco
    
    const answers = await prisma.journeyQuestionAnswer.findMany({
      where: {
        attempt: {
          user: { id: userId },
        },
      },
      include: {
        enemQuestion: true,
      },
    });

    const difficultyBuckets = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    };

    for (const answer of answers) {
      // Usa índice da questão como proxy de dificuldade
      const index = answer.enemQuestion.index || 0;
      const difficulty = index % 5 < 2 ? 'easy' : index % 5 < 4 ? 'medium' : 'hard';

      difficultyBuckets[difficulty].total++;
      if (answer.isCorrect) difficultyBuckets[difficulty].correct++;
    }

    return {
      easy: difficultyBuckets.easy.total > 0
        ? (difficultyBuckets.easy.correct / difficultyBuckets.easy.total) * 100
        : 0,
      medium: difficultyBuckets.medium.total > 0
        ? (difficultyBuckets.medium.correct / difficultyBuckets.medium.total) * 100
        : 0,
      hard: difficultyBuckets.hard.total > 0
        ? (difficultyBuckets.hard.correct / difficultyBuckets.hard.total) * 100
        : 0,
      stats: difficultyBuckets,
    };
  }
}

export const intelligentAnalyticsService = new IntelligentAnalyticsService();
