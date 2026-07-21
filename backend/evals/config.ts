/** Eval harness defaults - retention, pricing, reproducibility. */

export const EVAL_DEFAULT_SEED = 424242;

export const EVAL_RETENTION = {
  maxAgeDays: 30,
  maxRuns: 100,
} as const;

/** Rough USD per 1M tokens - used only for estimatedCostUsd in reports. */
export const MODEL_PRICE_PER_1M: Record<
  string,
  { input: number; output: number }
> = {
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export function estimateCostUsd(input: {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}): number | undefined {
  if (input.promptTokens == null || input.completionTokens == null) {
    return undefined;
  }
  const key = Object.keys(MODEL_PRICE_PER_1M).find((k) =>
    input.model.startsWith(k),
  );
  const price = key ? MODEL_PRICE_PER_1M[key] : MODEL_PRICE_PER_1M["gpt-4.1-mini"];
  return (
    (input.promptTokens / 1_000_000) * price.input +
    (input.completionTokens / 1_000_000) * price.output
  );
}
