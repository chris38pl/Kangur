import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { DataSyncEngine } from "@/features/data-sync-engine";

export type OfflineSyncStatus = {
  online: boolean;
  pending: number;
  failed: number;
  syncing: boolean;
  /** True when the banner should be shown on its own (no undo). */
  visible: boolean;
  message: string;
};

export type OfflineSyncStatusOptions = {
  /**
   * Shopping mode: hide banner for own SET_STATUS pending/syncing.
   * Still show offline, failed, and non-status pending ops (add/edit/…).
   */
  quietSetStatus?: boolean;
};

/** Shared offline / sync status for banners. */
export function useOfflineSyncStatus(
  listId?: string,
  options: OfflineSyncStatusOptions = {},
): OfflineSyncStatus {
  const { quietSetStatus = false } = options;
  const { t } = useTranslation();
  const [online, setOnline] = useState(DataSyncEngine.isOnline());
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [pendingNonStatus, setPendingNonStatus] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const [n, f, other] = await Promise.all([
        DataSyncEngine.pendingCount(listId),
        DataSyncEngine.failedCount(listId),
        quietSetStatus
          ? DataSyncEngine.pendingNonStatusCount(listId)
          : Promise.resolve(0),
      ]);
      if (mounted) {
        setPending(n);
        setFailed(f);
        setPendingNonStatus(other);
      }
    };
    void refresh();

    const offConn = DataSyncEngine.connectivity.onChange((isOnline) => {
      setOnline(isOnline);
    });
    const offQueue = DataSyncEngine.on("queueChanged", (p) => {
      if (listId && p?.listId && p.listId !== listId) return;
      setPending(p?.pendingCount ?? 0);
      void refresh();
    });
    const offStart = DataSyncEngine.on("syncStarted", () => setSyncing(true));
    const offEnd = DataSyncEngine.on("syncFinished", () => {
      setSyncing(false);
      void refresh();
    });

    return () => {
      mounted = false;
      offConn();
      offQueue();
      offStart();
      offEnd();
    };
  }, [listId, quietSetStatus]);

  const visible = quietSetStatus
    ? !online || failed > 0 || pendingNonStatus > 0
    : !online || pending > 0 || syncing || failed > 0;

  let message = t("offline.allSaved");
  if (!online) {
    message = t("offline.storedOnDevice");
  } else if (failed > 0) {
    message = t("offline.syncFailed", { count: failed });
  } else if (quietSetStatus) {
    if (pendingNonStatus > 0 && syncing) {
      message = t("offline.syncing");
    } else if (pendingNonStatus > 0) {
      message = t("offline.pending", { count: pendingNonStatus });
    }
  } else if (syncing) {
    message = t("offline.syncing");
  } else if (pending > 0) {
    message = t("offline.pending", { count: pending });
  }

  return { online, pending, failed, syncing, visible, message };
}
