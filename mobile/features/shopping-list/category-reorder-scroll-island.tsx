import type { ReactNode } from "react";

/** Web: no nestable scroll island needed. */
export function CategoryReorderScrollIsland({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
