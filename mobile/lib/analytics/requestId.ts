import * as Crypto from "expo-crypto";

/**
 * One logical operation (e.g. AI Import → Apply). Not session-scoped.
 */
export function createRequestId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
