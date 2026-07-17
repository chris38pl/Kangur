import { NextResponse } from "next/server";

import {
  CreateShoppingListBodySchema,
  ShoppingListDTOSchema,
  ShoppingListListResponseSchema,
} from "@/features/shopping-list/schemas";
import { createShoppingList } from "@/features/shopping-list/createShoppingList";
import { listShoppingLists } from "@/features/shopping-list/listShoppingLists";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const lists = await listShoppingLists(workspaceId, user.id);
    return NextResponse.json(ShoppingListListResponseSchema.parse({ lists }));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-list]", "ListFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = CreateShoppingListBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const list = await createShoppingList({
      workspaceId,
      userId: user.id,
      name: parsed.data.name,
      emoji: parsed.data.emoji,
    });

    return NextResponse.json(ShoppingListDTOSchema.parse(list), { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-list]", "CreateFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
