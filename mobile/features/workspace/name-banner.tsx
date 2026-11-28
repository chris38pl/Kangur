import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { NameSheet } from "@/features/profile/name-sheet";
import { Analytics } from "@/lib/analytics";

/** Closed once, gone for good, on this phone. */
const DISMISSED_KEY = "kangur.nameBanner.dismissed";

/**
 * For someone without a name in a workspace shared with others: "The household sees you as
 * Domownik. Add a name". Alone in a workspace, nobody is asked anything.
 */
export function NameBanner({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((value) => {
        if (alive) setDismissed(value === "1");
      })
      .catch(() => {
        if (alive) setDismissed(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const shown = visible && dismissed === false;
  useEffect(() => {
    if (shown) Analytics.track("name_prompt_shown", { place: "members" });
  }, [shown]);

  if (!shown && !sheetOpen) return null;

  const dismiss = () => {
    setDismissed(true);
    Analytics.track("name_skipped", { place: "members" });
    void AsyncStorage.setItem(DISMISSED_KEY, "1").catch(() => undefined);
  };

  return (
    <>
      {shown ? (
        <View
          style={{
            marginBottom: spacing[3],
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
            backgroundColor: theme.section,
            borderRadius: radius.lg,
            paddingVertical: spacing[3],
            paddingLeft: spacing[4],
            paddingRight: spacing[2],
          }}
        >
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            style={{ flex: 1, minWidth: 0 }}
          >
            <Text style={{ ...typography.caption, color: theme.textBody, lineHeight: 18 }}>
              {t("name.bannerText", { name: t("name.fallback") })}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.primary,
                fontWeight: "700",
                marginTop: 2,
              }}
            >
              {t("name.add")}
            </Text>
          </Pressable>
          <Pressable
            onPress={dismiss}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("workspace.close")}
            style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 18, color: theme.textMuted }}>×</Text>
          </Pressable>
        </View>
      ) : null}
      <NameSheet
        visible={sheetOpen}
        place="members"
        currentName={null}
        onClose={() => setSheetOpen(false)}
        onSaved={() => setDismissed(true)}
      />
    </>
  );
}
