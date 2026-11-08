import {
  APIError,
  APIException,
  AppStoreServerAPIClient,
  Environment,
  SignedDataVerifier,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
  type StatusResponse,
} from "@apple/app-store-server-library";

import { appleRootCertificates } from "./rootCertificates";

const LOOKUP_ENVIRONMENTS = [Environment.PRODUCTION, Environment.SANDBOX] as const;

export type AppleConfig = {
  issuerId: string;
  keyId: string;
  privateKey: string;
  bundleId: string;
  appAppleId: number;
};

export type LoadedAppleSubscription = {
  environment: Environment;
  status: number | null;
  transaction: JWSTransactionDecodedPayload;
};

function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.includes("BEGIN")) {
    return trimmed.replace(/\\n/g, "\n");
  }
  const decoded = Buffer.from(trimmed, "base64").toString("utf8");
  return decoded.includes("BEGIN") ? decoded.replace(/\\n/g, "\n") : "";
}

export function readAppleConfig(): AppleConfig {
  const issuerId = process.env.APPLE_ISSUER_ID?.trim() ?? "";
  const keyId = process.env.APPLE_KEY_ID?.trim() ?? "";
  const privateKey = normalizePrivateKey(process.env.APPLE_PRIVATE_KEY ?? "");
  const bundleId = process.env.APPLE_BUNDLE_ID?.trim() || "app.kangur";
  const appAppleId = Number(
    process.env.APPLE_APP_APPLE_ID?.trim() || "6832296080",
  );

  if (!issuerId || !keyId || !privateKey) {
    throw new Error(
      "Apple App Store Server API is not configured (APPLE_ISSUER_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY).",
    );
  }
  if (!Number.isFinite(appAppleId)) {
    throw new Error("APPLE_APP_APPLE_ID must be a number.");
  }

  return { issuerId, keyId, privateKey, bundleId, appAppleId };
}

const clients = new Map<Environment, AppStoreServerAPIClient>();
const verifiers = new Map<Environment, SignedDataVerifier>();

function clientFor(environment: Environment): AppStoreServerAPIClient {
  const existing = clients.get(environment);
  if (existing) return existing;
  const config = readAppleConfig();
  const client = new AppStoreServerAPIClient(
    config.privateKey,
    config.keyId,
    config.issuerId,
    config.bundleId,
    environment,
  );
  clients.set(environment, client);
  return client;
}

function verifierFor(environment: Environment): SignedDataVerifier {
  const existing = verifiers.get(environment);
  if (existing) return existing;
  const config = readAppleConfig();
  const verifier = new SignedDataVerifier(
    appleRootCertificates(),
    true,
    environment,
    config.bundleId,
    environment === Environment.PRODUCTION ? config.appAppleId : undefined,
  );
  verifiers.set(environment, verifier);
  return verifier;
}

export function isAppleTransactionMissing(error: unknown): boolean {
  if (!(error instanceof APIException)) return false;
  return (
    error.httpStatusCode === 404 ||
    error.apiError === APIError.TRANSACTION_ID_NOT_FOUND ||
    error.apiError === APIError.ORIGINAL_TRANSACTION_ID_NOT_FOUND ||
    error.apiError === APIError.ORIGINAL_TRANSACTION_ID_NOT_FOUND_RETRYABLE
  );
}

async function withEnvironment<T>(
  run: (environment: Environment) => Promise<T>,
): Promise<{ environment: Environment; value: T }> {
  let lastError: unknown;
  for (const environment of LOOKUP_ENVIRONMENTS) {
    try {
      return { environment, value: await run(environment) };
    } catch (error) {
      lastError = error;
      if (isAppleTransactionMissing(error)) continue;
      throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Apple transaction was not found.");
}

function peekNotificationEnvironment(signedPayload: string): Environment | null {
  const segment = signedPayload.split(".")[1];
  if (!segment) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(segment, "base64url").toString("utf8"),
    ) as { data?: { environment?: string } };
    const environment = payload.data?.environment;
    if (environment === Environment.SANDBOX) return Environment.SANDBOX;
    if (environment === Environment.PRODUCTION) return Environment.PRODUCTION;
    return null;
  } catch {
    return null;
  }
}

async function pickLatestTransaction(
  environment: Environment,
  statusResponse: StatusResponse,
): Promise<{ status: number | null; transaction: JWSTransactionDecodedPayload } | null> {
  const items = (statusResponse.data ?? []).flatMap(
    (group) => group.lastTransactions ?? [],
  );
  let best: {
    status: number | null;
    transaction: JWSTransactionDecodedPayload;
  } | null = null;

  for (const item of items) {
    if (!item.signedTransactionInfo) continue;
    const transaction = await verifierFor(environment).verifyAndDecodeTransaction(
      item.signedTransactionInfo,
    );
    const expires = transaction.expiresDate ?? 0;
    const bestExpires = best?.transaction.expiresDate ?? -1;
    if (!best || expires >= bestExpires) {
      best = {
        status: typeof item.status === "number" ? item.status : null,
        transaction,
      };
    }
  }

  return best;
}

/**
 * Latest subscription state for a transaction id or original transaction id.
 * Production is tried first, then Sandbox (TestFlight).
 */
export async function loadAppleSubscription(
  anyTransactionId: string,
): Promise<LoadedAppleSubscription | null> {
  try {
    const found = await withEnvironment(async (environment) => {
      const statusResponse = await clientFor(
        environment,
      ).getAllSubscriptionStatuses(anyTransactionId);
      const picked = await pickLatestTransaction(environment, statusResponse);
      if (!picked?.transaction.originalTransactionId) {
        throw new APIException(
          404,
          APIError.TRANSACTION_ID_NOT_FOUND,
          "Apple subscription status had no transaction.",
        );
      }
      return picked;
    });
    return {
      environment: found.environment,
      status: found.value.status,
      transaction: found.value.transaction,
    };
  } catch (error) {
    if (isAppleTransactionMissing(error)) return null;
    throw error;
  }
}

export async function verifyAppleNotification(
  signedPayload: string,
): Promise<ResponseBodyV2DecodedPayload> {
  const hinted = peekNotificationEnvironment(signedPayload);
  const environments = hinted ? [hinted] : [...LOOKUP_ENVIRONMENTS];
  let lastError: unknown;
  for (const environment of environments) {
    try {
      return await verifierFor(environment).verifyAndDecodeNotification(
        signedPayload,
      );
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Apple notification could not be verified.");
}
