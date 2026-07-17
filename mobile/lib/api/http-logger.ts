/**
 * Central HTTP logger for `apiFetch`.
 * Visible in the Metro terminal (not on the phone UI).
 * On when __DEV__ or EXPO_PUBLIC_APP_ENV=development.
 */

type HttpLogRequest = {
  method: string;
  url: string;
  body?: unknown;
};

type HttpLogResponse = {
  method: string;
  url: string;
  status: number;
  durationMs: number;
  body?: unknown;
};

type HttpLogFailure = {
  method: string;
  url: string;
  durationMs: number;
  error: string;
};

function loggingEnabled(): boolean {
  if (typeof __DEV__ !== "undefined" && __DEV__) return true;
  return process.env.EXPO_PUBLIC_APP_ENV === "development";
}

function truncate(value: string, max = 2000): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}… [truncated ${value.length - max} chars]`;
}

function formatBody(body: unknown): unknown {
  if (body === undefined) return undefined;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return truncate(body);
    }
  }
  return body;
}

export function httpLogRequest(entry: HttpLogRequest): void {
  if (!loggingEnabled()) return;
  console.log(
    `[HTTP] → ${entry.method} ${entry.url}`,
    entry.body !== undefined ? { body: formatBody(entry.body) } : "",
  );
}

export function httpLogResponse(entry: HttpLogResponse): void {
  if (!loggingEnabled()) return;
  const tag = entry.status >= 400 ? "✗" : "←";
  console.log(
    `[HTTP] ${tag} ${entry.method} ${entry.url} ${entry.status} (${entry.durationMs} ms)`,
    entry.body !== undefined ? { body: formatBody(entry.body) } : "",
  );
}

export function httpLogNetworkError(entry: HttpLogFailure): void {
  if (!loggingEnabled()) return;
  console.warn(
    `[HTTP] ✗ ${entry.method} ${entry.url} NETWORK (${entry.durationMs} ms)`,
    { error: entry.error },
  );
}
