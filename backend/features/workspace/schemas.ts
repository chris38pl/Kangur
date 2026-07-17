import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { isWorkspaceIconId } from "@shared/workspace-icons";

extendZodWithOpenApi(z);

export const WorkspaceRoleSchema = z
  .enum(["owner", "admin", "member"])
  .openapi("WorkspaceRole");

export const WorkspacePlanSchema = z
  .enum(["free", "premium"])
  .openapi("WorkspacePlan");

export const WorkspaceDTOSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    role: WorkspaceRoleSchema,
    isOwner: z.boolean(),
    memberCount: z.number().int().nonnegative(),
    plan: WorkspacePlanSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("WorkspaceDTO");

export type WorkspaceDTO = z.infer<typeof WorkspaceDTOSchema>;

export const CreateWorkspaceBodySchema = z
  .object({
    name: z.string().min(1).max(64),
    icon: z.string().refine(isWorkspaceIconId, {
      message: "Invalid workspace icon id.",
    }),
  })
  .openapi("CreateWorkspaceBody");

export type CreateWorkspaceBody = z.infer<typeof CreateWorkspaceBodySchema>;

export const WorkspaceListResponseSchema = z
  .object({
    workspaces: z.array(WorkspaceDTOSchema),
  })
  .openapi("WorkspaceListResponse");
