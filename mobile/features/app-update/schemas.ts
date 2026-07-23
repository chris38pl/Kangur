import { z } from "zod";

export const AppVersionResponseSchema = z.object({
  latestVersion: z.string().min(1),
  minSupportedVersion: z.string().min(1),
  publishedAt: z.string().datetime(),
});

export type AppVersionResponse = z.infer<typeof AppVersionResponseSchema>;
