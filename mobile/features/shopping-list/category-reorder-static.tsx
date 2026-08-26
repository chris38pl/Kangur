import { View } from "react-native";

import type { CategoryReorderListProps } from "./category-reorder-types";

/**
 * Non-draggable reorder (↑/↓). Used on web and as native fallback when
 * NestableDraggableFlatList cannot mount (missing NestableScrollContainer).
 */
export function CategoryReorderListStatic<T>({
  data,
  keyExtractor,
  onReorder,
  renderItem,
}: CategoryReorderListProps<T>) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= data.length) return;
    const next = data.slice();
    const [row] = next.splice(from, 1);
    if (!row) return;
    next.splice(to, 0, row);
    onReorder(next);
  };

  return (
    <View>
      {data.map((item, index) => (
        <View key={keyExtractor(item)}>
          {renderItem({
            item,
            index,
            drag: () => undefined,
            isActive: false,
            moveUp: index > 0 ? () => move(index, index - 1) : undefined,
            moveDown:
              index < data.length - 1
                ? () => move(index, index + 1)
                : undefined,
          })}
        </View>
      ))}
    </View>
  );
}
