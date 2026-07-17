import { verifyToken } from "@clerk/backend";

import { authRequired, invalidToken, tokenExpired } from "./errors";

export type ClerkIdentity = {
  clerkId: string;
};

function getBearerToken(authorizationHeader: string | null): string {
  if (!authorizationHeader) {
    throw authRequired();
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw authRequired();
  }

  return token;
}

export async function verifyClerkBearer(
  authorizationHeader: string | null,
): Promise<ClerkIdentity> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }

  const token = getBearerToken(authorizationHeader);

  try {
    const payload = await verifyToken(token, { secretKey });
    const clerkId = payload.sub;
    if (!clerkId) {
      throw invalidToken();
    }

    return { clerkId };
  } catch (error) {
    if (error instanceof Error && error.name === "ApiError") {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (/expired/i.test(message)) {
      throw tokenExpired();
    }
    throw invalidToken();
  }
}
