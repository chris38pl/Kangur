import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/** Plain marketing semver policy for mobile soft / future force update. */
export const AppVersionResponseSchema = z
  .object({
    latestVersion: z.string().min(1),
    minSupportedVersion: z.string().min(1),
    publishedAt: z.string().datetime(),
  })
  .openapi("AppVersionResponse");

export type AppVersionResponseDto = z.infer<typeof AppVersionResponseSchema>;
