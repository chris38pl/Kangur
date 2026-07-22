import {
  NestableDraggableFlatList,
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";

import type { CategoryReorderListProps } from "./category-reorder-types";

export type { CategoryReorderRenderArgs } from "./category-reorder-types";

/**
 * Native: long-press drag via react-native-draggable-flatlist.
 * Web uses category-reorder-list.tsx (no findNodeHandle).
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
      activationDistance={12}
      scrollEnabled={false}
      onDragEnd={({ data: next }) => onReorder(next)}
      renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<T>) => (
        <ScaleDecorator>
          {renderItem({
            item,
            index: getIndex() ?? 0,
            drag,
            isActive,
            moveUp: undefined,
            moveDown: undefined,
          })}
        </ScaleDecorator>
      )}
    />
  );
}
