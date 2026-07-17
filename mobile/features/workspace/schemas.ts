import { z } from "zod";

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  isOwner: z.boolean(),
  memberCount: z.number().int().nonnegative(),
  plan: z.enum(["free", "premium"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

export const WorkspaceListSchema = z.object({
  workspaces: z.array(WorkspaceSchema),
});
