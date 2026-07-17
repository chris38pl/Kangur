import { createClerkClient } from "@clerk/backend";

import { upsertUser } from "@/features/auth/upsertUser";
import { ensureDefaultWorkspace } from "@/features/workspace/ensureDefaultWorkspace";

import { verifyClerkBearer } from "./clerk";
import { invalidToken } from "./errors";

export type UserContext = {
  user: {
    id: string;
    clerkId: string;
    email: string;
    locale: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  clerkId: string;
};

function normalizeLocale(raw: string | null | undefined): "pl" | "en" | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.startsWith("pl")) return "pl";
  if (lower.startsWith("en")) return "en";
  return "en";
}

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
  const deviceLocale = normalizeLocale(options?.deviceLocale);

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
