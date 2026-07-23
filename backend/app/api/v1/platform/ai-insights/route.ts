import { NextResponse } from "next/server";

import { getAiInsights } from "@/features/platform/getAiInsights";
import { PlatformAiInsightsResponseSchema } from "@/features/platform/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const url = new URL(request.url);
    const insights = await getAiInsights(user, {
      limit: url.searchParams.get("limit"),
      q: url.searchParams.get("q"),
    });
    const body = PlatformAiInsightsResponseSchema.parse(insights);
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[platform]", "AiInsightsFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
