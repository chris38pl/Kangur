import { forwardRef, useMemo, type ComponentProps, type ReactNode } from "react";
import type { ScrollView } from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";
// Not re-exported by the package; used to lock the outer scroll during nested drag.
import { useNestableScrollContainerContext } from "react-native-draggable-flatlist/src/context/nestableScrollContainerContext";

import {
  NestableOuterScrollLockContext,
  type NestableOuterScrollLock,
} from "./nestable-outer-scroll-lock-context";
import { NestableScreenScrollProvider } from "./nestable-screen-scroll-context";

type Props = ComponentProps<typeof NestableScrollContainer>;

function NestableOuterScrollLockBridge({ children }: { children: ReactNode }) {
  const ctx = useNestableScrollContainerContext();
  const api = useMemo<NestableOuterScrollLock>(
    () => ({
      lockOuterScroll: () => ctx?.setOuterScrollEnabled(false),
      unlockOuterScroll: () => ctx?.setOuterScrollEnabled(true),
    }),
    [ctx],
  );

  return (
    <NestableOuterScrollLockContext.Provider value={api}>
      {children}
    </NestableOuterScrollLockContext.Provider>
  );
}

/** Native: nestable scroll for NestableDraggableFlatList. */
export const NestableScreenScroll = forwardRef<ScrollView, Props>(
  function NestableScreenScroll({ children, ...props }, ref) {
    return (
      <NestableScrollContainer
        ref={ref as ComponentProps<typeof NestableScrollContainer>["ref"]}
        {...props}
      >
        <NestableScreenScrollProvider>
          <NestableOuterScrollLockBridge>{children}</NestableOuterScrollLockBridge>
        </NestableScreenScrollProvider>
      </NestableScrollContainer>
    );
  },
);
