export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  streak: number;
  rankPosition: number;
  badges: Badge[];
  achievements: Achievement[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  completed: boolean;
}

export interface Question {
  id: string;
  statement: string;
  area: ENEMArea;
  difficulty: Difficulty;
  year: number;
  topic: string;
  alternatives: Alternative[];
  correctAnswer: string;
  explanation: string;
  videoUrl?: string;
}

export interface Alternative {
  id: string;
  letter: string;
  text: string;
}

export type ENEMArea = 'linguagens' | 'humanas' | 'natureza' | 'matematica';
export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface Simulado {
  id: string;
  title: string;
  area: ENEMArea;
  totalQuestions: number;
  timeLimit: number;
  status: 'pending' | 'in_progress' | 'completed';
  score?: number;
  triScore?: number;
  completedAt?: string;
}

export interface Essay {
  id: string;
  title: string;
  content: string;
  theme: string;
  score?: number;
  competencies?: number[];
  feedback?: string;
  submittedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PvPRoom {
  id: string;
  code: string;
  host: string;
  opponent?: string;
  status: 'waiting' | 'in_progress' | 'finished';
  scores: { host: number; opponent: number };
}

export interface RankingEntry {
  position: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  score: number;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  type: 'theme' | 'avatar' | 'badge' | 'booster';
  price: number;
  icon: string;
  owned: boolean;
}

export interface DashboardStats {
  dailyProgress: number;
  xp: number;
  xpToNextLevel: number;
  level: number;
  rankPosition: number;
  simuladosCompleted: number;
  essayScore: number;
  streak: number;
  weeklyPerformance: { day: string; score: number }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
