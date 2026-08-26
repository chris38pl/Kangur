import { Platform } from "react-native";
import {
  NestableDraggableFlatList,
  type DragEndParams,
  type RenderItemParams,
} from "react-native-draggable-flatlist";

import { CategoryReorderListStatic } from "./category-reorder-static";
import type { CategoryReorderListProps } from "./category-reorder-types";
import { useNestableScreenScroll } from "./nestable-screen-scroll-context";

export type { CategoryReorderRenderArgs } from "./category-reorder-types";

/**
 * Native: long-press drag via react-native-draggable-flatlist.
 *
 * - NestableDraggableFlatList inside NestableScreenScroll (or CategoryReorderScrollIsland).
 * - List edit wraps the list in CategoryReorderScrollIsland + locks outer scroll on drag.
 * - Falls back to ↑/↓ if nestable parent is missing.
 */
export function CategoryReorderList<T>({
  data,
  keyExtractor,
  onReorder,
  renderItem,
  onDragBegin,
  onDragEnd,
}: CategoryReorderListProps<T>) {
  const insideNestableScroll = useNestableScreenScroll();

  if (!insideNestableScroll) {
    return (
      <CategoryReorderListStatic
        data={data}
        keyExtractor={keyExtractor}
        onReorder={onReorder}
        renderItem={renderItem}
      />
    );
  }

  return (
    <NestableDraggableFlatList
      data={data}
      keyExtractor={keyExtractor}
      activationDistance={Platform.OS === "android" ? 24 : 20}
      autoscrollThreshold={-1}
      autoscrollSpeed={0}
      scrollEnabled={false}
      animationConfig={{
        damping: 24,
        mass: 0.25,
        stiffness: 120,
        overshootClamping: true,
      }}
      onDragBegin={() => onDragBegin?.()}
      onDragEnd={({ data: next }: DragEndParams<T>) => {
        onDragEnd?.();
        onReorder(next);
      }}
      renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<T>) =>
        renderItem({
          item,
          index: getIndex() ?? 0,
          drag,
          isActive,
          moveUp: undefined,
          moveDown: undefined,
        })
      }
    />
  );
}
