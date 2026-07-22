/**
 * Rough USD cost estimate for OpenAI chat completions (privacy-safe analytics).
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
};

function ratesForModel(model: string): { input: number; output: number } {
  const exact = RATES_USD_PER_1M[model];
  if (exact) return exact;
  if (model.includes("mini")) return RATES_USD_PER_1M["gpt-4o-mini"];
  return RATES_USD_PER_1M["gpt-4o"];
}

export function estimateOpenAiCostUsd(input: {
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

export function usageFromCompletion(raw: {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}): {
  tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
} {
  const usage = raw.usage;
  if (!usage) return {};
  return {
    tokens: usage.total_tokens,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
  };
}
