import { NextResponse } from "next/server";

import { getFeedback } from "@/features/feedback/getFeedback";
import {
  FeedbackDetailResponseSchema,
  UpdateFeedbackBodySchema,
} from "@/features/feedback/schemas";
import { updateFeedback } from "@/features/feedback/updateFeedback";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ feedbackId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request);
    const { feedbackId } = await context.params;
    const feedback = await getFeedback(user, feedbackId);
    const body = FeedbackDetailResponseSchema.parse({ feedback });
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[feedback]", "GetFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request);
    const { feedbackId } = await context.params;
    const json: unknown = await request.json();
    const parsed = UpdateFeedbackBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Invalid update payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const feedback = await updateFeedback(user, feedbackId, parsed.data);
    const body = FeedbackDetailResponseSchema.parse({ feedback });
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[feedback]", "UpdateFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
