import { NextResponse } from "next/server";

import {
  RegisterPushDeviceBodySchema,
  UnregisterPushDeviceBodySchema,
} from "@/features/notifications/schemas";
import { ApiError, validationError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request);
    assertRateLimit("auth", user.id);
    const json: unknown = await request.json();
    const parsed = RegisterPushDeviceBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid push device.",
      );
    }

    const now = new Date();
    const existing = await prisma.pushDevice.findUnique({
      where: { expoToken: parsed.data.expoToken },
    });

    // Do not reassign a token that already belongs to another user.
    if (existing && existing.userId !== user.id) {
      throw validationError("Push token is already registered to another account.");
    }

    await prisma.pushDevice.upsert({
      where: { expoToken: parsed.data.expoToken },
      create: {
        userId: user.id,
        expoToken: parsed.data.expoToken,
        platform: parsed.data.platform ?? null,
        appVersion: parsed.data.appVersion ?? null,
        lastSeenAt: now,
        disabledAt: null,
      },
      update: {
        platform: parsed.data.platform ?? null,
        appVersion: parsed.data.appVersion ?? null,
        lastSeenAt: now,
        disabledAt: null,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[notifications]", "RegisterPushFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireUser(request);
    const json: unknown = await request.json();
    const parsed = UnregisterPushDeviceBodySchema.safeParse(json);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues[0]?.message ?? "Invalid push device.",
      );
    }

    await prisma.pushDevice.deleteMany({
      where: {
        userId: user.id,
        expoToken: parsed.data.expoToken,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[notifications]", "UnregisterPushFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}
