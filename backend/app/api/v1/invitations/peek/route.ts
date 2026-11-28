import { NextResponse } from "next/server";

import { peekInvitation } from "@/features/workspace/peekInvitation";
import {
  InvitationPeekBodySchema,
  InvitationPeekResponseSchema,
} from "@/features/workspace/schemas";
import { ApiError, validationError } from "@/lib/auth/errors";
import { assertRateLimit } from "@/lib/rateLimit";

/** Before sign-in: the first address of x-forwarded-for keys the limit (Vercel sets it). */
function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

/** Public. Fills in the sign-in form on the invitation path (app 1.0.9). */
export async function POST(request: Request) {
  try {
    assertRateLimit("auth", `peek:${clientKey(request)}`);
    const json: unknown = await request.json();
    const parsed = InvitationPeekBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid invitation.",
      );
    }
    const body = InvitationPeekResponseSchema.parse(
      await peekInvitation(parsed.data.token),
    );
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[workspace]", "PeekInvitationFailed", error);
    return NextResponse.json(
      { code: "UNKNOWN", message: "Unable to read the invitation." },
      { status: 500 },
    );
  }
}
