import { NextResponse } from "next/server";

import {
  ShoppingItemDTOSchema,
  UpdateShoppingItemBodySchema,
} from "@/features/shopping-item/schemas";
import { updateShoppingItem } from "@/features/shopping-item/updateShoppingItem";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = UpdateShoppingItemBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const item = await updateShoppingItem({
      itemId,
      userId: user.id,
      ...parsed.data,
    });

    return NextResponse.json(ShoppingItemDTOSchema.parse(item));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-item]", "UpdateFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
