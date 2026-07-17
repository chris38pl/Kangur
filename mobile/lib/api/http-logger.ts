/**
 * DEV-only central HTTP logger for `apiFetch`.
 * Independent of React Native DevTools Network tab.
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

const ENABLED = typeof __DEV__ !== "undefined" && __DEV__;

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
  if (!ENABLED) return;
  console.log(
    `[HTTP] → ${entry.method} ${entry.url}`,
    entry.body !== undefined ? { body: formatBody(entry.body) } : "",
  );
}

export function httpLogResponse(entry: HttpLogResponse): void {
  if (!ENABLED) return;
  const tag = entry.status >= 400 ? "✗" : "←";
  console.log(
    `[HTTP] ${tag} ${entry.method} ${entry.url} ${entry.status} (${entry.durationMs} ms)`,
    entry.body !== undefined ? { body: formatBody(entry.body) } : "",
  );
}

export function httpLogNetworkError(entry: HttpLogFailure): void {
  if (!ENABLED) return;
  console.log(
    `[HTTP] ✗ ${entry.method} ${entry.url} NETWORK (${entry.durationMs} ms)`,
    { error: entry.error },
  );
}
