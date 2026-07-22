import type { ErrorDomain, ErrorSeverity } from "@shared/analytics/domains";

import { analyticsEnvironment } from "@/lib/analytics/posthog";

type SentryLike = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (
    error: unknown,
    hint?: Record<string, unknown>,
  ) => void;
  setUser: (user: { id: string } | null) => void;
  setTag: (key: string, value: string) => void;
};

let SentryMod: SentryLike | null | undefined;
let initialized = false;

export function isSentryEnabled(): boolean {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;
  const force = process.env.SENTRY_DEV?.trim().toLowerCase();
  const env = analyticsEnvironment();
  if (env === "development") {
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
    SentryMod = require("@sentry/nextjs") as SentryLike;
    return SentryMod;
  } catch {
    SentryMod = null;
    return null;
  }
}

export function initSentry(): void {
  if (initialized) return;
  initialized = true;
  const Sentry = loadSentry();
  if (!Sentry) return;
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  const environment = analyticsEnvironment();
  const release =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.npm_package_version ||
    "backend";

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: 0,
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
        if (Math.random() > 0.2) return null;
      }
      return event;
    },
  });
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

export function setSentryUser(userId: string | null): void {
  const Sentry = loadSentry();
  if (!Sentry) return;
  Sentry.setUser(userId ? { id: userId } : null);
}
