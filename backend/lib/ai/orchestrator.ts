import { aiUnavailable } from "@/lib/auth/errors";

import { capabilitiesForRequest, providerSupports } from "./capabilities";
import type { AiRuntimeConfig } from "./config";
import {
  AiProviderError,
  classifyProviderFailure,
  isAiProviderError,
} from "./errors";
import type { AiCompletionPort } from "./port";
import type {
  AiFeature,
  AiProviderId,
  AiStructuredRequest,
  AiStructuredResult,
} from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  provider: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new AiProviderError({
          kind: "timeout",
          message: `${provider} request timed out after ${timeoutMs}ms.`,
          provider,
        }),
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/** Long clipboard / screenshot imports need more headroom than suggest/meal. */
const LONG_IMPORT_FEATURES = new Set<AiFeature>([
  "import-text",
  "import-vision",
]);
const LONG_IMPORT_PRIMARY_FLOOR_MS = 45_000;
const LONG_IMPORT_FALLBACK_FLOOR_MS = 50_000;

function timeoutMsFor(
  config: AiRuntimeConfig,
  feature: AiFeature,
  isPrimary: boolean,
): number {
  const base = isPrimary
    ? config.primaryTimeoutMs
    : config.fallbackTimeoutMs;
  if (!LONG_IMPORT_FEATURES.has(feature)) return base;
  const floor = isPrimary
    ? LONG_IMPORT_PRIMARY_FLOOR_MS
    : LONG_IMPORT_FALLBACK_FLOOR_MS;
  return Math.max(base, floor);
}

export class AiOrchestrator {
  constructor(
    private readonly config: AiRuntimeConfig,
    private readonly providers: Map<string, AiCompletionPort>,
  ) {}

  async completeStructured(
    req: AiStructuredRequest,
  ): Promise<AiStructuredResult> {
    const startedAt = Date.now();
    const needed = capabilitiesForRequest(req.capability);
    const chain = this.config.chain.filter((id) => {
      const port = this.providers.get(id);
      if (!port?.isConfigured()) return false;
      return needed.every((cap) => providerSupports(id, cap));
    });

    if (chain.length === 0) {
      throw aiUnavailable("No AI providers are configured for this request.");
    }

    const primaryProvider = chain[0]!;
    const providerAttemptOrder: string[] = [];
    const providersTried: string[] = [];
    let attempts = 0;
    let lastError: AiProviderError | undefined;
    let fallbackReason: string | undefined;

    for (let index = 0; index < chain.length; index++) {
      const providerId = chain[index]!;
      const port = this.providers.get(providerId);
      if (!port) continue;

      const isPrimary = index === 0;
      const timeoutMs = timeoutMsFor(
        this.config,
        req.meta.feature,
        isPrimary,
      );
      const maxFastRetries = isPrimary ? this.config.retryMaxPrimaryFast : 0;

      let fastRetriesUsed = 0;
      for (;;) {
        attempts += 1;
        providerAttemptOrder.push(providerId);
        if (!providersTried.includes(providerId)) {
          providersTried.push(providerId);
        }

        try {
          const result = await withTimeout(
            port.completeStructured(req),
            timeoutMs,
            providerId,
          );

          const usedFallback = !isPrimary;
          return {
            ...result,
            timing: {
              attempts,
              usedFallback,
              fallbackProvider: usedFallback ? providerId : undefined,
              primaryProvider,
              fallbackReason: usedFallback ? fallbackReason : undefined,
              providerAttemptOrder,
              providersTried,
              durationMs: Date.now() - startedAt,
            },
          };
        } catch (error) {
          const classified = isAiProviderError(error)
            ? error
            : classifyProviderFailure(error, providerId);
          lastError = classified;

          if (!classified.fallbackable) {
            if (classified.kind === "content") {
              throw aiUnavailable(classified.message);
            }
            throw aiUnavailable();
          }

          // Timeout → immediate next provider (no retry).
          if (classified.kind === "timeout") {
            fallbackReason = classified.kind;
            break;
          }

          // Fast transient retry only on primary.
          if (
            classified.retryable &&
            fastRetriesUsed < maxFastRetries
          ) {
            fastRetriesUsed += 1;
            await sleep(200 + Math.floor(Math.random() * 300));
            continue;
          }

          fallbackReason = classified.kind;
          break;
        }
      }
    }

    console.error("[ai]", "AllProvidersFailed", {
      primaryProvider,
      providersTried,
      providerAttemptOrder,
      lastError: lastError?.message,
      kind: lastError?.kind,
      feature: req.meta.feature,
    });

    throw aiUnavailable();
  }

  listProviderIds(): AiProviderId[] {
    return [...this.config.chain];
  }

  getConfig(): AiRuntimeConfig {
    return this.config;
  }

  getProvider(id: string): AiCompletionPort | undefined {
    return this.providers.get(id);
  }
}
