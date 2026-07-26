import type { AiProviderId } from "./types";

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw?.trim());
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function parseProviderChain(raw: string | undefined): AiProviderId[] {
  const fallback: AiProviderId[] = ["openai"];
  if (!raw?.trim()) return fallback;
  const allowed = new Set<AiProviderId>(["openai", "gemini"]);
  const parsed = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part): part is AiProviderId => allowed.has(part as AiProviderId));
  return parsed.length > 0 ? parsed : fallback;
}

export type AiRuntimeConfig = {
  chain: AiProviderId[];
  primaryTimeoutMs: number;
  fallbackTimeoutMs: number;
  retryMaxPrimaryFast: number;
  openai: {
    apiKey: string | undefined;
    textModel: string;
    visionModel: string;
  };
  gemini: {
    apiKey: string | undefined;
    textModel: string;
    visionModel: string;
  };
};

export function loadAiRuntimeConfig(): AiRuntimeConfig {
  return {
    chain: parseProviderChain(process.env.AI_PROVIDER_CHAIN),
    primaryTimeoutMs: parsePositiveInt(
      process.env.AI_PRIMARY_TIMEOUT_MS,
      18_000,
    ),
    fallbackTimeoutMs: parsePositiveInt(
      process.env.AI_FALLBACK_TIMEOUT_MS,
      20_000,
    ),
    retryMaxPrimaryFast: parsePositiveInt(
      process.env.AI_RETRY_MAX_PRIMARY_FAST,
      1,
    ),
    openai: {
      apiKey: process.env.OPENAI_API_KEY?.trim() || undefined,
      textModel:
        process.env.OPENAI_MODEL_TEXT?.trim() || "gpt-4.1-mini",
      visionModel:
        process.env.OPENAI_MODEL_VISION?.trim() || "gpt-4.1-mini",
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
      textModel:
        process.env.GEMINI_MODEL_TEXT?.trim() || "gemini-2.0-flash",
      visionModel:
        process.env.GEMINI_MODEL_VISION?.trim() || "gemini-2.0-flash",
    },
  };
}
