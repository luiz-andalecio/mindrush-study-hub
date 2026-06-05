/**
 * Tipos para análise completa de redações ENEM
 * Interface entre backend (análise IA) e frontend (visualizações)
 */

// ============================================================================
// COMPETÊNCIAS ENEM
// ============================================================================

export type CompetencyLevel = 'muito fraco' | 'fraco' | 'regular' | 'bom' | 'excelente';

export interface CompetencyScore {
  id: number; // 1-5
  name: 'Norma Culta' | 'Compreensão' | 'Argumentação' | 'Coesão' | 'Proposta de Intervenção';
  score: number; // 0-200
  level: CompetencyLevel;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

// ============================================================================
// REDAÇÃO INDIVIDUAL
// ============================================================================

export interface EnemEssayBasic {
  id: string;
  theme: string;
  finalScore: number;
  submittedAt: Date;
  correctionStatus: 'pending' | 'corrected' | 'zero_rated';
  zeroCause?: string;
}

export interface EnemEssay extends EnemEssayBasic {
  content: string;
  wordCount: number;
  lineCount: number;
  competency1: number;
  competency2: number;
  competency3: number;
  competency4: number;
  competency5: number;
  aiCorrection?: Record<string, any>;
  analysis?: EnemEssayAnalysis;
}

// ============================================================================
// ANÁLISE DETALHADA DA REDAÇÃO
// ============================================================================

export interface Competency1Analysis {
  grammarErrors: number;
  spellingErrors: number;
  punctuationErrors: number;
  concordanceErrors: number;
  totalErrors: number;
  level: CompetencyLevel;
  errorTypes: {
    grammar: string[];
    spelling: string[];
    punctuation: string[];
    concordance: string[];
  };
}

export interface Competency2Analysis {
  themeAdherence: number; // 0-100
  repertoireCount: number;
  validRepertoires: number;
  productiveRepertoires: number;
  repertoireAreas: string[]; // "filosofia", "sociologia", etc
  level: CompetencyLevel;
}

export interface Competency3Analysis {
  argumentCount: number;
  argumentDepth: 'superficial' | 'média' | 'profunda';
  logicalProgression: number; // 0-100
  criticality: number; // 0-100
  arguments: Array<{
    summary: string;
    strength: 'fraco' | 'moderado' | 'forte';
    validity: boolean;
  }>;
  level: CompetencyLevel;
}

export interface Competency4Analysis {
  connectorCount: number;
  connectorVariety: number; // 0-100
  textualFlow: number; // 0-100
  paragraphStructure: 'deficiente' | 'adequada' | 'excelente';
  connectorsUsed: string[];
  coherenceBreaks: number;
  level: CompetencyLevel;
}

export interface Competency5Analysis {
  hasAgent: boolean;
  hasAction: boolean;
  hasMeans: boolean;
  hasEffect: boolean;
  hasDetails: boolean;
  completenessScore: number; // 0-100: quantos elementos tem
  interventionViability: 'inviável' | 'pouco viável' | 'viável' | 'muito viável';
  level: CompetencyLevel;
}

export interface EnemEssayAnalysis {
  id: string;
  essayId: string;
  themeIdentified: string;
  thesiDetected: string;
  
  // Análises por competência
  competency1: Competency1Analysis;
  competency2: Competency2Analysis;
  competency3: Competency3Analysis;
  competency4: Competency4Analysis;
  competency5: Competency5Analysis;
  
  // Análise avançada
  writingStyle: 'formal' | 'semiformal' | 'informal';
  stylisticProfile: 'argumentador' | 'crítico' | 'analítico' | 'técnico' | 'emocional' | 'persuasivo' | 'acadêmico';
  lexicalRichness: number; // 0-100
  textualComplexity: number; // 0-100
  coherenceScore: number; // 0-100
  
  // Pontos fortes e fracos
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  
  // Benchmark
  nationalAvgDistance: number;
  percentileRank: number; // 0-100
  
  createdAt: Date;
}

// ============================================================================
// ESTATÍSTICAS AGREGADAS
// ============================================================================

export interface EnemEssayStats {
  totalEssays: number;
  zeroRatedEssays: number;
  
  averageScore: number;
  bestScore: number;
  worstScore: number;
  medianScore: number;
  
  // Competências (médias)
  avgCompetency1: number;
  avgCompetency2: number;
  avgCompetency3: number;
  avgCompetency4: number;
  avgCompetency5: number;
  
  // Evolução
  evolutionPercentage: number;
  tendencyDirection: 'improving' | 'stable' | 'declining';
  
  // Frequência
  essaysPerWeek: number;
  lastEssayDate?: Date;
  
  // Consistência
  consistencyScore: number; // 0-100
  
  // Fraquezas
  weakestCompetency: number; // 1-5
  strongestCompetency: number; // 1-5
}

export interface CompetencyHistoryPoint {
  period: string; // "2025-W15", "2025-05"
  startDate: Date;
  endDate: Date;
  avgScore: number;
  c1Avg: number;
  c2Avg: number;
  c3Avg: number;
  c4Avg: number;
  c5Avg: number;
  trend: 'up' | 'down' | 'stable';
  essayCount: number;
}

// ============================================================================
// DASHBOARD DATA
// ============================================================================

export interface EssayDashboardData {
  stats: EnemEssayStats;
  recentEssays: EnemEssayBasic[];
  historyWeekly: CompetencyHistoryPoint[];
  historyMonthly: CompetencyHistoryPoint[];
}

export interface CompetencyRadarData {
  competency1: number; // 0-200
  competency2: number;
  competency3: number;
  competency4: number;
  competency5: number;
}

export interface EssayEvolutionPoint {
  date: Date;
  essayId: string;
  finalScore: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  theme: string;
}

// ============================================================================
// INSIGHTS E RECOMENDAÇÕES
// ============================================================================

export interface AutomaticInsight {
  id: string;
  type: 'strength' | 'weakness' | 'improvement' | 'prediction' | 'suggestion';
  title: string;
  description: string;
  actionableAdvice?: string;
  priority: 'high' | 'medium' | 'low';
  relatedCompetencies?: number[];
  createdAt: Date;
}

export interface PredictionData {
  currentAvg: number;
  projectedScore: number;
  essaysNeeded: number;
  timeframeWeeks: number;
  confidence: number; // 0-100
  probabilityOf900Plus: number;
  probabilityOf950Plus: number;
  probabilityOfPerfect: number;
}

// ============================================================================
// COMPARATIVOS
// ============================================================================

export interface BenchmarkComparison {
  userAverage: number;
  nationalAverage: number;
  platformAverage: number;
  topPercentileAverage: number;
  userPercentile: number;
  userRank?: number;
  totalUsers?: number;
}

// ============================================================================
// FILTROS E QUERIES
// ============================================================================

export interface EssayFilters {
  startDate?: Date;
  endDate?: Date;
  minScore?: number;
  maxScore?: number;
  theme?: string;
  competency?: number; // 1-5
  correctionStatus?: 'pending' | 'corrected' | 'zero_rated';
  sortBy?: 'date' | 'score' | 'competency';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface EssayListResponse {
  essays: EnemEssayBasic[];
  total: number;
  hasMore: boolean;
}
