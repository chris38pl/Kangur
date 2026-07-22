import { Platform } from "react-native";
import {
  NestableDraggableFlatList,
  type RenderItemParams,
} from "react-native-draggable-flatlist";

import type { CategoryReorderListProps } from "./category-reorder-types";

export type { CategoryReorderRenderArgs } from "./category-reorder-types";

/**
 * Native: long-press drag via react-native-draggable-flatlist.
 * Web uses category-reorder-list.tsx (no findNodeHandle).
 *
 * Android notes:
 * - Nested auto-scroll is disabled. With content above the list,
 *   NestableDraggableFlatList often mis-measures listVerticalOffset and
 *   auto-scrolls the parent on long-press (stuck cards / jank).
 * - Category lists are short; parent NestableScrollContainer still scrolls
 *   before drag; outer scroll locks for the duration of a drag.
 */
export function CategoryReorderList<T>({
  data,
  keyExtractor,
  onReorder,
  renderItem,
}: CategoryReorderListProps<T>) {
  return (
    <NestableDraggableFlatList
      data={data}
      keyExtractor={keyExtractor}
      // High enough that normal scroll wins over the list pan gesture;
      // Nestable default is 20 — keep that floor on Android.
      activationDistance={Platform.OS === "android" ? 24 : 20}
      // Negative threshold → never treat the cell as "at edge" → no nested auto-scroll.
      autoscrollThreshold={-1}
      autoscrollSpeed={0}
      scrollEnabled={false}
      // Avoid ScaleDecorator: scale + buggy parent scroll left cards visually
      // wedged between slots when the gesture aborted mid-drag.
      animationConfig={{
        damping: 24,
        mass: 0.25,
        stiffness: 120,
        overshootClamping: true,
      }}
      onDragEnd={({ data: next }) => onReorder(next)}
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
