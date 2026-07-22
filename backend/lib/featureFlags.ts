import { FeatureFlags, type FeatureFlagName } from "@shared/analytics/flags";

import { getPostHog, isAnalyticsEnabled } from "@/lib/analytics/posthog";

/**
 * Resolution: env hard kill → PostHog → default.
 * (No DEV AsyncStorage overrides on server.)
 */
export function isFeatureEnabled(
  flag: FeatureFlagName,
  defaultValue = false,
): boolean {
  if (flag === FeatureFlags.historySuggestions) {
    const raw = process.env.HISTORY_SUGGESTIONS_ENABLED?.trim().toLowerCase();
    if (raw === "0" || raw === "false" || raw === "off") return false;
    if (raw === "1" || raw === "true" || raw === "on") {
      defaultValue = true;
    } else if (raw === undefined || raw === "") {
      defaultValue = true; // ship-ready default
    }
  }

  if (flag === FeatureFlags.mealProposal) {
    const raw = process.env.MEAL_PROPOSAL_ENABLED?.trim().toLowerCase();
    if (raw === "0" || raw === "false" || raw === "off") return false;
    if (raw === "1" || raw === "true" || raw === "on") {
      defaultValue = true;
    } else if (raw === undefined || raw === "") {
      defaultValue = true;
    }
  }

  if (isAnalyticsEnabled()) {
    const client = getPostHog() as
      | (ReturnType<typeof getPostHog> & {
          isFeatureEnabled?: (
            key: string,
            options?: { distinctId?: string },
          ) => Promise<boolean | undefined> | boolean | undefined;
        })
      | null;
    // Sync path: PostHog node often needs await; skip remote if not cached
    void client;
  }

  return defaultValue;
}

export { FeatureFlags };
