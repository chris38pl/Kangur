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
  | "AI_UNAVAILABLE";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    message: string,
    status = 401,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export function authRequired(): ApiError {
  return new ApiError("AUTH_REQUIRED", "Authentication required.");
}

export function invalidToken(): ApiError {
  return new ApiError("INVALID_TOKEN", "Invalid authentication token.");
}

export function tokenExpired(): ApiError {
  return new ApiError("TOKEN_EXPIRED", "Authentication token has expired.");
}

export function notFound(
  message = "Resource not found.",
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError("NOT_FOUND", message, 404, details);
}

export function validationError(
  message: string,
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError("VALIDATION_ERROR", message, 400, details);
}

export function forbidden(
  message = "Forbidden.",
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError("FORBIDDEN", message, 403, details);
}

export function conflict(
  message = "Conflict.",
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError("CONFLICT", message, 409, details);
}

/** Free plan history depth exceeded - resource exists; upgrade for older lists. */
export function historyLimitExceeded(
  message = "Older history is available with Premium.",
): ApiError {
  return new ApiError("HISTORY_LIMIT_EXCEEDED", message, 403);
}

/** Feature requires an active/trialing Premium subscription. */
export function premiumRequired(
  message = "Premium is required for this feature.",
): ApiError {
  return new ApiError("PREMIUM_REQUIRED", message, 403);
}

/** Model provider failed / timed out - client should show temporary unavailability. */
export function aiUnavailable(
  message = "AI is temporarily unavailable. Please try again.",
): ApiError {
  return new ApiError("AI_UNAVAILABLE", message, 502);
}
