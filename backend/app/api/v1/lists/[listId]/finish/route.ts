import { NextResponse } from "next/server";

import {
  FinishShoppingListBodySchema,
  FinishShoppingListResponseSchema,
} from "@/features/notifications/schemas";
import { finishShoppingList } from "@/features/shopping-list/shoppingSessionService";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { withHttpMetrics } from "@/lib/metrics/http-middleware";

type RouteContext = {
  params: Promise<{ listId: string }>;
};

/**
 * Finish shopping without a session id (trip started offline). Archives the
 * list into History - unlike DELETE, which is the user's "Delete list".
 */
async function handlePost(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = FinishShoppingListBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid finish payload.",
      );
    }

    const result = await finishShoppingList({
      listId,
      actorUserId: user.id,
      unavailableCount: parsed.data.unavailableCount,
    });

    return NextResponse.json(FinishShoppingListResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-list]", "FinishFailed", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Could not finish the list." },
      { status: 500 },
    );
  }
}

export const POST = withHttpMetrics("lists.finish", handlePost as never);
