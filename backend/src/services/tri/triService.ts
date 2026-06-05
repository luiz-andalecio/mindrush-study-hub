/**
 * Serviço de Teoria de Resposta ao Item (TRI)
 * 
 * Implementa cálculos de proficiência e nota TRI baseados em respostas a questões.
 * Utiliza modelo 3PL (Three Parameter Logistic) calibrado com microdados do ENEM.
 * 
 * Fórmula TRI: P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))
 * Onde:
 *   - P(θ) = probabilidade de acerto
 *   - θ = proficiência do respondente
 *   - a = discriminação (quanto melhor discrimina proficiências)
 *   - b = dificuldade (valor de θ em que P(θ) = (1+c)/2)
 *   - c = acerto casual (piso da probabilidade)
 */

import { prisma } from '../../db/prisma';
import { logger } from '../../logger';

export interface QuestionResponse {
  questionId: string;
  isCorrect: boolean;
  difficulty?: number; // 0-1, padrão 0.5
  discrimination?: number; // padrão 1.0
  guessing?: number; // padrão 0.2
  timeSpentSeconds?: number;
}

export interface TriCalculationResult {
  proficiency: number; // θ (proficiência)
  estimatedScore: number; // Nota ENEM (0-1000)
  accuracy: number; // % de acertos
  coherence: number; // % de coerência pedagógica (0-100)
  incoherenceLevel: string; // "none" | "low" | "medium" | "high"
}

export interface AreaTriResult extends TriCalculationResult {
  area: string;
  questionCount: number;
}

export class TriService {
  /**
   * Calcula proficiência usando IRT
   * Utiliza método de máxima verossimilhança com aproximação de Newton-Raphson
   */
  async calculateProficiency(responses: QuestionResponse[]): Promise<number> {
    if (responses.length === 0) return 0;

    // Inicializa θ com estimativa baseada em % de acertos
    let theta = this.estimateInitialTheta(responses);
    
    // Iterações de Newton-Raphson para convergência
    const maxIterations = 20;
    const tolerance = 0.001;
    
    for (let i = 0; i < maxIterations; i++) {
      const { firstDerivative, secondDerivative } = this.calculateDerivatives(
        responses,
        theta
      );
      
      const newTheta = theta - firstDerivative / secondDerivative;
      
      if (Math.abs(newTheta - theta) < tolerance) {
        theta = newTheta;
        break;
      }
      
      theta = newTheta;
    }
    
    // Limita θ entre -3 e 3 (intervalo típico do ENEM)
    return Math.max(-3, Math.min(3, theta));
  }

  /**
   * Converte proficiência (θ) em nota ENEM (0-1000)
   * ENEM usa média 500 e desvio padrão 100
   */
  convertProficiencyToScore(proficiency: number): number {
    const mean = 500;
    const stdDev = 100;
    const score = mean + proficiency * stdDev;
    
    // Limita entre 0 e 1000
    return Math.max(0, Math.min(1000, Math.round(score)));
  }

  /**
   * Calcula coerência pedagógica
   * Penaliza acerto em questões difíceis + erro em fáceis
   */
  calculateCoherence(responses: QuestionResponse[]): {
    coherence: number;
    incoherenceLevel: string;
  } {
    if (responses.length < 2) {
      return { coherence: 100, incoherenceLevel: 'none' };
    }

    const dificultadesPorResposta = responses.map(r => ({
      difficulty: r.difficulty || 0.5,
      isCorrect: r.isCorrect,
    }));

    // Ordena por dificuldade
    const sorted = [...dificultadesPorResposta].sort(
      (a, b) => a.difficulty - b.difficulty
    );

    // Conta inversões (errar fácil e acertar difícil)
    let inversions = 0;
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        // Se errou fácil E acertou difícil
        if (!sorted[i].isCorrect && sorted[j].isCorrect) {
          inversions++;
        }
      }
    }

    // Calcula percentual de coerência
    const maxInversions = sorted.length * (sorted.length - 1) / 2;
    const coherence = Math.max(0, 100 - (inversions / maxInversions) * 100);

    // Classifica nível de incoerência
    let incoherenceLevel = 'none';
    if (coherence < 60) incoherenceLevel = 'high';
    else if (coherence < 75) incoherenceLevel = 'medium';
    else if (coherence < 90) incoherenceLevel = 'low';

    return { coherence, incoherenceLevel };
  }

  /**
   * Calcula TRI completo para uma série de respostas
   */
  async calculateTri(responses: QuestionResponse[]): Promise<TriCalculationResult> {
    const proficiency = await this.calculateProficiency(responses);
    const estimatedScore = this.convertProficiencyToScore(proficiency);
    
    const correctCount = responses.filter(r => r.isCorrect).length;
    const accuracy = (correctCount / responses.length) * 100;
    
    const { coherence, incoherenceLevel } = this.calculateCoherence(responses);

    return {
      proficiency,
      estimatedScore,
      accuracy,
      coherence,
      incoherenceLevel,
    };
  }

  /**
   * Calcula TRI por área do ENEM
   */
  async calculateAreaTri(
    responses: QuestionResponse[],
    area: string
  ): Promise<AreaTriResult> {
    const triResult = await this.calculateTri(responses);
    
    return {
      ...triResult,
      area,
      questionCount: responses.length,
    };
  }

  /**
   * Analisa coerência e identifica padrões incoerentes
   */
  analyzeIncoherence(responses: QuestionResponse[]): {
    hasHighIncoherence: boolean;
    incoherentPatterns: Array<{
      type: string;
      description: string;
      frequency: number;
    }>;
  } {
    const patterns: Array<{
      type: string;
      description: string;
      frequency: number;
    }> = [];

    // Padrão 1: Acertos em questões difíceis + erros em fáceis
    const easyErrors = responses.filter(r => 
      !r.isCorrect && (r.difficulty || 0.5) < 0.4
    ).length;
    const hardCorrect = responses.filter(r => 
      r.isCorrect && (r.difficulty || 0.5) > 0.7
    ).length;
    
    if (easyErrors > 0 && hardCorrect > 0) {
      patterns.push({
        type: 'easy_errors_hard_correct',
        description: `Você errou ${easyErrors} questões fáceis mas acertou ${hardCorrect} difíceis`,
        frequency: easyErrors + hardCorrect,
      });
    }

    // Padrão 2: Muitos erros consecutivos
    let consecutiveErrors = 0;
    let maxConsecutiveErrors = 0;
    for (const response of responses) {
      if (!response.isCorrect) {
        consecutiveErrors++;
        maxConsecutiveErrors = Math.max(maxConsecutiveErrors, consecutiveErrors);
      } else {
        consecutiveErrors = 0;
      }
    }
    
    if (maxConsecutiveErrors > 3) {
      patterns.push({
        type: 'consecutive_errors',
        description: `Sequência máxima de ${maxConsecutiveErrors} erros consecutivos`,
        frequency: maxConsecutiveErrors,
      });
    }

    return {
      hasHighIncoherence: patterns.length > 0,
      incoherentPatterns: patterns,
    };
  }

  // ========================================
  // Métodos privados (helpers)
  // ========================================

  private estimateInitialTheta(responses: QuestionResponse[]): number {
    const correctCount = responses.filter(r => r.isCorrect).length;
    const accuracy = correctCount / responses.length;
    
    // Converte % de acertos em θ aproximado
    // accuracy ≈ 0.5 → θ ≈ 0
    // accuracy ≈ 1.0 → θ ≈ 2
    // accuracy ≈ 0.0 → θ ≈ -2
    
    return (accuracy - 0.5) * 4; // Escala simples
  }

  private calculateDerivatives(
    responses: QuestionResponse[],
    theta: number
  ): {
    firstDerivative: number;
    secondDerivative: number;
  } {
    let firstDerivative = 0;
    let secondDerivative = 0;

    for (const response of responses) {
      const a = response.discrimination || 1.0;
      const b = response.difficulty || 0.5;
      const c = response.guessing || 0.2;

      // Probabilidade de acerto P(θ)
      const exponent = -a * (theta - b);
      const p = c + (1 - c) / (1 + Math.exp(exponent));

      // Derivada primeira e segunda
      const pPrime = (1 - c) * a * Math.exp(exponent) / Math.pow(1 + Math.exp(exponent), 2);

      if (response.isCorrect) {
        firstDerivative += pPrime / p;
        secondDerivative -= (pPrime * pPrime) / (p * p);
      } else {
        firstDerivative -= pPrime / (1 - p);
        secondDerivative -= (pPrime * pPrime) / ((1 - p) * (1 - p));
      }
    }

    return { firstDerivative, secondDerivative };
  }
}

export const triService = new TriService();
