import { NextResponse } from "next/server";

import { abandonSuggestFromHistory } from "@/features/ai/applySuggestFromHistory";
import { AbandonSuggestFromHistoryBodySchema } from "@/features/ai/schemas";
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
    const parsed = AbandonSuggestFromHistoryBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const result = await abandonSuggestFromHistory({
      workspaceId,
      userId: user.id,
      runId: parsed.data.runId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[ai]", "AbandonSuggestFromHistoryFailed", error);
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "AI abandon failed." },
      { status: 400 },
    );
  }
}
