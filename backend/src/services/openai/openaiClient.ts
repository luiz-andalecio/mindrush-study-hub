import OpenAI from "openai";
import { env } from "../../env";
import { logger } from "../../logger";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!cachedClient) {
    logger.info(
      {
        provider: "groq",
        model: env.groqModel,
        baseURL: "https://api.groq.com/openai/v1",
      },
      "Inicializando cliente Groq (Llama 3.3 70B)",
    );

    cachedClient = new OpenAI({
      apiKey: env.groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  return cachedClient;
}
