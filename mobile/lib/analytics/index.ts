import {
  ANALYTICS_SCHEMA_VERSION,
  type EventName,
  type EventPropsMap,
} from "@shared/analytics/events";

import { getAppBuildInfo } from "@/lib/app-build-info";

import { getPostHog, isAnalyticsEnabled } from "./posthog";

export type PersonProperties = {
  appVersion?: string;
  build?: string;
  environment?: string;
  platform?: string;
  language?: string;
  workspaceRole?: string;
  subscriptionPlan?: "free" | "premium";
};

export type WorkspaceGroupProperties = {
  workspacePlan?: "free" | "premium";
  memberCount?: number;
};

/**
 * Typed product analytics. Never call PostHog SDK from call sites.
 * Adds schemaVersion automatically. No-op when keys missing / development default.
 */
export function track<E extends EventName>(
  name: E,
  props: EventPropsMap[E],
): void {
  if (!isAnalyticsEnabled()) return;
  const client = getPostHog();
  if (!client) return;
  try {
    const env = getAppBuildInfo().environment;
    client.capture(name, {
      ...props,
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      environment: env === "preview" ? "staging" : env,
    });
  } catch {
    // fire-and-forget
  }
}

/** Merge person properties — never full replace. */
export function identify(
  userId: string,
  properties?: PersonProperties,
): void {
  if (!isAnalyticsEnabled()) return;
  const client = getPostHog();
  if (!client) return;
  try {
    client.identify(userId, properties ?? {});
  } catch {
    // fire-and-forget
  }
}

export function setPersonProperties(properties: PersonProperties): void {
  if (!isAnalyticsEnabled()) return;
  const client = getPostHog();
  if (!client) return;
  try {
    // PostHog RN: capture with $set merges person properties
    client.capture("$set", { $set: properties });
  } catch {
    // fire-and-forget
  }
}

export function groupWorkspace(
  workspaceId: string,
  properties?: WorkspaceGroupProperties,
): void {
  if (!isAnalyticsEnabled()) return;
  const client = getPostHog();
  if (!client) return;
  try {
    client.group("workspace", workspaceId, properties ?? {});
  } catch {
    // fire-and-forget
  }
}

export function resetAnalytics(): void {
  if (!isAnalyticsEnabled()) return;
  const client = getPostHog();
  if (!client) return;
  try {
    client.reset();
  } catch {
    // fire-and-forget
  }
}

export const Analytics = {
  track,
  identify,
  setPersonProperties,
  groupWorkspace,
  reset: resetAnalytics,
};
