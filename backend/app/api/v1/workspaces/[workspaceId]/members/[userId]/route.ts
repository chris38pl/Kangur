import { NextResponse } from "next/server";

import {
  removeMember,
  updateMemberRole,
} from "@/features/workspace/removeMember";
import { UpdateMemberRoleBodySchema } from "@/features/workspace/schemas";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string; userId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { workspaceId, userId: targetUserId } = await context.params;
    const { user } = await requireUser(request);
    await removeMember(workspaceId, targetUserId, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "RemoveMemberFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { workspaceId, userId: targetUserId } = await context.params;
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = UpdateMemberRoleBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Unknown role.",
      );
    }

    await updateMemberRole(
      workspaceId,
      targetUserId,
      user.id,
      parsed.data.role,
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "UpdateMemberRoleFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
