import type { User } from "@prisma/client";
import { NextResponse } from "next/server";

import { presentMe } from "@/features/auth/presentMe";
import { UpdateMeBodySchema } from "@/features/auth/schemas";
import { deleteMe } from "@/features/auth/deleteMe";
import { ApiError, validationError } from "@/lib/auth/errors";
import { verifyClerkBearer } from "@/lib/auth/clerk";
import { requireUser } from "@/lib/auth/requireUser";
import { checkDisplayName } from "@/lib/names/displayName";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const deviceLocale = request.headers.get("x-device-locale");
    const { user } = await requireUser(request, { deviceLocale });
    return NextResponse.json(presentMe(user));
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
 * Update profile fields the user can edit: app language, and the name other people see.
 * The name is Kangur's own (source `user`), never written to Clerk.
 */
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

    let nameFields: Pick<User, "displayName" | "displayNameSource"> | null = null;
    if (parsed.data.displayName === null) {
      nameFields = { displayName: null, displayNameSource: "user" };
    } else if (parsed.data.displayName !== undefined) {
      const check = checkDisplayName(parsed.data.displayName);
      if (!check.ok) {
        throw validationError(
          check.reason === "email"
            ? "Enter a name, not an address."
            : "A name has 1 to 30 characters.",
          { reason: `name_${check.reason}` },
        );
      }
      nameFields = { displayName: check.name, displayNameSource: "user" };
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(parsed.data.locale ? { locale: parsed.data.locale } : {}),
        ...(nameFields ?? {}),
      },
    });

    return NextResponse.json(presentMe(updated));
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
