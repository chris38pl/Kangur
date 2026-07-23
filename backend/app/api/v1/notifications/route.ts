import { NextResponse } from "next/server";

import { notificationRepository } from "@/features/notifications/notificationRepository";
import { NotificationListResponseSchema } from "@/features/notifications/schemas";
import { ensureNotificationHandlersRegistered } from "@/features/notifications/registerHandlers";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { assertRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    ensureNotificationHandlersRegistered();
    const { user } = await requireUser(request);
    assertRateLimit("notifications", user.id);
    const [rows, unreadCount] = await Promise.all([
      notificationRepository.listForUser(user.id),
      notificationRepository.unreadCount(user.id),
    ]);

    const body = NotificationListResponseSchema.parse({
      unreadCount,
      notifications: rows.map((row) => ({
        id: row.id,
        type: row.type,
        status: row.status,
        title: row.title,
        body: row.body,
        actorUserId: row.actorUserId,
        workspaceId: row.workspaceId,
        sourceId: row.sourceId,
        payloadType: row.payloadType,
        payloadSchemaVersion: row.payloadSchemaVersion,
        payload: row.payload,
        createdAt: row.createdAt.toISOString(),
        readAt: row.readAt?.toISOString() ?? null,
      })),
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
