import { NextResponse } from "next/server";

import { revokeInvitation } from "@/features/workspace/revokeInvitation";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string; invitationId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { workspaceId, invitationId } = await context.params;
    const { user } = await requireUser(request);
    await revokeInvitation(workspaceId, invitationId, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "RevokeInvitationFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
