import { NextResponse } from "next/server";

import {
  SuggestFromHistoryBodySchema,
  SuggestFromHistoryResponseSchema,
} from "@/features/ai/schemas";
import { suggestFromHistory } from "@/features/ai/suggestFromHistory";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { assertRateLimit } from "@/lib/rateLimit";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

async function readOptionalListId(request: Request): Promise<string | undefined> {
  const raw = await request.text();
  if (!raw.trim()) return undefined;

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    throw validationError("Invalid request body.");
  }

  const parsed = SuggestFromHistoryBodySchema.safeParse(json);
  if (!parsed.success) {
    throw validationError("Invalid request body.");
  }
  return parsed.data.listId;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);

    assertRateLimit("ai", `${user.id}:${workspaceId}`);

    const listId = await readOptionalListId(request);
    const result = await suggestFromHistory({
      workspaceId,
      userId: user.id,
      listId,
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
