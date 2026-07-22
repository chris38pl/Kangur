import { FeatureFlags, type FeatureFlagName } from "@shared/analytics/flags";

import { getPostHog, isAnalyticsEnabled } from "@/lib/analytics/posthog";

/**
 * DEV-only local overrides. Keys = FeatureFlagName, value = forced on/off.
 * Set via EXPO_PUBLIC_FF_OVERRIDE_JSON='{"history_suggestions":true}' or
 * AsyncStorage key kangur.ff.overrides (loaded by setDevFlagOverride).
 */
const devOverrides = new Map<string, boolean>();

export function setDevFlagOverride(
  flag: FeatureFlagName,
  value: boolean | null,
): void {
  if (!__DEV__) return;
  if (value === null) {
    devOverrides.delete(flag);
    return;
  }
  devOverrides.set(flag, value);
}

function parseEnvOverrideJson(): void {
  if (!__DEV__) return;
  const raw = process.env.EXPO_PUBLIC_FF_OVERRIDE_JSON?.trim();
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "boolean") devOverrides.set(k, v);
    }
  } catch {
    // ignore invalid JSON
  }
}

parseEnvOverrideJson();

function envHardKillHistory(): boolean | null {
  const raw =
    process.env.EXPO_PUBLIC_HISTORY_SUGGESTIONS_ENABLED?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;
  return null;
}

/**
 * Resolution: DEV override → env hard kill → PostHog → default.
 */
export function isFeatureEnabled(
  flag: FeatureFlagName,
  defaultValue = false,
): boolean {
  if (__DEV__ && devOverrides.has(flag)) {
    return Boolean(devOverrides.get(flag));
  }

  if (flag === FeatureFlags.historySuggestions) {
    const kill = envHardKillHistory();
    if (kill === false) return false;
    if (kill === true) {
      // env force-on still allows PostHog off later; treat as soft default on
      defaultValue = true;
    }
  }

  if (isAnalyticsEnabled()) {
    const client = getPostHog() as
      | (ReturnType<typeof getPostHog> & {
          isFeatureEnabled?: (key: string) => boolean | undefined;
          getFeatureFlag?: (key: string) => boolean | string | undefined;
        })
      | null;
    if (client?.isFeatureEnabled) {
      try {
        const v = client.isFeatureEnabled(flag);
        if (typeof v === "boolean") return v;
      } catch {
        // fall through
      }
    }
    if (client?.getFeatureFlag) {
      try {
        const v = client.getFeatureFlag(flag);
        if (typeof v === "boolean") return v;
        if (v === "true") return true;
        if (v === "false") return false;
      } catch {
        // fall through
      }
    }
  }

  return defaultValue;
}

export { FeatureFlags };
