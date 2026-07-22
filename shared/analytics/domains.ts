/**
 * Error domains for Sentry tags (closed enum).
 * M13.11 — Observability & Product Analytics
 */

export const ERROR_DOMAINS = [
  "auth",
  "workspace",
  "lists",
  "shopping",
  "sync",
  "ai",
  "billing",
  "history",
  "notifications",
] as const;

export type ErrorDomain = (typeof ERROR_DOMAINS)[number];

export const ERROR_SEVERITIES = [
  "info",
  "warning",
  "error",
  "fatal",
] as const;

export type ErrorSeverity = (typeof ERROR_SEVERITIES)[number];
