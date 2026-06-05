# 📊 Sistema de Inteligência de Desempenho MindRush

## 🎯 Overview

Este sistema implementa análises avançadas de desempenho para estudantes ENEM com:

- **TRI (Teoria de Resposta ao Item)** em tempo real
- **Análise de Coerência Pedagógica**
- **Detecção Automática de Fraquezas**
- **Curva de Aprendizado com ML**
- **Sistema Gamificado com 25+ Badges**

## 📁 Estrutura

```
backend/
├── src/
│   ├── services/
│   │   ├── tri/
│   │   │   └── triService.ts          # Cálculos de proficiência e nota TRI
│   │   ├── performance/
│   │   │   └── performanceAnalyticsService.ts  # Estatísticas gerais
│   │   ├── analytics/
│   │   │   └── intelligentAnalyticsService.ts  # Fraquezas e trends
│   │   └── gamification/
│   │       └── gamificationService.ts # Badges e conquistas
│   ├── routes/
│   │   └── stats.ts                   # 9 endpoints RESTful
│   └── scripts/
│       └── seed.ts                    # Inicializar badges padrão
├── prisma/
│   ├── schema.prisma                  # 9 novos modelos
│   └── migrations/
│       └── 20260520172200_*.sql       # Cria todas as tabelas
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── StatisticsOverview.tsx     # Dashboard geral com TRI
│   │   ├── WeaknessAnalytics.tsx      # Fraquezas e learning curve
│   │   └── BadgesShowcase.tsx         # Badges e conquistas
│   ├── hooks/
│   │   └── useStatistics.ts           # 7 hooks React
│   └── pages/
│       └── Statistics.tsx             # Página integrada
└── package.json
```

## 🚀 Começar

### 1. Migrar Banco de Dados

```bash
cd backend
npx prisma migrate deploy
# ou em desenvolvimento:
npx prisma migrate dev
```

### 2. Inicializar Badges (Opcional)

```bash
npx ts-node src/scripts/seed.ts
# ou add em package.json:
# "scripts": { "seed": "ts-node src/scripts/seed.ts" }
npm run seed
```

### 3. Iniciar Backend

```bash
npm run dev
# API disponível em: http://localhost:3000/api/stats
```

### 4. Acessar no Frontend

```
http://localhost:5173/statistics
```

## 📊 API Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/stats/overview` | GET | Dashboard geral: TRI, acurácia, areas, streak |
| `/stats/areas` | GET | Desempenho em todas as 4 áreas |
| `/stats/areas/:area` | GET | Detalhes de uma área específica |
| `/stats/weaknesses` | GET | Mapa de fraquezas, tópicos críticos |
| `/stats/tri-analysis` | GET | Últimas análises de TRI e coerência |
| `/stats/learning-curve` | GET | Curva de aprendizado com trend |
| `/stats/performance-by-difficulty` | GET | Acurácia por fácil/médio/difícil |
| `/stats/badges` | GET | Badges desbloqueados pelo usuário |
| `/stats/progress?period=weekly` | GET | Estatísticas por período |

## 🔐 Autenticação

Todos os endpoints requerem header:
```
Authorization: Bearer <token>
```

## 📈 Tipos de Dados

### OverviewStats
```typescript
{
  overallAccuracy: number;           // 0-100%
  estimatedTriScore: number;         // 0-1000
  coherence: number;                 // 0-100%
  totalQuestionsAnswered: number;
  bestArea: string;
  worstArea: string;
  currentStreak: number;
  maxStreak: number;
  weeklyEvolutionPercentage: number; // -50 a 100
}
```

### Weakness
```typescript
{
  topic: string;
  accuracy: number;                 // % de acertos
  severity: 'critical' | 'high' | 'medium' | 'low';
  questionsAttempted: number;
  daysSinceLastAttempt: number;
  trend: 'improving' | 'declining' | 'stable';
}
```

### TriAnalytic
```typescript
{
  id: string;
  userId: string;
  simuladoId?: string;
  proficiency: number;              // θ (-3 a 3)
  estimatedScore: number;           // 0-1000
  coherence: number;                // 0-100%
  questionsCount: number;
  correctAnswers: number;
  analyzedAt: Date;
}
```

## 🎮 Badges Desbloqueáveis

### Categorias

| Tipo | Exemplos | Critério |
|------|----------|----------|
| 🎯 Milestone | 100/500/1000 questões | Quantidade de respostas |
| 🎓 Mastery | 90% em área, Perfeição | Acurácia alta |
| 🔥 Consistency | 7/14/30 dias consecutivos | Dias seguidos estudando |
| ⚡ Speed | Velocidade, Raio Dourado | Questões por minuto |
| 🏆 Achievement | Nota 600/700/800 TRI | Score absoluto |

## 📊 Fórmula TRI

```
P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))

Parâmetros:
- θ = proficiência do respondente
- a = discriminação (0.5 a 1.5)
- b = dificuldade
- c = acerto casual (~0.2)

Conversão para ENEM:
Nota = 500 + 100 × θ (clamped 0-1000)
```

## 🔧 Integração com Sua App

### 1. Adicionar Tab de Estatísticas

Já feito em `Statistics.tsx` com 4 tabs:
- Dashboard
- Análises Avançadas
- Fraquezas
- Badges

### 2. Atualizar Analytics Após Respostas

```typescript
// src/services/questionsService.ts
async saveAnswer(userId, questionId, answer) {
  // ... salvar resposta
  
  // Atualizar TRI
  await triService.calculateTri(userId);
  
  // Verificar badges
  await gamificationService.checkAndUnlockBadges(userId);
}
```

### 3. Mostrar TRI em Tempo Real

```tsx
const { data: stats } = useOverviewStats();
<div>{Math.round(stats.estimatedTriScore)}</div>
```

## ⚙️ Configurações

### Limites de Streak

```typescript
// performanceAnalyticsService.ts
const STREAK_RESET_HOURS = 48; // reseta se não estudar em 48h
```

### Thresholds de Fraqueza

```typescript
// intelligentAnalyticsService.ts
CRITICAL = accuracy < 40%;
HIGH = accuracy < 60%;
MEDIUM = accuracy < 75%;
```

### Cálculo de Coherence

```typescript
const incoherent = errorsByDifficulty.easy > correctByDifficulty.hard ? true : false;
coherence = incoherent ? 20 : 95; // baixo se incoerente
```

## 📝 Logs

Todos os serviços usam:
```typescript
logger.info('Calculado TRI:', { userId, score });
logger.error('Erro ao calcular:', error);
```

Veja logs em: `backend/logs/` (se configurado)

## 🐛 Debugging

### Testar TRI
```bash
curl http://localhost:3000/api/stats/tri-analysis \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Testar Fraquezas
```bash
curl http://localhost:3000/api/stats/weaknesses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Verificar Badges
```bash
curl http://localhost:3000/api/stats/badges \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Próximas Fases

### Phase 2: Machine Learning
- Previsão de nota futura com regressão
- Agrupamento de estilos de aprendizado
- Anomalia detection para detecção de cola

### Phase 3: Comparativa
- Percentil do usuário na plataforma
- Benchmarking por área e dificuldade
- Comparação com universidades alvo

### Phase 3: Exportar/Compartilhar
- Download de relatório PDF
- Compartilhar no LinkedIn
- Badge públicas

## 💡 Observações

1. **TRI é estimado**, não oficial. Usar parâmetros reais do INEP para precisão máxima.
2. **Coerência** é baseada em heurísticas. Pode ser refinada com mais dados.
3. **Badges** desbloqueados sem reversão. Considerar implementar system de "perder badge" se degradar.
4. **Cache** - Considerar Redis para queries frequentes.
5. **Perf** - Considerar materialized views para queries complexas.

---

**Desenvolvido para:** MindRush Study Hub  
**Stack:** TypeScript + Express + Prisma + React + Recharts  
**Data:** Maio 2026  
