import { NextResponse } from "next/server";

import { HistoryListResponseSchema } from "@/features/shopping-list/schemas";
import { listHistoryLists } from "@/features/shopping-list/listHistoryLists";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await context.params;
    const { user } = await requireUser(request);
    const lists = await listHistoryLists(workspaceId, user.id);
    return NextResponse.json(HistoryListResponseSchema.parse({ lists }));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-list]", "HistoryListFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
