type PostHogNodeLike = {
  capture: (input: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }) => void;
  identify: (input: {
    distinctId: string;
    properties?: Record<string, unknown>;
  }) => void;
  groupIdentify: (input: {
    groupType: string;
    groupKey: string;
    properties?: Record<string, unknown>;
  }) => void;
  getDistinctId?: () => string;
};

let client: PostHogNodeLike | null | undefined;

/** Align with mobile EAS profiles: development | preview | production. */
function resolveEnvironment(): string {
  const v = process.env.VERCEL_ENV?.trim();
  if (v === "preview") return "preview";
  if (v === "production") return "production";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}

export function isAnalyticsEnabled(): boolean {
  const key = process.env.POSTHOG_KEY?.trim();
  if (!key) return false;
  const force = process.env.ANALYTICS_ENABLED?.trim().toLowerCase();
  if (force === "0" || force === "false" || force === "off") return false;
  if (resolveEnvironment() === "development") {
    return force === "1" || force === "true" || force === "on";
  }
  return true;
}

export function getPostHog(): PostHogNodeLike | null {
  if (client !== undefined) return client;
  if (!isAnalyticsEnabled()) {
    client = null;
    return null;
  }
  const apiKey = process.env.POSTHOG_KEY?.trim();
  if (!apiKey) {
    client = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PostHog } = require("posthog-node") as {
      PostHog: new (
        key: string,
        opts: Record<string, unknown>,
      ) => PostHogNodeLike;
    };
    const host =
      process.env.POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";
    client = new PostHog(apiKey, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });
    return client;
  } catch {
    client = null;
    return null;
  }
}

export function analyticsEnvironment(): string {
  return resolveEnvironment();
}
