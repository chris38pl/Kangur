export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INSUFFICIENT_CREDITS";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status = 401) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
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

export function notFound(message = "Resource not found."): ApiError {
  return new ApiError("NOT_FOUND", message, 404);
}

export function validationError(message: string): ApiError {
  return new ApiError("VALIDATION_ERROR", message, 400);
}

export function forbidden(message = "Forbidden."): ApiError {
  return new ApiError("FORBIDDEN", message, 403);
}

export function conflict(message = "Conflict."): ApiError {
  return new ApiError("CONFLICT", message, 409);
}
