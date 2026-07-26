import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  getSoftUpdateSheetVisible,
  subscribeSoftUpdateSheetVisible,
} from "@/features/app-update/soft-update-session";
import { useAppStartup } from "@/features/startup/AppStartupController";
import { getAppBuildInfo } from "@/lib/app-build-info";
import { isNewerVersion } from "@/lib/semver";

import { getReleaseByVersion } from "./load-releases";
import {
  getLastSeenReleaseVersion,
  setLastSeenReleaseVersion,
} from "./storage";
import { WhatsNewToast } from "./WhatsNewToast";

type Props = { children: ReactNode };

/**
 * One-time What's New toast after app update.
 * - First install: seed lastSeen = current, never show.
 * - Upgrade: save-on-show (anti crash-loop), then bottom toast.
 * - Tap toast → /whats-new (full notes). Waits while soft-update sheet is visible.
 */
export function WhatsNewGate({ children }: Props) {
  const { isBrandSplashActive } = useAppStartup();
  const softUpdateVisible = useSyncExternalStore(
    subscribeSoftUpdateSheetVisible,
    getSoftUpdateSheetVisible,
    () => false,
  );

  const currentVersion = useMemo(() => getAppBuildInfo().version, []);
  const [visible, setVisible] = useState(false);
  const [evaluated, setEvaluated] = useState(false);

  useEffect(() => {
    if (isBrandSplashActive || softUpdateVisible || evaluated) return;

    let cancelled = false;

    void (async () => {
      try {
        const lastSeen = await getLastSeenReleaseVersion();

        if (cancelled) return;

        if (!lastSeen) {
          await setLastSeenReleaseVersion(currentVersion);
          if (!cancelled) setEvaluated(true);
          return;
        }

        if (!isNewerVersion(currentVersion, lastSeen)) {
          if (!cancelled) setEvaluated(true);
          return;
        }

        const notes = getReleaseByVersion(currentVersion);
        if (!notes) {
          await setLastSeenReleaseVersion(currentVersion);
          if (!cancelled) setEvaluated(true);
          return;
        }

        // Soft update may have appeared while we were reading storage.
        // Bail without saving so we can retry when soft update dismisses.
        if (getSoftUpdateSheetVisible()) {
          return;
        }

        // Save-on-show: persist before presenting UI (anti crash-loop).
        await setLastSeenReleaseVersion(currentVersion);
        if (cancelled) return;

        setVisible(true);
        setEvaluated(true);
      } catch {
        if (!cancelled) setEvaluated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentVersion, evaluated, isBrandSplashActive, softUpdateVisible]);

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <>
      {children}
      <WhatsNewToast
        visible={visible}
        version={currentVersion}
        onDismiss={onDismiss}
      />
    </>
  );
}
