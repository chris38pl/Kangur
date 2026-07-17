const DEV_DEFAULT_ORIGINS = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
] as const;

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }
  if (process.env.NODE_ENV === "development") {
    return [...DEV_DEFAULT_ORIGINS];
  }
  return [];
}

export function isOriginAllowed(origin: string | null): origin is string {
  if (!origin) return false;
  return parseAllowedOrigins().includes(origin);
}

/** CORS headers for an allowed Origin. Do not use `*` when Authorization is sent. */
export function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-Device-Locale, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
