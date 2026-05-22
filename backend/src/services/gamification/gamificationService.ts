/**
 * Serviço de Gamificação
 * 
 * Gerencia:
 * - Badges (medalhas)
 * - Achievements (conquistas)
 * - Recompensas
 */

import { prisma } from '../../db/prisma';
import { logger } from '../../logger';

export interface UnlockableReward {
  badgeId?: string;
  achievementId?: string;
  xpGained: number;
  coinGained: number;
  message: string;
}

export class GamificationService {
  /**
   * Verifica e desbloqueia badges baseado em ações do usuário
   */
  async checkAndUnlockBadges(userId: string, eventType: string, eventData?: any): Promise<UnlockableReward[]> {
    const rewards: UnlockableReward[] = [];
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const unlockedBadgeIds = userBadges.map(ub => ub.badgeId);

    // Define critérios de badges
    const badgeCheckers = [
      this.checkMilestonesBadges(userId, unlockedBadgeIds),
      this.checkMasteryBadges(userId, unlockedBadgeIds),
      this.checkConsistencyBadges(userId, unlockedBadgeIds),
      this.checkSpeedBadges(userId, unlockedBadgeIds),
    ];

    const newBadges = await Promise.all(badgeCheckers);
    
    for (const badge of newBadges.flat()) {
      if (badge) {
        rewards.push(badge);
      }
    }

    return rewards;
  }

  /**
   * Badges de marcos (milestone)
   */
  private async checkMilestonesBadges(
    userId: string,
    unlockedIds: string[]
  ): Promise<UnlockableReward[]> {
    const badges: UnlockableReward[] = [];

    // Badge: 100 questões respondidas
    const questionCount = await prisma.journeyQuestionAnswer.count({
      where: { attempt: { user: { id: userId } } },
    });

    const badge100 = await prisma.badge.findUnique({
      where: { code: 'milestone_100_questions' },
    });

    if (badge100 && !unlockedIds.includes(badge100.id) && questionCount >= 100) {
      await this.unlockBadge(userId, badge100.id);
      badges.push({
        badgeId: badge100.id,
        xpGained: badge100.xpReward,
        coinGained: badge100.coinReward,
        message: '🏅 Você desbloqueou: 100 Questões!',
      });
    }

    // Badge: 500 questões
    const badge500 = await prisma.badge.findUnique({
      where: { code: 'milestone_500_questions' },
    });

    if (badge500 && !unlockedIds.includes(badge500.id) && questionCount >= 500) {
      await this.unlockBadge(userId, badge500.id);
      badges.push({
        badgeId: badge500.id,
        xpGained: badge500.xpReward,
        coinGained: badge500.coinReward,
        message: '🏆 Você desbloqueou: 500 Questões!',
      });
    }

    return badges;
  }

  /**
   * Badges de domínio (mastery)
   */
  private async checkMasteryBadges(
    userId: string,
    unlockedIds: string[]
  ): Promise<UnlockableReward[]> {
    const badges: UnlockableReward[] = [];

    // Badge: 90% em uma área
    const areas = ['Linguagens', 'Ciências Humanas', 'Ciências da Natureza', 'Matemática'];

    for (const area of areas) {
      const answers = await prisma.journeyQuestionAnswer.findMany({
        where: {
          attempt: {
            user: { id: userId },
            node: {
              journey: { area },
            },
          },
        },
        select: { isCorrect: true },
      });

      if (answers.length >= 20) {
        const correctCount = answers.filter(a => a.isCorrect).length;
        const accuracy = (correctCount / answers.length) * 100;

        if (accuracy >= 90) {
          const areaCode = area.toLowerCase().replace(' ', '_');
          const badge = await prisma.badge.findUnique({
            where: { code: `mastery_${areaCode}` },
          });

          if (badge && !unlockedIds.includes(badge.id)) {
            await this.unlockBadge(userId, badge.id);
            badges.push({
              badgeId: badge.id,
              xpGained: badge.xpReward,
              coinGained: badge.coinReward,
              message: `🎓 Você desbloqueou: Mestre de ${area}!`,
            });
          }
        }
      }
    }

    return badges;
  }

  /**
   * Badges de consistência (consistency)
   */
  private async checkConsistencyBadges(
    userId: string,
    unlockedIds: string[]
  ): Promise<UnlockableReward[]> {
    const badges: UnlockableReward[] = [];

    // Badge: 7 dias consecutivos
    const answersLast30Days = await prisma.journeyQuestionAnswer.findMany({
      where: {
        attempt: {
          user: { id: userId },
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      select: { answeredAt: true },
    });

    const dates = new Set(answersLast30Days.map(a => 
      new Date(a.answeredAt).toDateString()
    ));

    const sortedDates = Array.from(dates).sort().reverse();
    let streak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      
      if (i === 0) {
        streak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const diffDays = (prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }

      if (streak === 7) {
        const badge7 = await prisma.badge.findUnique({
          where: { code: 'consistency_7_days' },
        });

        if (badge7 && !unlockedIds.includes(badge7.id)) {
          await this.unlockBadge(userId, badge7.id);
          badges.push({
            badgeId: badge7.id,
            xpGained: badge7.xpReward,
            coinGained: badge7.coinReward,
            message: '🔥 Você desbloqueou: 7 Dias Consecutivos!',
          });
        }
        break;
      }
    }

    return badges;
  }

  /**
   * Badges de velocidade (speed)
   */
  private async checkSpeedBadges(
    userId: string,
    unlockedIds: string[]
  ): Promise<UnlockableReward[]> {
    const badges: UnlockableReward[] = [];

    // Badge: Resolver 10 questões em menos de 5 min
    const recentAnswers = await prisma.journeyQuestionAnswer.findMany({
      where: {
        attempt: {
          user: { id: userId },
        },
      },
      select: { answeredAt: true },
      orderBy: { answeredAt: 'desc' },
      take: 10,
    });

    if (recentAnswers.length === 10) {
      const timeDiff = recentAnswers[0].answeredAt.getTime() - recentAnswers[9].answeredAt.getTime();
      const minutes = timeDiff / (1000 * 60);

      if (minutes < 5) {
        const badgeSpeed = await prisma.badge.findUnique({
          where: { code: 'speed_10_in_5min' },
        });

        if (badgeSpeed && !unlockedIds.includes(badgeSpeed.id)) {
          await this.unlockBadge(userId, badgeSpeed.id);
          badges.push({
            badgeId: badgeSpeed.id,
            xpGained: badgeSpeed.xpReward,
            coinGained: badgeSpeed.coinReward,
            message: '⚡ Você desbloqueou: Velocidade!',
          });
        }
      }
    }

    return badges;
  }

  /**
   * Desbloqueia um badge para o usuário
   */
  private async unlockBadge(userId: string, badgeId: string): Promise<void> {
    try {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId,
        },
      });

      logger.info(`Badge ${badgeId} desbloqueado para usuário ${userId}`);
    } catch (error: any) {
      // Badge já desbloqueado
      if (error.code !== 'P2002') {
        throw error;
      }
    }
  }

  /**
   * Busca badges do usuário
   */
  async getUserBadges(userId: string) {
    return await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    });
  }

  /**
   * Inicializa badges padrão no banco (executar uma vez)
   */
  async initializeDefaultBadges(): Promise<void> {
    const defaultBadges = [
      // Milestones
      {
        code: 'milestone_100_questions',
        name: '100 Questões',
        description: 'Responda 100 questões',
        category: 'milestone',
        criteria: { type: 'questions_count', value: 100 },
        xpReward: 100,
        coinReward: 50,
        rarity: 'common',
      },
      {
        code: 'milestone_500_questions',
        name: '500 Questões',
        description: 'Responda 500 questões',
        category: 'milestone',
        criteria: { type: 'questions_count', value: 500 },
        xpReward: 500,
        coinReward: 250,
        rarity: 'rare',
      },
      // Mastery
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
        code: 'mastery_ciencias_humanas',
        name: 'Mestre de Humanas',
        description: 'Atinja 90% de acurácia em Ciências Humanas',
        category: 'mastery',
        criteria: { type: 'area_accuracy', area: 'Ciências Humanas', value: 90 },
        xpReward: 200,
        coinReward: 100,
        rarity: 'rare',
      },
      {
        code: 'mastery_ciencias_natureza',
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
      // Consistency
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
      // Speed
      {
        code: 'speed_10_in_5min',
        name: 'Velocidade',
        description: 'Responda 10 questões em menos de 5 minutos',
        category: 'speed',
        criteria: { type: 'speed_test', questions: 10, minutes: 5 },
        xpReward: 100,
        coinReward: 50,
        rarity: 'common',
      },
    ];

    for (const badge of defaultBadges) {
      try {
        await prisma.badge.upsert({
          where: { code: badge.code },
          update: {},
          create: badge as any,
        });
      } catch (error) {
        logger.warn(`Badge ${badge.code} já existe`);
      }
    }

    logger.info('Badges padrão inicializados');
  }
}

export const gamificationService = new GamificationService();
