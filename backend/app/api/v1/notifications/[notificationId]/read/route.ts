import { NextResponse } from "next/server";

import { notificationRepository } from "@/features/notifications/notificationRepository";
import { ApiError, notFound } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

type RouteContext = { params: Promise<{ notificationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { notificationId } = await context.params;
    const { user } = await requireUser(request);
    const result = await notificationRepository.markRead(
      user.id,
      notificationId,
    );
    if (result.count === 0) {
      throw notFound("Notification not found.");
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[notifications]", "MarkReadFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
