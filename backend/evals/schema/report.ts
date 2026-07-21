import { z } from "zod";

export const EvidenceSchema = z.object({
  offendingItems: z.array(z.string()).optional(),
  expected: z.array(z.string()).optional(),
  actual: z.array(z.string()).optional(),
  missing: z.array(z.string()).optional(),
  extra: z.array(z.string()).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const RuleResultSchema = z.object({
  id: z.string(),
  type: z.string(),
  tier: z.enum(["hard", "soft", "info"]),
  severity: z.enum(["critical", "major", "minor"]),
  status: z.enum(["pass", "fail", "warn", "info"]),
  message: z.string(),
  latencyMs: z.number(),
  evidence: EvidenceSchema.default({}),
});

export type RuleResult = z.infer<typeof RuleResultSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
