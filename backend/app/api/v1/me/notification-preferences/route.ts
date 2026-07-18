import { NextResponse } from "next/server";

import {
  getOrCreateNotificationPreferences,
} from "@/features/notifications/preferences";
import {
  NotificationPreferencesSchema,
  UpdateNotificationPreferencesBodySchema,
} from "@/features/notifications/schemas";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";

function toDto(row: {
  silentMode?: boolean;
  workspaceInvitations: boolean;
  shoppingStarted: boolean;
  shoppingFinished: boolean;
  shoppingListCreated: boolean;
  shoppingListDeleted?: boolean;
  appUpdates: boolean;
  newFeatures: boolean;
  offersPromos: boolean;
}) {
  return NotificationPreferencesSchema.parse({
    silentMode: row.silentMode ?? false,
    workspaceInvitations: row.workspaceInvitations,
    shoppingStarted: row.shoppingStarted,
    shoppingFinished: row.shoppingFinished,
    shoppingListCreated: row.shoppingListCreated,
    shoppingListDeleted: row.shoppingListDeleted ?? false,
    appUpdates: row.appUpdates,
    newFeatures: row.newFeatures,
    offersPromos: row.offersPromos,
  });
}

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const prefs = await getOrCreateNotificationPreferences(user.id);
    return NextResponse.json(toDto(prefs));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[notifications]", "GetPrefsFailed", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Unable to load preferences." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = UpdateNotificationPreferencesBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid preferences.",
      );
    }

    await getOrCreateNotificationPreferences(user.id);
    const updated = await prisma.userNotificationPreferences.update({
      where: { userId: user.id },
      data: parsed.data,
    });

    return NextResponse.json(toDto(updated));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[notifications]", "UpdatePrefsFailed", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Unable to update preferences." },
      { status: 500 },
    );
  }
}
