import { loadAiRuntimeConfig } from "./config";
import { AiOrchestrator } from "./orchestrator";
import { createGeminiProvider } from "./providers/gemini";
import { createOpenAiProvider } from "./providers/openai";
import type { AiCompletionPort } from "./port";

let cached: AiOrchestrator | null = null;

export function getAiOrchestrator(): AiOrchestrator {
  if (cached) return cached;

  const config = loadAiRuntimeConfig();
  const providers = new Map<string, AiCompletionPort>();

  providers.set(
    "openai",
    createOpenAiProvider({
      apiKey: config.openai.apiKey,
      textModel: config.openai.textModel,
      visionModel: config.openai.visionModel,
    }),
  );
  providers.set(
    "gemini",
    createGeminiProvider({
      apiKey: config.gemini.apiKey,
      textModel: config.gemini.textModel,
      visionModel: config.gemini.visionModel,
    }),
  );

  cached = new AiOrchestrator(config, providers);
  return cached;
}

/** Test helper — clear cached orchestrator after ENV changes. */
export function resetAiOrchestratorForTests(): void {
  cached = null;
}

export type {
  AiStructuredRequest,
  AiStructuredResult,
  AiFeature,
  AiCapability,
} from "./types";
export { getAiProvidersHealth } from "./health";
export type { AiProvidersHealthResponse } from "./health";
export { AiProviderError, isAiProviderError } from "./errors";
