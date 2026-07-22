import { NextResponse } from "next/server";

import {
  MeResponseSchema,
  UpdateMeBodySchema,
} from "@/features/auth/schemas";
import { deleteMe } from "@/features/auth/deleteMe";
import { ApiError, validationError } from "@/lib/auth/errors";
import { verifyClerkBearer } from "@/lib/auth/clerk";
import { requireUser } from "@/lib/auth/requireUser";
import { isAppLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

function toMeDto(user: {
  id: string;
  clerkId: string;
  email: string;
  locale: string | null;
  platformRole: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}) {
  return MeResponseSchema.parse({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    locale: isAppLocale(user.locale) ? user.locale : null,
    platformRole: user.platformRole,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}

export async function GET(request: Request) {
  try {
    const deviceLocale = request.headers.get("x-device-locale");
    const { user } = await requireUser(request, { deviceLocale });
    return NextResponse.json(toMeDto(user));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[auth]", "MeFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

/** Update profile fields the user can edit (currently: app language). */
export async function PATCH(request: Request) {
  try {
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = UpdateMeBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid profile update.",
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { locale: parsed.data.locale },
    });

    return NextResponse.json(toMeDto(updated));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[auth]", "MePatchFailed", error);
    return NextResponse.json(
      { code: "UNKNOWN", message: "Unable to update profile." },
      { status: 500 },
    );
  }
}

/**
 * Idempotent account purge (app DB only).
 * Missing user → 204. No body. No Clerk calls inside the handler transaction.
 */
export async function DELETE(request: Request) {
  try {
    const { clerkId } = await verifyClerkBearer(
      request.headers.get("authorization"),
    );

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return new NextResponse(null, { status: 204 });
    }

    await deleteMe(user.id);
    console.info("[auth]", "MeDeleted", { clerkId });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error("[auth]", "MeDeleteFailed", error);
    return NextResponse.json(
      { code: "UNKNOWN", message: "Unable to delete account." },
      { status: 500 },
    );
  }
}
