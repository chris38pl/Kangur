import { NextResponse } from "next/server";

import { MeResponseSchema } from "@/features/auth/schemas";
import { deleteMe } from "@/features/auth/deleteMe";
import { ApiError } from "@/lib/auth/errors";
import { verifyClerkBearer } from "@/lib/auth/clerk";
import { requireUser } from "@/lib/auth/requireUser";
import { isAppLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const deviceLocale = request.headers.get("x-device-locale");
    const { user } = await requireUser(request, { deviceLocale });

    const body = MeResponseSchema.parse({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      locale: isAppLocale(user.locale) ? user.locale : null,
      platformRole: user.platformRole,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });

    return NextResponse.json(body);
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
