import { NextResponse } from "next/server";

import {
  MealProposalRequestBodySchema,
  MealProposalResponseSchema,
} from "@/features/ai/schemas";
import { ingestMealProposal } from "@/features/ai/ingestMealProposal";
import { assertCanIngest } from "@/lib/aiCredits";
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
    await assertCanIngest(list.workspaceId, "meal");

    const json: unknown = await request.json();
    const parsed = MealProposalRequestBodySchema.safeParse(json);
    if (!parsed.success) throw validationError("Invalid meal proposal body.");

    const dishes = parsed.data.dishes.map((d) => d.trim()).filter(Boolean);
    if (dishes.length < 1 || dishes.length > 5) {
      throw validationError("Provide 1 to 5 dishes.");
    }

    const result = await ingestMealProposal({
      listId,
      userId: user.id,
      dishes,
    });
    return NextResponse.json(MealProposalResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[ai]", "MealProposalFailed", error);
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Meal proposal failed." },
      { status: 400 },
    );
  }
}
