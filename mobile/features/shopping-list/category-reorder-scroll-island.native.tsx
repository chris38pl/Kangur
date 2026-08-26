import type { ReactNode } from "react";
import { View } from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";

import { NestableScreenScrollProvider } from "./nestable-screen-scroll-context";

/**
 * Short inner nestable scroll so category drag measures offset locally
 * (list sits far below other content in the parent NestableScreenScroll).
 */
export function CategoryReorderScrollIsland({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <View collapsable={false}>
      <NestableScrollContainer
        scrollEnabled={false}
        nestedScrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 0 }}
      >
        <NestableScreenScrollProvider>{children}</NestableScreenScrollProvider>
      </NestableScrollContainer>
    </View>
  );
}
