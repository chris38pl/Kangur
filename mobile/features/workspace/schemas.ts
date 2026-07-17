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

export const WorkspaceMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  joinedAt: z.string(),
});

export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

export const WorkspaceMemberListSchema = z.object({
  members: z.array(WorkspaceMemberSchema),
});
