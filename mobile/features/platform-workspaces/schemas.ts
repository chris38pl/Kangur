import { z } from "zod";

import { WorkspaceSchema, type Workspace } from "@/features/workspace/schemas";

export const PlatformWorkspaceListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  plan: z.enum(["free", "premium"]),
  memberCount: z.number().int().nonnegative(),
  ownerEmail: z.string().email().nullable(),
  createdAt: z.string(),
  lastUsedAt: z.string(),
});

export type PlatformWorkspaceListItem = z.infer<
  typeof PlatformWorkspaceListItemSchema
>;

export const PlatformWorkspaceListResponseSchema = z.object({
  workspaces: z.array(PlatformWorkspaceListItemSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int().nonnegative(),
});

export type PlatformWorkspaceListResponse = z.infer<
  typeof PlatformWorkspaceListResponseSchema
>;

export const PlatformWorkspaceDetailResponseSchema = z.object({
  workspace: WorkspaceSchema,
});

export type { Workspace };
