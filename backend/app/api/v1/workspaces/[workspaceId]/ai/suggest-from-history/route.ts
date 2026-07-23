import { NextResponse } from "next/server";

import { SuggestFromHistoryResponseSchema } from "@/features/ai/schemas";
import { suggestFromHistory } from "@/features/ai/suggestFromHistory";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { assertRateLimit } from "@/lib/rateLimit";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);

    assertRateLimit("ai", `${user.id}:${workspaceId}`);

    const result = await suggestFromHistory({
      workspaceId,
      userId: user.id,
    });

    return NextResponse.json(SuggestFromHistoryResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[ai]", "SuggestFromHistoryFailed", error);
    return NextResponse.json(
      {
        code: "AI_UNAVAILABLE",
        message: "AI is temporarily unavailable. Please try again.",
      },
      { status: 502 },
    );
  }
}
