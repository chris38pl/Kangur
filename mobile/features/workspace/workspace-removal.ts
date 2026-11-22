/**
 * Pure helpers for deleting / leaving a workspace. No React Native imports so
 * `node --test --experimental-strip-types` can run the tests directly.
 */

export type WorkspaceRemovalMode = "delete" | "leave";

export type SubscriptionProvider = "apple" | "google" | "stripe";

export type WorkspaceRemovalFailure =
  | {
      kind: "active_subscription";
      provider: SubscriptionProvider | null;
      /** False when another member pays, so the caller cannot cancel it. */
      billingOwnerIsYou: boolean;
    }
  | { kind: "last_workspace" }
  | { kind: "owner_cannot_leave" }
  | { kind: "not_found" }
  | { kind: "generic" };

/** Owners delete; everyone else leaves. */
export function removalModeForRole(
  role: "owner" | "admin" | "member",
): WorkspaceRemovalMode {
  return role === "owner" ? "delete" : "leave";
}

function readProvider(value: unknown): SubscriptionProvider | null {
  return value === "apple" || value === "google" || value === "stripe"
    ? value
    : null;
}

/** Maps an API error (ApiClientError or anything shaped like it) to UI copy. */
export function describeRemovalFailure(
  error: unknown,
): WorkspaceRemovalFailure {
  if (!error || typeof error !== "object") return { kind: "generic" };
  const { code, details } = error as {
    code?: unknown;
    details?: Record<string, unknown>;
  };

  switch (code) {
    case "WORKSPACE_HAS_ACTIVE_SUBSCRIPTION":
      return {
        kind: "active_subscription",
        provider: readProvider(details?.provider),
        billingOwnerIsYou: details?.billingOwnerIsYou !== false,
      };
    case "LAST_WORKSPACE":
      return { kind: "last_workspace" };
    case "OWNER_CANNOT_LEAVE":
      return { kind: "owner_cannot_leave" };
    case "NOT_FOUND":
      return { kind: "not_found" };
    default:
      return { kind: "generic" };
  }
}

/** Workspace to switch to after `removedId` is gone; null if none is left. */
export function pickNextWorkspaceId(
  workspaces: readonly { id: string }[] | undefined,
  removedId: string,
): string | null {
  return workspaces?.find((w) => w.id !== removedId)?.id ?? null;
}

/**
 * True when `workspaceId` is the user's only workspace. The server enforces
 * this too; checking first skips a confirm sheet that cannot succeed.
 */
export function isOnlyWorkspace(
  workspaces: readonly { id: string }[] | undefined,
  workspaceId: string,
): boolean {
  if (!workspaces) return false;
  return pickNextWorkspaceId(workspaces, workspaceId) === null;
}

/**
 * False while a platform admin browses a workspace they are not a member of.
 * The server refuses both actions there (delete 403, leave 404), and a 404
 * would read as "already gone" and switch the app away.
 *
 * @param memberships The user's own workspaces, without the admin overlay.
 */
export function canOfferRemoval(input: {
  workspaceId: string;
  browsingId: string | null;
  memberships: readonly { id: string }[] | undefined;
}): boolean {
  if (input.browsingId !== input.workspaceId) return true;
  return input.memberships?.some((w) => w.id === input.workspaceId) ?? false;
}

/** True when a React Query key belongs to the removed workspace. */
export function queryKeyMentionsWorkspace(
  queryKey: readonly unknown[],
  workspaceId: string,
): boolean {
  return queryKey.some((part) => part === workspaceId);
}
