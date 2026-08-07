import { google } from "googleapis";

let cachedPublisher: ReturnType<typeof google.androidpublisher> | null = null;

export function getGooglePlayPackageName(): string {
  const name = process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim();
  if (!name) {
    throw new Error("GOOGLE_PLAY_PACKAGE_NAME is not configured");
  }
  return name;
}

function parseServiceAccountJson(): Record<string, unknown> {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured");
  }
  // Support raw JSON or base64-encoded JSON
  try {
    if (raw.startsWith("{")) {
      return JSON.parse(raw) as Record<string, unknown>;
    }
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is invalid JSON/base64");
  }
}

export function getAndroidPublisher() {
  if (cachedPublisher) return cachedPublisher;

  const credentials = parseServiceAccountJson();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  cachedPublisher = google.androidpublisher({ version: "v3", auth });
  return cachedPublisher;
}

export type GoogleSubscriptionV2Response = {
  kind?: string | null;
  startTime?: string | null;
  subscriptionState?: string | null;
  latestOrderId?: string | null;
  linkedPurchaseToken?: string | null;
  acknowledgementState?: string | null;
  lineItems?: Array<{
    productId?: string | null;
    expiryTime?: string | null;
    latestSuccessfulOrderId?: string | null;
    offerDetails?: {
      basePlanId?: string | null;
      offerId?: string | null;
    } | null;
  }> | null;
};
