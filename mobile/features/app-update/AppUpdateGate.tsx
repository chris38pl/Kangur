import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useCallback, useMemo, useState } from "react";

import { useAppStartup } from "@/features/startup/AppStartupController";
import { getAppBuildInfo } from "@/lib/app-build-info";
import { hasApiUrl } from "@/lib/api/client";

import { fetchAppVersion } from "./api";
import { AppUpdateSheet } from "./AppUpdateSheet";
import { evaluateUpdatePolicy } from "./evaluate-update";
import { openStoreUpdate } from "./store-links";

type Props = { children: ReactNode };

/**
 * Best-effort soft update gate.
 * Failure to fetch or evaluate must never impact startup or navigation.
 */
export function AppUpdateGate({ children }: Props) {
  const { isBrandSplashActive } = useAppStartup();
  const [dismissed, setDismissed] = useState(false);

  const build = useMemo(() => getAppBuildInfo(), []);
  const skipEnv = build.environment === "development";

  const versionQuery = useQuery({
    queryKey: ["app", "version"],
    queryFn: fetchAppVersion,
    enabled: hasApiUrl() && !skipEnv,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const kind = useMemo(() => {
    if (skipEnv || !versionQuery.data) return "none" as const;
    try {
      return evaluateUpdatePolicy({
        installed: build.version,
        latestVersion: versionQuery.data.latestVersion,
        minSupportedVersion: versionQuery.data.minSupportedVersion,
      }).kind;
    } catch {
      return "none" as const;
    }
  }, [build.version, skipEnv, versionQuery.data]);

  const dismissSession = useCallback(() => {
    setDismissed(true);
  }, []);

  const onUpdate = useCallback(() => {
    void openStoreUpdate();
    dismissSession();
  }, [dismissSession]);

  // MVP: soft only. Force kind is computed but not shown yet.
  const visible =
    !isBrandSplashActive && !dismissed && kind === "soft";

  return (
    <>
      {children}
      <AppUpdateSheet
        visible={visible}
        variant="soft"
        onUpdate={onUpdate}
        onLater={dismissSession}
      />
    </>
  );
}
