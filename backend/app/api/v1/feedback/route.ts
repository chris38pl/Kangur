import { NextResponse } from "next/server";

import { createFeedback } from "@/features/feedback/createFeedback";
import {
  CreateFeedbackBodySchema,
  CreateFeedbackResponseSchema,
} from "@/features/feedback/schemas";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = CreateFeedbackBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Invalid feedback payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const feedback = await createFeedback(user, parsed.data);
    const body = CreateFeedbackResponseSchema.parse({ feedback });
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[feedback]", "CreateFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
