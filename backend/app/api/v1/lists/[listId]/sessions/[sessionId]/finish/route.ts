import { NextResponse } from "next/server";

import {
  FinishShoppingSessionBodySchema,
  FinishShoppingSessionResponseSchema,
} from "@/features/notifications/schemas";
import { finishShoppingSession } from "@/features/shopping-list/shoppingSessionService";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ listId: string; sessionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { listId, sessionId } = await context.params;
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = FinishShoppingSessionBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid finish payload.",
      );
    }

    const result = await finishShoppingSession({
      listId,
      sessionId,
      actorUserId: user.id,
      unavailableCount: parsed.data.unavailableCount,
    });

    return NextResponse.json(
      FinishShoppingSessionResponseSchema.parse(result),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-session]", "FinishFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
