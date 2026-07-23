import { useCallback, useRef, useState, type ReactNode } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useNavigation } from "expo-router";

import { LeaveShoppingDialog } from "./leave-shopping-dialog";
import { leaveShoppingTask } from "./shopping-task-intent";

/**
 * Intercept hardware / gesture back while Shopping Mode is focused.
 * Call `allowLeave()` before intentional navigation (finish, continue).
 * Renders branded exit sheet via `exitDialog`.
 */
export function useShoppingModeExitGuard(
  enabled: boolean,
  listId: string,
  options?: { onLeave?: () => void },
): {
  allowLeave: () => void;
  exitDialog: ReactNode;
} {
  const navigation = useNavigation();
  const allowLeaveRef = useRef(false);
  const onLeaveSideEffectRef = useRef(options?.onLeave);
  onLeaveSideEffectRef.current = options?.onLeave;
  const [visible, setVisible] = useState(false);

  const allowLeave = useCallback(() => {
    allowLeaveRef.current = true;
  }, []);

  const onStay = useCallback(() => {
    setVisible(false);
  }, []);

  const onLeave = useCallback(() => {
    allowLeaveRef.current = true;
    setVisible(false);
    onLeaveSideEffectRef.current?.();
    leaveShoppingTask(listId);
  }, [listId]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      allowLeaveRef.current = false;
      setVisible(false);

      const requestExit = () => {
        setVisible(true);
      };

      const onBack = () => {
        if (allowLeaveRef.current) return false;
        requestExit();
        return true;
      };

      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      const unsub = navigation.addListener(
        "beforeRemove",
        (e: { preventDefault: () => void }) => {
          if (allowLeaveRef.current) return;
          e.preventDefault();
          requestExit();
        },
      );

      return () => {
        sub.remove();
        unsub();
      };
    }, [enabled, navigation]),
  );

  return {
    allowLeave,
    exitDialog: (
      <LeaveShoppingDialog
        visible={visible}
        onStay={onStay}
        onLeave={onLeave}
      />
    ),
  };
}
