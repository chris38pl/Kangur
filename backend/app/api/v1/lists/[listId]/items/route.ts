import { NextResponse } from "next/server";

import {
  CreateShoppingItemBodySchema,
  ShoppingItemDTOSchema,
  ShoppingItemListResponseSchema,
} from "@/features/shopping-item/schemas";
import { createShoppingItem } from "@/features/shopping-item/createShoppingItem";
import { listShoppingItems } from "@/features/shopping-item/listShoppingItems";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ listId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const items = await listShoppingItems(listId, user.id);
    return NextResponse.json(ShoppingItemListResponseSchema.parse({ items }));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-item]", "ListFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = CreateShoppingItemBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const item = await createShoppingItem({
      listId,
      userId: user.id,
      ...parsed.data,
    });

    return NextResponse.json(ShoppingItemDTOSchema.parse(item), { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-item]", "CreateFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
