/**
 * Which app is asking. App 1.0.9 and newer send their version in X-Kangur-App-Version on
 * every request. App 1.0.8 sends nothing and checks answers with strict schemas: a
 * notification type it does not know, or an invitation without an address, breaks a whole
 * list there. So new things go only to apps that know them, and no header means 1.0.8.
 * Pure: tests run on plain Node.
 */

export const APP_VERSION_HEADER = "x-kangur-app-version";

/** The first app version that understands each new thing in the API. */
export const FEATURE_MIN_VERSION = {
  /** Invitations without an address in the invitation list (kind `link`). */
  linkInvitations: "1.0.9",
  /** WORKSPACE_MEMBER_JOINED in the notification list and as a push. */
  memberJoinedNotifications: "1.0.9",
  /** `email: null` for a member whose address Apple hides. */
  hiddenMemberEmail: "1.0.9",
} as const;

export type ClientFeature = keyof typeof FEATURE_MIN_VERSION;

/** Null when the request has no usable version: treated as app 1.0.8. */
export type ClientVersion = string | null;

const PLAIN_SEMVER = /^(\d{1,4})\.(\d{1,4})\.(\d{1,6})$/;

function parts(version: string): [number, number, number] | null {
  const match = PLAIN_SEMVER.exec(version.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** -1, 0 or 1; null when either side is not MAJOR.MINOR.PATCH. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 | null {
  const left = parts(a);
  const right = parts(b);
  if (!left || !right) return null;
  for (let i = 0; i < 3; i += 1) {
    if (left[i]! !== right[i]!) return left[i]! < right[i]! ? -1 : 1;
  }
  return 0;
}

export function normalizeClientVersion(raw: string | null | undefined): ClientVersion {
  const value = raw?.trim();
  return value && parts(value) ? value : null;
}

export function readClientVersion(source: Request | Headers): ClientVersion {
  const headers = source instanceof Headers ? source : source.headers;
  return normalizeClientVersion(headers.get(APP_VERSION_HEADER));
}

export function clientSupports(
  version: ClientVersion | undefined,
  feature: ClientFeature,
): boolean {
  if (!version) return false;
  const verdict = compareVersions(version, FEATURE_MIN_VERSION[feature]);
  return verdict === 0 || verdict === 1;
}
