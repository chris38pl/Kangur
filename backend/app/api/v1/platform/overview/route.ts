import { NextResponse } from "next/server";

import { getPlatformOverview } from "@/features/platform/getOverview";
import { PlatformOverviewResponseSchema } from "@/features/platform/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const overview = await getPlatformOverview(user);
    const body = PlatformOverviewResponseSchema.parse(overview);
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[platform]", "OverviewFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
