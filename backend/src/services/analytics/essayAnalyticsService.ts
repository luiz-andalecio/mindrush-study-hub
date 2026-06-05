/**
 * Serviço de Análise de Redações ENEM
 * Responsável por calcular e agregar dados de análise de redações
 */

import { prisma } from '../../db/prisma';

export const essayAnalyticsService = {
  /**
   * Obter estatísticas agregadas do usuário em redações
   */
  async getUserEssayStats(userId: string) {
    // Buscar todas as redações do usuário
    const essays = await prisma.enemEssay.findMany({
      where: { userId, correctionStatus: 'corrected' },
      orderBy: { submittedAt: 'desc' },
    });

    if (essays.length === 0) {
      return null;
    }

    const scores = essays.map((e) => e.finalScore);
    const avgScore = essays.reduce((sum, e) => sum + e.finalScore, 0) / essays.length;
    const medianScore =
      essays.length % 2 === 0
        ? (scores[essays.length / 2 - 1] + scores[essays.length / 2]) / 2
        : scores[Math.floor(essays.length / 2)];

    // Competências
    const avgC1 = essays.reduce((sum, e) => sum + e.competency1, 0) / essays.length;
    const avgC2 = essays.reduce((sum, e) => sum + e.competency2, 0) / essays.length;
    const avgC3 = essays.reduce((sum, e) => sum + e.competency3, 0) / essays.length;
    const avgC4 = essays.reduce((sum, e) => sum + e.competency4, 0) / essays.length;
    const avgC5 = essays.reduce((sum, e) => sum + e.competency5, 0) / essays.length;

    // Evolução (últimas 5 redações)
    const lastFive = essays.slice(0, 5);
    const firstFiveAvg =
      lastFive.length >= 2
        ? lastFive.reduce((sum, e) => sum + e.finalScore, 0) / lastFive.length
        : avgScore;
    const evolutionPercentage = essays.length >= 2 ? ((scores[0] - scores[scores.length - 1]) / scores[scores.length - 1]) * 100 : 0;

    // Tendência
    const tendencyDirection =
      evolutionPercentage > 5 ? 'improving' : evolutionPercentage < -5 ? 'declining' : 'stable';

    // Frequência
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const essaysLastWeek = essays.filter((e) => e.submittedAt > weekAgo).length;
    const essaysPerWeek = essaysLastWeek === 0 ? essays.length / ((now.getTime() - essays[essays.length - 1].submittedAt.getTime()) / (7 * 24 * 60 * 60 * 1000)) : essaysLastWeek;

    // Consistência (quanto menor a variação, maior a consistência)
    const variance =
      essays.reduce((sum, e) => sum + Math.pow(e.finalScore - avgScore, 2), 0) / essays.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 100 - (stdDev / 10) * 10); // normaliza para 0-100

    // Competência mais fraca e forte
    const competencies = [avgC1, avgC2, avgC3, avgC4, avgC5];
    const weakestCompetency = competencies.indexOf(Math.min(...competencies)) + 1;
    const strongestCompetency = competencies.indexOf(Math.max(...competencies)) + 1;

    // Salvar ou atualizar stats
    return await prisma.enemEssayStats.upsert({
      where: { userId },
      update: {
        totalEssays: essays.length,
        zeroRatedEssays: essays.filter((e) => e.finalScore === 0).length,
        averageScore: avgScore,
        bestScore: Math.max(...scores),
        worstScore: Math.min(...scores),
        medianScore,
        avgCompetency1: avgC1,
        avgCompetency2: avgC2,
        avgCompetency3: avgC3,
        avgCompetency4: avgC4,
        avgCompetency5: avgC5,
        evolutionPercentage,
        tendencyDirection,
        essaysPerWeek,
        lastEssayDate: essays[0].submittedAt,
        consistencyScore,
        weakestCompetency,
        strongestCompetency,
      },
      create: {
        userId,
        totalEssays: essays.length,
        zeroRatedEssays: essays.filter((e) => e.finalScore === 0).length,
        averageScore: avgScore,
        bestScore: Math.max(...scores),
        worstScore: Math.min(...scores),
        medianScore,
        avgCompetency1: avgC1,
        avgCompetency2: avgC2,
        avgCompetency3: avgC3,
        avgCompetency4: avgC4,
        avgCompetency5: avgC5,
        evolutionPercentage,
        tendencyDirection,
        essaysPerWeek,
        lastEssayDate: essays[0].submittedAt,
        consistencyScore,
        weakestCompetency,
        strongestCompetency,
      },
    });
  },

  /**
   * Gerar histórico de competências agregadas por período
   */
  async generateCompetencyHistory(userId: string) {
    const essays = await prisma.enemEssay.findMany({
      where: { userId, correctionStatus: 'corrected' },
      orderBy: { submittedAt: 'asc' },
    });

    if (essays.length === 0) return [];

    // Agrupar por semana
    const weeklyGroups = new Map<string, typeof essays>();
    essays.forEach((essay) => {
      const date = essay.submittedAt;
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyGroups.has(weekKey)) weeklyGroups.set(weekKey, []);
      weeklyGroups.get(weekKey)!.push(essay);
    });

    // Gerar registros de histórico
    const histories = [];
    for (const [weekKey, groupEssays] of weeklyGroups) {
      const startDate = new Date(weekKey);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const avgScore = groupEssays.reduce((sum, e) => sum + e.finalScore, 0) / groupEssays.length;
      const c1Avg = groupEssays.reduce((sum, e) => sum + e.competency1, 0) / groupEssays.length;
      const c2Avg = groupEssays.reduce((sum, e) => sum + e.competency2, 0) / groupEssays.length;
      const c3Avg = groupEssays.reduce((sum, e) => sum + e.competency3, 0) / groupEssays.length;
      const c4Avg = groupEssays.reduce((sum, e) => sum + e.competency4, 0) / groupEssays.length;
      const c5Avg = groupEssays.reduce((sum, e) => sum + e.competency5, 0) / groupEssays.length;

      histories.push({
        userId,
        period: 'weekly',
        startDate,
        endDate,
        avgScore,
        c1Avg,
        c2Avg,
        c3Avg,
        c4Avg,
        c5Avg,
        trend: 'stable' as const,
        essayCount: groupEssays.length,
      });
    }

    // Salvar registros
    for (const history of histories) {
      await prisma.enemEssayCompetencyHistory.upsert({
        where: {
          userId_period_startDate: {
            userId: history.userId,
            period: history.period,
            startDate: history.startDate,
          },
        },
        update: {
          avgScore: history.avgScore,
          c1Avg: history.c1Avg,
          c2Avg: history.c2Avg,
          c3Avg: history.c3Avg,
          c4Avg: history.c4Avg,
          c5Avg: history.c5Avg,
          essayCount: history.essayCount,
        },
        create: history,
      });
    }

    return histories;
  },

  /**
   * Gerar insights automáticos baseados em análises
   */
  async generateInsights(userId: string) {
    const stats = await prisma.enemEssayStats.findUnique({ where: { userId } });
    const analysis = await prisma.enemEssayAnalysis.findFirst({
      where: { essay: { userId } },
      orderBy: { createdAt: 'desc' },
    });

    const insights: Array<{
      type: 'strength' | 'weakness' | 'improvement' | 'prediction';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    if (!stats || stats.totalEssays === 0) {
      return insights;
    }

    // Insight sobre evolução
    if (stats.evolutionPercentage > 10) {
      insights.push({
        type: 'strength',
        title: 'Evolução Significativa',
        description: `Você evoluiu ${stats.evolutionPercentage.toFixed(1)}% nas últimas redações. Mantenha o ritmo!`,
        priority: 'high',
      });
    } else if (stats.evolutionPercentage < -10) {
      insights.push({
        type: 'weakness',
        title: 'Desempenho em Queda',
        description: `Suas notas caíram ${Math.abs(stats.evolutionPercentage).toFixed(1)}% recentemente. Revise suas estratégias.`,
        priority: 'high',
      });
    }

    // Competência fraca
    if (stats.weakestCompetency) {
      const competencyNames = ['C1: Norma Culta', 'C2: Compreensão', 'C3: Argumentação', 'C4: Coesão', 'C5: Proposta'];
      insights.push({
        type: 'weakness',
        title: `${competencyNames[stats.weakestCompetency - 1]} é sua maior fraqueza`,
        description: `Sua média em ${competencyNames[stats.weakestCompetency - 1]} é ${Math.round((stats as any)[`avgCompetency${stats.weakestCompetency}`])}. Foco em exercícios direcionados pode melhorar bastante.`,
        priority: 'high',
      });
    }

    // Frequência
    if (stats.essaysPerWeek < 1) {
      insights.push({
        type: 'improvement',
        title: 'Aumentar Frequência de Escrita',
        description: `Você escreve menos de 1 redação por semana. Aumentar a prática ajuda na fixação de conceitos.`,
        priority: 'medium',
      });
    }

    return insights;
  },

  /**
   * Fazer predição de nota futura baseada em IA
   */
  async predictFutureScore(userId: string) {
    const stats = await prisma.enemEssayStats.findUnique({ where: { userId } });

    if (!stats || stats.totalEssays < 3) {
      return null;
    }

    const currentAvg = stats.averageScore;
    const trend = stats.tendencyDirection === 'improving' ? 1.5 : stats.tendencyDirection === 'declining' ? 0.5 : 1;

    // Projeção simples: aumentar conforme tendência
    const projectedScore = Math.min(1000, Math.round(currentAvg * trend + (stats.evolutionPercentage / 100) * 50));

    // Calcular probabilidades
    const variance = Math.pow(stats.consistencyScore / 100, 2); // norma de 0-1
    const baseProbability = currentAvg / 1000;

    return {
      currentAvg: Math.round(currentAvg),
      projectedScore,
      essaysNeeded: Math.max(0, Math.ceil((projectedScore - currentAvg) / (projectedScore * 0.05))),
      timeframeWeeks: Math.max(2, Math.ceil((projectedScore - currentAvg) / (trend * 20))),
      confidence: Math.round((1 - Math.abs(stats.evolutionPercentage) / 100) * 100),
      probabilityOf900Plus: Math.round(Math.max(0, Math.min(100, baseProbability * 1.2 * 100))),
      probabilityOf950Plus: Math.round(Math.max(0, Math.min(100, baseProbability * 0.6 * 100))),
      probabilityOfPerfect: Math.round(Math.max(0, Math.min(100, baseProbability * 0.2 * 100))),
    };
  },
};
