import {
  ANALYTICS_SCHEMA_VERSION,
  type EventName,
  type EventPropsMap,
} from "@shared/analytics/events";

import { analyticsEnvironment, getPostHog, isAnalyticsEnabled } from "./posthog";

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

export function track<E extends EventName>(
  name: E,
  props: EventPropsMap[E],
  distinctId?: string,
): void {
  if (!isAnalyticsEnabled()) return;
  const client = getPostHog();
  if (!client) return;
  const id =
    distinctId ||
    ("workspace_id" in (props as object) &&
    typeof (props as { workspace_id?: string }).workspace_id === "string"
      ? (props as { workspace_id: string }).workspace_id
      : "server");
  try {
    client.capture({
      distinctId: id,
      event: name,
      properties: {
        ...props,
        schemaVersion: ANALYTICS_SCHEMA_VERSION,
        environment: analyticsEnvironment(),
      },
    });
  } catch {
    // fire-and-forget
  }
}

export function identify(
  userId: string,
  properties?: PersonProperties,
): void {
  if (!isAnalyticsEnabled()) return;
  const client = getPostHog();
  if (!client) return;
  try {
    client.identify({
      distinctId: userId,
      properties: properties ?? {},
    });
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
    client.groupIdentify({
      groupType: "workspace",
      groupKey: workspaceId,
      properties: properties ?? {},
    });
  } catch {
    // fire-and-forget
  }
}

export const Analytics = {
  track,
  identify,
  groupWorkspace,
};
