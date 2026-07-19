import type { User } from "@prisma/client";
import { createClerkClient } from "@clerk/backend";

import { upsertUser } from "@/features/auth/upsertUser";
import { ensureDefaultWorkspace } from "@/features/workspace/ensureDefaultWorkspace";
import { resolveAppLocale, type AppLocale } from "@/lib/locale";

import { verifyClerkBearer } from "./clerk";
import { invalidToken } from "./errors";

export type UserContext = {
  user: User;
  clerkId: string;
};

async function resolveEmail(
  clerkId: string,
  secretKey: string,
): Promise<string> {
  const clerk = createClerkClient({ secretKey });
  const clerkUser = await clerk.users.getUser(clerkId);
  const primary =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    ) ?? clerkUser.emailAddresses[0];

  if (!primary?.emailAddress) {
    throw invalidToken();
  }

  return primary.emailAddress;
}

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
  const email = await resolveEmail(identity.clerkId, secretKey);
  const deviceLocale: AppLocale | null = options?.deviceLocale
    ? resolveAppLocale(options.deviceLocale)
    : null;

  const user = await upsertUser({
    clerkId: identity.clerkId,
    email,
    deviceLocale,
  });

  await ensureDefaultWorkspace(user);

  console.info("[auth]", "MeTouched", { clerkId: identity.clerkId });

  return {
    user,
    clerkId: identity.clerkId,
  };
}
