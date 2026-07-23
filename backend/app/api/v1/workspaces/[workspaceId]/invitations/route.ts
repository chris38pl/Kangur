import { NextResponse } from "next/server";

import { inviteMember } from "@/features/workspace/inviteMember";
import { listInvitations } from "@/features/workspace/listInvitations";
import {
  CreateInvitationBodySchema,
  InvitationListResponseSchema,
  InviteMemberResultSchema,
} from "@/features/workspace/schemas";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { assertRateLimit } from "@/lib/rateLimit";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const invitations = await listInvitations(workspaceId, user.id);
    const body = InvitationListResponseSchema.parse({ invitations });
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "ListInvitationsFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    assertRateLimit("invitations", user.id);
    const json: unknown = await request.json();
    const parsed = CreateInvitationBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid invitation payload.",
      );
    }

    const result = await inviteMember({
      workspaceId,
      actorUserId: user.id,
      actorEmail: user.email,
      actorLocale: user.locale,
      email: parsed.data.email,
      role: parsed.data.role,
    });

    const body = InviteMemberResultSchema.parse(result);
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "InviteMemberFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
