import { NextResponse } from "next/server";

import { previewInvitation } from "@/features/workspace/previewInvitation";
import {
  InvitationPreviewQuerySchema,
  InvitationPreviewResponseSchema,
} from "@/features/workspace/schemas";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const url = new URL(request.url);
    const parsed = InvitationPreviewQuerySchema.safeParse({
      token: url.searchParams.get("token") ?? "",
    });
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid invitation token.",
      );
    }

    const result = await previewInvitation({
      rawToken: parsed.data.token,
      userId: user.id,
      userEmail: user.email,
      clerkId: user.clerkId,
    });

    const body = InvitationPreviewResponseSchema.parse(result);
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "PreviewInvitationFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
