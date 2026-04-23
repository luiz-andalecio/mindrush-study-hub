import api from "@/services/api";
import type {
  AnswerSaveResponse,
  FinalizeNodeResponse,
  Journey,
  JourneyNodeDetails,
  JourneySummary,
  RetryNodeResponse,
} from "@/types";

export type CreateJourneyBody = {
  area: 'Linguagens' | 'Ciências Humanas' | 'Ciências da Natureza' | 'Matemática';
  // Só para Linguagens
  language?: 'ingles' | 'espanhol';
};

export type AnswerJourneyBody = {
  enemQuestionId: string;
  selectedAlternative: string;
};

export const journeyService = {
  listJourneys() {
    return api.get<JourneySummary[]>("/journey");
  },

  createJourney(body: CreateJourneyBody) {
    return api.post<Journey>("/journey", body);
  },

  getJourney(id: string) {
    return api.get<Journey>(`/journey/${id}`);
  },

  getNodeDetails(nodeId: string) {
    return api.get<JourneyNodeDetails>(`/journey/nodes/${nodeId}`);
  },

  saveAnswer(nodeId: string, body: AnswerJourneyBody) {
    return api.post<AnswerSaveResponse>(`/journey/nodes/${nodeId}/answer`, body);
  },

  finalizeNode(nodeId: string) {
    return api.post<FinalizeNodeResponse>(`/journey/nodes/${nodeId}/finalize`, {});
  },

  retryNode(nodeId: string) {
    return api.post<RetryNodeResponse>(`/journey/nodes/${nodeId}/retry`, {});
  },

  // Alias (legado) — evita quebra durante refactor
  answer(nodeId: string, body: AnswerJourneyBody) {
    return api.post<AnswerSaveResponse>(`/journey/${nodeId}/answer`, body);
  },
};
