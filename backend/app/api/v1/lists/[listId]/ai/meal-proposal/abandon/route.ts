import { NextResponse } from "next/server";

import { AbandonMealProposalBodySchema } from "@/features/ai/schemas";
import { abandonMealProposal } from "@/features/ai/ingestMealProposal";
import { authorizeList } from "@/lib/authorize";
import { ApiError, forbidden, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { isMealProposalEnabled } from "@/lib/featureGates";

type RouteContext = { params: Promise<{ listId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const { list } = await authorizeList(listId, user.id);

    if (!isMealProposalEnabled(list)) {
      throw forbidden("Meal proposal is disabled.");
    }

    const json: unknown = await request.json();
    const parsed = AbandonMealProposalBodySchema.safeParse(json);
    if (!parsed.success) throw validationError("Invalid abandon body.");

    const result = await abandonMealProposal({
      listId,
      userId: user.id,
      runId: parsed.data.runId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[ai]", "MealProposalAbandonFailed", error);
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Abandon failed." },
      { status: 400 },
    );
  }
}
