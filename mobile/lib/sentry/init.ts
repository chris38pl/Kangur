import type { ErrorDomain, ErrorSeverity } from "@shared/analytics/domains";

import { getAppBuildInfo } from "@/lib/app-build-info";

type SentryLike = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (
    error: unknown,
    hint?: Record<string, unknown>,
  ) => void;
  setUser: (user: { id: string } | null) => void;
  setTag: (key: string, value: string) => void;
  setContext: (name: string, ctx: Record<string, unknown> | null) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
  wrap: <T>(fn: T) => T;
};

let SentryMod: SentryLike | null | undefined;
let initialized = false;

export function isSentryEnabled(): boolean {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return false;
  const force = process.env.EXPO_PUBLIC_SENTRY_DEV?.trim().toLowerCase();
  const env = getAppBuildInfo().environment;
  if (env === "development" || __DEV__) {
    return force === "1" || force === "true" || force === "on";
  }
  return true;
}

function loadSentry(): SentryLike | null {
  if (SentryMod !== undefined) return SentryMod;
  if (!isSentryEnabled()) {
    SentryMod = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SentryMod = require("@sentry/react-native") as SentryLike;
    return SentryMod;
  } catch {
    SentryMod = null;
    return null;
  }
}

/** Call once at app start (root layout). */
export function initSentry(): void {
  if (initialized) return;
  initialized = true;
  const Sentry = loadSentry();
  if (!Sentry) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;
  const info = getAppBuildInfo();
  // 1:1 with EXPO_PUBLIC_APP_ENV / EAS profile (development | preview | production)
  const environment = info.environment;
  const release =
    info.build !== "-"
      ? `${info.version} (${info.build})`
      : info.version;

  Sentry.init({
    dsn,
    environment,
    release,
    dist: info.commit ?? undefined,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0,
    // Production: full crashes; handled sampled via beforeSend
    sampleRate: 1,
    beforeSend(event: {
      level?: string;
      exception?: { values?: Array<{ mechanism?: { handled?: boolean } }> };
    }) {
      if (environment === "production") {
        const unhandled = event.exception?.values?.some(
          (v) => v.mechanism?.handled === false,
        );
        if (unhandled || event.level === "fatal") return event;
        // ~20% handled
        if (Math.random() > 0.2) return null;
      }
      return event;
    },
  });
  Sentry.setTag("app_env", info.environment);
}

export function setSentryUser(userId: string | null): void {
  const Sentry = loadSentry();
  if (!Sentry) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

export function setSentryWorkspace(workspaceId: string | null): void {
  const Sentry = loadSentry();
  if (!Sentry) return;
  if (workspaceId) Sentry.setTag("workspaceId", workspaceId);
}

export function setSentryRequestId(requestId: string | null): void {
  const Sentry = loadSentry();
  if (!Sentry) return;
  if (requestId) Sentry.setTag("requestId", requestId);
}

export function captureException(
  error: unknown,
  opts?: {
    domain?: ErrorDomain;
    severity?: ErrorSeverity;
    requestId?: string;
    extra?: Record<string, unknown>;
  },
): void {
  const Sentry = loadSentry();
  if (!Sentry) return;
  try {
    if (opts?.domain) Sentry.setTag("domain", opts.domain);
    if (opts?.severity) Sentry.setTag("severity", opts.severity);
    if (opts?.requestId) Sentry.setTag("requestId", opts.requestId);
    Sentry.captureException(error, {
      captureContext: {
        extra: opts?.extra,
        level:
          opts?.severity === "fatal"
            ? "fatal"
            : opts?.severity === "warning"
              ? "warning"
              : opts?.severity === "info"
                ? "info"
                : "error",
      },
    });
  } catch {
    // fire-and-forget
  }
}

export function addSentryBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
): void {
  const Sentry = loadSentry();
  if (!Sentry) return;
  try {
    Sentry.addBreadcrumb({
      message,
      data,
      level: "info",
    });
  } catch {
    // ignore
  }
}
