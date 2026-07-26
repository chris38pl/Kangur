import { NextResponse } from "next/server";

import { listFeedback } from "@/features/feedback/listFeedback";
import {
  FeedbackListResponseSchema,
  ListFeedbackQuerySchema,
} from "@/features/feedback/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const url = new URL(request.url);
    const parsed = ListFeedbackQuerySchema.safeParse({
      status: url.searchParams.get("status") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
      unresolvedOnly: url.searchParams.get("unresolvedOnly") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid query." },
        { status: 400 },
      );
    }

    const result = await listFeedback(user, parsed.data);
    const body = FeedbackListResponseSchema.parse(result);
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[feedback]", "ListFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
