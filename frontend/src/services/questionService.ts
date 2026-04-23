import { journeyService } from './journeyService';

// @deprecated: o fluxo antigo "questions" foi substituído pela Jornada.
// Mantido apenas para evitar confusão durante refactors (não usar em código novo).
export const questionService = journeyService;
