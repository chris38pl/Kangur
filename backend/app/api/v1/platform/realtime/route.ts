import { NextResponse } from "next/server";

import { getPlatformRealtime } from "@/features/platform/getRealtime";
import { PlatformRealtimeResponseSchema } from "@/features/platform/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const realtime = await getPlatformRealtime(user);
    const body = PlatformRealtimeResponseSchema.parse(realtime);
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[platform]", "RealtimeFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
