import { getAppBuildInfo } from "@/lib/app-build-info";

type PostHogLike = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  group: (
    type: string,
    key: string,
    properties?: Record<string, unknown>,
  ) => void;
  reset: () => void;
};

let client: PostHogLike | null | undefined;

function mapEnvironment(): string {
  const env = getAppBuildInfo().environment;
  if (env === "preview") return "staging";
  return env;
}

/**
 * Analytics enabled when PostHog key is set and not forced off.
 * Development: off unless EXPO_PUBLIC_ANALYTICS_ENABLED=1.
 */
export function isAnalyticsEnabled(): boolean {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return false;
  const force =
    process.env.EXPO_PUBLIC_ANALYTICS_ENABLED?.trim().toLowerCase();
  if (force === "0" || force === "false" || force === "off") return false;
  const appEnv = getAppBuildInfo().environment;
  if (appEnv === "development" || __DEV__) {
    return force === "1" || force === "true" || force === "on";
  }
  return true;
}

export function getPostHog(): PostHogLike | null {
  if (client !== undefined) return client;
  if (!isAnalyticsEnabled()) {
    client = null;
    return null;
  }
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
  if (!apiKey) {
    client = null;
    return null;
  }
  try {
    // Lazy require so missing native module does not crash noop path
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PostHog } = require("posthog-react-native") as {
      PostHog: new (
        key: string,
        opts: Record<string, unknown>,
      ) => PostHogLike;
    };
    const host =
      process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() ||
      "https://eu.i.posthog.com";
    client = new PostHog(apiKey, {
      host,
      captureAppLifecycleEvents: false,
      // MVP: product events + flags only (no Session Replay / Surveys UI)
      disable_surveys: true,
      // SDK queues offline; no custom queue
    });
    // Attach super-properties-like defaults via first identify callers
    void mapEnvironment;
    return client;
  } catch {
    client = null;
    return null;
  }
}
