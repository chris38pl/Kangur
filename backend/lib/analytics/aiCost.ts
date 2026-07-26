/**
 * Rough USD cost estimate for AI providers (privacy-safe analytics).
 * Rates are approximate; bump when pricing changes. One currency only.
 */

const RATES_USD_PER_1M: Record<
  string,
  { input: number; output: number }
> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2, output: 8 },
  // Gemini Flash — approximate public rates
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
};

function ratesForModel(model: string): { input: number; output: number } {
  const exact = RATES_USD_PER_1M[model];
  if (exact) return exact;
  if (model.includes("gemini") && model.includes("flash")) {
    return RATES_USD_PER_1M["gemini-2.0-flash"];
  }
  if (model.includes("mini") || model.includes("flash")) {
    return RATES_USD_PER_1M["gpt-4o-mini"];
  }
  return RATES_USD_PER_1M["gpt-4o"];
}

export function estimateAiCostUsd(input: {
  model: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
}): number | undefined {
  const prompt = input.promptTokens ?? 0;
  const completion = input.completionTokens ?? 0;
  if (prompt <= 0 && completion <= 0) return undefined;
  const rates = ratesForModel(input.model);
  const usd =
    (prompt / 1_000_000) * rates.input +
    (completion / 1_000_000) * rates.output;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

/** @deprecated Prefer estimateAiCostUsd */
export const estimateOpenAiCostUsd = estimateAiCostUsd;

export function usageFromTokenCounts(usage?: {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}): {
  tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
} {
  if (!usage) return {};
  return {
    tokens:
      usage.totalTokens ??
      ((usage.promptTokens ?? 0) + (usage.completionTokens ?? 0) || undefined),
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
  };
}

/** Supports Chat Completions + Responses usage shapes. */
export function usageFromCompletion(raw: {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
  };
}): {
  tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
} {
  const usage = raw.usage;
  if (!usage) return {};
  const promptTokens = usage.prompt_tokens ?? usage.input_tokens;
  const completionTokens = usage.completion_tokens ?? usage.output_tokens;
  const total =
    usage.total_tokens ??
    (promptTokens != null || completionTokens != null
      ? (promptTokens ?? 0) + (completionTokens ?? 0)
      : undefined);
  return {
    tokens: total,
    promptTokens,
    completionTokens,
  };
}
