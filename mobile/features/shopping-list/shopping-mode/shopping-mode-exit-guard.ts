import { useCallback, useRef } from "react";
import { Alert, BackHandler } from "react-native";
import { useFocusEffect, useNavigation } from "expo-router";
import { useTranslation } from "react-i18next";

/**
 * Intercept hardware / gesture back while Shopping Mode is focused.
 * Call `allowLeave()` before intentional navigation (finish, continue).
 */
export function useShoppingModeExitGuard(enabled: boolean) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const allowLeaveRef = useRef(false);

  const allowLeave = useCallback(() => {
    allowLeaveRef.current = true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      allowLeaveRef.current = false;

      const confirm = () => {
        Alert.alert(t("shoppingMode.exitTitle"), t("shoppingMode.exitBody"), [
          { text: t("shoppingMode.exitStay"), style: "cancel" },
          {
            text: t("shoppingMode.exitLeave"),
            style: "destructive",
            onPress: () => {
              allowLeaveRef.current = true;
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ]);
      };

      const onBack = () => {
        if (allowLeaveRef.current) return false;
        confirm();
        return true;
      };

      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
  const unsub = navigation.addListener(
    "beforeRemove",
    (e: { preventDefault: () => void }) => {
      if (allowLeaveRef.current) return;
      e.preventDefault();
      confirm();
    },
  );

      return () => {
        sub.remove();
        unsub();
      };
    }, [enabled, navigation, t]),
  );

  return { allowLeave };
}
