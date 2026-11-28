import { NextResponse } from "next/server";

import { notificationRepository } from "@/features/notifications/notificationRepository";
import {
  hiddenNotificationTypes,
  presentNotifications,
} from "@/features/notifications/presentNotifications";
import { NotificationListResponseSchema } from "@/features/notifications/schemas";
import { ensureNotificationHandlersRegistered } from "@/features/notifications/registerHandlers";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { readClientVersion } from "@/lib/clientVersion";
import { assertRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    ensureNotificationHandlersRegistered();
    const { user } = await requireUser(request);
    assertRateLimit("notifications", user.id);
    const client = readClientVersion(request);
    const hiddenTypes = hiddenNotificationTypes(client);
    const [rows, unreadCount] = await Promise.all([
      notificationRepository.listForUser(user.id, { hiddenTypes }),
      notificationRepository.unreadCount(user.id, { hiddenTypes }),
    ]);

    const body = NotificationListResponseSchema.parse({
      unreadCount,
      notifications: presentNotifications(rows, client),
    });

    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[notifications]", "ListFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
