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

/** Shared offline / sync status for banners. */
export function useOfflineSyncStatus(listId?: string): OfflineSyncStatus {
  const { t } = useTranslation();
  const [online, setOnline] = useState(DataSyncEngine.isOnline());
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const [n, f] = await Promise.all([
        DataSyncEngine.pendingCount(listId),
        DataSyncEngine.failedCount(listId),
      ]);
      if (mounted) {
        setPending(n);
        setFailed(f);
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
  }, [listId]);

  const visible = !online || pending > 0 || syncing || failed > 0;

  let message = t("offline.allSaved");
  if (!online) {
    message = t("offline.storedOnDevice");
  } else if (syncing) {
    message = t("offline.syncing");
  } else if (failed > 0) {
    message = t("offline.syncFailed", { count: failed });
  } else if (pending > 0) {
    message = t("offline.pending", { count: pending });
  }

  return { online, pending, failed, syncing, visible, message };
}
