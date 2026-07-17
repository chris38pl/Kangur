import { NextResponse } from "next/server";

import { MeResponseSchema } from "@/features/auth/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(request: Request) {
  try {
    const deviceLocale = request.headers.get("x-device-locale");
    const { user } = await requireUser(request, { deviceLocale });

    const body = MeResponseSchema.parse({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      locale: user.locale === "pl" || user.locale === "en" ? user.locale : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });

    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[auth]", "MeFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
