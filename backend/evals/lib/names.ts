import { createHash } from "node:crypto";

export function normalizeNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function namesMatch(a: string, b: string): boolean {
  return normalizeNameKey(a) === normalizeNameKey(b);
}

export function findName(haystack: string[], needle: string): string | undefined {
  const key = normalizeNameKey(needle);
  return haystack.find((h) => normalizeNameKey(h) === key);
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function precisionRecallF1(
  predicted: string[],
  expected: string[],
): { precision: number; recall: number; f1: number } {
  const predKeys = new Set(predicted.map(normalizeNameKey).filter(Boolean));
  const expKeys = new Set(expected.map(normalizeNameKey).filter(Boolean));
  if (predKeys.size === 0 && expKeys.size === 0) {
    return { precision: 1, recall: 1, f1: 1 };
  }
  let tp = 0;
  for (const k of predKeys) {
    if (expKeys.has(k)) tp += 1;
  }
  const precision = predKeys.size === 0 ? 0 : tp / predKeys.size;
  const recall = expKeys.size === 0 ? 0 : tp / expKeys.size;
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);
  return { precision, recall, f1 };
}
