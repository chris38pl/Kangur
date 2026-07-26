/**
 * HTTP anomaly detectors (storm first; more can land here later).
 * Observability only — never blocks or rate-limits requests.
 */

/** Chosen to detect accidental polling/query loops while avoiding false positives during normal app usage. */
export const HTTP_STORM_WINDOW_MS = 10_000;
export const HTTP_STORM_THRESHOLD = 20;
export const HTTP_STORM_COOLDOWN_MS = 30_000;

export type HttpStormHitInput = {
  method: string;
  url: string;
  now?: number;
  windowMs?: number;
  threshold?: number;
  cooldownMs?: number;
  /** Injectable store for tests; defaults to module singleton. */
  store?: HttpStormStore;
};

export type HttpStormHitResult = {
  stormed: boolean;
  key: string;
  method: string;
  path: string;
  count: number;
  windowMs: number;
  firstSeenAt: number;
  lastSeenAt: number;
  durationMs: number;
  firstSeenAgoMs: number;
  timestamp: number;
};

export type HttpStormStore = {
  hits: Map<string, number[]>;
  lastWarnedAt: Map<string, number>;
};

export function createHttpStormStore(): HttpStormStore {
  return {
    hits: new Map(),
    lastWarnedAt: new Map(),
  };
}

const defaultStore = createHttpStormStore();

/** Pathname only (no origin / query). */
export function extractPathname(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "/";
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      return new URL(trimmed).pathname || "/";
    }
  } catch {
    // fall through
  }
  const noQuery = trimmed.split("?")[0] ?? trimmed;
  return noQuery.startsWith("/") ? noQuery : `/${noQuery}`;
}

function looksLikeIdSegment(segment: string): boolean {
  if (!segment) return false;
  if (/^\d+$/.test(segment)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f-]{4,}$/i.test(segment)) return true;
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return true;
  // cuid / opaque ids: long, mixed letters+digits (avoids "notifications")
  return (
    segment.length >= 8 &&
    /[0-9]/.test(segment) &&
    /[a-z]/i.test(segment) &&
    /^[a-z0-9_-]+$/i.test(segment)
  );
}

/** Collapse id-like path segments to `:id` for storm aggregation. */
export function normalizeHttpPath(url: string): string {
  const pathname = extractPathname(url);
  const parts = pathname.split("/").map((seg) =>
    looksLikeIdSegment(seg) ? ":id" : seg,
  );
  const joined = parts.join("/");
  return joined.length > 0 ? joined : "/";
}

export function stormKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

/**
 * Pure storm detector: sliding window + cooldown.
 * Returns `stormed: true` only when a warning should be emitted.
 */
export function recordHttpStormHit(
  input: HttpStormHitInput,
): HttpStormHitResult {
  const now = input.now ?? Date.now();
  const windowMs = input.windowMs ?? HTTP_STORM_WINDOW_MS;
  const threshold = input.threshold ?? HTTP_STORM_THRESHOLD;
  const cooldownMs = input.cooldownMs ?? HTTP_STORM_COOLDOWN_MS;
  const store = input.store ?? defaultStore;

  const method = input.method.toUpperCase();
  const path = normalizeHttpPath(input.url);
  const key = stormKey(method, path);

  const cutoff = now - windowMs;
  const prev = store.hits.get(key) ?? [];
  const next = prev.filter((t) => t > cutoff);
  next.push(now);
  store.hits.set(key, next);

  const count = next.length;
  const firstSeenAt = next[0] ?? now;
  const lastSeenAt = next[next.length - 1] ?? now;
  const durationMs = Math.max(0, lastSeenAt - firstSeenAt);
  const firstSeenAgoMs = Math.max(0, now - firstSeenAt);

  const base = {
    key,
    method,
    path,
    count,
    windowMs,
    firstSeenAt,
    lastSeenAt,
    durationMs,
    firstSeenAgoMs,
    timestamp: now,
  };

  if (count < threshold) {
    return { stormed: false, ...base };
  }

  const lastWarned = store.lastWarnedAt.get(key);
  if (lastWarned !== undefined && now - lastWarned < cooldownMs) {
    return { stormed: false, ...base };
  }

  store.lastWarnedAt.set(key, now);
  return { stormed: true, ...base };
}

export type HttpStormReportPayload = {
  method: string;
  path: string;
  count: number;
  windowMs: number;
  timestamp: string;
  environment: string;
  firstSeenAt: number;
  lastSeenAt: number;
  durationMs: number;
  firstSeenAgoMs: number;
};

export function buildHttpStormReportPayload(
  hit: HttpStormHitResult,
  environment: string,
): HttpStormReportPayload {
  return {
    method: hit.method,
    path: hit.path,
    count: hit.count,
    windowMs: hit.windowMs,
    timestamp: new Date(hit.timestamp).toISOString(),
    environment,
    firstSeenAt: hit.firstSeenAt,
    lastSeenAt: hit.lastSeenAt,
    durationMs: hit.durationMs,
    firstSeenAgoMs: hit.firstSeenAgoMs,
  };
}

/** Side-effect wrapper: Metro warn + Sentry breadcrumb. */
export function reportHttpStorm(payload: HttpStormReportPayload): void {
  console.warn("[HTTP] query_storm", payload);
  try {
    // Lazy import avoids pulling Sentry into unit tests of the pure recorder.
    const { addSentryBreadcrumb } = require("@/lib/sentry/init") as {
      addSentryBreadcrumb: (
        message: string,
        data?: Record<string, unknown>,
        level?: string,
      ) => void;
    };
    addSentryBreadcrumb("http.query_storm", payload, "warning");
  } catch {
    // ignore — Sentry optional
  }
}

function resolveEnvironment(): string {
  const fromEnv = process.env.EXPO_PUBLIC_APP_ENV?.trim();
  if (
    fromEnv === "development" ||
    fromEnv === "preview" ||
    fromEnv === "production"
  ) {
    return fromEnv;
  }
  try {
    const { getAppBuildInfo } = require("@/lib/app-build-info") as {
      getAppBuildInfo: () => { environment: string };
    };
    return getAppBuildInfo().environment;
  } catch {
    return "unknown";
  }
}

/** Record + report if stormed. Safe to call on every HTTP request. */
export function observeHttpRequest(method: string, url: string): void {
  const hit = recordHttpStormHit({ method, url });
  if (!hit.stormed) return;
  reportHttpStorm(buildHttpStormReportPayload(hit, resolveEnvironment()));
}
