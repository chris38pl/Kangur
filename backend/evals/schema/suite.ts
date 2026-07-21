import { z } from "zod";

export const SuiteMetaSchema = z.object({
  name: z.string().min(1),
  suiteVersion: z.number().int().positive().default(1),
  adapter: z.string().min(1),
  defaultModel: z.string().optional(),
  defaultPrompt: z.string().default("production"),
  description: z.string().optional(),
});

export type SuiteMeta = z.infer<typeof SuiteMetaSchema>;
