import { NextResponse } from "next/server";

import { ShoppingEventListResponseSchema } from "@/features/shopping-item/schemas";
import { listShoppingEvents } from "@/features/shopping-item/listShoppingEvents";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ listId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const after = new URL(request.url).searchParams.get("after");

    const result = await listShoppingEvents({
      listId,
      userId: user.id,
      after,
    });

    return NextResponse.json(ShoppingEventListResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-event]", "ListFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
