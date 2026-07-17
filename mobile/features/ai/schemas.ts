import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";
import { z } from "zod";

export const ProposalOperationSchema = z.object({
  proposalRowId: z.string(),
  op: z.enum(["create", "merge", "update", "ignore"]),
  targetItemId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  name: z.string(),
  amount: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  category: z.enum(SHOPPING_CATEGORIES),
  confidence: z.number(),
  reason: z.string().nullable().optional(),
});

export type ProposalOperation = z.infer<typeof ProposalOperationSchema>;

export const AiIngestResponseSchema = z.object({
  runId: z.string(),
  model: z.string(),
  promptVersion: z.string(),
  durationMs: z.number().nullable(),
  proposal: z.object({
    operations: z.array(ProposalOperationSchema),
  }),
  fastPath: z.boolean(),
});

export type AiIngestResponse = z.infer<typeof AiIngestResponseSchema>;

export const ApplyAiProposalResponseSchema = z.object({
  applied: z.number(),
  items: z.array(z.unknown()),
});
