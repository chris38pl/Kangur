/**
 * TEMPORARY entry — boot diagnostics when EXPO_PUBLIC_BOOT_DIAG=1, else
 * plain Expo Router entry. Remove with boot-diagnostics cleanup.
 */
const { BOOT_DIAG_ENABLED } = require("./lib/boot-diagnostics");

if (BOOT_DIAG_ENABLED) {
  const {
    bootLog,
    checkRequiredPublicEnv,
    installGlobalBootErrorHandlers,
    hideNativeSplashLogged,
  } = require("./lib/boot-diagnostics");

  bootLog("entrypoint", "index.js before expo-router/entry");
  installGlobalBootErrorHandlers();
  checkRequiredPublicEnv();
  bootLog(
    "entrypoint",
    `BOOT_DIAG=${process.env.EXPO_PUBLIC_BOOT_DIAG ?? "unset"} APP_ENV=${process.env.EXPO_PUBLIC_APP_ENV ?? "unset"}`,
  );

  // Hard safety: if React never mounts, still try to hide splash after a delay.
  setTimeout(() => {
    void hideNativeSplashLogged("entrypoint_timeout_5s");
  }, 5000);
}

require("expo-router/entry");
