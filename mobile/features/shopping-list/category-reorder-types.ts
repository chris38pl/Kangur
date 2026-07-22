import type { ReactElement } from "react";

export type CategoryReorderRenderArgs<T> = {
  item: T;
  index: number;
  /** Native: start drag. Web: unused. */
  drag: () => void;
  isActive: boolean;
  /** Web: swap with previous. */
  moveUp: (() => void) | undefined;
  /** Web: swap with next. */
  moveDown: (() => void) | undefined;
};

export type CategoryReorderListProps<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  onReorder: (data: T[]) => void;
  renderItem: (args: CategoryReorderRenderArgs<T>) => ReactElement;
};
