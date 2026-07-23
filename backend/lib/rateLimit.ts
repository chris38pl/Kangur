import { ApiError } from "@/lib/auth/errors";

export type RateLimitClass = "ai" | "invitations" | "auth" | "notifications";

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

/** Tiered limits (per-instance memory; better than none on serverless). */
const RATE_LIMITS: Record<RateLimitClass, RateLimitConfig> = {
  /** Very restrictive — OpenAI cost surface. */
  ai: { limit: 10, windowMs: 60_000 },
  /** ~20/h per user. */
  invitations: { limit: 20, windowMs: 60 * 60_000 },
  /** Standard auth-adjacent (me, push register). */
  auth: { limit: 60, windowMs: 60_000 },
  /** Notification list / mark-read — looser. */
  notifications: { limit: 120, windowMs: 60_000 },
};

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function rateLimitExceeded(
  message = "Too many requests. Try again later.",
): ApiError {
  return new ApiError("RATE_LIMITED", message, 429);
}

/**
 * Sliding-window rate limit. Key should include userId (and workspaceId when relevant).
 */
export function assertRateLimit(
  rateClass: RateLimitClass,
  key: string,
): void {
  const config = RATE_LIMITS[rateClass];
  const bucketKey = `${rateClass}:${key}`;
  const now = Date.now();
  let bucket = buckets.get(bucketKey);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(bucketKey, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter(
    (t) => now - t < config.windowMs,
  );
  if (bucket.timestamps.length >= config.limit) {
    throw rateLimitExceeded();
  }
  bucket.timestamps.push(now);
}
