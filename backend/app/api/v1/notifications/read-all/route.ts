import { NextResponse } from "next/server";

import { notificationRepository } from "@/features/notifications/notificationRepository";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request);
    await notificationRepository.markAllRead(user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[notifications]", "MarkAllReadFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
