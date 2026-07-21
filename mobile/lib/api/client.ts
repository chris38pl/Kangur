import {
  httpLogNetworkError,
  httpLogRequest,
  httpLogResponse,
} from "./http-logger";

export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INSUFFICIENT_CREDITS"
  | "HISTORY_LIMIT_EXCEEDED"
  | "PREMIUM_REQUIRED"
  | "AI_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    message: string,
    status?: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!url) {
    throw new ApiClientError(
      "NETWORK_ERROR",
      "EXPO_PUBLIC_API_URL is not set",
    );
  }
  return url.replace(/\/$/, "");
}

export function hasApiUrl(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());
}

type ApiFetchOptions = {
  token?: string | null;
  deviceLocale?: string | null;
  method?: string;
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const started = Date.now();

  let base: string;
  try {
    base = getBaseUrl();
  } catch (err) {
    httpLogNetworkError({
      method,
      url: path,
      durationMs: 0,
      error:
        err instanceof Error
          ? err.message
          : "EXPO_PUBLIC_API_URL is not set",
    });
    throw err;
  }

  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.deviceLocale) {
    headers["X-Device-Locale"] = options.deviceLocale;
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  httpLogRequest({
    method,
    url,
    body: options.body,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    httpLogNetworkError({
      method,
      url,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : "Network request failed",
    });
    throw new ApiClientError("NETWORK_ERROR", "Network request failed.");
  }

  const durationMs = Date.now() - started;
  const rawText = await res.text();
  let parsed: unknown;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as unknown;
    } catch {
      parsed = rawText;
    }
  }

  httpLogResponse({
    method,
    url,
    status: res.status,
    durationMs,
    body: parsed,
  });

  if (!res.ok) {
    let code: ApiErrorCode = "UNKNOWN";
    let message = `Request failed (${res.status})`;
    let details: Record<string, unknown> | undefined;
    if (parsed && typeof parsed === "object") {
      const data = parsed as Partial<ApiErrorBody>;
      if (data.code) code = data.code;
      if (data.message) message = data.message;
      if (data.details && typeof data.details === "object") {
        details = data.details;
      }
    }
    throw new ApiClientError(code, message, res.status, details);
  }

  if (res.status === 204 || !rawText) {
    return undefined as T;
  }

  return parsed as T;
}

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  return apiFetch("/api/health");
}
