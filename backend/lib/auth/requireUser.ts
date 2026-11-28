import type { User } from "@prisma/client";
import { createClerkClient } from "@clerk/backend";

import { upsertUser } from "@/features/auth/upsertUser";
import { ensureDefaultWorkspace } from "@/features/workspace/ensureDefaultWorkspace";
import { resolveAppLocale, type AppLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

import { verifyClerkBearer } from "./clerk";
import { invalidToken, rateLimited } from "./errors";

export type UserContext = {
  user: User;
  clerkId: string;
};

function isClerkRateLimit(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as {
    status?: number;
    errors?: Array<{ code?: string }>;
    message?: string;
  };
  if (e.status === 429) return true;
  if (e.errors?.some((x) => x.code === "too_many_requests")) return true;
  if (
    typeof e.message === "string" &&
    /too many requests/i.test(e.message)
  ) {
    return true;
  }
  return false;
}

/**
 * The Clerk profile at the first sign-in: primary address and the name. Apple gives the
 * name only at the first sign-in and Clerk keeps it on the user (firstName / lastName); the
 * Apple external account holds nothing by then (checked 28 XI 2026).
 */
async function resolveClerkProfile(
  clerkId: string,
  secretKey: string,
): Promise<{
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
}> {
  const clerk = createClerkClient({ secretKey });
  try {
    const clerkUser = await clerk.users.getUser(clerkId);
    const primary =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      ) ?? clerkUser.emailAddresses[0];

    if (!primary?.emailAddress) {
      throw invalidToken();
    }

    return {
      email: primary.emailAddress,
      emailVerified: primary.verification?.status === "verified",
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    };
  } catch (error) {
    if (isClerkRateLimit(error)) {
      throw rateLimited();
    }
    throw error;
  }
}

/**
 * Authenticate request and resolve local User.
 *
 * Clerk `users.getUser` is only called for **first-time** users (no DB row).
 * Returning sessions use JWT verify + Prisma — avoids Clerk rate limits on
 * hot paths like GET /workspaces.
 */
export async function requireUser(
  request: Request,
  options?: { deviceLocale?: string | null },
): Promise<UserContext> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }

  const identity = await verifyClerkBearer(
    request.headers.get("authorization"),
  );
  const deviceLocale: AppLocale | null = options?.deviceLocale
    ? resolveAppLocale(options.deviceLocale)
    : null;

  const existing = await prisma.user.findUnique({
    where: { clerkId: identity.clerkId },
  });

  let user: User;
  if (existing) {
    // Hot path: no Clerk Admin API. Only write when seeding missing locale.
    if (deviceLocale && !existing.locale) {
      user = await upsertUser({
        clerkId: identity.clerkId,
        email: existing.email,
        emailVerified: false,
        deviceLocale,
      });
    } else {
      user = existing;
    }
  } else {
    const profile = await resolveClerkProfile(identity.clerkId, secretKey);
    user = await upsertUser({
      clerkId: identity.clerkId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      deviceLocale,
      providerName: {
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
    });
  }

  await ensureDefaultWorkspace(user);

  return {
    user,
    clerkId: identity.clerkId,
  };
}
