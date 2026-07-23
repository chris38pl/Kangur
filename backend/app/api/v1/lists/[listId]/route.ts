import { NextResponse } from "next/server";

import {
  ShoppingListDTOSchema,
  UpdateShoppingListBodySchema,
} from "@/features/shopping-list/schemas";
import { archiveShoppingList } from "@/features/shopping-list/archiveShoppingList";
import { getShoppingList } from "@/features/shopping-list/getShoppingList";
import { updateShoppingList } from "@/features/shopping-list/updateShoppingList";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ listId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const url = new URL(request.url);
    const allowArchived = url.searchParams.get("allowArchived") === "1";
    const list = await getShoppingList(listId, user.id, { allowArchived });
    return NextResponse.json(ShoppingListDTOSchema.parse(list));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-list]", "GetFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = UpdateShoppingListBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const list = await updateShoppingList({
      listId,
      userId: user.id,
      ...parsed.data,
    });

    return NextResponse.json(ShoppingListDTOSchema.parse(list));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-list]", "UpdateFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    await archiveShoppingList(listId, user.id, {
      notifyMembers: true,
      outcome: "deleted",
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-list]", "ArchiveFailed", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Could not delete list." },
      { status: 500 },
    );
  }
}
