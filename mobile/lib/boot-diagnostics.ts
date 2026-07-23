/**
 * TEMPORARY boot diagnostics for Play Internal black-screen investigation.
 *
 * Gated by EXPO_PUBLIC_BOOT_DIAG=1 (preview eas.json). When unset/0:
 * - bootLog / overlay / ErrorUtils hooks are no-ops
 * - hideNativeSplashLogged still hides the native splash (production path)
 *
 * Cleanup after root cause: set EXPO_PUBLIC_BOOT_DIAG=0 (or remove env), then
 * delete index.js + BootDiagnosticsOverlay + this file and revert package.json main
 * + probe call sites.
 */
import { Appearance } from "react-native";

/** True only when explicitly enabled for a diagnostic build. */
export const BOOT_DIAG_ENABLED = process.env.EXPO_PUBLIC_BOOT_DIAG === "1";

export type BootStage =
  | "entrypoint"
  | "error_handlers_installed"
  | "env_check"
  | "root_layout_module"
  | "root_layout_render"
  | "clerk_provider"
  | "posthog"
  | "navigation_stack"
  | "splash_native_hide"
  | "app_startup_controller"
  | "index_route"
  | "tabs_layout"
  | "first_screen"
  | "boot_ready"
  | "fatal"
  | "unhandledrejection"
  | "error_utils";

export type BootEvent = {
  t: number;
  stage: string;
  detail?: string;
};

type Listener = () => void;

const startedAt = Date.now();
const events: BootEvent[] = [];
const listeners = new Set<Listener>();

let lastFatal: { message: string; stack?: string } | null = null;
let handlersInstalled = false;
let splashHideAttempted = false;
let splashHideOk: boolean | null = null;

function notify(): void {
  if (!BOOT_DIAG_ENABLED) return;
  for (const l of listeners) {
    try {
      l();
    } catch {
      // ignore
    }
  }
}

export function subscribeBootDiagnostics(listener: Listener): () => void {
  if (!BOOT_DIAG_ENABLED) return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBootEvents(): readonly BootEvent[] {
  return events;
}

export function getBootFatal(): { message: string; stack?: string } | null {
  return lastFatal;
}

export function getSplashHideStatus(): {
  attempted: boolean;
  ok: boolean | null;
} {
  return { attempted: splashHideAttempted, ok: splashHideOk };
}

export function bootLog(stage: string, detail?: string): void {
  if (!BOOT_DIAG_ENABLED) return;
  const ev: BootEvent = {
    t: Date.now() - startedAt,
    stage,
    detail: detail?.slice(0, 500),
  };
  events.push(ev);
  if (events.length > 80) events.shift();
  console.log(`[BOOT +${ev.t}ms] ${stage}${detail ? ` — ${detail}` : ""}`);
  notify();
}

export function bootFatal(error: unknown, source: string): void {
  if (!BOOT_DIAG_ENABLED) return;
  const message =
    error instanceof Error
      ? `${source}: ${error.message}`
      : `${source}: ${String(error)}`;
  const stack = error instanceof Error ? error.stack : undefined;
  lastFatal = { message, stack };
  bootLog("fatal", message);
  notify();
}

/** Required EXPO_PUBLIC_* for preview / Play Internal (presence only). */
export function checkRequiredPublicEnv(): {
  ok: boolean;
  report: string;
  missing: string[];
} {
  if (!BOOT_DIAG_ENABLED) {
    return { ok: true, report: "", missing: [] };
  }

  const required = [
    "EXPO_PUBLIC_APP_ENV",
    "EXPO_PUBLIC_API_URL",
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
  ] as const;
  const recommended = [
    "EXPO_PUBLIC_POSTHOG_KEY",
    "EXPO_PUBLIC_POSTHOG_HOST",
    "EXPO_PUBLIC_SENTRY_DSN",
  ] as const;

  const lines: string[] = [];
  const missing: string[] = [];

  for (const key of required) {
    const raw = process.env[key]?.trim();
    const present = Boolean(raw);
    if (!present) missing.push(key);
    lines.push(
      `${present ? "OK" : "MISSING"} ${key}${present ? `=${maskEnv(key, raw!)}` : ""}`,
    );
  }
  for (const key of recommended) {
    const raw = process.env[key]?.trim();
    const present = Boolean(raw);
    lines.push(
      `${present ? "OK" : "unset"} ${key}${present ? `=${maskEnv(key, raw!)}` : ""}`,
    );
  }

  lines.push(`colorScheme=${Appearance.getColorScheme() ?? "null"}`);
  const report = lines.join("\n");
  bootLog("env_check", report.replace(/\n/g, " | "));
  return { ok: missing.length === 0, report, missing };
}

function maskEnv(key: string, value: string): string {
  if (key.includes("KEY") || key.includes("DSN") || key.includes("TOKEN")) {
    if (value.length <= 8) return "***";
    return `${value.slice(0, 6)}…${value.slice(-4)} (len=${value.length})`;
  }
  return value.length > 60 ? `${value.slice(0, 60)}…` : value;
}

/**
 * Hide native splash. Always runs (needed for normal boot).
 * Logging / bookkeeping only when BOOT_DIAG is on.
 */
export async function hideNativeSplashLogged(
  reason: string,
): Promise<void> {
  if (BOOT_DIAG_ENABLED) {
    splashHideAttempted = true;
  }
  try {
    // Lazy require so entrypoint can call before RN fully ready
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SplashScreen = require("expo-splash-screen") as {
      hideAsync: () => Promise<boolean | void>;
    };
    await SplashScreen.hideAsync();
    if (BOOT_DIAG_ENABLED) {
      splashHideOk = true;
      bootLog("splash_native_hide", `ok reason=${reason}`);
      notify();
    }
  } catch (e) {
    if (BOOT_DIAG_ENABLED) {
      splashHideOk = false;
      bootLog(
        "splash_native_hide",
        `FAIL reason=${reason} err=${e instanceof Error ? e.message : String(e)}`,
      );
      notify();
    }
  }
}

export function installGlobalBootErrorHandlers(): void {
  if (!BOOT_DIAG_ENABLED || handlersInstalled) return;
  handlersInstalled = true;

  type ErrorUtilsLike = {
    getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
    setGlobalHandler?: (
      handler: (error: Error, isFatal?: boolean) => void,
    ) => void;
  };

  const g = globalThis as typeof globalThis & {
    ErrorUtils?: ErrorUtilsLike;
  };

  const prev = g.ErrorUtils?.getGlobalHandler?.();
  g.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    bootFatal(error, `ErrorUtils(isFatal=${Boolean(isFatal)})`);
    void hideNativeSplashLogged("error_utils");
    try {
      prev?.(error, isFatal);
    } catch {
      // ignore
    }
  });

  const anyGlobal = globalThis as typeof globalThis & {
    addEventListener?: (
      type: string,
      listener: (ev: { reason?: unknown }) => void,
    ) => void;
  };
  anyGlobal.addEventListener?.("unhandledrejection", (ev) => {
    bootFatal(ev.reason ?? "unknown rejection", "unhandledrejection");
    void hideNativeSplashLogged("unhandledrejection");
  });

  bootLog("error_handlers_installed");
}

export function formatBootLogForDisplay(): string {
  if (!BOOT_DIAG_ENABLED) return "";
  const splash = getSplashHideStatus();
  const lines = [
    `boot diagnostics (TEMPORARY)`,
    `splashHide attempted=${splash.attempted} ok=${String(splash.ok)}`,
    ...events.map(
      (e) => `+${e.t}ms ${e.stage}${e.detail ? ` | ${e.detail}` : ""}`,
    ),
  ];
  if (lastFatal) {
    lines.push("--- FATAL ---", lastFatal.message);
    if (lastFatal.stack) lines.push(lastFatal.stack.slice(0, 1200));
  }
  return lines.join("\n");
}
