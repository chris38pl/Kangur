import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { DataSyncEngine } from "@/features/data-sync-engine";
import { colors, spacing, typography } from "@/design-system/tokens";

type Props = {
  listId?: string;
};

/**
 * Shared offline / sync status banner. Reads Engine connectivity + pending count.
 * Informational only — no business logic on event order.
 */
export function OfflineStatusBanner({ listId }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [online, setOnline] = useState(DataSyncEngine.isOnline());
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const n = await DataSyncEngine.pendingCount(listId);
      if (mounted) setPending(n);
    };
    void refresh();

    const offConn = DataSyncEngine.connectivity.onChange((isOnline) => {
      setOnline(isOnline);
    });
    const offQueue = DataSyncEngine.on("queueChanged", (p) => {
      if (listId && p?.listId && p.listId !== listId) return;
      setPending(p?.pendingCount ?? 0);
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

  if (online && pending === 0 && !syncing) {
    return null;
  }

  let message = t("offline.allSaved");
  if (!online) {
    message = t("offline.storedOnDevice");
  } else if (syncing) {
    message = t("offline.syncing");
  } else if (pending > 0) {
    message = t("offline.pending", { count: pending });
  }

  return (
    <View
      style={{
        backgroundColor: online ? theme.accent : "#F59E0B22",
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
      }}
    >
      <Text style={{ ...typography.caption, color: theme.text, textAlign: "center" }}>
        {message}
      </Text>
    </View>
  );
}
