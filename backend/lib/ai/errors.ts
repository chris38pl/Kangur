export type AiProviderErrorKind =
  | "transient"
  | "timeout"
  | "unavailable"
  | "fatal_client"
  | "content"
  | "schema";

export class AiProviderError extends Error {
  readonly kind: AiProviderErrorKind;
  readonly provider?: string;
  readonly cause?: unknown;
  readonly retryable: boolean;
  readonly fallbackable: boolean;

  constructor(input: {
    kind: AiProviderErrorKind;
    message: string;
    provider?: string;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = "AiProviderError";
    this.kind = input.kind;
    this.provider = input.provider;
    this.cause = input.cause;
    this.retryable = input.kind === "transient";
    this.fallbackable =
      input.kind === "transient" ||
      input.kind === "timeout" ||
      input.kind === "unavailable";
  }
}

export function isAiProviderError(error: unknown): error is AiProviderError {
  return error instanceof AiProviderError;
}

/** Map unknown SDK / network errors into classified provider errors. */
export function classifyProviderFailure(
  error: unknown,
  provider: string,
): AiProviderError {
  if (error instanceof AiProviderError) return error;

  if (error instanceof Error && error.name === "AbortError") {
    return new AiProviderError({
      kind: "timeout",
      message: `${provider} request timed out.`,
      provider,
      cause: error,
    });
  }

  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;

  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : undefined;

  const message =
    error instanceof Error ? error.message : `Unknown ${provider} error`;

  if (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    /timeout/i.test(message)
  ) {
    return new AiProviderError({
      kind: code === "ETIMEDOUT" || /timeout/i.test(message) ? "timeout" : "transient",
      message,
      provider,
      cause: error,
    });
  }

  if (status === 429 || status === 408) {
    return new AiProviderError({
      kind: "transient",
      message,
      provider,
      cause: error,
    });
  }

  if (status !== undefined && status >= 500) {
    return new AiProviderError({
      kind: "unavailable",
      message,
      provider,
      cause: error,
    });
  }

  if (
    /moderation|safety|content.?policy|blocked/i.test(message) ||
    status === 400
  ) {
    // 400 can be schema/client bugs too — treat generic 400 as fatal_client
    // unless clearly content-policy.
    if (/moderation|safety|content.?policy|blocked/i.test(message)) {
      return new AiProviderError({
        kind: "content",
        message,
        provider,
        cause: error,
      });
    }
    if (status === 400) {
      return new AiProviderError({
        kind: "fatal_client",
        message,
        provider,
        cause: error,
      });
    }
  }

  if (status === 401 || status === 403) {
    return new AiProviderError({
      kind: "unavailable",
      message,
      provider,
      cause: error,
    });
  }

  return new AiProviderError({
    kind: "unavailable",
    message,
    provider,
    cause: error,
  });
}
