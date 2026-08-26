import type { CategoryReorderListProps } from "./category-reorder-types";
import { CategoryReorderListStatic } from "./category-reorder-static";

export type { CategoryReorderRenderArgs } from "./category-reorder-types";

/**
 * Web: ↑/↓ reorder (findNodeHandle / drag list unsupported on web).
 */
export function CategoryReorderList<T>(props: CategoryReorderListProps<T>) {
  return <CategoryReorderListStatic {...props} />;
}
