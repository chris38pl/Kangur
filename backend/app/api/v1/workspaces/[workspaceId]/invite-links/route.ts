import { NextResponse } from "next/server";

import { createInviteLink } from "@/features/workspace/createInviteLink";
import {
  CreateInviteLinkBodySchema,
  InviteLinkResultSchema,
} from "@/features/workspace/schemas";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { assertRateLimit } from "@/lib/rateLimit";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

/** A one-time invitation link without an address (app 1.0.9: "Pokaż kod", "Wyślij link"). */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    assertRateLimit("invitations", user.id);
    const text = await request.text();
    let json: unknown = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw validationError("Invalid JSON body.");
    }
    const parsed = CreateInviteLinkBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid invitation link payload.",
      );
    }

    const result = await createInviteLink({
      workspaceId,
      actorUserId: user.id,
      channel: parsed.data.channel,
      role: parsed.data.role,
    });

    const body = InviteLinkResultSchema.parse(result);
    return NextResponse.json(body, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "CreateInviteLinkFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
