import { NextResponse } from "next/server";

import { applySuggestFromHistory } from "@/features/ai/applySuggestFromHistory";
import {
  ApplySuggestFromHistoryBodySchema,
  ApplySuggestFromHistoryResponseSchema,
} from "@/features/ai/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = ApplySuggestFromHistoryBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const result = await applySuggestFromHistory({
      workspaceId,
      userId: user.id,
      runId: parsed.data.runId,
      acceptedProposalRowIds: parsed.data.acceptedProposalRowIds,
    });

    return NextResponse.json(
      ApplySuggestFromHistoryResponseSchema.parse(result),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[ai]", "ApplySuggestFromHistoryFailed", error);
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "AI apply failed." },
      { status: 400 },
    );
  }
}
