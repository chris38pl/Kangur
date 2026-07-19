import { NextResponse } from "next/server";

import { ShoppingListDTOSchema } from "@/features/shopping-list/schemas";
import { repeatList } from "@/features/shopping-list/repeatList";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ listId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const list = await repeatList({ listId, userId: user.id });
    return NextResponse.json(ShoppingListDTOSchema.parse(list), { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-list]", "RepeatFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
