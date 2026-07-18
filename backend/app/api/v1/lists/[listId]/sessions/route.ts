import { NextResponse } from "next/server";

import {
  StartShoppingSessionBodySchema,
  StartShoppingSessionResponseSchema,
} from "@/features/notifications/schemas";
import { startShoppingSession } from "@/features/shopping-list/shoppingSessionService";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = { params: Promise<{ listId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    let body: { clientInstanceId?: string; clientPlatform?: string } = {};
    const text = await request.text();
    if (text) {
      const parsed = StartShoppingSessionBodySchema.safeParse(
        JSON.parse(text) as unknown,
      );
      if (!parsed.success) {
        throw validationError(
          parsed.error.issues[0]?.message ?? "Invalid session payload.",
        );
      }
      body = parsed.data;
    }

    const result = await startShoppingSession({
      listId,
      actorUserId: user.id,
      clientInstanceId: body.clientInstanceId,
      clientPlatform: body.clientPlatform,
    });

    return NextResponse.json(
      StartShoppingSessionResponseSchema.parse(result),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-session]", "StartFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
