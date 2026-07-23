import { NextResponse } from "next/server";

import { acceptInvitation } from "@/features/workspace/acceptInvitation";
import {
  AcceptInvitationBodySchema,
  AcceptInvitationResponseSchema,
} from "@/features/workspace/schemas";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { assertRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const { user, clerkId } = await requireUser(request);
    assertRateLimit("invitations", user.id);
    const json: unknown = await request.json();
    const parsed = AcceptInvitationBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid accept payload.",
      );
    }

    const result = await acceptInvitation({
      rawToken: parsed.data.token,
      invitationId: parsed.data.invitationId,
      userId: user.id,
      userEmail: user.email,
      clerkId,
    });

    const body = AcceptInvitationResponseSchema.parse(result);
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "AcceptInvitationFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
